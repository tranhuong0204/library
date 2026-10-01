import logging
import re
from typing import Dict, List, Optional

from config import MAX_CONTEXT_LENGTH, MAX_HISTORY_MESSAGES, SIMILARITY_THRESHOLD, TOP_K
from schemas import ChatRequest
from services import document_service, vector_service
from services.llm_service import build_general_prompt, call_llm, call_llm_with_guard
from services.retrieval_policy import select_relevant_documents

logger = logging.getLogger("ai_service")


DOCUMENT_SEARCH_KEYWORDS = [
    "có tài liệu",
    "tài liệu nào",
    "tìm tài liệu",
    "cho tôi tài liệu",
    "liên quan đến",
    "trong hệ thống có",
    "hệ thống có",
    "giáo trình nào",
    "giáo trình",
    "sách nào",
    "pdf nào",
    "file nào",
    "document nào",
    "tài liệu về",
]

DOCUMENT_COUNT_PATTERNS = (
    "hệ thống có bao nhiêu tài liệu",
    "có bao nhiêu tài liệu",
    "tổng số tài liệu",
    "số lượng tài liệu",
)


def robust_sanitize(text) -> str:
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)
    return re.sub(r"[\ud800-\udfff]", "", text)


def build_history_text(history: Optional[List[Dict[str, str]]]) -> str:
    if not history:
        return ""

    lines: List[str] = []

    for item in history[-MAX_HISTORY_MESSAGES:]:
        role = robust_sanitize(item.get("role", "")).upper()
        content = robust_sanitize(item.get("content", "")).strip()

        if not content:
            continue

        if role == "USER":
            lines.append(f"Người dùng: {content}")
        elif role == "AI":
            lines.append(f"AI: {content}")
        else:
            lines.append(f"{role or 'Tin nhắn'}: {content}")

    return "\n".join(lines)


def is_document_search_query(question: str) -> bool:
    q = robust_sanitize(question).lower()
    return any(keyword in q for keyword in DOCUMENT_SEARCH_KEYWORDS)


def is_document_count_query(question: str) -> bool:
    return any(pattern in robust_sanitize(question).lower() for pattern in DOCUMENT_COUNT_PATTERNS)


def _document_count_response(question: str, conversation_id: Optional[str]) -> dict:
    try:
        count = document_service.get_document_count_from_backend()
        message = f"Hiện hệ thống có {count} tài liệu đã được duyệt."
    except document_service.BackendUnavailableError:
        message = "Chưa thể lấy số lượng tài liệu hiện tại vì hệ thống thư viện đang không phản hồi."
    return {
        "message": message,
        "documents": [],
        "answerMode": "DOCUMENT_COUNT",
        "sources": [],
        "conversationId": robust_sanitize(conversation_id),
    }


def _general_chat_response(question: str, history_text: str, conversation_id: Optional[str]) -> dict:
    prompt = build_general_prompt(question, history_text)
    clean_response, _ = call_llm_with_guard(prompt, question, history_text)

    return {
        "message": clean_response + (
            "\n\n> Câu trả lời sử dụng kiến thức chung của mô hình, "
            "không trích dẫn tài liệu nội bộ."
        ),
        "documents": [],
        "answerMode": "GENERAL",
        "sources": [],
        "conversationId": robust_sanitize(conversation_id),
    }


def _build_rag_prompt(question: str, history_text: str, context: str) -> str:
    return f"""
Bạn là trợ lý AI học tập LIBRIA. Nhiệm vụ của bạn là trả lời câu hỏi của
người học DỰA TRÊN đoạn tài liệu được cung cấp bên dưới, trích từ tài liệu
đang có trong hệ thống thư viện.

QUY TẮC BẮT BUỘC:
- Chỉ trả lời bằng tiếng Việt, tự nhiên, rõ ràng, đúng trọng tâm câu hỏi.
  Không dùng tiếng Trung, tiếng Indonesia hoặc ngôn ngữ khác; nếu tài liệu
  có đoạn tiếng nước ngoài, phải diễn giải lại bằng tiếng Việt.
- CHỈ được dùng dữ kiện xuất hiện trong phần "Tài liệu" bên dưới. Không dùng
  kiến thức chung để bổ sung, suy đoán hoặc "lấp" phần tài liệu không đề
  cập. Nếu tài liệu không đủ để kết luận trọn vẹn, phải nói rõ đúng phần nào
  tài liệu chưa cung cấp thay vì tự bịa thêm.
- Tuyệt đối không bịa số liệu, tên riêng, mốc thời gian hay chi tiết không
  có trong tài liệu.
- Nếu ngữ cảnh gồm nhiều đoạn/nhiều trang, hãy tổng hợp mạch lạc thành một
  câu trả lời thống nhất — không liệt kê rời rạc từng đoạn, không trộn lẫn
  nội dung của các chủ đề không liên quan dù chúng cùng xuất hiện trong
  ngữ cảnh được cung cấp.
- Chọn cách trình bày phù hợp với câu hỏi: dùng danh sách/các bước khi câu
  hỏi là so sánh, liệt kê hoặc quy trình nhiều bước; dùng đoạn văn liền mạch
  khi câu hỏi là khái niệm hoặc giải thích đơn giản. Không ép mọi câu trả
  lời vào một khuôn cố định (khái niệm/đặc điểm/ứng dụng) nếu không phù hợp
  với câu hỏi.
- Không được tự liệt kê nguồn, tên tài liệu hoặc số trang trong câu trả
  lời — hệ thống sẽ tự động thêm phần "Nguồn tài liệu trong hệ thống" ở
  cuối.
- Nếu câu hỏi dùng các từ như "nó", "cái đó", "điều đó", "nếu không có",
  "vậy thì", "còn cái này", hãy xác định đối tượng được nhắc tới từ lịch sử
  hội thoại trước khi trả lời; không coi đây là câu hỏi mới độc lập. Nếu
  lịch sử vẫn không đủ rõ, hãy hỏi lại người dùng cho rõ thay vì đoán.
- Với câu hỏi về SQL, phải phân biệt rõ: bảng có thể không khai báo PRIMARY
  KEY, nhưng nếu đã khai báo PRIMARY KEY thì giá trị của PRIMARY KEY bắt
  buộc duy nhất và không được NULL.
- Trả lời đầy đủ ý nhưng súc tích, khoảng 100-200 từ tuỳ độ phức tạp của
  câu hỏi; không dừng giữa câu, không lan man ngoài phạm vi câu hỏi.

Lịch sử hội thoại:
{history_text if history_text else "Không có."}

Tài liệu:
{context[:MAX_CONTEXT_LENGTH]}

Câu hỏi hiện tại: {question}

Trả lời bằng tiếng Việt:
"""


def _build_context_from_docs(filtered_docs: List, resolved_titles: dict) -> str:
    context_parts: List[str] = []

    for doc in filtered_docs:
        source_name = document_service.get_display_title(doc, resolved_titles)
        page = doc.metadata.get("page", 0)
        content = robust_sanitize(doc.page_content)

        context_parts.append(
            f"[Giáo trình: {source_name} - Trang {page + 1}]: {content}"
        )

    return "\n\n".join(context_parts)


def _build_citation_text(filtered_docs: List, resolved_titles: dict) -> str:
    sources: Dict[str, dict] = {}

    for doc in filtered_docs:
        display_title = document_service.get_display_title(doc, resolved_titles)
        page = doc.metadata.get("page", 0) + 1

        if display_title not in sources:
            sources[display_title] = {
                "pages": set(),
                "url": doc.metadata.get("originalFileUrl", ""),
            }
        sources[display_title]["pages"].add(page)

    citation_parts: List[str] = []

    for src_name, source in sorted(sources.items(), key=lambda x: x[0]):
        sorted_pages = sorted(list(source["pages"]))[:3]
        pages_str = ", ".join(map(str, sorted_pages))
        # Storage paths are implementation details and can also disclose the
        # server's internal upload layout. The API already returns structured
        # document metadata for clients that need to open a source.
        citation_parts.append(f"- **{src_name}** — trang {pages_str}")

    if not citation_parts:
        return ""

    return "### Nguồn tài liệu trong hệ thống\n\n" + "\n".join(citation_parts)


def chat(request: ChatRequest) -> dict:
    try:
        question = robust_sanitize(request.message).strip()
        history_text = build_history_text(request.history)

        logger.info("HISTORY RECEIVED:")
        logger.info(history_text if history_text else "NO HISTORY")

        if not question:
            return {
                "message": "Bạn vui lòng nhập câu hỏi để mình hỗ trợ nhé.",
                "documents": [],
                "conversationId": robust_sanitize(request.conversationId),
            }

        # A count is authoritative metadata from Spring Boot; it does not
        # depend on FAISS being available.
        if is_document_count_query(question):
            return _document_count_response(question, request.conversationId)

        # Intent riêng: tìm tài liệu trong hệ thống.
        if is_document_search_query(question):
            search_result = document_service.search_documents_in_system(question, top_k=TOP_K)
            return {
                "message": search_result.get("message", ""),
                "documents": search_result.get("documents", []),
                "answerMode": "DOCUMENT_SEARCH",
                "sources": search_result.get("documents", []),
                "conversationId": robust_sanitize(request.conversationId),
            }

        if not vector_service.has_vector_store():
            return _general_chat_response(question, history_text, request.conversationId)

        # RAG QA: hỏi đáp kiến thức từ tài liệu.
        search_query = question
        if history_text and len(question.split()) <= 8:
            search_query = history_text[-500:] + "\nCâu hỏi hiện tại: " + question

        docs_with_scores = vector_service.similarity_search_with_score(search_query, k=TOP_K)
        sorted_docs_with_scores = sorted(docs_with_scores, key=lambda x: x[1])
        filtered_docs = select_relevant_documents(
            sorted_docs_with_scores,
            question,
            SIMILARITY_THRESHOLD,
            max_documents=4,
        )

        logger.info(f"RAG docs selected: {len(filtered_docs)}")
        for doc, score in sorted_docs_with_scores[:5]:
            logger.info(
                f"RAG score={score:.3f}, title={doc.metadata.get('title')}, "
                f"source={doc.metadata.get('source')}, page={doc.metadata.get('page')}"
            )

        if not filtered_docs:
            return _general_chat_response(question, history_text, request.conversationId)

        resolved_titles = document_service.resolve_titles_for_docs(filtered_docs)
        context = _build_context_from_docs(filtered_docs, resolved_titles)

        prompt = _build_rag_prompt(question, history_text, context)
        clean_response = call_llm(prompt)

        citation_text = _build_citation_text(filtered_docs, resolved_titles)
        final_message = clean_response

        if citation_text:
            final_message += "\n\n" + citation_text

        rag_documents = document_service.build_documents_payload_from_docs(
            filtered_docs,
            resolved_titles
        )

        return {
            "message": final_message,
            "documents": rag_documents,
            "answerMode": "RAG",
            "sources": rag_documents,
            "conversationId": robust_sanitize(request.conversationId),
        }

    except Exception as e:
        logger.error("AI service chat exception", exc_info=True)
        return {
            "message": f"Lỗi hệ thống AI service: {robust_sanitize(str(e))}",
            "documents": [],
            "conversationId": "error",
        }
