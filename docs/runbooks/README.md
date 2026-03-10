# 🛠 docs/runbooks — Hướng dẫn vận hành

## Mục đích

Chứa các **runbook** — hướng dẫn từng bước để xử lý các tình huống vận hành, troubleshooting, và setup.

## Nội dung hiện tại

```
runbooks/
└── local-dev.md    ← Hướng dẫn troubleshooting local development
```

### `local-dev.md`

Hướng dẫn khắc phục các lỗi thường gặp khi chạy local:
- Lỗi kết nối PostgreSQL
- Port bị chiếm
- Flyway migration conflict
- Docker Compose issues
- Vite dev server errors

## Dự kiến bổ sung

```
runbooks/
├── local-dev.md           ← ✅ Hiện có
├── db-migration.md        ← Hướng dẫn tạo/chạy database migration
├── deploy-staging.md      ← Deploy lên staging (K8s)
└── incident-response.md   ← Quy trình xử lý sự cố
```
