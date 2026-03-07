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
| Spring Boot 3.x / FastAPI | Framework |
| JDK 17 / Python 3.11 | Runtime |
| PostgreSQL | Database (schema: `<schema_name>`) |
| Flyway / Alembic | Migration |

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

# Java
mvn spring-boot:run

# Python
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 80xx
```

## Owner

@daithang59

## Links

- [Architecture Overview](../../docs/architecture/overview.md)
- [OpenAPI Spec](../../contracts/openapi/<service>.yaml)
- [Related ADRs](../../docs/decisions/)
