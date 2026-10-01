
# LIBRIA — Hệ thống thư viện số tích hợp AI
# Library-ai – Nền tảng thư viện và học tập thông minh

Library-ai là nền tảng quản lý thư viện số và hỗ trợ học tập dành cho các trung tâm đào tạo, trường học và cộng đồng học tập. Ứng dụng tập trung tài liệu học tập, hoạt động trao đổi của học viên và trợ lý AI vào một hệ thống duy nhất.

Hệ thống phù hợp với các trung tâm muốn:

- Xây dựng thư viện tài liệu số theo danh mục.
- Hỗ trợ học viên tìm kiếm, đọc, đánh giá và lưu tài liệu.
- Tạo không gian nhóm để học viên trao đổi và cộng tác.
- Cung cấp trợ lý AI trả lời câu hỏi dựa trên tài liệu đào tạo.
- Quản lý người dùng, nội dung, tài liệu và hoạt động toàn hệ thống.

## Chức năng chính

### Dành cho học viên và người dùng

- Đăng ký, đăng nhập, đổi mật khẩu và khôi phục mật khẩu.
- Cập nhật hồ sơ cá nhân và xem lịch sử hoạt động.
- Tra cứu thư viện theo danh mục và từ khóa.
- Xem chi tiết, tải/xem tài liệu PDF.
- Yêu thích, đánh giá và bình luận tài liệu.
- Tìm kiếm tài liệu có hỗ trợ AI.
- Trò chuyện với trợ lý AI bằng tiếng Việt.
- Lưu lịch sử các cuộc hội thoại AI.
- Tạo nhóm học tập, tham gia hoặc rời nhóm.
- Quản lý thành viên và yêu cầu tham gia nhóm.
- Trao đổi tin nhắn trong nhóm.
- Đọc tin tức và thông báo của trung tâm.
- Tham gia diễn đàn: đăng bài, bình luận, thích và báo cáo nội dung.

### Dành cho quản trị viên

- Dashboard tổng quan và thống kê hoạt động.
- Quản lý tài khoản, trạng thái và vai trò người dùng.
- Quản lý tài liệu, danh mục và nội dung thư viện.
- Quản lý nhóm học tập và thành viên.
- Quản lý tin tức và bài viết.
- Quản lý danh mục diễn đàn.
- Kiểm duyệt bài viết, xử lý báo cáo và ẩn/xóa nội dung vi phạm.

### Trợ lý AI học tập

- Hỏi đáp dựa trên nội dung tài liệu được nạp vào hệ thống.
- Tìm các đoạn tài liệu liên quan bằng vector search.
- Đồng bộ tài liệu từ backend sang AI service.
- Hỗ trợ tóm tắt tài liệu, tạo flashcard và tạo câu hỏi trắc nghiệm.
- Lưu lịch sử hội thoại theo từng người dùng.

## Kiến trúc hệ thống

Ứng dụng gồm ba service chính và các thành phần hạ tầng:

```text
Frontend React/Vite
        │
        ▼
Backend Spring Boot ───────► MySQL
        │
        ▼
AI Service FastAPI ────────► Ollama
        │
        └───────────────────► FAISS + Sentence Transformers
```

- Frontend giao tiếp với backend qua REST API.
- Backend xử lý xác thực, nghiệp vụ, dữ liệu người dùng và tài liệu.
- AI service xử lý embedding, tìm kiếm ngữ nghĩa và gọi mô hình Ollama.
- MySQL lưu dữ liệu nghiệp vụ.
- FAISS lưu chỉ mục vector cho chức năng hỏi đáp theo tài liệu.

## Công nghệ sử dụng

### Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- Axios
- Framer Motion, React Spring, Lottie
- Lucide React và React Hot Toast

### Backend

- Java 17
- Spring Boot 3.5
- Spring Web
- Spring Data JPA / Hibernate
- Spring Security
- JWT
- MySQL Connector
- SpringDoc OpenAPI / Swagger
- Maven

### AI service

- Python 3.11
- FastAPI và Uvicorn
- LangChain
- Ollama
- FAISS CPU
- Sentence Transformers
- PyMuPDF và PyPDF

### Triển khai

- Docker
- Docker Compose
- Nginx
- MySQL 8.4

## Yêu cầu cài đặt

### Cách khuyến nghị: chạy bằng Docker

Chỉ cần cài:

- Docker Desktop
- Git

Không cần cài Java, Maven, Python, Node.js, MySQL, Ollama hoặc các thư viện AI trên máy host.

### Chạy trong môi trường phát triển

Nếu muốn sửa code và debug bằng IntelliJ/VSCode, cần cài thêm:

- JDK 17 và Maven
- Python 3.11+
- Node.js 20+
- MySQL hoặc chạy MySQL bằng Docker
- Ollama hoặc chạy Ollama bằng Docker

## Chạy toàn bộ hệ thống bằng Docker

Clone repository và khởi động các service:

```bash
git clone <url-cua-repository>
cd Lib_AI
docker compose up --build
```

Mở ứng dụng tại:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- AI service: http://localhost:8000
- Swagger UI: http://localhost:8080/swagger-ui.html

Để chạy ở chế độ nền:

```bash
docker compose up --build -d
```

Xem log:

```bash
docker compose logs -f
```

Dừng các service:

```bash
docker compose down
```

Không dùng `docker compose down -v` nếu muốn giữ database, file upload, model Ollama và embedding model đã tải.

### Lần chạy đầu tiên

Docker sẽ tự động tải image, dependency, model Ollama và embedding model. Quá trình này có thể cần vài GB dung lượng và mất nhiều thời gian tùy tốc độ mạng. Các lần chạy sau sẽ sử dụng Docker volume đã được lưu cache.

Model mặc định là `qwen3.5:4b`. Có thể thay đổi trong file `.env` ở thư mục gốc:

```env
OLLAMA_MODEL=qwen3.5:4b
DB_PASSWORD=123456
JWT_SECRET=thay-bang-chuoi-bi-mat-dai-hon
```

Không nên đưa thông tin mật khẩu hoặc JWT secret thật lên Git.

## Chạy backend, AI service và frontend riêng khi phát triển

Bạn vẫn có thể chạy backend trong IntelliJ, AI service trong VSCode và frontend bằng Vite. Khi đó chỉ cần chạy MySQL và Ollama bằng Docker:

```bash
docker compose up -d mysql ollama
docker compose run --rm ollama-model
```

Các service local sử dụng các địa chỉ mặc định:

```env
DB_URL=jdbc:mysql://localhost:3306/digitallibrary
OLLAMA_BASE_URL=http://localhost:11434
AI_SERVICE_BASE_URL=http://localhost:8000
VITE_API_URL=http://localhost:8080/api
```

Khởi động theo thứ tự:

1. MySQL và Ollama bằng Docker.
2. AI service tại port `8000`.
3. Backend Spring Boot tại port `8080`.
4. Frontend bằng `npm install` và `npm run dev` tại port `5173`.

Không chạy đồng thời service local và container tương ứng, vì có thể gây trùng port.

## Cấu trúc thư mục

```text
.
├── apps
│   ├── frontend          # Ứng dụng React/Vite
│   ├── backend-spring    # REST API Spring Boot
│   └── ai-service        # FastAPI, RAG và Ollama integration
├── docker
│   └── nginx.conf        # Cấu hình phục vụ frontend
├── Dockerfile            # Image frontend
├── docker-compose.yml    # Toàn bộ môi trường Docker
└── README.md
```

## Một số endpoint kiểm tra

```text
GET  http://localhost:8080/api/health
GET  http://localhost:8000/health
POST http://localhost:8000/api/chat
POST http://localhost:8000/api/ingest
```

LIBRIA là nền tảng thư viện số dành cho học tập và chia sẻ kiến thức. Hệ thống kết hợp quản lý tài liệu, diễn đàn, nhóm học tập, tin tức, thông báo và trợ lý AI sử dụng RAG để hỏi đáp dựa trên nội dung PDF.

## 1. Tổng quan hệ thống

Hệ thống gồm bốn thành phần chính:

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, Axios | Giao diện người dùng và trang quản trị |
| Backend | Java 17, Spring Boot 3, Spring Security, Spring Data JPA | API nghiệp vụ, xác thực, phân quyền và quản lý dữ liệu |
| AI service | Python, FastAPI, LangChain, FAISS, Sentence Transformers | RAG, tìm kiếm ngữ nghĩa, tóm tắt và sinh nội dung từ PDF |
| Hạ tầng dữ liệu | MySQL 8, Ollama | Lưu dữ liệu nghiệp vụ và chạy mô hình ngôn ngữ cục bộ |

Luồng xử lý tổng quát:

```text
Trình duyệt
    │
    ▼
React / Nginx
    │  /api, /uploads
    ▼
Spring Boot ───────────────► MySQL
    │
    │ yêu cầu chat / đồng bộ tài liệu
    ▼
FastAPI ─────► FAISS Vector DB
    │
    ▼
Ollama (qwen3.5:4b mặc định)
```

Khi chạy bằng Docker, Nginx là điểm truy cập duy nhất từ bên ngoài. Nginx phục vụ React SPA và chuyển tiếp `/api` cùng `/uploads` đến backend. MySQL, backend và các dịch vụ AI chỉ giao tiếp trong mạng nội bộ Docker.

## 2. Vai trò người dùng

### Người dùng (`USER`)

- Đăng ký, đăng nhập và đặt lại mật khẩu.
- Cập nhật hồ sơ, đổi mật khẩu và xem hoạt động cá nhân.
- Xem, tìm kiếm, tải xuống và tương tác với tài liệu.
- Yêu thích, bình luận và đánh giá tài liệu.
- Đọc tin tức.
- Đăng bài, bình luận, thích và báo cáo nội dung diễn đàn.
- Tạo hoặc tham gia nhóm học tập, trò chuyện trong nhóm.
- Sử dụng trợ lý AI và quản lý lịch sử hội thoại.
- Xem, đánh dấu đã đọc hoặc xóa thông báo.

### Quản trị viên (`ADMIN`)

Quản trị viên có toàn bộ quyền của người dùng và thêm các quyền:

- Xem dashboard và số liệu thống kê.
- Tạo, sửa, khóa/mở khóa, đổi vai trò hoặc xóa tài khoản.
- Quản lý tài liệu và danh mục tài liệu.
- Quản lý nhóm học tập.
- Quản lý danh mục, bài viết và báo cáo diễn đàn.
- Xử lý vi phạm, xóa bài và ghi chú kiểm duyệt.
- Tạo, sửa, xuất bản hoặc xóa tin tức.

## 3. Chức năng và nghiệp vụ

### 3.1. Xác thực và tài khoản

- Tài khoản được đăng ký bằng username, email, mật khẩu và họ tên.
- Username và email không được trùng.
- Mật khẩu được mã hóa bằng BCrypt.
- Đăng nhập chấp nhận username hoặc email và trả về JWT Bearer token.
- API ngoài nhóm public yêu cầu header `Authorization: Bearer <token>`.
- Tài khoản mới mặc định có vai trò `USER` và trạng thái hoạt động.
- Quản trị viên có thể khóa tài khoản; tài khoản bị khóa không thể đăng nhập.
- Token đặt lại mật khẩu có hiệu lực 30 phút. Bản hiện tại trả token trực tiếp từ API, chưa tích hợp gửi email.

### 3.2. Thư viện tài liệu

- Tài liệu được phân loại theo danh mục.
- Người dùng có thể xem danh sách, lọc theo danh mục và xem chi tiết.
- Khi xem chi tiết, hệ thống tăng lượt xem.
- Upload hỗ trợ file tài liệu và ảnh bìa; file được lưu trong thư mục/volume `uploads`.
- Kích thước upload tối đa hiện tại là 50 MB cho một file và 60 MB cho một request.
- Người dùng có thể thêm/xóa yêu thích, bình luận, xóa bình luận của mình và đánh giá tài liệu.
- Khi tài liệu được tạo hoặc cập nhật, backend yêu cầu AI service ingest lại nội dung PDF.
- Khi tài liệu bị xóa, file, dữ liệu tương tác và vector tương ứng cũng được dọn dẹp.
- Hibernate đang dùng `ddl-auto=update`, vì vậy schema được tạo/cập nhật tự động khi backend khởi động.

### 3.3. Trợ lý AI và RAG

- Mỗi người dùng có thể tạo nhiều cuộc hội thoại và xem lại lịch sử tin nhắn.
- Spring Boot lưu hội thoại/tin nhắn trong MySQL rồi chuyển câu hỏi cùng lịch sử gần nhất sang FastAPI.
- FastAPI dùng embedding `sentence-transformers/all-MiniLM-L6-v2` và FAISS để tìm các đoạn PDF liên quan.
- Nếu tìm thấy ngữ cảnh phù hợp, nội dung được đưa vào prompt và câu trả lời kèm nguồn tài liệu/trang tham khảo.
- Nếu không có vector phù hợp, trợ lý vẫn có thể trả lời bằng kiến thức chung của mô hình Ollama.
- AI service còn có endpoint phục vụ ingest, đồng bộ, tìm tài liệu, tóm tắt, flashcard và quiz.
- Vector DB, cache Hugging Face và model Ollama được lưu bền vững bằng Docker volume để không tải lại ở lần chạy sau.

### 3.4. Diễn đàn

- Quản lý danh mục diễn đàn.
- Người dùng xem danh sách bài, xem chi tiết và tạo bài viết.
- Người dùng có thể bình luận, thích/bỏ thích bài viết và bình luận.
- Một bài viết có thể bị báo cáo để quản trị viên kiểm duyệt.
- Báo cáo đi qua các trạng thái `PENDING`, `RESOLVED`, `REJECTED`.
- Quản trị viên có thể xử lý hoặc từ chối báo cáo, thêm ghi chú và xóa bài vi phạm.

### 3.5. Nhóm học tập

- Người dùng có thể tạo nhóm `PUBLIC` hoặc `PRIVATE`.
- Người tạo nhóm trở thành thành viên của nhóm.
- Nhóm công khai có thể chấp nhận thành viên ngay; nhóm riêng tư tạo yêu cầu chờ duyệt.
- Yêu cầu tham gia có các trạng thái `PENDING`, `APPROVED`, `REJECTED`.
- Chủ nhóm có thể xem, duyệt hoặc từ chối yêu cầu tham gia.
- Thành viên đã được duyệt có thể xem và gửi tin nhắn nhóm.
- Người dùng có thể rời nhóm; chủ nhóm có quyền cập nhật hoặc xóa nhóm.

### 3.6. Tin tức

- Người dùng xem danh sách tin đã xuất bản, tin nổi bật và chi tiết tin.
- Tin tức hỗ trợ truy cập theo ID hoặc slug.
- Quản trị viên tạo, sửa và xóa tin.
- Tin có trạng thái `DRAFT` hoặc `PUBLISHED` và có thể được đánh dấu nổi bật.

### 3.7. Thông báo và thống kê

- Người dùng xem danh sách thông báo cá nhân.
- Có thể đánh dấu một thông báo hoặc toàn bộ thông báo là đã đọc.
- Người dùng có thể xóa thông báo.
- Quản trị viên có dashboard tổng hợp dữ liệu người dùng, tài liệu, diễn đàn, nhóm và các hoạt động liên quan.

## 4. Cấu trúc thư mục

```text
Lib_AI/
├── apps/
│   ├── frontend/          # React/Vite UI và cấu hình Nginx
│   ├── backend-spring/    # Spring Boot REST API
│   └── ai-service/        # FastAPI, RAG và FAISS vector database
├── compose.yaml           # Docker Compose cho toàn hệ thống
├── .env.docker.example    # Mẫu biến môi trường Docker
└── README.md
```

## 5. Chạy nhanh bằng Docker — khuyến nghị

### Yêu cầu

- Docker Desktop, hoặc Docker Engine có Docker Compose v2.
- Tối thiểu khoảng 2 GB RAM cho bản lõi.
- Nếu bật AI, nên có tối thiểu 8 GB RAM và đủ dung lượng để lưu model.

### 5.1. Cấu hình môi trường

PowerShell:

```powershell
Copy-Item .env.docker.example .env.docker
```

Linux/macOS:

```bash
cp .env.docker.example .env.docker
```

Đổi ít nhất các giá trị `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` và `JWT_SECRET` trước khi triển khai thật.

### 5.2. Chạy bản lõi

Bản lõi gồm React/Nginx, Spring Boot và MySQL, không tải thư viện/model AI nặng:

```bash
docker compose --env-file .env.docker up --build -d
```

Mở `http://localhost`. Nếu đổi `APP_PORT=8088`, truy cập `http://localhost:8088`.

### 5.3. Chạy đầy đủ cả AI

```bash
docker compose --env-file .env.docker --profile ai up --build -d
```

Lần đầu sẽ tải image AI, embedding model và `qwen3.5:4b`. Dữ liệu tải về được giữ trong volume nên các lần chạy sau chỉ cần:

```bash
docker compose --env-file .env.docker --profile ai up -d
```

### 5.4. Kiểm tra và xem log

```bash
docker compose ps
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f ai-service
```

Backend health check: `http://localhost/api/health`.

Swagger UI khi chạy qua Docker: `http://localhost/swagger-ui.html`.

### 5.5. Dừng hệ thống

Dừng nhưng giữ database, uploads và model:

```bash
docker compose down
```

Xóa cả container và toàn bộ volume dữ liệu:

```bash
docker compose down -v
```

> Cảnh báo: `down -v` xóa database, file upload, vector DB, cache embedding và model Ollama đã tải.

## 6. Chạy thủ công để phát triển

### Yêu cầu

- Node.js 20+ và npm.
- Java Development Kit 17.
- MySQL 8.
- Python 3.10 hoặc 3.11.
- Ollama nếu sử dụng chức năng AI.

### 6.1. Khởi tạo MySQL

```sql
CREATE DATABASE digitallibrary
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Thiết lập biến môi trường trước khi chạy backend. Ví dụ PowerShell:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/digitallibrary?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_password"
$env:JWT_SECRET="replace-with-a-long-random-secret-at-least-32-characters"
$env:AI_SERVICE_BASE_URL="http://localhost:8000"
```

### 6.2. Chạy Spring Boot

PowerShell:

```powershell
cd apps/backend-spring
.\mvnw.cmd spring-boot:run
```

Linux/macOS:

```bash
cd apps/backend-spring
./mvnw spring-boot:run
```

Backend chạy tại `http://localhost:8080`.

### 6.3. Chạy frontend

Mở terminal khác:

```bash
cd apps/frontend
npm ci
npm run dev
```

Frontend development chạy tại `http://localhost:5173` và mặc định gọi API tại `http://localhost:8080/api`.

### 6.4. Chạy AI service

Cài và khởi động Ollama, sau đó tải model:

```bash
ollama pull qwen3.5:4b
ollama serve
```

Mở terminal khác:

```bash
cd apps/ai-service
python -m venv .venv
```

PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:OLLAMA_MODEL="qwen3.5:4b"
$env:OLLAMA_BASE_URL="http://localhost:11434"
$env:BACKEND_BASE_URL="http://localhost:8080"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Linux/macOS:

```bash
source .venv/bin/activate
pip install -r requirements.txt
export OLLAMA_MODEL=qwen3.5:4b
export OLLAMA_BASE_URL=http://localhost:11434
export BACKEND_BASE_URL=http://localhost:8080
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

AI health check: `http://localhost:8000/health`.

## 7. Biến môi trường chính

| Biến | Mặc định development | Mô tả |
| --- | --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/digitallibrary...` | JDBC URL của MySQL |
| `DB_USERNAME` | `root` | Tài khoản MySQL |
| `DB_PASSWORD` | `123456` | Mật khẩu MySQL; cần thay khi triển khai |
| `JWT_SECRET` | Giá trị development trong application properties | Khóa ký JWT; bắt buộc thay trong production |
| `JWT_EXPIRATION` | `86400000` | Thời hạn token, đơn vị mili giây |
| `MAIL_ENABLED` | `false` | Bật gửi email đặt lại mật khẩu trong production |
| `SMTP_HOST`, `SMTP_PORT` | `localhost`, `587` | Máy chủ và cổng SMTP |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | — | Tài khoản SMTP gửi email |
| `FRONTEND_BASE_URL` | `http://localhost:5173` | Địa chỉ dùng để tạo liên kết đặt lại mật khẩu |
| `AI_SERVICE_BASE_URL` | `http://localhost:8000` | Địa chỉ FastAPI mà Spring Boot gọi |
| `VITE_API_URL` | `http://localhost:8080/api` | Base URL API phía frontend |
| `VITE_BACKEND_ORIGIN` | `http://localhost:8080` | Origin dùng để mở file upload |
| `OLLAMA_MODEL` | `qwen3.5:4b` | Model ngôn ngữ Ollama |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Địa chỉ Ollama |
| `BACKEND_BASE_URL` | `http://localhost:8080` | Backend mà AI service gọi ngược lại |
| `VECTOR_DB_PATH` | `apps/ai-service/vector_db` | Nơi lưu FAISS index |

## 8. API và địa chỉ hữu ích

| Địa chỉ | Mục đích |
| --- | --- |
| `/api/health` | Health check Spring Boot |
| `/swagger-ui.html` | Swagger UI |
| `/v3/api-docs` | OpenAPI JSON |
| `/api/auth/**` | Đăng ký, đăng nhập, quên/đặt lại mật khẩu |
| `/api/documents/**` | Tài liệu, yêu thích, bình luận, đánh giá |
| `/api/forum/**` | Diễn đàn |
| `/api/groups/**` | Nhóm học tập và chat nhóm |
| `/api/ai/**` | Chat AI và lịch sử hội thoại |
| `/api/news/**` | Tin tức |
| `/api/notifications/**` | Thông báo |
| `/api/admin/**` | Nghiệp vụ quản trị |
| `/api/analytics/**` | Dashboard thống kê quản trị |

## 9. Tạo tài khoản quản trị đầu tiên

Dự án hiện chưa có cơ chế seed admin tự động. Đăng ký một tài khoản bình thường trước, sau đó cập nhật vai trò trong MySQL:

```sql
UPDATE users
SET role = 'ADMIN'
WHERE username = 'your_username';
```

Đăng xuất và đăng nhập lại để JWT mới chứa quyền truy cập phù hợp.

## 10. Lưu ý triển khai

- Không commit `.env`, mật khẩu database hoặc JWT secret thật.
- Đổi toàn bộ mật khẩu mặc định trước khi public hệ thống.
- Cấu hình HTTPS ở reverse proxy khi triển khai production.
- CORS backend hiện cho phép frontend development tại `http://localhost:5173`; bản Docker dùng Nginx cùng origin nên không cần public CORS bổ sung.
- Chức năng quên mật khẩu hiện trả reset token qua API, chưa gửi email.
- AI là thành phần tùy chọn. Bản lõi vẫn hoạt động, nhưng trang chat AI và ingest vector cần profile `ai` hoặc AI service chạy riêng.
- File upload, database và model là dữ liệu bền vững; cần có kế hoạch backup volume khi triển khai thật.

## 11. Lệnh phát triển thường dùng

Frontend:

```bash
npm run dev
npm run build
npm run lint
```

Backend:

```bash
./mvnw test
./mvnw spring-boot:run
./mvnw clean package
```

Docker:

```bash
docker compose config
docker compose build
docker compose up -d
docker compose --profile ai up -d
docker compose logs -f
```
