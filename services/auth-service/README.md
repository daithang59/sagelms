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
| JDK 17 | Runtime |
| PostgreSQL | Database (schema: `auth`) |
| Flyway | Database migration |

## Port: `8081`

## Database Schema

```
auth.users (id, email, password_hash, role, created_at, ...)
```

## API Endpoints (dự kiến)

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
GET    /api/v1/users          (admin)
```
