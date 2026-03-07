# 🚀 Onboarding Guide — SageLMS

> **Mục tiêu:** Clone repo → chạy local deps → mở PR → CI pass — dưới 30 phút.

---

## 1. Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---------|---------------------|
| Git | 2.40+ |
| Docker Desktop | 24.x + Compose v2 |
| JDK | 17 LTS |
| Node.js | 20 LTS |
| Python | 3.11+ |
| Make | (có sẵn trên Linux/macOS; Windows dùng `choco install make`) |

---

## 2. Clone & setup

```bash
git clone https://github.com/<org>/sagelms.git
cd sagelms

# Copy env mẫu
cp .env.example .env
# → Chỉnh sửa giá trị trong .env nếu cần
```

---

## 3. Khởi chạy infrastructure (Postgres + Redis)

```bash
make up          # docker compose up -d
make logs        # xem logs
make down        # tắt
```

Kiểm tra:
```bash
docker compose -f infra/docker/docker-compose.yml ps
# postgres → 0.0.0.0:5432
# redis    → 0.0.0.0:6379
```

---

## 4. Kết nối database

| Param | Value |
|-------|-------|
| Host | `localhost` |
| Port | `5432` |
| DB | `sagelms` |
| User | `sagelms` |
| Password | (xem `.env`) |

---

## 5. Chạy service (khi đã có code)

```bash
# Java (Spring Boot)
cd services/auth-service
mvn spring-boot:run

# Python (FastAPI)
cd services/ai-tutor-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8086

# Frontend
cd apps/web
npm install && npm run dev
```

---

## 6. Tạo branch & mở PR

```bash
git checkout -b feat/your-feature
# ... code & commit ...
git push origin feat/your-feature
# → Mở PR trên GitHub → CI tự chạy → chờ review
```

> Xem chi tiết quy ước tại [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## 7. Cấu trúc thư mục

```
apps/web/                → Frontend (React)
services/gateway/        → API Gateway
services/auth-service/   → Authentication
services/course-service/ → Course management
services/content-service/→ Content delivery
services/progress-service/→ Progress tracking
services/assessment-service/ → Quizzes & grading
services/ai-tutor-service/  → AI Tutor (RAG)
services/worker/         → Background jobs
infra/docker/            → Docker Compose (local)
infra/k8s/               → Kubernetes manifests
contracts/               → OpenAPI / AsyncAPI specs
docs/                    → Documentation
scripts/                 → Build/deploy scripts
```

---

## 8. Pre-commit hooks (khuyến nghị)

Giúp kiểm tra trước khi commit, giảm ~80% lỗi vặt trong PR.

```bash
# Cài pre-commit (Python)
pip install pre-commit

# Cài hooks vào repo
pre-commit install
```

Nếu chưa có `.pre-commit-config.yaml`, tạo thủ công:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-merge-conflict
      - id: detect-private-key

  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.21.2
    hooks:
      - id: gitleaks
```

> Không bắt buộc nhưng **cực kỳ đáng** — detect secrets, trailing whitespace, YAML errors trước khi code đến CI.

---

## 9. Tài liệu tham khảo

| Tài liệu | Link |
|-----------|------|
| Contributing | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Architecture | [docs/architecture/overview.md](./architecture/overview.md) |
| API Contracts | [contracts/](../contracts/) |
| Roadmap | [docs/roadmap.md](./roadmap.md) |
| Working Agreements | [docs/working-agreements.md](./working-agreements.md) |
| Runbooks | [docs/runbooks/local-dev.md](./runbooks/local-dev.md) |

---

## Gặp vấn đề?

1. Đọc [docs/runbooks/local-dev.md](./runbooks/local-dev.md).
2. Search [GitHub Issues](../../issues).
3. Hỏi trên Slack/Discord channel dự án.

