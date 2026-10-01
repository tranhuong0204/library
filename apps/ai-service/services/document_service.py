import os
import re
import logging
from typing import List, Dict, Any

import requests
from fastapi import HTTPException
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import (
    AI_SERVICE_API_KEY,
    AI_UPLOAD_DIR,
    BASE_DIR,
    BACKEND_BASE_URL,
    SIMILARITY_THRESHOLD,
)

INTERNAL_API_HEADERS = {"X-Internal-Api-Key": AI_SERVICE_API_KEY}
from services import vector_service

logger = logging.getLogger("ai_service")


# =========================
# Text helpers
# =========================

VI_STOPWORDS = {
    "là", "gì", "và", "của", "có", "cho", "về", "trong", "các", "một",
    "những", "được", "không", "nào", "hãy", "giải", "thích", "tôi",
    "muốn", "tìm", "tài", "liệu", "với", "theo", "khi", "như", "thế",
    "ở", "để", "này", "đó", "ra", "sao", "bạn", "giúp", "hỏi", "nói"
}

SEARCH_STOPWORDS = {
    "he", "thong", "co", "tai", "lieu", "nao", "lien", "quan", "den",
    "khong", "cho", "toi", "tim", "ve", "trong", "pdf", "file", "document",
    "sach", "giao", "trinh", "hay", "can", "muon", "xem", "giup", "minh",
    "cua", "la", "gi", "nhung", "cac", "mot", "duoc"
}


def robust_sanitize(text: Any) -> str:
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)
    return re.sub(r"[\ud800-\udfff]", "", text)


def remove_vietnamese_accents(text: str) -> str:
    import unicodedata

    text = robust_sanitize(text).lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = text.replace("đ", "d")
    text = re.sub(r"[^a-z0-9+#.\s-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_words(text: str) -> List[str]:
    text = robust_sanitize(text).lower()
    text = re.sub(r"[^a-zA-ZÀ-ỹ0-9\s+#.]", " ", text)
    words = [w.strip() for w in text.split() if len(w.strip()) >= 3]
    return [w for w in words if w not in VI_STOPWORDS]


def extract_document_search_terms(question: str) -> tuple[str, List[str]]:
    normalized = remove_vietnamese_accents(question)
    words = re.findall(r"[a-z0-9+#.]+", normalized)

    terms = [w for w in words if w not in SEARCH_STOPWORDS and len(w) >= 2]
    phrase = " ".join(terms).strip()
    return phrase, terms


def title_matches_search(title: str, phrase: str, terms: List[str]) -> bool:
    if not title or not terms:
        return False

    title_norm = remove_vietnamese_accents(title)

    if phrase and phrase in title_norm:
        return True

    if len(terms) <= 3 and all(term in title_norm for term in terms):
        return True

    match_count = sum(1 for term in terms if term in title_norm)
    return match_count >= max(1, min(2, len(terms)))


# =========================
# Metadata helpers
# =========================


def get_display_title(doc, resolved_titles: Dict[str, str]) -> str:
    source_path = doc.metadata.get("source", "")
    doc_basename = os.path.basename(source_path) if source_path else ""

    display_title = resolved_titles.get(doc_basename) if doc_basename else None

    if not display_title:
        display_title = doc.metadata.get("title")

    if display_title:
        display_title = str(display_title).strip()

    is_invalid = False
    if not display_title:
        is_invalid = True
    else:
        orig_url = doc.metadata.get("originalFileUrl", "")
        orig_basename = os.path.basename(orig_url) if orig_url else ""
        lower_title = display_title.lower().strip()

        if re.search(r"\.[a-zA-Z0-9]{2,4}$", lower_title):
            is_invalid = True
        elif re.search(r"[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}", lower_title):
            is_invalid = True
        elif lower_title.startswith("document-"):
            is_invalid = True
        elif "/" in display_title or "\\" in display_title:
            is_invalid = True
        elif doc_basename and lower_title == doc_basename.lower():
            is_invalid = True
        elif orig_basename and lower_title == orig_basename.lower():
            is_invalid = True
        elif lower_title in ["tài liệu không tên", "tài liệu tham khảo", "document"]:
            is_invalid = True

    if is_invalid:
        return "Tài liệu tham khảo"
    return display_title


def build_document_key(doc, title: str) -> str:
    document_id = doc.metadata.get("document_id")
    original_url = doc.metadata.get("originalFileUrl")
    source = doc.metadata.get("source")

    if document_id:
        return f"document:{document_id}"
    if original_url:
        return os.path.basename(original_url)
    if source:
        return os.path.basename(source)
    return title


def group_documents_from_docs(docs: List, resolved_titles: Dict[str, str]) -> List[dict]:
    grouped: Dict[str, dict] = {}

    for doc in docs:
        content = robust_sanitize(doc.page_content)
        title = get_display_title(doc, resolved_titles)
        key = build_document_key(doc, title)
        page = doc.metadata.get("page", 0) + 1

        if key not in grouped:
            grouped[key] = {
                "document_id": doc.metadata.get("document_id"),
                "id": doc.metadata.get("document_id"),
                "documentId": doc.metadata.get("document_id"),
                "title": title,
                "author": doc.metadata.get("author", ""),
                "categoryName": doc.metadata.get("categoryName", ""),
                "fileUrl": doc.metadata.get("originalFileUrl", ""),
                "FileUrl": doc.metadata.get("originalFileUrl", ""),
                "pages": set(),
                "snippets": [],
                "best_score": 999999.0,
                "overlap": 0,
            }

        grouped[key]["pages"].add(page)

        if len(grouped[key]["snippets"]) < 2:
            snippet = re.sub(r"\s+", " ", content).strip()[:260]
            if snippet:
                grouped[key]["snippets"].append(snippet)

    results = []
    for item in grouped.values():
        item["pages"] = sorted(list(item["pages"]))[:5]
        results.append(item)

    return results


def build_documents_payload_from_docs(docs: List, resolved_titles: Dict[str, str]) -> List[dict]:
    grouped: Dict[str, dict] = {}

    for doc in docs:
        title = get_display_title(doc, resolved_titles)
        key = build_document_key(doc, title)
        page = doc.metadata.get("page", 0) + 1

        if key not in grouped:
            document_id = doc.metadata.get("document_id")
            file_url = doc.metadata.get("originalFileUrl", "")

            grouped[key] = {
                "id": document_id,
                "documentId": document_id,
                "title": title,
                "author": doc.metadata.get("author", ""),
                "categoryName": doc.metadata.get("categoryName", ""),
                "fileUrl": file_url,
                "FileUrl": file_url,
                "pages": set(),
            }

        grouped[key]["pages"].add(page)

    results = []
    for item in grouped.values():
        item["pages"] = sorted(list(item["pages"]))[:5]
        results.append(item)

    results.sort(key=lambda x: remove_vietnamese_accents(str(x.get("title", ""))))
    return results


def build_document_search_message(results: List[dict]) -> str:
    if not results:
        return "Hiện tại chưa tìm thấy tài liệu liên quan trong hệ thống."

    lines = ["Có, hệ thống có tài liệu liên quan:"]

    for idx, item in enumerate(results, start=1):
        pages = item.get("pages", [])
        pages_str = ", ".join(map(str, pages)) if pages else "Không rõ"
        snippets = item.get("snippets", [])
        snippet = snippets[0] if snippets else "Không có mô tả ngắn."

        lines.append(f"\n{idx}. {item.get('title', 'Tài liệu không tên')}")
        if item.get("author"):
            lines.append(f"   - Tác giả: {item['author']}")
        if item.get("categoryName"):
            lines.append(f"   - Danh mục: {item['categoryName']}")
        lines.append(f"   - Trang liên quan: {pages_str}")
        lines.append(f"   - Nội dung liên quan: {snippet}...")

    return "\n".join(lines)


# =========================
# Backend document APIs
# =========================


def resolve_titles_for_docs(docs: List) -> Dict[str, str]:
    filenames_to_resolve = set()

    for doc in docs:
        source_path = doc.metadata.get("source", "")
        if source_path:
            filenames_to_resolve.add(os.path.basename(source_path))

        original_url = doc.metadata.get("originalFileUrl", "")
        if original_url:
            filenames_to_resolve.add(os.path.basename(original_url))

    resolved_titles: Dict[str, str] = {}

    if not filenames_to_resolve:
        return resolved_titles

    try:
        backend_url = f"{BACKEND_BASE_URL}/api/documents/resolve-titles"
        params = {"filenames": ",".join(list(filenames_to_resolve))}
        resp = requests.get(
            backend_url, params=params, headers=INTERNAL_API_HEADERS, timeout=5
        )

        if resp.status_code == 200:
            resp_data = resp.json()
            logger.info(f"Resolved titles response: {resp_data}")

            if isinstance(resp_data, dict):
                document_list = resp_data.get("documents", [])
            elif isinstance(resp_data, list):
                document_list = resp_data
            else:
                document_list = []

            for item in document_list:
                if isinstance(item, dict):
                    title = item.get("title")
                    file_name = item.get("fileName")
                    file_url = item.get("fileUrl")
                    if title:
                        if file_name:
                            resolved_titles[os.path.basename(file_name)] = title
                        if file_url:
                            resolved_titles[os.path.basename(file_url)] = title
    except Exception as e:
        logger.error(f"Failed to resolve titles from backend: {e}")

    return resolved_titles


class BackendUnavailableError(Exception):
    """Backend Spring Boot did not answer (network/timeout), as opposed to
    answering with a legitimate empty result set."""


def get_document_count_from_backend() -> int:
    """Return the real learner-visible document count from Spring Boot."""
    try:
        resp = requests.get(
            f"{BACKEND_BASE_URL}/api/documents/count-ai",
            headers=INTERNAL_API_HEADERS,
            timeout=5,
        )
        if resp.status_code != 200:
            raise BackendUnavailableError(f"status={resp.status_code}")
        count = resp.json().get("count")
        if not isinstance(count, int) or count < 0:
            raise BackendUnavailableError("invalid count response")
        return count
    except BackendUnavailableError:
        raise
    except (requests.exceptions.RequestException, ValueError, AttributeError) as e:
        raise BackendUnavailableError(str(e)) from e


def search_documents_from_backend(keyword: str) -> List[dict]:
    if not keyword:
        return []

    try:
        backend_url = f"{BACKEND_BASE_URL}/api/documents/search-ai"
        resp = requests.get(
            backend_url,
            params={"keyword": keyword},
            headers=INTERNAL_API_HEADERS,
            timeout=5,
        )

        if resp.status_code != 200:
            logger.warning(f"Backend search-ai failed: status={resp.status_code}")
            raise BackendUnavailableError(f"status={resp.status_code}")

        data = resp.json()
        if isinstance(data, dict):
            docs = data.get("documents", [])
        elif isinstance(data, list):
            docs = data
        else:
            docs = []

        return [item for item in docs if isinstance(item, dict)]
    except BackendUnavailableError:
        raise
    except requests.exceptions.RequestException as e:
        # Connection refused / timeout / DNS failure: the backend itself is
        # unreachable, this is NOT the same thing as "no document matches".
        logger.error(f"Backend unreachable while searching documents: {e}")
        raise BackendUnavailableError(str(e)) from e
    except Exception as e:
        logger.error(f"Failed to search documents from backend: {e}")
        return []


def fetch_documents_for_sync() -> List[dict]:
    sync_url = f"{BACKEND_BASE_URL}/api/documents/ai-sync"
    resp = requests.get(sync_url, headers=INTERNAL_API_HEADERS, timeout=10)

    if resp.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Không gọi được Spring Boot ai-sync: {resp.status_code}"
        )

    data = resp.json()
    return data.get("documents", []) if isinstance(data, dict) else []


# =========================
# Document Search
# =========================


def search_documents_in_system(question: str, top_k: int = 20) -> dict:
    phrase, terms = extract_document_search_terms(question)
    keyword = phrase.strip()
    logger.info(f"Document search keyword='{keyword}', terms={terms}")

    # Metadata search through Spring Boot must continue to work even when
    # FAISS is being rebuilt or the embedding model is temporarily unavailable.
    all_vector_docs = vector_service.get_all_vector_docs() if vector_service.has_vector_store() else []

    backend_unavailable = False
    try:
        backend_docs = search_documents_from_backend(keyword)
    except BackendUnavailableError:
        # Backend Spring Boot không phản hồi (mất mạng, đang restart, timeout...).
        # Đây KHÔNG đồng nghĩa "không có tài liệu" — rơi xuống tìm bằng FAISS/tiêu đề
        # cục bộ bên dưới thay vì khẳng định sai là hệ thống không có tài liệu.
        backend_docs = []
        backend_unavailable = True

    # Nếu user hỏi rõ tài liệu theo keyword mà backend trả lời KHÔNG có tài liệu khớp
    # (chứ không phải backend bị lỗi/mất kết nối), không fallback sang FAISS toàn hệ
    # thống để tránh trả nhầm SQL/Spring Boot.
    if keyword and not backend_docs and not backend_unavailable:
        return {
            "message": f"Hiện tại hệ thống chưa có tài liệu liên quan đến '{keyword}'.",
            "documents": []
        }

    if backend_docs:
        matched_ids = {
            str(item.get("documentId") or item.get("id"))
            for item in backend_docs
            if item.get("documentId") is not None or item.get("id") is not None
        }

        matched_vector_docs = [
            doc for doc in all_vector_docs
            if str(doc.metadata.get("document_id")) in matched_ids
        ]

        backend_by_id = {
            str(item.get("documentId") or item.get("id")): item
            for item in backend_docs
        }

        for doc in matched_vector_docs:
            meta = backend_by_id.get(str(doc.metadata.get("document_id")), {})
            if meta:
                doc.metadata["title"] = meta.get("title", doc.metadata.get("title", ""))
                doc.metadata["author"] = meta.get("author", doc.metadata.get("author", ""))
                doc.metadata["categoryName"] = meta.get("categoryName", doc.metadata.get("categoryName", ""))
                doc.metadata["originalFileUrl"] = meta.get("fileUrl", doc.metadata.get("originalFileUrl", ""))

        if matched_vector_docs:
            results = group_documents_from_docs(matched_vector_docs, {})
            results.sort(key=lambda x: remove_vietnamese_accents(x.get("title", "")))
            return {
                "message": build_document_search_message(results[:5]),
                "documents": results[:5]
            }

        lines = [
            "Có, hệ thống có tài liệu liên quan. Tuy nhiên, nội dung tài liệu "
            "chưa được lập chỉ mục nên AI chưa thể hiển thị trang và trích đoạn liên quan:"
        ]
        for idx, item in enumerate(backend_docs[:5], start=1):
            lines.append(f"\n{idx}. {item.get('title', 'Tài liệu không tên')}")
            if item.get("author"):
                lines.append(f"   - Tác giả: {item.get('author')}")
            if item.get("categoryName"):
                lines.append(f"   - Danh mục: {item.get('categoryName')}")
        return {
            "message": "\n".join(lines),
            "documents": backend_docs[:5]
        }

    if not vector_service.has_vector_store():
        return {
            "message": "Hiện tại chưa thể tìm trong chỉ mục nội dung vì vector database chưa sẵn sàng.",
            "documents": []
        }

    # Chỉ fallback khi không có keyword rõ ràng.
    resolved_titles_all = resolve_titles_for_docs(all_vector_docs) if all_vector_docs else {}
    title_matched_docs = []
    if terms:
        for doc in all_vector_docs:
            title = get_display_title(doc, resolved_titles_all)
            if title_matches_search(title, keyword, terms):
                title_matched_docs.append(doc)

    if title_matched_docs:
        results = group_documents_from_docs(title_matched_docs, resolved_titles_all)
        results.sort(key=lambda x: remove_vietnamese_accents(x.get("title", "")))
        return {
            "message": build_document_search_message(results[:5]),
            "documents": results[:5]
        }

    docs_with_scores = vector_service.similarity_search_with_score(question, k=top_k)
    sorted_docs_with_scores = sorted(docs_with_scores, key=lambda x: x[1])

    candidates = [
        (doc, score)
        for doc, score in sorted_docs_with_scores
        if score <= max(SIMILARITY_THRESHOLD, 3.0)
    ]

    if not candidates:
        candidates = sorted_docs_with_scores[:5]

    candidate_docs = [doc for doc, _ in candidates]
    resolved_titles = resolve_titles_for_docs(candidate_docs)

    grouped: Dict[str, dict] = {}
    question_words = set(normalize_words(question))

    for doc, score in candidates:
        content = robust_sanitize(doc.page_content)
        content_words = set(normalize_words(content[:3000]))
        overlap_count = len(question_words.intersection(content_words))

        title = get_display_title(doc, resolved_titles)
        key = build_document_key(doc, title)
        page = doc.metadata.get("page", 0) + 1

        if key not in grouped:
            grouped[key] = {
                "document_id": doc.metadata.get("document_id"),
                "id": doc.metadata.get("document_id"),
                "documentId": doc.metadata.get("document_id"),
                "title": title,
                "author": doc.metadata.get("author", ""),
                "categoryName": doc.metadata.get("categoryName", ""),
                "fileUrl": doc.metadata.get("originalFileUrl", ""),
                "FileUrl": doc.metadata.get("originalFileUrl", ""),
                "pages": set(),
                "snippets": [],
                "best_score": float(score),
                "overlap": 0,
            }

        grouped[key]["pages"].add(page)
        grouped[key]["best_score"] = min(grouped[key]["best_score"], float(score))
        grouped[key]["overlap"] += overlap_count

        if len(grouped[key]["snippets"]) < 2:
            snippet = re.sub(r"\s+", " ", content).strip()[:260]
            if snippet:
                grouped[key]["snippets"].append(snippet)

    results = []
    for item in grouped.values():
        item["pages"] = sorted(list(item["pages"]))[:5]
        results.append(item)

    results.sort(key=lambda x: (x.get("best_score", 999999.0), -x.get("overlap", 0)))
    results = results[:5]

    return {
        "message": build_document_search_message(results),
        "documents": results
    }


# =========================
# Sync all documents
# =========================


def sync_documents() -> dict:
    try:
        document_list = fetch_documents_for_sync()
        all_chunks = []

        for item in document_list:
            file_url = item.get("fileUrl")
            title = item.get("title")
            document_id = item.get("documentId") or item.get("id")
            author = item.get("author", "")
            category_name = item.get("categoryName", "")

            if not file_url:
                continue

            normalized_url = str(file_url).replace("\\", "/").strip()
            if not normalized_url.startswith("/uploads/"):
                logger.warning("Skip unsafe file URL: %s", file_url)
                continue

            relative_path = normalized_url.removeprefix("/uploads/")
            resolved_path = os.path.realpath(
                os.path.join(AI_UPLOAD_DIR, relative_path)
            )
            try:
                inside_upload_dir = os.path.commonpath(
                    [AI_UPLOAD_DIR, resolved_path]
                ) == AI_UPLOAD_DIR
            except ValueError:
                inside_upload_dir = False

            if not inside_upload_dir or not os.path.isfile(resolved_path):
                logger.warning(f"Skip missing file: {resolved_path}")
                continue

            if not resolved_path.lower().endswith(".pdf"):
                logger.warning(f"Skip non-pdf file: {resolved_path}")
                continue

            loader = PyMuPDFLoader(resolved_path)
            documents = loader.load()

            for d in documents:
                d.metadata["document_id"] = str(document_id)
                d.metadata["title"] = title
                d.metadata["author"] = author
                d.metadata["categoryName"] = category_name
                d.metadata["source"] = resolved_path
                d.metadata["originalFileUrl"] = file_url
                d.metadata["fileName"] = os.path.basename(resolved_path)

            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=150
            )

            chunks = text_splitter.split_documents(documents)
            all_chunks.extend(chunks)

        if not all_chunks:
            vector_service.rebuild_vector_store_from_documents([])
            return {
                "status": "empty",
                "message": "Không có tài liệu PDF nào để đồng bộ.",
                "documents": len(document_list),
                "chunks": 0
            }

        vector_service.rebuild_vector_store_from_documents(all_chunks)

        logger.info(
            f"Sync documents success: documents={len(document_list)}, chunks={len(all_chunks)}"
        )

        return {
            "status": "success",
            "documents": len(document_list),
            "chunks": len(all_chunks)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Sync documents exception", exc_info=True)
        raise HTTPException(status_code=500, detail=robust_sanitize(str(e)))
