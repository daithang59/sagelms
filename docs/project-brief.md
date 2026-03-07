# 📋 Project Brief — SageLMS

> Tóm tắt đề bài và phạm vi dự án. Chi tiết đầy đủ xem [NT548_DoAnWeb.md](./NT548_DoAnWeb.md).

---

## Vision

Xây dựng nền tảng học tập (LMS) theo kiến trúc **microservices**, tích hợp **AI Tutor** theo mô hình **RAG** (Retrieval-Augmented Generation) để hỏi đáp dựa trên tài liệu nội bộ của khoá học.

---

## MVP Scope

### Must-have
| Module | Mô tả |
|--------|--------|
| Auth & RBAC | Đăng ký/đăng nhập, JWT, phân quyền (admin/instructor/student) |
| LMS Core | Course CRUD, Enroll, Content metadata, Progress tracking |
| Assessment | Quiz/question CRUD, attempt, chấm điểm cơ bản |
| AI Tutor (RAG) | Ingestion → embedding → vector search → LLM answer + citation |
| Async Jobs | Redis queue + worker, job status tracking |
| Observability | Correlation-id, structured logging |

### Out of Scope (MVP)
- CI/CD pipeline hoàn chỉnh (chỉ có CI mức PR)
- Thanh toán / subscription
- Analytics nâng cao, recommendation, A/B testing
- Bảo mật nâng cao (WAF, secrets rotation phức tạp)

---

## Deliverables

1. Source code Gateway/BFF + microservices
2. OpenAPI/Swagger specs
3. Database migrations + seed data
4. Hướng dẫn chạy local & deploy thủ công lên K8s/EKS
5. Demo script + demo data
6. Tài liệu kiến trúc & vận hành tối thiểu

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Gateway | Spring Cloud Gateway |
| Backend (Java) | Spring Boot 3.x, JDK 17 |
| Backend (Python) | FastAPI, Python 3.11 |
| Frontend | React 18 + TypeScript, Vite, TailwindCSS, shadcn/ui |
| Database | PostgreSQL 16 + pgvector |
| Cache/Queue | Redis 7 |
| Container | Docker Compose (local), K8s/EKS (staging) |
| IaC | Terraform |

---

## Kịch bản Demo

1. **Auth/RBAC** — login → gọi API bảo vệ qua Gateway
2. **LMS Core** — instructor tạo course + content → student enroll → cập nhật progress
3. **Assessment** — instructor tạo quiz → student attempt → nhận score
4. **AI Tutor** — ingest content → ask AI → nhận answer + citation
5. **Async** — trigger job → theo dõi trạng thái → completed/failed
