# 🤝 Hướng dẫn đóng góp — SageLMS

> Tài liệu này giúp bạn **clone → setup → code → test → tạo PR** trong thời gian ngắn nhất.
> Đọc hết file này trước khi bắt đầu bất kỳ task nào.

---

## 📖 Đọc trước khi bắt đầu

| Tài liệu | Nội dung | Bắt buộc? |
|-----------|----------|:---------:|
| [project-status.md](docs/project-status.md) | **Trạng thái hiện tại** — cái gì đã làm, cái gì cần làm, phân công | ✅ |
| [database-design.md](docs/database-design.md) | Thiết kế DB — 15 bảng, 6 schemas, coding rules | ✅ |
| [architecture/overview.md](docs/architecture/overview.md) | Kiến trúc microservices, nguyên tắc thiết kế | ✅ |
| [contracts/openapi/](contracts/openapi/) | API specs (auth, course, content, progress, assessment, ai-tutor) | Khi code API |
| [README.md](README.md) | Tổng quan dự án, tech stack, thành viên | Nên đọc |

---

## ⚡ Quickstart — Setup môi trường (5 phút)

### Yêu cầu

- **Git** ≥ 2.30
- **Docker Desktop** (Docker Engine ≥ 24 + Docker Compose V2)
- **Java 17** (JDK, không chỉ JRE) — tải từ [Adoptium](https://adoptium.net/)
- **Node.js** ≥ 18 + npm ≥ 9
- **Python** ≥ 3.9 (chỉ cần nếu làm ai-tutor-service)
- **uv** (Python tool runner) — `curl -LsSf https://astral.sh/uv/install.sh | sh` hoặc xem [docs](https://docs.astral.sh/uv/)

> **Lưu ý:** Không cần cài Maven — mỗi service có sẵn **Maven Wrapper** (`mvnw` / `mvnw.cmd`).

### Các bước

```bash
# 1. Clone repo
git clone https://github.com/daithang59/sagelms.git
cd sagelms

# 2. Copy env (chỉ cần làm 1 lần)
cp .env.example .env

# 3. Start infrastructure (PostgreSQL + Redis + pgAdmin)
docker compose -f infra/docker/docker-compose.yml --env-file .env up -d
# Hoặc dùng shortcut:
make up

# 4. Kiểm tra infra đã sẵn sàng
make ps
# Chờ postgres=healthy, redis=healthy, pgadmin=running

# 5. Chạy service đang phát triển (ví dụ auth-service)
cd services/auth-service
./mvnw spring-boot:run          # Linux/macOS
.\mvnw.cmd spring-boot:run      # Windows
# → Flyway TỰ ĐỘNG tạo schema + tables khi khởi động

# 6. Chạy frontend
cd apps/web
npm install && npm run dev      # → http://localhost:3000
```

### Xem Database trực quan (pgAdmin)

1. Mở **http://localhost:5050**
2. Login: `admin@sagelms.dev` / `admin`
3. Add Server → General: Name = `SageLMS` → Connection:
   - Host: `postgres`, Port: `5432`, Database: `sagelms`, User: `sagelms`, Password: `sagelms`
4. Chuột phải vào database → **ERD For Database** để xem sơ đồ quan hệ

### Ports tham khảo

| Service | Port | Ghi chú |
|---------|:----:|---------|
| Gateway | 8080 | Entry point |
| auth-service | 8081 | |
| course-service | 8082 | |
| content-service | 8083 | |
| progress-service | 8084 | |
| assessment-service | 8085 | |
| ai-tutor-service | 8086 | Python/FastAPI |
| Frontend (dev) | 3000 | Vite dev server |
| PostgreSQL | 5432 | |
| Redis | 6379 | |
| pgAdmin | 5050 | DB UI |

---

## 🏗️ Cấu trúc dự án — Tôi code ở đâu?

```
sagelms/
├── apps/web/                       → Frontend (React + Vite + TypeScript)
├── services/
│   ├── auth-service/               → Xác thực & phân quyền
│   │   ├── src/main/java/dev/sagelms/auth/   → Code Java
│   │   ├── src/main/resources/
│   │   │   ├── application.yml               → Config
│   │   │   └── db/migration/                 → 📌 Flyway SQL files
│   │   └── src/test/                         → Unit tests
│   ├── course-service/             → (cấu trúc tương tự)
│   ├── content-service/
│   ├── progress-service/
│   ├── assessment-service/
│   ├── ai-tutor-service/           → Python/FastAPI
│   │   ├── main.py
│   │   ├── alembic/                → 📌 Alembic migrations
│   │   └── requirements.txt
│   ├── gateway/                    → API Gateway
│   └── worker/                     → Background jobs
├── contracts/openapi/              → API specs (YAML)
├── docs/                           → Tài liệu dự án
├── infra/docker/                   → Docker Compose
└── .env.example                    → Template biến môi trường
```

---

## 💻 Workflow phát triển — Tôi bắt đầu code như thế nào?

### Bước 1: Nhận task

- Xem [project-status.md](docs/project-status.md) §6 — tìm task chưa hoàn thành trong milestone của bạn.
- Tạo **GitHub Issue** cho task (nếu chưa có).

### Bước 2: Tạo branch

```bash
git checkout main
git pull origin main
git checkout -b feat/ten-feature       # Ví dụ: feat/auth-login
```

**Branch naming:**

| Loại | Prefix | Ví dụ |
|------|--------|-------|
| Feature mới | `feat/` | `feat/auth-login` |
| Sửa lỗi | `fix/` | `fix/login-redirect` |
| Chore / refactor | `chore/` | `chore/upgrade-spring` |
| Tài liệu | `docs/` | `docs/api-spec` |
| Hotfix | `hotfix/` | `hotfix/null-pointer` |

### Bước 3: Code theo convention

Xem phần [Coding Rules](#-coding-rules) bên dưới.

### Bước 4: Commit

Sử dụng **[Conventional Commits](https://www.conventionalcommits.org/)**:

```
<type>(<scope>): <subject>
```

**Ví dụ:**

```bash
git commit -m "feat(auth): add register endpoint with BCrypt"
git commit -m "fix(course): handle null description field"
git commit -m "test(assessment): add quiz grading unit tests"
git commit -m "docs(readme): update docker setup instructions"
```

**Types:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `ci`, `perf`

### Bước 5: Push & mở PR

```bash
git push origin feat/ten-feature
```

Vào GitHub → mở Pull Request vào `main` → điền PR template.

### Bước 6: Review & Merge

- Cần **≥ 1 approval** + **CI pipeline xanh**.
- Merge bằng **Squash and Merge**.

---

## 📐 Coding Rules

### Java / Spring Boot (tất cả services trừ ai-tutor)

#### Entity — Bắt buộc extend `BaseEntity`

```java
@MappedSuperclass
public abstract class BaseEntity {
    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();  // ← tự set khi JPA UPDATE
    }
}
```

Mọi entity PHẢI extend `BaseEntity`. KHÔNG dùng DB trigger cho `updated_at`.

#### Flyway Migration — Khi cần thêm/sửa bảng

Tạo file SQL mới trong `src/main/resources/db/migration/`:

```
V2__add_phone_to_users.sql    ← Số version tăng dần
V3__create_sessions_table.sql
```

> **KHÔNG BAO GIỜ** sửa file migration đã chạy (ví dụ V1). Luôn tạo file mới với version tiếp theo.

#### Package structure

```
dev.sagelms.<service>/
├── config/          → Security, CORS, Bean config
├── controller/      → REST controllers
├── dto/             → Request/Response DTOs
├── entity/          → JPA entities
├── repository/      → Spring Data JPA repositories
├── service/         → Business logic
└── exception/       → Custom exceptions
```

### Python / FastAPI (ai-tutor-service)

#### Alembic Migration — Khi cần thêm/sửa bảng

```bash
cd services/ai-tutor-service
uvx --with psycopg2-binary alembic revision --autogenerate -m "add_new_column"
uvx --with psycopg2-binary alembic upgrade head
```

#### `updated_at` convention

```python
@declarative_mixin
class TimestampMixin:
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
```

### Frontend (React + TypeScript)

- Component files: `PascalCase.tsx` (ví dụ: `CourseCard.tsx`)
- Utils / hooks: `camelCase.ts` (ví dụ: `useAuth.ts`)
- Styling: Tailwind CSS classes
- Test: Vitest + Testing Library

### Cross-service rules

| Quy tắc | Chi tiết |
|---------|---------|
| **KHÔNG cross-schema JOIN** | Mỗi service chỉ đọc/ghi schema riêng |
| **Cross-service reference** | Dùng UUID soft reference + API call, KHÔNG FK constraint |
| **TIMESTAMPTZ** | Luôn dùng timezone-aware cho mọi timestamp |
| **UUID v4** | `gen_random_uuid()` cho Primary Key |
| **Error response format** | `{ timestamp, path, errorCode, message, correlationId }` |

---

## 🧪 Chạy Tests

```bash
# ---- Java services ----
cd services/<service-name>
./mvnw test                     # Linux/macOS
.\mvnw.cmd test                 # Windows

# ---- Frontend ----
cd apps/web
npm test -- --run               # Chạy 1 lần
npm test                        # Watch mode

# ---- Python (ai-tutor) ----
cd services/ai-tutor-service
pytest
```

> **Trước khi mở PR**, chạy test cho tất cả services bạn đã sửa. CI sẽ tự chạy lại, nhưng nên verify local trước.

---

## ✅ PR Checklist

Trước khi mở PR, tự kiểm tra:

- [ ] Branch name đúng convention (`feat/`, `fix/`, …)
- [ ] Commit messages đúng Conventional Commits
- [ ] Code build thành công (`mvnw verify` / `npm run build`)
- [ ] Đã viết hoặc cập nhật unit tests
- [ ] Không commit `.env`, secret, hay credentials
- [ ] Nếu thay đổi API → cập nhật OpenAPI spec trong `contracts/openapi/`
- [ ] Nếu thêm/sửa DB table → tạo migration file mới (KHÔNG sửa file cũ)
- [ ] Nếu thêm DB table → cập nhật `docs/database-design.md`
- [ ] Đã self-review code trước khi request review
- [ ] PR size < 500 dòng (lý tưởng < 200, nếu > 500 → tách ra)

---

## 🛑 Những điều KHÔNG được làm

| ❌ Không | ✅ Thay vào đó |
|---------|--------------|
| Commit trực tiếp vào `main` | Tạo branch → PR → review → merge |
| Sửa file migration đã chạy (V1, V2…) | Tạo file migration version tiếp theo |
| Cross-schema JOIN trong SQL | Gọi API giữa các services |
| Dùng DB trigger cho `updated_at` | Dùng `@PreUpdate` (Java) / `onupdate` (Python) |
| Commit file `.env` | Chỉ commit `.env.example` |
| Hardcode secret trong code | Dùng environment variables |
| Cài Maven global | Dùng `./mvnw` (Maven Wrapper có sẵn) |

---

## 🧰 Makefile Shortcuts

```bash
make up      # Start PostgreSQL + Redis + pgAdmin
make down    # Stop containers
make logs    # Xem logs realtime
make ps      # Liệt kê containers đang chạy
make clean   # Stop + XOÁ volumes (reset DB hoàn toàn)
```

---

## ❓ Cần hỗ trợ?

1. Đọc lại [project-status.md](docs/project-status.md) — hầu hết câu hỏi được trả lời ở đây.
2. Xem [docs/](docs/) — architecture, onboarding, roadmap.
3. Mở [GitHub Issue](../../issues) nếu gặp bug hoặc muốn đề xuất.
4. Hỏi trực tiếp trên nhóm chat của team.
