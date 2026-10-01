import json
import sys
import time
from pathlib import Path

import requests

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
BASE = "http://localhost:8080/api"
AI = "http://localhost:8000"
KEY = "libria-e2e-internal-key-20260731"
PDF = Path("tmp/pdfs/libria_e2e_rag.pdf")


def auth(username, password):
    response = requests.post(
        BASE + "/auth/login",
        json={"usernameOrEmail": username, "password": password},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()["token"]


admin = auth("e2e_admin_20260731", "AdminPass!2026")
headers = {"Authorization": f"Bearer {admin}"}

category = requests.post(
    BASE + "/categories",
    headers=headers,
    json={"name": "E2E Isolated RAG", "description": "Isolated vector test"},
    timeout=15,
)
category.raise_for_status()
category_id = category.json()["id"]

with PDF.open("rb") as handle:
    document = requests.post(
        BASE + "/documents",
        headers=headers,
        files={"document": ("libria_e2e_rag.pdf", handle, "application/pdf")},
        data={
            "title": "Project Aurora Policy",
            "description": "Synthetic RAG fixture",
            "author": "Codex Test",
            "categoryId": str(category_id),
        },
        timeout=180,
    )
document.raise_for_status()
document_id = document.json()["id"]

common_headers = {"X-Internal-Api-Key": KEY}
general = requests.post(
    AI + "/api/chat",
    headers=common_headers,
    json={"message": "Quang hợp ở thực vật là gì?", "history": []},
    timeout=180,
)
general.raise_for_status()
general_data = general.json()

rag = requests.post(
    AI + "/api/chat",
    headers=common_headers,
    json={
        "message": (
            "According to the Project Aurora Policy document, what are the "
            "project codename, exact review cycle, and responsible unit?"
        ),
        "history": [],
    },
    timeout=180,
)
rag.raise_for_status()
rag_data = rag.json()

checks = {
    "general_mode": general_data.get("answerMode") == "GENERAL",
    "general_has_no_sources": general_data.get("documents") == [],
    "rag_mode": rag_data.get("answerMode") == "RAG",
    "rag_codename": "AURORA-7429" in rag_data.get("message", ""),
    "rag_cycle": "17" in rag_data.get("message", ""),
    "rag_unit": "Blue Lotus" in rag_data.get("message", ""),
    "rag_citation": "Nguồn tài liệu" in rag_data.get("message", ""),
    "rag_sources": bool(rag_data.get("sources")),
}

print(json.dumps({
    "checks": checks,
    "general": general_data,
    "rag": rag_data,
}, ensure_ascii=False, indent=2))

requests.delete(BASE + f"/documents/{document_id}", headers=headers, timeout=30)
requests.delete(BASE + f"/categories/{category_id}", headers=headers, timeout=30)

sys.exit(0 if all(checks.values()) else 1)
