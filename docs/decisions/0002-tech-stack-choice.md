# ADR-0002: Chọn Stack chính cho Microservices

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-03-07 |
| Decision | Spring Boot (Java 17) cho core services; FastAPI (Python) cho AI Tutor |

---

## Bối cảnh

Cần chọn 1 stack chính thống nhất cho 6 core services (gateway, auth, course, content, progress, assessment, worker) để pipeline CI/CD, ops, và codebase dễ maintain. AI Tutor có nhu cầu riêng (ML libs, LangChain, pgvector) nên cần đánh giá riêng.

## Quyết định

### Stack chính: Spring Boot 3.x + Java 17

| Thành phần | Công nghệ |
|-----------|----------|
| Framework | Spring Boot 3.x |
| Language | Java 17 LTS |
| Build | Maven (hoặc Gradle) |
| Gateway | Spring Cloud Gateway |
| Auth | Spring Security + JWT |
| Database | PostgreSQL 16 (Flyway migration) |
| Cache/Queue | Redis 7 |
| Testing | JUnit 5 + Mockito + Testcontainers |
| Observability | Spring Actuator (health, metrics) |

### Ngoại lệ: AI Tutor — FastAPI (Python 3.11)

| Thành phần | Công nghệ |
|-----------|----------|
| Framework | FastAPI |
| Language | Python 3.11 |
| AI/ML | LangChain, pgvector |
| Migration | Alembic |
| Testing | pytest |

## Lý do chọn Spring Boot

1. **Enterprise-ready:** Auth/JWT/RBAC, validation, exception handling có sẵn "bài bản"
2. **Test chuẩn hoá:** JUnit5 + Mockito → CI chỉ cần `mvn test`
3. **Observability:** Actuator health, metrics, tracing patterns rõ ràng (hợp đồ án DevSecOps)
4. **Microservices ecosystem:** Gateway, config, resilience, messaging đều mature
5. **Maintainability:** Static typing + conventions → dễ đọc khi team đông

## Lý do AI Tutor dùng Python

- LangChain, pgvector, ML libs phong phú hơn rất nhiều trong Python ecosystem
- Phù hợp cho RAG pipeline (chunking → embedding → vector search → LLM)
- Đây là "1 ngoại lệ có lý do", không phá vỡ tính nhất quán của stack chính

## Alternatives đã xem xét

- **NestJS (TypeScript):** Phù hợp nếu team mạnh JS/TS, nhưng không enterprise-grade bằng Spring Boot cho auth/security
- **Mixed stack (NestJS + FastAPI + Spring Boot):** Quá nhiều runtime, CI phức tạp

## CI Rule

Mỗi service phải có lệnh test chuẩn:
- Java: `mvn test`
- Python: `pytest`
- Frontend: `npm test`

CI chỉ cần gọi đúng lệnh theo folder.
