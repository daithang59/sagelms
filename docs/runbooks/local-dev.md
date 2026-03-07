# 🛠 Runbook: Local Development

## Vấn đề thường gặp & cách xử lý

---

### 1. Port 5432 đã bị chiếm

```bash
# Tìm process
# Windows
netstat -ano | findstr :5432
# Linux/macOS
lsof -i :5432

# Giải pháp: tắt process hoặc đổi port trong .env
POSTGRES_PORT=5433
```

---

### 2. Docker Compose không tìm thấy .env

```bash
# Đảm bảo chạy từ root repo
make up
# hoặc chỉ định tường minh
docker compose -f infra/docker/docker-compose.yml --env-file .env up -d
```

---

### 3. pgvector extension chưa có

Image `pgvector/pgvector:pg16` đã bao gồm extension. Nếu dùng image Postgres thuần:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### 4. Redis connection refused

Kiểm tra Redis đang chạy:
```bash
docker compose -f infra/docker/docker-compose.yml ps redis
# Nếu chưa: make up
```

---

### 5. Reset toàn bộ data local

```bash
make down
docker volume rm sagelms_pg sagelms_redis
make up
```

---

### 6. Xem logs service cụ thể

```bash
docker compose -f infra/docker/docker-compose.yml logs -f postgres
docker compose -f infra/docker/docker-compose.yml logs -f redis
```
