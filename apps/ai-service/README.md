# Hướng Dẫn Chạy AI Service

## 1. Yêu Cầu
- **Python 3.8+**
- **Ollama 0.32.5+**: Đã cài đặt và chạy (tải model `qwen3.5:4b`).

## 2. Cài Đặt (Lần đầu)
Mở terminal tại thư mục `apps/ai-service`:
```bash
# Cài đặt thư viện
pip install -r requirements.txt
```

## 3. Chạy Server
```bash
# Chạy server với tính năng tự động reload khi sửa code
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Hoặc nếu dùng `py` launcher trên Windows:
```bash
py -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 4. API Endpoints
- **Health Check**: `GET http://localhost:8000/health`
- **Chat**: `POST http://localhost:8000/api/chat`
- **Ingest PDF**: `POST http://localhost:8000/api/ingest`
