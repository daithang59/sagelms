# 🔐 services/auth-service — Authentication & Authorization

## Mục đích

Quản lý **xác thực** (authentication) và **phân quyền** (authorization) cho toàn hệ thống.

## Chức năng chính

| Feature | Mô tả |
|---------|--------|
| Register | `POST /api/v1/auth/register` — BCrypt hash, tạo user, trả tokens |
| Login | `POST /api/v1/auth/login` — validate credentials, trả access + refresh token |
| Token Refresh | `POST /api/v1/auth/refresh` — đổi refresh token lấy token pair mới |
| User CRUD | `GET/PUT/DELETE /api/v1/users/{id}` — admin only (via `X-User-Roles` header) |
| Seed Data | Tự seed admin/instructor/student khi khởi động |
| RBAC | Phân quyền theo role: `ADMIN`, `INSTRUCTOR`, `STUDENT` |

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| Spring Boot 4.x | Framework |
| Spring Security | PasswordEncoder (BCrypt) |
| JJWT 0.12.x | JWT generation (HS256) |
| Spring Boot Actuator | Health / info endpoints |
| JDK 17 | Runtime |
| PostgreSQL | Database (schema: `auth`) |
| Flyway | Database migration |
| H2 | In-memory DB for tests |

## Port: `8081`

## API Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/ping` | Public | Smoke test |
| GET | `/actuator/health` | Public | Health check |
| POST | `/api/v1/auth/register` | Public | Đăng ký user mới |
| POST | `/api/v1/auth/login` | Public | Đăng nhập, trả tokens + user |
| POST | `/api/v1/auth/refresh` | Public | Refresh access token |
| GET | `/api/v1/users` | ADMIN | Danh sách users (paginated) |
| GET | `/api/v1/users/{id}` | ADMIN | Chi tiết user |
| PUT | `/api/v1/users/{id}` | ADMIN | Cập nhật role/isActive |
| DELETE | `/api/v1/users/{id}` | ADMIN | Xoá user |

## Seed Data (auto khi startup)

| Email | Password | Role |
|-------|----------|------|
| `admin@sagelms.dev` | `Admin123!` | ADMIN |
| `instructor@sagelms.dev` | `Instructor123!` | INSTRUCTOR |
| `student@sagelms.dev` | `Student123!` | STUDENT |

## JWT Claim Spec

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "student@sagelms.dev",
  "roles": ["STUDENT"],
  "iss": "sagelms-auth",
  "iat": 1710000000,
  "exp": 1710001800
}
```

## Environment Variables

| Variable | Default | Mô tả |
|----------|---------|-------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `sagelms` | Database name |
| `DB_USER` | `sagelms` | Database user |
| `DB_PASSWORD` | `sagelms` | Database password |
| `JWT_SECRET` | dev default | **Phải giống gateway** |

## Chạy local

```bash
cd services/auth-service

# Cần PostgreSQL đang chạy (docker compose up -d)
./mvnw spring-boot:run          # Linux/macOS
mvnw.cmd spring-boot:run        # Windows

# Smoke test
curl http://localhost:8081/ping
curl http://localhost:8081/actuator/health
```

## Chạy qua Gateway (end-to-end)

```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","fullName":"Test","role":"STUDENT"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@sagelms.dev","password":"Student123!"}'
```

## Chạy tests

```bash
./mvnw test     # Dùng H2 in-memory, không cần PostgreSQL
```

## Owner

@daithang59
