from types import SimpleNamespace
import unittest

from services.retrieval_policy import (
    has_document_intent,
    normalize_terms,
    select_relevant_documents,
)


def make_doc(content: str, title: str = ""):
    return SimpleNamespace(
        page_content=content,
        metadata={"title": title},
    )


class RetrievalPolicyTests(unittest.TestCase):

    def test_normalize_terms_handles_vietnamese_accents(self):
        self.assertIn("spring", normalize_terms("Tài liệu Spring Boot"))
        self.assertIn("lieu", normalize_terms("Tài liệu Spring Boot"))

    def test_document_intent_is_detected(self):
        self.assertTrue(has_document_intent("Trong thư viện có tài liệu SQL nào?"))
        self.assertFalse(has_document_intent("Thời tiết hôm nay thế nào?"))

    def test_unrelated_document_is_not_selected_even_with_good_vector_score(self):
        doc = make_doc("Spring Boot và REST API", "Lập trình Java")
        selected = select_relevant_documents(
            [(doc, 0.2)],
            "Cách chăm sóc cây hoa hồng?",
            threshold=1.1,
        )
        self.assertEqual([], selected)

    def test_relevant_document_is_selected(self):
        doc = make_doc(
            "Spring Security sử dụng JWT để xác thực REST API.",
            "Bảo mật Spring Boot",
        )
        selected = select_relevant_documents(
            [(doc, 0.7)],
            "Spring Security xác thực JWT như thế nào?",
            threshold=1.1,
        )
        self.assertEqual([doc], selected)

    def test_shared_generic_location_does_not_force_rag(self):
        doc = make_doc(
            "Giáo trình SQL được biên soạn và sử dụng tại Việt Nam.",
            "Giáo trình SQL",
        )
        selected = select_relevant_documents(
            [(doc, 0.2)],
            "Thủ đô của Việt Nam là gì?",
            threshold=1.1,
        )
        self.assertEqual([], selected)

    def test_single_specific_topic_can_use_rag(self):
        doc = make_doc("SQL là ngôn ngữ truy vấn cơ sở dữ liệu.", "Giáo trình SQL")
        selected = select_relevant_documents(
            [(doc, 0.4)],
            "SQL là gì?",
            threshold=1.1,
        )
        self.assertEqual([doc], selected)

    def test_score_above_threshold_is_rejected(self):
        doc = make_doc("SQL sử dụng khóa chính để định danh bản ghi.", "Cơ sở dữ liệu")
        selected = select_relevant_documents(
            [(doc, 1.5)],
            "Khóa chính SQL là gì?",
            threshold=1.1,
        )
        self.assertEqual([], selected)


if __name__ == "__main__":
    unittest.main()
