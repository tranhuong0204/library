import unittest

from services.document_service import build_document_search_message


class DocumentSearchMessageTests(unittest.TestCase):

    def test_message_does_not_expose_internal_file_path(self):
        message = build_document_search_message([
            {
                "title": "Python cơ bản",
                "author": "Bùi Việt Hà",
                "categoryName": "Công nghệ thông tin",
                "pages": [1, 2],
                "snippets": ["Biến và kiểu dữ liệu trong Python"],
                "fileUrl": "/uploads/documents/internal-id.pdf",
            }
        ])

        self.assertIn("Python cơ bản", message)
        self.assertIn("Trang liên quan: 1, 2", message)
        self.assertNotIn("/uploads/", message)
        self.assertNotIn("File:", message)


if __name__ == "__main__":
    unittest.main()
