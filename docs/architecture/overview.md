# 🏗 Architecture Overview — SageLMS

## Tổng quan

SageLMS sử dụng kiến trúc **microservices** với API Gateway làm điểm vào duy nhất. Mỗi service quản lý schema riêng trong cùng một PostgreSQL instance (MVP).

---

## Component Diagram

```
┌─────────────┐
│   Browser    │
│  (React SPA) │
└──────┬───────┘
       │ HTTPS
┌──────▼───────┐
│  API Gateway │  ← JWT validation, RBAC, rate-limit, correlation-id
│  (Spring CG) │
└──┬──┬──┬──┬──┘
   │  │  │  │
   │  │  │  └───► auth-service        (Spring Boot)
   │  │  └──────► course-service       (Spring Boot)
   │  └─────────► content-service      (Spring Boot)
   └────────────► progress-service     (Spring Boot)
                  assessment-service   (Spring Boot)
                  ai-tutor-service     (FastAPI + LangChain)
                        │
                        ▼
                  ┌───────────┐
                  │   Worker   │ ← Redis Queue consumer
                  │ (Celery/   │
                  │  BullMQ)   │
                  └───────────┘

Data stores:
  ┌────────────────────┐    ┌───────────┐
  │ PostgreSQL 16      │    │  Redis 7  │
  │ + pgvector         │    │ cache +   │
  │ (schema-per-svc)   │    │ queue     │
  └────────────────────┘    └───────────┘
```

---

## Request Flow

1. Client gọi API qua **Gateway/BFF**
2. Gateway **xác thực JWT**, áp **RBAC**, gắn `correlation-id` / `trace-id`, định tuyến request đến service đích
3. Service xử lý nghiệp vụ trong **schema riêng** — không join cross-service ở runtime
4. Tác vụ nặng/async: service publish message vào **Redis queue** → Worker consume và cập nhật job status
5. **AI Tutor RAG**: content → chunking → embedding → pgvector → retrieval → LLM → answer + citation

---

## Nguyên tắc thiết kế

| Nguyên tắc | Mô tả |
|------------|--------|
| Schema-per-service | Mỗi service sở hữu schema DB riêng, không join cross-schema |
| API-first | OpenAPI 3.0 contract cho mọi service |
| Correlation ID | Mọi request có `X-Correlation-Id` xuyên suốt Gateway → services |
| Error format thống nhất | `{ timestamp, path, errorCode, message, correlationId }` |
| Async-first cho tác vụ nặng | Ingestion, quiz generation qua Redis queue |

---

## Diagrams chi tiết

- ERD / Data model: xem `docs/architecture/data-model.md` *(sẽ bổ sung)*
- Sequence diagrams: xem `docs/architecture/sequences/` *(sẽ bổ sung)*

---

## Decisions

Các quyết định kiến trúc được ghi nhận tại [docs/decisions/](../decisions/).
