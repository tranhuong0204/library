import re

import requests

from config import (
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    OLLAMA_NUM_CTX,
    OLLAMA_NUM_PREDICT,
    OLLAMA_REQUEST_TIMEOUT,
)


class OllamaClient:
    def invoke(self, prompt: str) -> str:
        response = requests.post(
            f"{OLLAMA_BASE_URL.rstrip('/')}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "think": False,
                "keep_alive": "24h",
                "options": {
                    "temperature": 0.1,
                    "num_ctx": OLLAMA_NUM_CTX,
                    "num_predict": OLLAMA_NUM_PREDICT,
                    "repeat_penalty": 1.1,
                },
            },
            timeout=(5, OLLAMA_REQUEST_TIMEOUT),
        )
        response.raise_for_status()
        payload = response.json()
        return str(payload.get("response", ""))


llm = OllamaClient()


FORBIDDEN_ANSWER_PATTERNS = [
    "xin lỗi, tôi không thể",
    "không tìm thấy thông tin",
    "không thấy thông tin",
    "tài liệu không cung cấp",
    "trong tài liệu không có",
    "không có thông tin liên quan",
    "dựa trên tài liệu được cung cấp",
    "dựa vào tài liệu được cung cấp",
]


def robust_sanitize(text):
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)
    return re.sub(r"[\ud800-\udfff]", "", text)


def contains_forbidden_answer(answer: str) -> bool:
    first_part = robust_sanitize(answer).lower()[:900]
    return any(pattern in first_part for pattern in FORBIDDEN_ANSWER_PATTERNS)


def build_general_prompt(question: str, history_text: str = "") -> str:
    return f"""
Bạn là trợ lý AI học tập LIBRIA. Hãy trả lời câu hỏi bằng tiếng Việt tự nhiên,
chính xác, ngắn gọn và dễ hiểu, dựa trên kiến thức chung của bạn.

Quy tắc:
- Chỉ viết bằng tiếng Việt; có thể giữ thuật ngữ chuyên môn tiếng Anh khi cần.
- Trả lời trực tiếp bằng kiến thức chung, dù câu hỏi không liên quan đến tài liệu.
- Không nói rằng bạn không tìm thấy tài liệu, không nhắc đến việc thiếu tài
  liệu — người dùng đang hỏi ngoài phạm vi thư viện, đó là điều bình thường,
  không cần xin lỗi hay giải thích về việc đó.
- Không bịa dữ kiện, số liệu, tên riêng hoặc mốc thời gian. Nếu không chắc
  chắn, hoặc thông tin thuộc loại có thể đã thay đổi theo thời gian (giá cả,
  phiên bản phần mềm, số liệu thống kê mới...), nói rõ giới hạn đó thay vì
  khẳng định chắc nịch.
- Trước khi trả lời câu hỏi kiến thức, tự kiểm tra lại các dữ kiện cốt lõi và quan hệ nguyên nhân - kết quả.
- Với câu hỏi khoa học, phải phân biệt đúng đầu vào, đầu ra và điều kiện của quá trình; không đảo ngược chúng.
- Chỉ mô tả đúng quá trình được hỏi; không trộn thêm quá trình khác (ví dụ hô hấp khi đang hỏi quang hợp) nếu người dùng không yêu cầu so sánh.
- Ưu tiên thông tin nền tảng đã được thừa nhận rộng rãi; không đoán con số, tên riêng hoặc mốc thời gian.
- Dùng lịch sử hội thoại để hiểu câu hỏi nối tiếp; nếu câu hỏi phụ thuộc
  ngữ cảnh trước đó mà lịch sử không đủ rõ, hỏi lại thay vì đoán.
- Trả lời đúng trọng tâm trong 1-2 đoạn; chỉ thêm ví dụ khi thật sự cần.
- Bắt buộc hoàn tất câu trả lời trong tối đa 100 từ; không dừng giữa câu.

Lịch sử hội thoại:
{history_text if history_text else "Không có."}

Câu hỏi: {question}

Trả lời bằng tiếng Việt:
"""


def build_retry_prompt(question: str, history_text: str = "") -> str:
    return f"""
Trả lời trực tiếp câu hỏi dưới đây hoàn toàn bằng tiếng Việt tự nhiên.
Không từ chối chỉ vì câu hỏi không liên quan đến tài liệu. Không bịa thông tin.
Tự kiểm tra dữ kiện cốt lõi trước khi viết và hoàn tất câu trả lời trong tối đa 100 từ.

Lịch sử: {history_text if history_text else "Không có."}
Câu hỏi: {question}
Trả lời:
"""


def call_llm_with_guard(
    prompt: str,
    question: str,
    history_text: str = "",
) -> tuple[str, bool]:
    response = llm.invoke(robust_sanitize(prompt))
    clean_response = robust_sanitize(str(response)).strip()

    if contains_forbidden_answer(clean_response):
        retry_prompt = build_retry_prompt(question, history_text)
        response = llm.invoke(robust_sanitize(retry_prompt))
        clean_response = robust_sanitize(str(response)).strip()
        return clean_response, True

    return clean_response, False


def call_llm(prompt: str) -> str:
    response = llm.invoke(robust_sanitize(prompt))
    return robust_sanitize(str(response)).strip()


def warm_up_llm() -> None:
    """Load the configured model into Ollama memory before serving user traffic."""
    llm.invoke("Chỉ trả lời đúng một từ: OK")
