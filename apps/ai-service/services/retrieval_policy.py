import re
import unicodedata
from typing import Iterable, List, Tuple


STOPWORDS = {
    "ai", "anh", "ban", "biet", "cac", "cai", "cho", "co", "cua", "duoc",
    "gi", "hay", "hoi", "khong", "la", "lam", "minh", "mot", "nao", "nhung",
    "noi", "the", "thi", "toi", "trong", "ve", "va",
    # Từ đệm/hỏi thường gặp trong câu hỏi tiếp nối (vd. "giải thích thêm về...",
    # "cho tôi biết... như thế nào"). Không lọc các từ này khiến câu hỏi dài bị
    # pha loãng độ phủ (coverage) và bị loại nhầm dù thật sự on-topic — xem
    # ghi chú NOTE bên dưới trong select_relevant_documents.
    "giai", "thich", "them", "nhu", "muon", "giup", "xin", "dang", "sao",
}

DOCUMENT_INTENT_PHRASES = (
    "tài liệu",
    "giáo trình",
    "trong hệ thống",
    "trong thư viện",
    "theo tài liệu",
    "dựa trên tài liệu",
    "nguồn",
    "trang nào",
    "pdf",
)


def normalize_terms(text: str) -> set[str]:
    normalized = unicodedata.normalize("NFD", (text or "").lower())
    normalized = "".join(
        character
        for character in normalized
        if unicodedata.category(character) != "Mn"
    ).replace("đ", "d")
    words = re.findall(r"[a-z0-9+#.]{2,}", normalized)
    return {word for word in words if word not in STOPWORDS}


def _strip_accents_word(word: str) -> str:
    normalized = unicodedata.normalize("NFD", word.lower())
    normalized = "".join(
        character for character in normalized if unicodedata.category(character) != "Mn"
    ).replace("đ", "d")
    return normalized


def _accented_terms(text: str) -> set[str]:
    """Tokenize keeping Vietnamese diacritics (unlike normalize_terms)."""
    normalized = unicodedata.normalize("NFC", (text or "").lower())
    return {w for w in re.findall(r"\w{2,}", normalized, flags=re.UNICODE)}


def _confirm_overlap_with_accents(
    raw_overlap: set[str],
    question_accented: set[str],
    candidate_accented: set[str],
) -> set[str]:
    """Re-check each accent-stripped overlapping term against the accented
    text on both sides.

    Stripping Vietnamese diacritics for lexical matching (normalize_terms)
    can collapse two unrelated words onto the same token — e.g. "phần"
    (percent) and "phân" (binary/divide) both become "phan". Confirmed in
    production: a question about "hệ nhị phân" (binary system) matched an
    unrelated exam document purely because it was full of "phần trăm"
    (percent), and the resulting overlap count (>= 3) was enough to pass the
    relevance gate below and get cited as a source. Only count a term as a
    genuine match if the same accented spelling appears on both sides.
    """
    confirmed = set()
    for term in raw_overlap:
        q_variants = {w for w in question_accented if _strip_accents_word(w) == term}
        c_variants = {w for w in candidate_accented if _strip_accents_word(w) == term}
        if q_variants & c_variants:
            confirmed.add(term)
    return confirmed


def has_document_intent(question: str) -> bool:
    lowered = (question or "").lower()
    return any(phrase in lowered for phrase in DOCUMENT_INTENT_PHRASES)


def select_relevant_documents(
    docs_with_scores: Iterable[Tuple[object, float]],
    question: str,
    threshold: float,
    max_documents: int = 4,
) -> List[object]:
    """Conservatively choose RAG context; unrelated questions stay general."""
    question_terms = normalize_terms(question)
    question_accented = _accented_terms(question)
    explicit_document_intent = has_document_intent(question)
    selected: List[object] = []

    for doc, score in sorted(docs_with_scores, key=lambda item: item[1]):
        numeric_score = float(score)
        if numeric_score > threshold:
            continue

        metadata = getattr(doc, "metadata", {}) or {}
        metadata_text = " ".join(
            str(metadata.get(key, ""))
            for key in ("title", "author", "categoryName")
        )
        page_content = getattr(doc, "page_content", "")[:6000]
        candidate_terms = normalize_terms(page_content) | normalize_terms(metadata_text)
        candidate_accented = _accented_terms(page_content) | _accented_terms(metadata_text)

        raw_overlap = question_terms & candidate_terms
        overlap = _confirm_overlap_with_accents(raw_overlap, question_accented, candidate_accented)
        coverage = len(overlap) / len(question_terms) if question_terms else 0.0

        # A vector score alone is not enough: short, generic fragments such as
        # "Việt Nam" can otherwise route an unrelated question to a document.
        # Single-topic questions (for example "SQL là gì?") are still allowed,
        # while longer questions need meaningful lexical coverage.
        # NOTE: this gate trades recall for precision on purpose (see comment
        # above). Measured against the real ingested "Giáo trình SQL" corpus,
        # ~40% of clearly on-topic, longer/paraphrased follow-up questions
        # (e.g. "Giải thích thêm về TRANSACTION trong SQL") still get rejected
        # here even with a strong vector score, and fall back to the general
        # LLM answer instead of citing the document. Loosening `coverage`
        # below 0.60 is unsafe without re-validating against the real
        # embedding model — the "Việt Nam" anti-hallucination test case
        # (see tests/test_retrieval_policy.py) sits at coverage == 0.50 and
        # must stay rejected. Use scripts/tune_retrieval_policy.py against a
        # real vector store to calibrate this threshold before changing it.
        lexically_relevant = (
            len(question_terms) == 1 and len(overlap) == 1
        ) or len(overlap) >= 3 or coverage >= 0.60

        if lexically_relevant or (
            explicit_document_intent and numeric_score <= threshold * 0.85
        ):
            selected.append(doc)

        if len(selected) >= max_documents:
            break

    return selected
