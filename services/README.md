# ⚙️ services — Backend Microservices

## Mục đích

Chứa mã nguồn của tất cả **backend microservices** trong SageLMS.

## Danh sách services

| Service | Port | Tech | Chức năng |
|---------|------|------|-----------|
| [gateway](./gateway/) | `8080` | Spring Cloud Gateway | API Gateway, JWT, RBAC, routing |
| [auth-service](./auth-service/) | `8081` | Spring Boot | Xác thực, phân quyền |
| [course-service](./course-service/) | `8082` | Spring Boot | Quản lý khoá học, enrollment |
| [content-service](./content-service/) | `8083` | Spring Boot | Quản lý nội dung bài giảng |
| [progress-service](./progress-service/) | `8084` | Spring Boot | Theo dõi tiến trình học |
| [assessment-service](./assessment-service/) | `8085` | Spring Boot | Quiz, chấm điểm |
| [ai-tutor-service](./ai-tutor-service/) | `8086` | FastAPI | AI Tutor RAG |
| [worker](./worker/) | — | Celery/BullMQ | Background jobs |

## Nguyên tắc

- Mỗi service sở hữu **schema riêng** trong PostgreSQL.
- Giao tiếp cross-service qua **REST API** (không join DB trực tiếp).
- Tác vụ nặng gửi vào **Redis queue** → Worker xử lý.
- Mọi API tuân thủ **OpenAPI 3.0** và **error format thống nhất**.

## Xem thêm

Kiến trúc tổng quan: [docs/architecture/overview.md](../docs/architecture/overview.md)
