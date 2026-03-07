# 🐳 Local Infrastructure — Docker Compose

## Purpose

File `docker-compose.yml` trong thư mục này chỉ chứa **local dependencies** (database, cache). Các application services sẽ được chạy riêng (IDE hoặc terminal).

---

## Services

| Service | Image | Port | Mục đích |
|---------|-------|------|----------|
| PostgreSQL | `pgvector/pgvector:pg16` | `5432` | Database chính + pgvector extension |
| Redis | `redis:7-alpine` | `6379` | Cache + message queue |

---

## Cách sử dụng

### Từ root repo (khuyến nghị)

```bash
make up       # Start Postgres + Redis
make down     # Stop & remove containers
make logs     # Tail logs
```

### Trực tiếp

```bash
docker compose -f infra/docker/docker-compose.yml --env-file ../../.env up -d
docker compose -f infra/docker/docker-compose.yml --env-file ../../.env down
```

---

## Connection strings

| Service | Connection |
|---------|------------|
| PostgreSQL | `postgresql://sagelms:sagelms@localhost:5432/sagelms` |
| Redis | `redis://localhost:6379` |

> Giá trị mặc định. Tuỳ chỉnh trong `.env` ở root repo.

---

## Reset data

```bash
make down
docker volume rm sagelms_pg sagelms_redis
make up
```
