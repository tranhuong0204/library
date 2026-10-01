import json
import sys
from pathlib import Path

import requests

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
BASE = "http://localhost:8080/api"
PDF = Path("tmp/pdfs/libria_e2e_rag.pdf")
results = []


def token(username, password):
    response = requests.post(BASE + "/auth/login", json={
        "usernameOrEmail": username, "password": password
    }, timeout=15)
    response.raise_for_status()
    return response.json()["token"]


USER = token("e2e_user_20260731", "TestPass!2026")
ADMIN = token("e2e_admin_20260731", "AdminPass!2026")


def call(name, method, path, auth=None, expected=(200,), **kwargs):
    headers = kwargs.pop("headers", {})
    if auth:
        headers["Authorization"] = f"Bearer {auth}"
    response = requests.request(
        method, BASE + path, headers=headers, timeout=180, **kwargs
    )
    ok = response.status_code in expected
    try:
        body = response.json()
    except Exception:
        body = response.text
    results.append((name, ok, response.status_code))
    print("PASS" if ok else "FAIL", name, response.status_code)
    if not ok:
        print(str(body)[:600])
    return body


category = call("category.create", "POST", "/categories", ADMIN, json={
    "name": "E2E Supplement Category", "description": "Supplement"
})
category_id = category["id"]

with PDF.open("rb") as handle:
    document = call("document.create", "POST", "/documents", ADMIN,
        files={"document": ("supplement.pdf", handle, "application/pdf")},
        data={"title": "E2E Supplement Document", "categoryId": str(category_id)})
document_id = document["id"]
call("document.update", "PUT", f"/documents/{document_id}", ADMIN, files={
    "title": (None, "E2E Supplement Document Updated"),
    "description": (None, "Updated without replacing file"),
    "author": (None, "E2E"),
    "categoryId": (None, str(category_id)),
})

news = call("news.create", "POST", "/admin/news", ADMIN, json={
    "title": "E2E Unique Slug News", "summary": "Summary", "content": "Content",
    "thumbnailUrl": "", "category": "Testing", "featured": False,
    "status": "PUBLISHED"
})
news_id = news["id"]
slug = news.get("slug")
if slug:
    call("news.by_slug", "GET", f"/news/slug/{slug}", USER)
else:
    results.append(("news.by_slug", False, 0))
    print("FAIL news.by_slug missing slug")

forum_category = call("forum.category.create", "POST", "/forum/categories", ADMIN, json={
    "name": "E2E Supplement Forum", "description": "Supplement", "color": "#334455"
})
forum_category_id = forum_category["id"]

posts = []
reports = []
for index in range(3):
    post = call(f"forum.post.create.{index}", "POST", "/forum/posts", USER, json={
        "title": f"E2E Moderation Post {index}",
        "content": f"Moderation content {index}",
        "categoryId": forum_category_id,
    })
    posts.append(post["id"])
    report = call(f"forum.report.create.{index}", "POST", f"/forum/posts/{post['id']}/report", ADMIN, json={
        "reason": "OTHER", "description": f"Moderation report {index}"
    })
    reports.append(report["reportId"])

call("forum.report.reject", "PUT", f"/admin/forum/reports/{reports[0]}/reject", ADMIN, json={
    "adminNote": "Rejected by supplement"
})
call("forum.moderation.generic", "POST", "/admin/forum/moderation", ADMIN, json={
    "reportId": reports[1], "action": "resolve", "adminNote": "Generic moderation"
})
call(
    "forum.admin.delete_reported_post",
    "DELETE",
    f"/admin/forum/posts/{posts[2]}?reportId={reports[2]}",
    ADMIN,
)

group = call("group.create", "POST", "/groups", USER, json={
    "name": "E2E Reject Group", "description": "Reject branch",
    "subject": "QA", "visibility": "PRIVATE"
})
group_id = group["id"]
call("group.join", "POST", f"/groups/{group_id}/join", ADMIN)
join_requests = call("group.join_requests", "GET", f"/groups/{group_id}/join-requests", USER)
member_id = join_requests[0]["id"]
call("group.join.reject", "POST", f"/groups/{group_id}/join-requests/{member_id}/reject", USER)

ai_chat = call("ai.chat.compatibility", "POST", "/ai/chat", USER, json={
    "message": "2 cộng 2 bằng bao nhiêu?"
})
if not ai_chat.get("message"):
    results.append(("ai.chat.compatibility.message", False, 0))
else:
    results.append(("ai.chat.compatibility.message", True, 200))
    print("PASS ai.chat.compatibility.message")

call("document.delete", "DELETE", f"/documents/{document_id}", ADMIN)
call("news.delete", "DELETE", f"/admin/news/{news_id}", ADMIN)
call("group.delete", "DELETE", f"/groups/{group_id}", USER)
for post_id in posts[:2]:
    call(f"forum.post.delete.{post_id}", "DELETE", f"/forum/posts/{post_id}", USER)
call("forum.category.delete", "DELETE", f"/forum/categories/{forum_category_id}", ADMIN)
call("category.delete", "DELETE", f"/categories/{category_id}", ADMIN)

failed = [item for item in results if not item[1]]
print(json.dumps({"total": len(results), "passed": len(results) - len(failed), "failed": failed}))
sys.exit(1 if failed else 0)
