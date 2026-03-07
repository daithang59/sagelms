# 📋 Service README Template

> Copy file này vào `services/<tên-service>/README.md` và điền thông tin cụ thể.

---

# 🔷 services/<tên-service> — <Tên đầy đủ>

## Mục đích

<!-- Mô tả ngắn gọn service này làm gì, 1–2 câu -->

## Chức năng chính

| Feature | Mô tả |
|---------|--------|
| Feature 1 | ... |
| Feature 2 | ... |

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| Spring Boot 3.x | Framework |
| JDK 17 | Runtime |
| Spring Security + JWT | Auth |
| PostgreSQL 16 | Database (schema: `<schema_name>`) |
| Flyway | Migration |
| Redis 7 | Cache / Queue |

> **Ngoại lệ:** `ai-tutor-service` dùng FastAPI (Python 3.11) + LangChain + Alembic.

## Configuration

| Biến môi trường | Mô tả | Mặc định |
|-----------------|--------|----------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `sagelms` |
| `<SERVICE>_PORT` | Service port | `80xx` |

## Port: `80xx`

## Database Schema

```sql
<schema_name>.<table_name> (id, ..., created_at, updated_at)
```

## API Endpoints

Base path: `/api/v1/<resource>`

```
GET    /api/v1/<resource>
POST   /api/v1/<resource>           (role)
GET    /api/v1/<resource>/:id
PUT    /api/v1/<resource>/:id       (role)
DELETE /api/v1/<resource>/:id       (role)
```

> OpenAPI spec: `contracts/openapi/<service>.yaml`

## Chạy local

```bash
cd services/<tên-service>

# Build & run
mvn spring-boot:run

# Chạy tests
mvn test
```

## Owner

@daithang59

## Links

- [Architecture Overview](../../docs/architecture/overview.md)
- [OpenAPI Spec](../../contracts/openapi/<service>.yaml)
- [Related ADRs](../../docs/decisions/)
