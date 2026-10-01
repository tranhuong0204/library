import sys
import io
import logging
import hmac

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from langchain_community.document_loaders import PyMuPDFLoader

from config import AI_SERVICE_API_KEY, OLLAMA_MODEL, VECTOR_DB_PATH
from schemas import ChatRequest, IngestRequest
from services.chat_service import chat as chat_service
from services.document_service import robust_sanitize, sync_documents as sync_documents_service
from services.llm_service import call_llm, warm_up_llm
from services.vector_service import (
    delete_document_vectors,
    has_vector_store,
    ingest_document,
    load_vector_store,
    resolve_ingest_file_path,
)

# Force UTF-8 for standard streams on Windows
try:
    if hasattr(sys.stdout, "buffer"):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
except Exception:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("ai_service")
logger.info("--- AI SERVICE STARTING ---")

app = FastAPI(title="LIBRIA AI PRO")


@app.middleware("http")
async def require_internal_api_key(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)

    provided_key = request.headers.get("X-Internal-Api-Key", "")
    if not hmac.compare_digest(provided_key, AI_SERVICE_API_KEY):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    return await call_next(request)

# Load FAISS vector DB when app starts
load_vector_store()

try:
    logger.info("Warming up Ollama model %s...", OLLAMA_MODEL)
    warm_up_llm()
    logger.info("Ollama model is ready.")
except Exception:
    # Do not prevent the API from starting when Ollama is temporarily unavailable.
    logger.warning("Ollama warm-up failed; the first chat request will retry.", exc_info=True)


@app.post("/api/chat")
async def chat(request: ChatRequest):
    return chat_service(request)


@app.post("/api/ingest")
async def ingest_document_api(request: IngestRequest):
    return ingest_document(request)


@app.delete("/api/vector/document/{document_id}")
async def delete_document_vectors_api(document_id: str):
    return delete_document_vectors(document_id)


@app.post("/api/sync-documents")
async def sync_documents_api():
    return sync_documents_service()


@app.post("/api/summarize")
async def summarize(request: IngestRequest):
    try:
        resolved_path = resolve_ingest_file_path(request)
        loader = PyMuPDFLoader(resolved_path)
        docs = loader.load()

        content = robust_sanitize("\n".join([doc.page_content for doc in docs]))

        prompt = f"""
Hãy tóm tắt nội dung sau một cách chi tiết, khoa học, dễ hiểu bằng tiếng Việt:

{content[:8000]}
"""

        return {"summary": call_llm(prompt)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("AI service summarize exception", exc_info=True)
        raise HTTPException(status_code=500, detail=robust_sanitize(str(e)))


@app.post("/api/flashcards")
async def flashcards(request: IngestRequest):
    try:
        resolved_path = resolve_ingest_file_path(request)
        loader = PyMuPDFLoader(resolved_path)
        docs = loader.load()

        content = robust_sanitize("\n".join([doc.page_content for doc in docs]))

        prompt = f"""
Tạo 5 flashcards từ nội dung sau.
Trả về bằng tiếng Việt, dạng JSON list.
Mỗi phần tử gồm:
- question
- answer

Nội dung:
{content[:6000]}
"""

        return {"flashcards": call_llm(prompt)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("AI service flashcards exception", exc_info=True)
        raise HTTPException(status_code=500, detail=robust_sanitize(str(e)))


@app.post("/api/quiz")
async def quiz(request: IngestRequest):
    try:
        resolved_path = resolve_ingest_file_path(request)
        loader = PyMuPDFLoader(resolved_path)
        docs = loader.load()

        content = robust_sanitize("\n".join([doc.page_content for doc in docs]))

        prompt = f"""
Tạo bài kiểm tra 5 câu hỏi trắc nghiệm từ nội dung sau.
Trả về bằng tiếng Việt, dạng JSON.
Mỗi câu gồm:
- question
- options
- correctAnswer
- explanation

Nội dung:
{content[:6000]}
"""

        return {"quiz": call_llm(prompt)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("AI service quiz exception", exc_info=True)
        raise HTTPException(status_code=500, detail=robust_sanitize(str(e)))


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": OLLAMA_MODEL,
        "vectorDbPath": VECTOR_DB_PATH,
        "vectorStoreLoaded": has_vector_store(),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
