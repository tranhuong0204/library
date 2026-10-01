import json
import sys
import time
from pathlib import Path

import requests

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")


BASE = "http://localhost:8080/api"
AI_BASE = "http://localhost:8000"
AI_KEY = "libria-e2e-internal-key-20260731"
PDF = Path("tmp/pdfs/libria_e2e_rag.pdf").resolve()

results = []
state = {}


def record(name, ok, detail=""):
    results.append({"name": name, "ok": bool(ok), "detail": str(detail)[:300]})
    print(("PASS" if ok else "FAIL"), name, detail)


def call(name, method, path, token=None, expected=(200,), **kwargs):
    headers = dict(kwargs.pop("headers", {}))
    if token:
        headers["Authorization"] = f"Bearer {token}"
    started = time.perf_counter()
    try:
        response = requests.request(
            method, BASE + path, headers=headers, timeout=130, **kwargs
        )
        elapsed = time.perf_counter() - started
        ok = response.status_code in expected
        try:
            data = response.json()
        except Exception:
            data = response.text
        record(name, ok, f"status={response.status_code} time={elapsed:.2f}s")
        if not ok:
            print("  BODY", str(data)[:800])
        return data, response.status_code
    except Exception as exc:
        record(name, False, repr(exc))
        return {}, 0


def first_id(data):
    if isinstance(data, dict):
        for key in ("id", "documentId", "postId", "commentId", "reportId"):
            if data.get(key) is not None:
                return int(data[key])
    return None


user_login, _ = call(
    "auth.login.user",
    "POST",
    "/auth/login",
    json={"usernameOrEmail": "e2e_user_20260731", "password": "TestPass!2026"},
)
admin_login, _ = call(
    "auth.login.admin",
    "POST",
    "/auth/login",
    json={"usernameOrEmail": "e2e_admin_20260731", "password": "AdminPass!2026"},
)
USER = user_login.get("token")
ADMIN = admin_login.get("token")
state["user_id"] = user_login.get("id")
state["admin_id"] = admin_login.get("id")

call("health.public", "GET", "/health")
call("auth.login.invalid", "POST", "/auth/login", expected=(400,), json={
    "usernameOrEmail": "e2e_user_20260731", "password": "wrong-password"
})
call("auth.register.validation", "POST", "/auth/register", expected=(400,), json={
    "username": "x", "email": "invalid", "password": "1"
})
forgot_unknown, _ = call("auth.forgot.unknown", "POST", "/auth/forgot-password", json={
    "email": "unknown@example.test"
})
record("auth.forgot.no_token", "token" not in forgot_unknown)
call("auth.reset.invalid", "POST", "/auth/reset-password", expected=(400,), json={
    "token": "invalid-token", "newPassword": "NewPass!2026"
})

call("security.anonymous.protected", "GET", "/users/me", expected=(401, 403))
call("security.user.admin_denied", "GET", "/admin/users", USER, expected=(403,))
call("user.profile.get", "GET", "/users/me", USER)
call("user.profile.update", "PUT", "/users/me", USER, json={
    "fullName": "E2E User Updated", "email": "e2e_user_20260731@example.test",
    "major": "Software Testing"
})
call("user.activity", "GET", "/users/activity", USER)
call("user.password.invalid_old", "PUT", "/users/change-password", USER, expected=(400,), json={
    "oldPassword": "wrong-password", "newPassword": "AnotherPass!2026"
})

category, _ = call("category.create.admin", "POST", "/categories", ADMIN, json={
    "name": "E2E Category 20260731", "description": "Automated test category"
})
category_id = first_id(category)
state["category_id"] = category_id
call("category.list.public", "GET", "/categories")
call("category.create.user_denied", "POST", "/categories", USER, expected=(403,), json={
    "name": "Should Not Exist"
})
call("category.update.admin", "PUT", f"/categories/{category_id}", ADMIN, json={
    "name": "E2E Category Updated 20260731", "description": "Updated"
})

forum_category, _ = call("forum.category.create.admin", "POST", "/forum/categories", ADMIN, json={
    "name": "E2E Forum Category", "description": "Forum testing", "color": "#3366ff"
})
forum_category_id = first_id(forum_category)
state["forum_category_id"] = forum_category_id
call("forum.category.list", "GET", "/forum/categories", USER)
call("forum.category.create.user_denied", "POST", "/forum/categories", USER, expected=(403,), json={
    "name": "Forbidden category"
})
call("forum.category.update", "PUT", f"/forum/categories/{forum_category_id}", ADMIN, json={
    "name": "E2E Forum Category Updated", "description": "Updated", "color": "#2255aa"
})

post, _ = call("forum.post.create", "POST", "/forum/posts", USER, json={
    "title": "E2E Forum Post", "content": "Automated forum content",
    "categoryId": forum_category_id
})
post_id = first_id(post)
state["post_id"] = post_id
call("forum.post.list", "GET", "/forum/posts", USER)
call("forum.post.detail", "GET", f"/forum/posts/{post_id}", USER)
call("forum.post.update.owner", "PUT", f"/forum/posts/{post_id}", USER, json={
    "title": "E2E Forum Post Updated", "content": "Updated forum content",
    "categoryId": forum_category_id
})
call("forum.post.like", "POST", f"/forum/posts/{post_id}/like", ADMIN)
call("forum.post.unlike", "DELETE", f"/forum/posts/{post_id}/like", ADMIN)
comment, _ = call("forum.comment.create", "POST", f"/forum/posts/{post_id}/comments", ADMIN, json={
    "content": "E2E forum comment"
})
comment_id = first_id(comment)
if comment_id is None and isinstance(comment, dict):
    comment_id = first_id(comment.get("comment", {}))
state["comment_id"] = comment_id
call("forum.comment.like", "POST", f"/forum/comments/{comment_id}/like", USER)
call("forum.comment.unlike", "DELETE", f"/forum/comments/{comment_id}/like", USER)
report, _ = call("forum.report.create", "POST", f"/forum/posts/{post_id}/report", ADMIN, json={
    "reason": "OTHER", "description": "Automated moderation test"
})
report_id = first_id(report)
state["report_id"] = report_id
call("forum.admin.reports", "GET", "/admin/forum/reports", ADMIN)
call("forum.admin.report.resolve", "PUT", f"/admin/forum/reports/{report_id}/resolve", ADMIN, json={
    "adminNote": "Resolved by E2E"
})

group, _ = call("group.create", "POST", "/groups", USER, json={
    "name": "E2E Private Group", "description": "Automated group",
    "subject": "Testing", "visibility": "PRIVATE"
})
group_id = first_id(group)
state["group_id"] = group_id
call("group.list", "GET", "/groups", USER)
call("group.join.request", "POST", f"/groups/{group_id}/join", ADMIN)
join_requests, _ = call("group.join_requests.owner", "GET", f"/groups/{group_id}/join-requests", USER)
member_id = None
if isinstance(join_requests, list) and join_requests:
    member_id = join_requests[0].get("id") or join_requests[0].get("memberId")
state["join_member_id"] = member_id
call("group.join.approve", "POST", f"/groups/{group_id}/join-requests/{member_id}/approve", USER)
call("group.members", "GET", f"/groups/{group_id}/members", USER)
call("group.chat.send", "POST", f"/groups/{group_id}/chats", ADMIN, json={
    "content": "E2E chat message", "channel": "general"
})
call("group.chat.list", "GET", f"/groups/{group_id}/chats?channel=general", USER)
with PDF.open("rb") as handle:
    call("group.chat.attachment", "POST", f"/groups/{group_id}/chats/attachments", ADMIN,
         files={"file": ("e2e.pdf", handle, "application/pdf")},
         data={"content": "E2E attachment", "channel": "general"})
call("group.update.owner", "PUT", f"/groups/{group_id}", USER, json={
    "name": "E2E Private Group Updated", "description": "Updated",
    "subject": "QA", "visibility": "PRIVATE"
})
call("group.leave.member", "DELETE", f"/groups/{group_id}/leave", ADMIN)

news, _ = call("news.create.admin", "POST", "/admin/news", ADMIN, json={
    "title": "E2E Published News", "summary": "Test summary",
    "content": "Test news content", "thumbnailUrl": "",
    "category": "Testing", "featured": True, "status": "PUBLISHED"
})
news_id = first_id(news)
state["news_id"] = news_id
call("news.admin.list", "GET", "/admin/news", ADMIN)
call("news.list", "GET", "/news", USER)
call("news.featured", "GET", "/news/featured", USER)
call("news.detail", "GET", f"/news/{news_id}", USER)
call("news.update", "PUT", f"/admin/news/{news_id}", ADMIN, json={
    "title": "E2E Published News Updated", "summary": "Updated summary",
    "content": "Updated news content", "thumbnailUrl": "",
    "category": "Testing", "featured": False, "status": "PUBLISHED"
})

call("document.create.user_denied", "POST", "/documents", USER, expected=(403,),
     files={"document": ("e2e.pdf", PDF.open("rb"), "application/pdf")},
     data={"title": "Forbidden", "categoryId": str(category_id)})
with PDF.open("rb") as handle:
    document, _ = call("document.create.admin", "POST", "/documents", ADMIN,
        files={"document": ("libria_e2e_rag.pdf", handle, "application/pdf")},
        data={
            "title": "LIBRIA E2E RAG Knowledge", "description": "Synthetic RAG fixture",
            "author": "Codex Test", "categoryId": str(category_id)
        })
document_id = first_id(document)
state["document_id"] = document_id
call("document.list", "GET", "/documents", USER)
call("document.detail", "GET", f"/documents/{document_id}", USER)
call("document.comments.list", "GET", f"/documents/{document_id}/comments", USER)
doc_comment, _ = call("document.comment.create", "POST", f"/documents/{document_id}/comments", USER, json={
    "content": "E2E document comment"
})
doc_comment_id = first_id(doc_comment)
if doc_comment_id is None and isinstance(doc_comment, dict):
    doc_comment_id = first_id(doc_comment.get("comment", {}))
state["doc_comment_id"] = doc_comment_id
call("document.rating.create", "POST", f"/documents/{document_id}/ratings", USER, json={"rating": 5})
call("document.rating.get", "GET", f"/documents/{document_id}/ratings", USER)
call("document.favorite.add", "POST", f"/documents/{document_id}/favorite", USER)
call("document.favorite.list", "GET", "/documents/favorites", USER)
call("document.favorite.remove", "DELETE", f"/documents/{document_id}/favorite", USER)
call("document.internal.no_key", "GET", "/documents/ai-sync", expected=(401,))
call("document.internal.sync", "GET", "/documents/ai-sync", headers={"X-Internal-Api-Key": AI_KEY})
call("document.internal.titles", "GET", "/documents/resolve-titles", headers={"X-Internal-Api-Key": AI_KEY})
call("document.internal.search", "GET", "/documents/search-ai?keyword=Aurora", headers={"X-Internal-Api-Key": AI_KEY})

call("notifications.list", "GET", "/notifications", USER)
notifications, _ = call("notifications.list.admin", "GET", "/notifications", ADMIN)
if isinstance(notifications, list) and notifications:
    notification_id = notifications[0].get("id")
    call("notifications.read", "PUT", f"/notifications/{notification_id}/read", ADMIN)
    call("notifications.delete", "DELETE", f"/notifications/{notification_id}", ADMIN)
call("notifications.read_all", "PUT", "/notifications/read-all", USER)

call("analytics.dashboard", "GET", "/analytics/dashboard", ADMIN)
admin_users, _ = call("admin.users.list", "GET", "/admin/users", ADMIN)
call("admin.users.detail", "GET", f"/admin/users/{state['user_id']}", ADMIN)
temp_user, _ = call("admin.users.create", "POST", "/admin/users", ADMIN, json={
    "username": "e2e_temp_20260731", "email": "e2e_temp_20260731@example.test",
    "password": "TempPass!2026", "fullName": "E2E Temp", "role": "USER"
})
temp_data = temp_user.get("user", {}) if isinstance(temp_user, dict) else {}
temp_id = first_id(temp_data)
call("admin.users.update", "PUT", f"/admin/users/{temp_id}", ADMIN, json={
    "username": "e2e_temp_20260731", "email": "e2e_temp_20260731@example.test",
    "password": "", "fullName": "E2E Temp Updated", "role": "USER"
})
temp_login, _ = call("auth.login.temp", "POST", "/auth/login", json={
    "usernameOrEmail": "e2e_temp_20260731", "password": "TempPass!2026"
})
temp_token = temp_login.get("token")
call("admin.users.role", "PUT", f"/admin/users/{temp_id}/role", ADMIN, json={"role": "ADMIN"})
call("admin.users.status.lock", "PUT", f"/admin/users/{temp_id}/status", ADMIN, json={"enabled": False})
call("security.locked.jwt_rejected", "GET", "/users/me", temp_token, expected=(401, 403))
call("admin.users.delete", "DELETE", f"/admin/users/{temp_id}", ADMIN)

conversation, _ = call("ai.conversation.create", "POST", "/ai/conversations", USER, json={
    "title": "E2E AI Conversation"
})
conversation_id = first_id(conversation)
state["conversation_id"] = conversation_id
call("ai.conversations.list", "GET", "/ai/conversations", USER)
call("ai.messages.initial", "GET", f"/ai/conversations/{conversation_id}/messages", USER)
general, _ = call("ai.general.through_backend", "POST", f"/ai/conversations/{conversation_id}/messages", USER, json={
    "message": "Thủ đô của Nhật Bản là gì?", "conversationId": str(conversation_id)
})
record("ai.general.answer.nonempty", bool(general.get("message")))
call("ai.messages.after_general", "GET", f"/ai/conversations/{conversation_id}/messages", USER)

direct_no_key = requests.post(AI_BASE + "/api/chat", json={"message": "hello"}, timeout=20)
record("ai.direct.requires_key", direct_no_key.status_code == 401, direct_no_key.status_code)
direct_general = requests.post(
    AI_BASE + "/api/chat",
    headers={"X-Internal-Api-Key": AI_KEY},
    json={"message": "Thủ đô của Nhật Bản là gì?", "history": []},
    timeout=130,
)
record("ai.direct.general.status", direct_general.status_code == 200, direct_general.status_code)
if direct_general.status_code == 200:
    dg = direct_general.json()
    record("ai.direct.general.mode", dg.get("answerMode") == "GENERAL", dg.get("answerMode"))
    record("ai.direct.general.no_sources", dg.get("documents") == [], dg.get("documents"))

# Wait briefly for the asynchronous-looking (but synchronous HTTP) ingest path and test RAG.
time.sleep(2)
rag_response = requests.post(
    AI_BASE + "/api/chat",
    headers={"X-Internal-Api-Key": AI_KEY},
    json={
        "message": "Theo tài liệu Project Aurora, mã dự án, chu kỳ review và đơn vị phụ trách là gì?",
        "history": [],
    },
    timeout=130,
)
record("ai.direct.rag.status", rag_response.status_code == 200, rag_response.status_code)
if rag_response.status_code == 200:
    rag = rag_response.json()
    message = rag.get("message", "")
    record("ai.direct.rag.mode", rag.get("answerMode") == "RAG", rag.get("answerMode"))
    record("ai.direct.rag.fact.codename", "AURORA-7429" in message, message[:200])
    record("ai.direct.rag.fact.cycle", "17" in message, message[:200])
    record("ai.direct.rag.fact.unit", "Blue Lotus" in message, message[:200])
    record("ai.direct.rag.citation", "Nguồn tài liệu" in message and "trang 1" in message, message[-300:])
    record("ai.direct.rag.sources", bool(rag.get("sources")), rag.get("sources"))

call("ai.conversation.delete", "DELETE", f"/ai/conversations/{conversation_id}", USER)

# Cleanup resource endpoints also validate their DELETE behavior.
call("document.comment.delete", "DELETE", f"/documents/{document_id}/comments/{doc_comment_id}", USER)
call("document.delete.user_denied", "DELETE", f"/documents/{document_id}", USER, expected=(403,))
call("document.delete.admin", "DELETE", f"/documents/{document_id}", ADMIN)
call("news.delete", "DELETE", f"/admin/news/{news_id}", ADMIN)
call("group.delete.owner", "DELETE", f"/groups/{group_id}", USER)
call("forum.post.delete.owner", "DELETE", f"/forum/posts/{post_id}", USER)
call("forum.category.delete", "DELETE", f"/forum/categories/{forum_category_id}", ADMIN)
call("category.delete", "DELETE", f"/categories/{category_id}", ADMIN)

summary = {
    "total": len(results),
    "passed": sum(1 for item in results if item["ok"]),
    "failed": [item for item in results if not item["ok"]],
    "state": state,
}
Path("tmp/e2e_api_results.json").write_text(
    json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
)
print("SUMMARY", json.dumps(summary, ensure_ascii=False))
sys.exit(1 if summary["failed"] else 0)
