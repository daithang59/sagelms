# 🚪 services/gateway — API Gateway

## Mục đích

Điểm vào duy nhất cho tất cả API requests từ Frontend. Chịu trách nhiệm:

- **JWT validation** — xác thực token trước khi forward
- **RBAC enforcement** — kiểm tra quyền theo role (admin/instructor/student)
- **Routing** — định tuyến request đến đúng microservice
- **Correlation ID** — gắn `X-Correlation-Id` xuyên suốt request chain
- **Rate limiting** — giới hạn request cho endpoint AI (tuỳ chọn)
- **CORS** — cấu hình CORS theo domain frontend

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| Spring Cloud Gateway | API Gateway framework |
| Spring Boot 3.x | Runtime |
| JDK 17 | Java runtime |

## Port

| Môi trường | Port |
|-----------|------|
| Local | `8080` |

## Luồng request

```
Browser → Gateway (8080) → auth-service / course-service / ... → Response
              ↓
       JWT validate
       RBAC check
       Add correlation-id
       Route to service
```
