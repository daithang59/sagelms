# 🔐 services/auth-service — Authentication & Authorization

## Mục đích

Quản lý **xác thực** (authentication) và **phân quyền** (authorization) cho toàn hệ thống.

## Chức năng chính

| Feature | Mô tả |
|---------|--------|
| User CRUD | Đăng ký, quản lý tài khoản |
| Login / Logout | Cấp JWT access token (+ refresh token tuỳ chọn) |
| RBAC | Phân quyền theo role: `admin`, `instructor`, `student` |
| Token verification | Endpoint để Gateway xác thực JWT |

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| Spring Boot 3.x | Framework |
| Spring Security | Auth & authorization |
| Spring Boot Actuator | Health / info endpoints |
| JDK 17 | Runtime |
| PostgreSQL | Database (schema: `auth`) |
| Flyway | Database migration |
| H2 | In-memory DB for tests |

## Port: `8081`

## Security Config

- `/ping`, `/actuator/health` → **public** (không cần auth)
- Tất cả endpoint khác → **yêu cầu auth** (tạm httpBasic, sau thay JWT)

## Database Schema

```
auth.users (id, email, password_hash, role, created_at, ...)
```

## API Endpoints

```
GET    /ping                    → "ok" (public, smoke test)
GET    /actuator/health         → {"status":"UP"} (public)
POST   /api/v1/auth/register    (planned)
POST   /api/v1/auth/login       (planned)
POST   /api/v1/auth/refresh     (planned)
GET    /api/v1/auth/me           (planned)
GET    /api/v1/users             (admin, planned)
```

## Chạy local

```bash
cd services/auth-service

# Cần PostgreSQL đang chạy (make up)
./mvnw spring-boot:run          # Linux/macOS
mvnw.cmd spring-boot:run        # Windows

# Smoke test
curl http://localhost:8081/ping              # → "ok"
curl http://localhost:8081/actuator/health    # → {"status":"UP"}
```

## Chạy tests

```bash
./mvnw test     # Dùng H2 in-memory, không cần PostgreSQL
```

## Owner

@daithang59
