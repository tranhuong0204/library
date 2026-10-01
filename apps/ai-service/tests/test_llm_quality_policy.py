import unittest
from unittest.mock import Mock, patch

from config import OLLAMA_NUM_PREDICT
from services.llm_service import OllamaClient, build_general_prompt


class LlmQualityPolicyTests(unittest.TestCase):
    def test_default_output_budget_is_bounded_for_fast_complete_answers(self):
        self.assertGreaterEqual(OLLAMA_NUM_PREDICT, 200)
        self.assertLessEqual(OLLAMA_NUM_PREDICT, 256)

    def test_general_prompt_requires_fact_check_and_complete_answer(self):
        prompt = build_general_prompt("Quang hợp là gì?")
        self.assertIn("tự kiểm tra lại các dữ kiện cốt lõi", prompt)
        self.assertIn("không đảo ngược", prompt)
        self.assertIn("không trộn thêm quá trình khác", prompt)
        self.assertIn("không dừng giữa câu", prompt)

    @patch("services.llm_service.requests.post")
    def test_ollama_disables_hidden_thinking_for_fast_visible_answers(self, post):
        response = Mock()
        response.json.return_value = {"response": "Câu trả lời"}
        response.raise_for_status.return_value = None
        post.return_value = response

        answer = OllamaClient().invoke("Câu hỏi")

        self.assertEqual("Câu trả lời", answer)
        request_payload = post.call_args.kwargs["json"]
        self.assertFalse(request_payload["think"])
        self.assertFalse(request_payload["stream"])


if __name__ == "__main__":
    unittest.main()
