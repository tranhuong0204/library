import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:4b")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_REQUEST_TIMEOUT = int(os.getenv("OLLAMA_REQUEST_TIMEOUT", "180"))

VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", os.path.join(BASE_DIR, "vector_db"))

BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8080")
AI_SERVICE_API_KEY = os.getenv("AI_SERVICE_API_KEY", "local-development-ai-key-change-me")
AI_UPLOAD_DIR = os.path.realpath(
    os.getenv(
        "AI_UPLOAD_DIR",
        os.path.join(BASE_DIR, "..", "backend-spring", "uploads"),
    )
)

TOP_K = int(os.getenv("TOP_K", "5"))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "1.1"))
MAX_CONTEXT_LENGTH = int(os.getenv("MAX_CONTEXT_LENGTH", "2500"))
MAX_HISTORY_MESSAGES = int(os.getenv("MAX_HISTORY_MESSAGES", "10"))
OLLAMA_NUM_PREDICT = int(os.getenv("OLLAMA_NUM_PREDICT", "240"))
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "4096"))

EMBEDDING_MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL_NAME",
    "sentence-transformers/all-MiniLM-L6-v2"
)
