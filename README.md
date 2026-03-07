# 📚 SageLMS — AI-Powered Learning Management System

[![CI (PR)](https://github.com/daithang59/sagelms/actions/workflows/ci-pr.yml/badge.svg)](https://github.com/daithang59/sagelms/actions/workflows/ci-pr.yml)

> **Vision:** Xây dựng nền tảng học trực tuyến thế hệ mới tích hợp AI Tutor, hỗ trợ cá nhân hoá lộ trình học và đánh giá tự động.

📖 [Onboarding](./docs/onboarding.md) · 🏗 [Architecture](./docs/architecture/overview.md) · 📋 [Roadmap](./docs/roadmap.md) · 🤝 [Contributing](./CONTRIBUTING.md) · 📜 [API Contracts](./contracts/)

---

## 🎯 MVP Scope

| Feature | Mô tả |
|---------|--------|
| **Authentication** | Đăng ký / Đăng nhập (JWT + OAuth 2.0) |
| **Course Management** | CRUD khoá học, gán giảng viên |
| **Content Delivery** | Upload & phát video/tài liệu bài giảng |
| **Progress Tracking** | Theo dõi tiến trình học của sinh viên |
| **Assessment** | Tạo bài kiểm tra, chấm điểm tự động |
| **AI Tutor** | Chatbot hỗ trợ hỏi đáp dựa trên nội dung khoá học |

---

## 🛠 Tech Stack

- **Frontend:** React, Next.js
- **Backend:** Spring Boot, NestJS, FastAPI
- **Database & Cache:** PostgreSQL 16, Redis 7
- **Message Queue & Background Jobs:** RabbitMQ, Celery, BullMQ
- **AI / LLM:** LangChain
- **Infrastructure & Deployment:** Docker, Kubernetes

---

## 🏗 Kiến trúc Microservices

```
apps/web               → Frontend (React / Next.js)
services/gateway        → API Gateway
services/auth-service   → Xác thực & phân quyền
services/course-service → Quản lý khoá học
services/content-service→ Quản lý nội dung bài giảng
services/progress-service→ Theo dõi tiến trình
services/assessment-service → Đánh giá / bài kiểm tra
services/ai-tutor-service   → AI Tutor chatbot
services/worker         → Background jobs (email, video encoding…)
infra/docker            → Docker Compose cho local dev
infra/k8s               → Kubernetes manifests
```

---

## 🚀 Chạy Local bằng Docker Compose

### Yêu cầu
- Docker ≥ 24.x & Docker Compose v2
- (Tuỳ chọn) Node.js 20+, Python 3.11+, Java 21+

### Bước chạy

```bash
# 1. Clone repo
git clone https://github.com/daithang59/sagelms.git
cd sagelms

# 2. Copy env mẫu
cp .env.example .env          # chỉnh lại giá trị phù hợp

# 3. Khởi chạy toàn bộ stack
docker compose -f infra/docker/docker-compose.yml up -d

# 4. Truy cập
#    - Web UI:      http://localhost:3000
#    - API Gateway:  http://localhost:8080
#    - pgAdmin:      http://localhost:5050
```

---

## 🔌 Danh sách Services & Ports

| Service | Port | Tech |
|---------|------|------|
| Web (Frontend) | `3000` | React / Next.js |
| API Gateway | `8080` | Spring Cloud Gateway / Kong |
| Auth Service | `8081` | Spring Boot / NestJS |
| Course Service | `8082` | Spring Boot / NestJS |
| Content Service | `8083` | FastAPI / NestJS |
| Progress Service | `8084` | Spring Boot / NestJS |
| Assessment Service | `8085` | Spring Boot / NestJS |
| AI Tutor Service | `8086` | FastAPI + LangChain |
| Worker | `—` | Celery / BullMQ |
| PostgreSQL | `5432` | PostgreSQL 16 |
| Redis | `6379` | Redis 7 |
| RabbitMQ | `5672` / `15672` | RabbitMQ 3.13 |

---

## 🌿 Quy ước Branch & PR

| Loại | Prefix | Ví dụ |
|------|--------|-------|
| Feature | `feat/` | `feat/add-course-crud` |
| Bug fix | `fix/` | `fix/login-token-expired` |
| Chore | `chore/` | `chore/update-deps` |
| Docs | `docs/` | `docs/add-api-spec` |
| Hotfix | `hotfix/` | `hotfix/critical-auth-bug` |

**Quy trình:**
1. Tạo branch từ `develop` (hoặc `main` cho hotfix).
2. Commit theo [Conventional Commits](https://www.conventionalcommits.org/).
3. Mở PR → Ít nhất 1 approval + CI xanh → Merge.

> Chi tiết xem [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## 👥 Danh sách thành viên

- **Huỳnh Lê Đại Thắng** - Leader
- **Trần Nguyễn Việt Hoàng** - Member
- **Bùi Ngọc Thái** - Member
- **Nguyễn Trường Duy** - Member

---

## 📄 License

[MIT](./LICENSE)