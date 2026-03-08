# 📊 SageLMS — Tổng hợp trạng thái dự án & Phân công công việc

> **Cập nhật lần cuối:** 2026-03-08 (tối)
> **Giai đoạn hiện tại:** Milestone 1.1 hoàn tất + Database schema implemented — sẵn sàng bắt đầu Milestone 1.2+

---

## 1. Tổng quan dự án

**SageLMS** là nền tảng học tập trực tuyến (LMS) kiến trúc **microservices**, tích hợp **AI Tutor** theo mô hình RAG (Retrieval-Augmented Generation).

### Thành viên

| STT | Họ tên | Vai trò |
|-----|--------|---------|
| 1 | Huỳnh Lê Đại Thắng | Leader |
| 2 | Trần Nguyễn Việt Hoàng | Member |
| 3 | Bùi Ngọc Thái | Member |
| 4 | Nguyễn Trường Duy | Member |

### MVP Scope

| Module | Mô tả |
|--------|--------|
| **Auth & RBAC** | Đăng ký/đăng nhập, JWT, phân quyền (admin/instructor/student) |
| **LMS Core** | Course CRUD, Enroll, Content metadata, Progress tracking |
| **Assessment** | Quiz/Question CRUD, attempt, chấm điểm cơ bản |
| **AI Tutor (RAG)** | Ingestion → embedding → vector search → LLM answer + citation |
| **Async Jobs** | Redis queue + worker, job status tracking |
| **Frontend** | React SPA: auth pages, course listing, lesson viewer, quiz, AI chat |

---

## 2. Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS 3, React Router 6 |
| **Core Backend** | Spring Boot 3.x, Java 17 |
| **AI Tutor** | FastAPI, Python 3.11, LangChain |
| **API Gateway** | Spring Cloud Gateway |
| **Database** | PostgreSQL 16 + pgvector |
| **Cache / Queue** | Redis 7 |
| **Migration** | Flyway (Java), Alembic (Python) |
| **Auth** | Spring Security + JWT |
| **Testing** | JUnit 5 + Mockito (Java), Vitest (Frontend), pytest (Python) |
| **Infra** | Docker Compose (local), Kubernetes (staging) |
| **CI** | GitHub Actions (PR-level: secret scan, lint, tests) |

---

## 3. Kiến trúc hệ thống

```
Browser (React SPA)
       │ HTTPS
       ▼
┌──────────────────┐
│   API Gateway    │  ← JWT validation, RBAC, routing, correlation-id
│ (Spring Cloud GW)│
└──┬──┬──┬──┬──┬───┘
   │  │  │  │  │
   │  │  │  │  └──► auth-service        :8081  (Spring Boot)
   │  │  │  └─────► course-service      :8082  (Spring Boot)
   │  │  └────────► content-service     :8083  (Spring Boot)
   │  └───────────► progress-service    :8084  (Spring Boot)
   └──────────────► assessment-service  :8085  (Spring Boot)
                    ai-tutor-service    :8086  (FastAPI + LangChain)
                          │
                          ▼
                    ┌───────────┐
                    │  Worker   │  ← Redis Queue consumer
                    │(Spring    │
                    │ Boot)     │
                    └───────────┘

Data stores:
  ┌────────────────────┐    ┌───────────┐
  │ PostgreSQL 16      │    │ Redis 7   │
  │ + pgvector         │    │ cache +   │
  │ (schema-per-svc)   │    │ queue     │
  └────────────────────┘    └───────────┘
```

### Nguyên tắc thiết kế

- **Schema-per-service**: Mỗi service sở hữu schema DB riêng, không join cross-schema
- **API-first**: OpenAPI 3.0 contract cho mọi service
- **Correlation ID**: `X-Correlation-Id` xuyên suốt Gateway → services
- **Error format thống nhất**: `{ timestamp, path, errorCode, message, correlationId }`
- **Async-first cho tác vụ nặng**: Ingestion, quiz generation qua Redis queue

---

## 4. Cấu trúc thư mục

```
sagelms/
├── apps/web/                    → Frontend (React 18 + Vite + TypeScript)
├── services/
│   ├── gateway/                 → API Gateway (Spring Cloud Gateway)    :8080
│   ├── auth-service/            → Xác thực & phân quyền                :8081
│   ├── course-service/          → Quản lý khoá học                     :8082
│   ├── content-service/         → Quản lý nội dung bài giảng           :8083
│   ├── progress-service/        → Theo dõi tiến trình học              :8084
│   ├── assessment-service/      → Quiz & chấm điểm                    :8085
│   ├── ai-tutor-service/        → AI Tutor chatbot (FastAPI)           :8086
│   └── worker/                  → Background jobs (Redis consumer)
├── infra/
│   ├── docker/                  → Docker Compose (PostgreSQL + Redis + optional services)
│   └── k8s/                     → Kubernetes manifests (placeholder)
├── contracts/
│   ├── openapi/                 → OpenAPI specs (gateway, auth, course, content, progress, assessment, ai-tutor)
│   └── asyncapi/                → AsyncAPI specs (jobs)
├── docs/                        → Tài liệu (architecture, onboarding, roadmap, ADR, runbooks)
├── scripts/                     → Build/Deploy scripts (placeholder)
├── .github/                     → CI workflows, PR template, issue templates, CODEOWNERS
├── .env.example                 → Template biến môi trường
├── Makefile                     → Shortcuts: make up/down/logs/ps/clean
└── README.md                    → Tài liệu chính
```

---

## 5. Trạng thái hiện tại — Cái gì ĐÃ LÀM XONG

### ✅ Milestone 1.1 — Repo Bootstrap (HOÀN TẤT)

| Hạng mục | Chi tiết |
|----------|---------|
| **Mono-repo structure** | Tất cả services + frontend + infra + docs trong 1 repo |
| **Governance kit** | `.github/`: CI workflow, PR template, issue templates, CODEOWNERS, dependabot |
| **CI Pipeline** (`ci-pr.yml`) | Secret scan (gitleaks), PR title/branch/commit lint, path-based test matrix cho Java/Frontend/Python |
| **Docker Compose** | PostgreSQL 16 + pgvector, Redis 7, **pgAdmin 4** (DB UI), optional gateway + auth-service (`--profile app`) |
| **7 Java service skeletons** | Mỗi service có: `pom.xml`, `mvnw`/`mvnw.cmd` (Maven Wrapper), `application.yml`, Actuator health endpoint, 1 smoke test |
| **Frontend skeleton** | React 18 + Vite + TypeScript + Tailwind CSS 3 + React Router 6, 1 test file, Vitest config |
| **AI Tutor placeholder** | FastAPI `main.py` + health endpoint + **Alembic migration setup** (config, env.py, initial migration) |
| **OpenAPI contracts** | 7 files YAML reference specs (gateway, auth, course, content, progress, assessment, ai-tutor) |
| **AsyncAPI contract** | `jobs.yaml` cho async job specs |
| **Docs đầy đủ** | Architecture overview, onboarding guide, roadmap, project brief, working agreements, ADRs, runbooks, **database-design.md** |
| **Kubernetes placeholder** | Namespace `dev.yaml`, kustomization base |

### ✅ Database Schema Implementation (2026-03-08 tối)

> Thiết kế DB hoàn chỉnh tại `docs/database-design.md` (15 bảng, 6 schemas). Migration files đã tạo cho tất cả services.

| Schema | Service | Migration Tool | Bảng | File |
|--------|---------|---------------|------|------|
| `auth` | auth-service | Flyway | `users`, `refresh_tokens` | `V1__create_auth_tables.sql` |
| `course` | course-service | Flyway | `courses`, `enrollments` | `V1__create_course_tables.sql` |
| `content` | content-service | Flyway | `lessons` | `V1__create_content_tables.sql` |
| `progress` | progress-service | Flyway | `lesson_progress` | `V1__create_progress_tables.sql` |
| `assessment` | assessment-service | Flyway | `quizzes`, `questions`, `choices`, `attempts`, `attempt_answers` | `V1__create_assessment_tables.sql` |
| `ai_tutor` | ai-tutor-service | Alembic | `documents`, `document_chunks`, `chat_history`, `jobs` | `0001_create_ai_tutor_tables.py` |

- **Java services**: Flyway tự chạy migration khi `spring-boot:run` (không cần lệnh thủ công)
- **AI Tutor**: Chạy `uvx --with psycopg2-binary alembic upgrade head` trong thư mục `services/ai-tutor-service/`
- **pgAdmin 4**: Truy cập `http://localhost:5050` (email: `admin@sagelms.dev`, password: `admin`) để xem DB trực quan

### ✅ Kết quả kiểm tra (2026-03-08)

| # | Hạng mục | Kết quả |
|---|----------|---------|
| 1 | Docker: PostgreSQL + Redis + pgAdmin | ✅ Healthy |
| 2 | Gateway unit test | ✅ BUILD SUCCESS (0 errors) |
| 3 | Auth Service unit test | ✅ BUILD SUCCESS (0 errors) |
| 4 | Course Service unit test | ✅ BUILD SUCCESS (0 errors) |
| 5 | Content Service unit test | ✅ BUILD SUCCESS (0 errors) |
| 6 | Progress Service unit test | ✅ BUILD SUCCESS (0 errors) |
| 7 | Assessment Service unit test | ✅ BUILD SUCCESS (0 errors) |
| 8 | Worker unit test | ✅ BUILD SUCCESS (0 errors) |
| 9 | Frontend unit test | ✅ PASS |
| 10 | Frontend build (tsc + vite) | ✅ PASS |
| 11 | Gateway `spring-boot:run` + `/actuator/health` | ✅ `{"status":"UP"}` |
| 12 | Frontend dev server | ✅ Running tại `http://localhost:3000` |
| 13 | Flyway migrations (5 Java services) | ✅ `mvnw compile` thành công |
| 14 | Alembic migration (ai-tutor-service) | ✅ `alembic upgrade head` thành công |
| 15 | Database: 15 bảng / 6 schemas tạo thành công | ✅ Verified via `psql` + pgAdmin ERD |

### ⚠️ Lưu ý

- **Chỉ Gateway + Auth Service** có Dockerfile. Các services khác cần bổ sung.
- **AI Tutor** có FastAPI skeleton + Alembic migration, chưa có business logic (RAG, LLM).

---

## 6. Cái gì CẦN LÀM — Theo Milestones

### 🔴 Milestone 1.2 — Auth & Gateway (Ưu tiên cao nhất)

| Task | Service | Mô tả chi tiết | Kỹ năng cần |
|------|---------|----------------|------------|
| ~~**Auth: User entity + migration**~~ | auth-service | ✅ ĐÃ XONG — Flyway migration `V1__create_auth_tables.sql` (users + refresh_tokens). Còn lại: JPA Entity class | ~~Java, SQL, Flyway~~ |
| **Auth: JPA Entity classes** | auth-service | Tạo `User.java`, `RefreshToken.java` entity + `BaseEntity.java` (`@PreUpdate`) | Java, JPA |
| **Auth: Register endpoint** | auth-service | `POST /api/v1/auth/register` — hash password (BCrypt), lưu user, trả JWT | Spring Security, JWT |
| **Auth: Login endpoint** | auth-service | `POST /api/v1/auth/login` — validate credentials, trả JWT access + refresh token | Spring Security, JWT |
| **Auth: User CRUD** | auth-service | `GET/PUT/DELETE /api/v1/users/{id}` — admin quản lý users | Spring Boot, JPA |
| **Gateway: JWT validation filter** | gateway | Validate JWT trên mọi request (trừ auth routes), extract user info | Spring Cloud Gateway, JWT |
| **Gateway: RBAC filter** | gateway | Kiểm tra role (ADMIN/INSTRUCTOR/STUDENT) dựa trên JWT claims | Spring Security |
| **Gateway: Correlation-ID filter** | gateway | Tự động generate `X-Correlation-Id` nếu chưa có, forward xuống services | Spring Cloud Gateway |
| **OpenAPI spec hoàn chỉnh** | contracts | Cập nhật `auth.yaml` và `gateway.yaml` với đầy đủ request/response schema | OpenAPI 3.0 |
| **Unit tests bổ sung** | auth + gateway | Test login/register/JWT validation logic | JUnit 5, Mockito |

---

### 🟡 Milestone 1.3 — Core LMS

| Task | Service | Mô tả chi tiết | Kỹ năng cần |
|------|---------|----------------|------------|
| ~~**Course entity + migration**~~ | course-service | ✅ ĐÃ XONG — `V1__create_course_tables.sql` (courses + enrollments). Còn lại: JPA Entity class | ~~SQL, Flyway~~ |
| **Course CRUD API** | course-service | JPA Entity + `POST/GET/PUT/DELETE /api/v1/courses` | Spring Boot, JPA |
| **Enrollment logic** | course-service | `POST /api/v1/courses/{id}/enroll`, `GET /api/v1/users/{id}/enrollments` | Spring Boot, JPA |
| ~~**Content entity + migration**~~ | content-service | ✅ ĐÃ XONG — `V1__create_content_tables.sql` (lessons). Còn lại: JPA Entity class | ~~SQL, Flyway~~ |
| **Content CRUD API** | content-service | JPA Entity + `POST/GET/PUT/DELETE /api/v1/lessons` | Spring Boot, JPA |
| ~~**Progress entity + migration**~~ | progress-service | ✅ ĐÃ XONG — `V1__create_progress_tables.sql` (lesson_progress). Còn lại: JPA Entity class | ~~SQL, Flyway~~ |
| **Progress tracking API** | progress-service | JPA Entity + `POST /api/v1/progress` (mark complete), `GET /api/v1/progress?userId=&courseId=` (% hoàn thành) | Spring Boot, JPA |
| **Dockerfile cho services** | course/content/progress | Copy từ auth-service Dockerfile, chỉnh port | Docker |
| **Docker Compose mở rộng** | infra/docker | Thêm course, content, progress vào `docker-compose.yml` (profile app) | Docker Compose |

---

### 🟡 Milestone 1.4 — Assessment

| Task | Service | Mô tả chi tiết | Kỹ năng cần |
|------|---------|----------------|------------|
| ~~**Quiz/Question entity + migration**~~ | assessment-service | ✅ ĐÃ XONG — `V1__create_assessment_tables.sql` (5 bảng). Còn lại: JPA Entity classes | ~~SQL, Flyway~~ |
| **Quiz CRUD API** | assessment-service | JPA Entity + `POST/GET/PUT/DELETE /api/v1/quizzes` | Spring Boot, JPA |
| **Attempt & auto-grading** | assessment-service | `POST /api/v1/quizzes/{id}/attempt` — nhận answers, chấm điểm, lưu score (theo scoring contract) | Spring Boot |
| **Score reporting** | assessment-service | `GET /api/v1/quizzes/{id}/results` — thống kê điểm | Spring Boot, JPA |

---

### 🟡 Milestone 1.5 — AI Tutor (RAG)

| Task | Service | Mô tả chi tiết | Kỹ năng cần |
|------|---------|----------------|------------|
| ~~**FastAPI project setup**~~ | ai-tutor-service | ✅ ĐÃ XONG — `main.py`, `requirements.txt`, Alembic config + initial migration (4 bảng + pgvector). Còn lại: Dockerfile | ~~Python, FastAPI~~ |
| **Ingestion pipeline** | ai-tutor-service | Chunking documents → generate embeddings → lưu pgvector | LangChain, pgvector |
| **Vector search endpoint** | ai-tutor-service | `POST /api/v1/tutor/ask` — query → retrieve relevant chunks → LLM → answer + citation | LangChain, OpenAI |
| **Worker: async jobs** | worker | Redis queue consumer — xử lý ingestion jobs bất đồng bộ | Spring Boot, Redis |
| **Job status tracking** | worker | `GET /api/v1/jobs/{id}` — trả trạng thái PENDING/RUNNING/COMPLETED/FAILED | Spring Boot |

---

### 🟡 Milestone 1.6 — Frontend MVP

| Task | Component | Mô tả chi tiết | Kỹ năng cần |
|------|-----------|----------------|------------|
| **Auth pages** | apps/web | Login + Register forms, JWT storage (localStorage/cookie), protected routes | React, TypeScript |
| **Layout & Navigation** | apps/web | Sidebar/header, role-based menu (admin/instructor/student) | React Router, Tailwind |
| **Course listing & detail** | apps/web | Danh sách courses, trang chi tiết course, nút Enroll | React, Axios |
| **Lesson viewer** | apps/web | Hiển thị nội dung lesson (video/text/pdf), nút "Mark as Complete" | React |
| **Progress dashboard** | apps/web | Hiển thị % hoàn thành course, progress bar | React, Chart lib |
| **Quiz taking UI** | apps/web | Hiển thị câu hỏi, chọn đáp án, submit, hiển thị kết quả | React |
| **AI Tutor chat** | apps/web | Chat interface, gửi câu hỏi, hiển thị answer + citation | React, WebSocket/REST |
| **API client setup** | apps/web | Axios instance với JWT interceptor, base URL config, error handling | Axios, TypeScript |

---

### 🟢 Milestone 1.7 — Integration & Demo

| Task | Mô tả |
|------|-------|
| End-to-end testing | Test flow: register → login → create course → enroll → view lesson → take quiz → ask AI |
| Demo script + seed data | SQL seed data + Postman collection cho demo |
| Deployment guide | Hướng dẫn deploy lên K8s/EKS |

---

## 7. Cách chạy dự án (cho developer mới)

```bash
# 1. Clone repo
git clone https://github.com/daithang59/sagelms.git
cd sagelms

# 2. Copy env
cp .env.example .env

# 3. Khởi chạy infrastructure (PostgreSQL + Redis + pgAdmin)
docker compose -f infra/docker/docker-compose.yml --env-file .env up -d

# 4. Chạy service đang phát triển (ví dụ auth-service)
#    Flyway tự tạo schema + tables khi service khởi động
cd services/auth-service
./mvnw spring-boot:run          # Linux/macOS
.\mvnw.cmd spring-boot:run      # Windows

# 5. Chạy AI Tutor migration (chỉ cần 1 lần)
cd services/ai-tutor-service
uvx --with psycopg2-binary alembic upgrade head

# 6. Xem DB trực quan
# Mở http://localhost:5050 (pgAdmin)
# Login: admin@sagelms.dev / admin
# Add Server: host=postgres, port=5432, db=sagelms, user=sagelms, pass=sagelms

# 7. Chạy frontend
cd apps/web
npm install && npm run dev      # → http://localhost:3000

# 8. Chạy tests
cd services/<service-name>
./mvnw test                     # Java services
cd apps/web && npm test -- --run  # Frontend
```

---

## 8. Quy ước làm việc

| Quy ước | Chi tiết |
|---------|---------|
| **Branch naming** | `feat/`, `fix/`, `chore/`, `docs/`, `hotfix/` + slug (ví dụ: `feat/auth-login`) |
| **Commit message** | Conventional Commits: `feat(auth): add login endpoint` |
| **PR size** | < 200 lines (lý tưởng), < 500 (OK), > 500 (nên tách) |
| **Merge strategy** | Squash and Merge vào `develop` |
| **Definition of Done** | Code reviewed + CI pass + tests + OpenAPI updated + migration created + docs updated |

---

## 9. Tài liệu tham khảo

| Tài liệu | Đường dẫn |
|-----------|-----------|
| README chính | `README.md` |
| **Database Design** | **`docs/database-design.md`** |
| Onboarding Guide | `docs/onboarding.md` |
| Architecture | `docs/architecture/overview.md` |
| Roadmap | `docs/roadmap.md` |
| Working Agreements | `docs/working-agreements.md` |
| Project Brief | `docs/project-brief.md` |
| API Contracts | `contracts/openapi/` |
| CI Workflow | `.github/workflows/ci-pr.yml` |
| Contributing | `CONTRIBUTING.md` |

---

## 10. Gợi ý phân công (4 thành viên)

> Đây là gợi ý tham khảo, team lead quyết định phân công chính thức.

| Thành viên | Phụ trách chính | Milestones liên quan |
|------------|----------------|---------------------|
| **Thành viên A** | Auth Service + Gateway (JWT, RBAC, routing) | 1.2 |
| **Thành viên B** | Course + Content Service (CRUD, enrollment) | 1.3 |
| **Thành viên C** | Progress + Assessment Service (tracking, quiz) | 1.3, 1.4 |
| **Thành viên D** | AI Tutor + Worker + Frontend | 1.5, 1.6 |

**Lưu ý quan trọng:**
- **Milestone 1.2 (Auth & Gateway) phải làm trước** vì các service khác phụ thuộc vào JWT/RBAC
- Frontend (Milestone 1.6) có thể bắt đầu song song auth pages, nhưng cần auth API xong mới test được
- Mỗi người nên tự viết unit tests cho phần mình
- Sau khi hoàn thành API, cập nhật OpenAPI spec trong `contracts/openapi/`
