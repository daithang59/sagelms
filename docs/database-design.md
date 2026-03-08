# 🗄️ SageLMS — Thiết kế cơ sở dữ liệu (MVP Final)

> **Database Engine:** PostgreSQL 16 + pgvector  
> **Pattern:** Schema-per-service (mỗi service sở hữu 1 schema riêng, không join cross-schema)  
> **Migration Tool:** Flyway (Java services), Alembic (Python/AI Tutor)  
> **Primary Key:** UUID v4 (`gen_random_uuid()`) — đơn giản, không cần thư viện bên ngoài  
> **Timestamp:** Luôn dùng `TIMESTAMPTZ`  
> **`updated_at` convention:** Cập nhật ở **app layer** (service code), KHÔNG dùng DB trigger  
> **Reviewed:** 2026-03-08 — Round 4 final (scoring contract, snapshot, 1-file-per-lesson, LINK note, analytics indexes)

---

## Tổng quan kiến trúc dữ liệu

Hệ thống sử dụng **1 PostgreSQL instance** với **6 schemas riêng biệt**, mỗi schema thuộc về 1 microservice. Liên kết cross-service thông qua **UUID tham chiếu** + **API call**, KHÔNG dùng foreign key cross-schema.

```
PostgreSQL 16 Instance
├── auth           → auth-service      :8081  (2 bảng)
├── course         → course-service    :8082  (2 bảng)
├── content        → content-service   :8083  (1 bảng)
├── progress       → progress-service  :8084  (1 bảng)
├── assessment     → assessment-service:8085  (5 bảng)
└── ai_tutor       → ai-tutor-service  :8086  (4 bảng) + pgvector

Redis 7
├── Job Queue      (FIFO cho async jobs)
└── Cache Layer    (course detail, progress % — optional)
```

> **Redis MVP scope:** Ưu tiên **job queue** + **cache**. ~~Session store~~ không cần vì JWT stateless + đã có bảng `refresh_tokens`. Blacklist access token (revoke nhanh) để post-MVP.

---

## ⚙️ Coding Rules — `updated_at` Convention (BẮT BUỘC)

Vì không dùng DB trigger, **mọi service phải tự cập nhật `updated_at`** khi UPDATE. Chi tiết:

### Java / Spring Boot (JPA)

```java
@MappedSuperclass
public abstract class BaseEntity {
    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();   // ← auto-set khi JPA flush UPDATE
    }
}
```

> Mọi entity PHẢI extend `BaseEntity`. `@PreUpdate` đảm bảo `updated_at` luôn đúng mà không cần nhớ set thủ công.

### Python / FastAPI (SQLAlchemy)

```python
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime
from sqlalchemy.orm import declarative_mixin

@declarative_mixin
class TimestampMixin:
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),  # ← auto-set khi UPDATE
    )
```

> Mọi model PHẢI include `TimestampMixin`. SQLAlchemy `onupdate` handler đảm bảo consistency.

---

## 1. Auth Schema (`auth`) — auth-service :8081

> **MVP:** Dùng single `role` column. **Post-MVP:** tách thành `roles` + `user_roles` (n-n) + `permissions` + `role_permissions`.

### 1.1 Bảng `users`

```sql
CREATE TABLE auth.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255),
    role            VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'INSTRUCTOR', 'STUDENT')),
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()  -- app layer: @PreUpdate
);
```

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | UUID | PK | User ID (v4 random) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng nhập |
| `password_hash` | VARCHAR(255) | NOT NULL | BCrypt hash |
| `full_name` | VARCHAR(255) | | Tên đầy đủ |
| `role` | VARCHAR(20) | NOT NULL, CHECK | ADMIN / INSTRUCTOR / STUDENT |
| `avatar_url` | VARCHAR(500) | | URL avatar |
| `is_active` | BOOLEAN | DEFAULT TRUE | Trạng thái tài khoản |
| `last_login_at` | TIMESTAMPTZ | | Lần đăng nhập gần nhất |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ngày tạo |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | App layer: `@PreUpdate` |

> **Post-MVP RBAC:**
> ```sql
> CREATE TABLE auth.roles (id UUID PK, name VARCHAR UNIQUE, description TEXT);
> CREATE TABLE auth.user_roles (user_id UUID FK, role_id UUID FK, UNIQUE(user_id, role_id));
> CREATE TABLE auth.permissions (id UUID PK, resource VARCHAR, action VARCHAR);
> CREATE TABLE auth.role_permissions (role_id UUID FK, permission_id UUID FK);
> ```

### 1.2 Bảng `refresh_tokens`

```sql
CREATE TABLE auth.refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash   VARCHAR(255) NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked      BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### Auth Indexes

```sql
CREATE INDEX idx_users_role ON auth.users (role);
CREATE INDEX idx_users_active ON auth.users (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_refresh_tokens_user ON auth.refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires ON auth.refresh_tokens (expires_at) WHERE revoked = FALSE;
```

---

## 2. Course Schema (`course`) — course-service :8082

### 2.1 Bảng `courses`

```sql
CREATE TABLE course.courses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    thumbnail_url   VARCHAR(500),
    instructor_id   UUID NOT NULL,  -- ref → auth.users (qua API, KHÔNG FK)
    status          VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    category        VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Bảng `enrollments`

```sql
CREATE TABLE course.enrollments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID NOT NULL REFERENCES course.courses(id) ON DELETE CASCADE,
    student_id  UUID NOT NULL,  -- ref → auth.users (qua API, KHÔNG FK)
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status      VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DROPPED', 'COMPLETED')),
    CONSTRAINT uq_enrollment UNIQUE (course_id, student_id)
);
```

### Course Indexes

```sql
CREATE INDEX idx_courses_instructor ON course.courses (instructor_id);
CREATE INDEX idx_courses_status ON course.courses (status);
CREATE INDEX idx_enrollments_student ON course.enrollments (student_id);
CREATE INDEX idx_enrollments_course ON course.enrollments (course_id);
```

---

## 3. Content Schema (`content`) — content-service :8083

### 3.1 Bảng `lessons`

```sql
CREATE TABLE content.lessons (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id        UUID NOT NULL,  -- ref → course.courses (qua API)
    title            VARCHAR(255) NOT NULL,
    type             VARCHAR(20) NOT NULL CHECK (type IN ('VIDEO', 'TEXT', 'PDF', 'LINK')),
    content_url      VARCHAR(500),
    text_content     TEXT,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER,
    is_published     BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_lesson_order UNIQUE (course_id, sort_order)
);
```

### Content Rules (bắt buộc tuân thủ ở app layer)

| `type` | `content_url` | `text_content` | Ghi chú |
|--------|---------------|----------------|---------|
| `TEXT` | NULL | NOT NULL | Nội dung inline, AI ingestion đọc trực tiếp |
| `VIDEO` | NOT NULL | Optional | URL YouTube/S3; text_content = transcript (nếu có) |
| `PDF` | NOT NULL | Optional | URL S3; text_content = extracted text (cho AI) |
| `LINK` | NOT NULL | NULL | External URL — **MVP không ingest** |

> **Quy tắc:** Service validate theo bảng trên khi create/update lesson. Nếu `type=TEXT` mà `text_content` rỗng → reject 400. AI ingestion chỉ xử lý lesson có `text_content IS NOT NULL`.
>
> **LINK:** MVP không ingest (không có text). Post-MVP: crawler fetch HTML → extract text → lưu `text_content`.

### Content Indexes

```sql
CREATE INDEX idx_lessons_course ON content.lessons (course_id);
CREATE INDEX idx_lessons_published ON content.lessons (course_id, is_published, sort_order);  -- query "published lessons of course"
-- UNIQUE (course_id, sort_order) tự tạo index
```

---

## 4. Progress Schema (`progress`) — progress-service :8084

### 4.1 Bảng `lesson_progress`

```sql
CREATE TABLE progress.lesson_progress (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL,    -- ref → auth.users
    lesson_id    UUID NOT NULL,    -- ref → content.lessons
    course_id    UUID NOT NULL,    -- ref → course.courses (denormalized)
    status       VARCHAR(20) DEFAULT 'NOT_STARTED'
                 CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),  -- ← THÊM: track khi status thay đổi
    CONSTRAINT uq_progress UNIQUE (user_id, lesson_id)
);
```

### Consistency Rules (bắt buộc)

1. **Ghi progress:** progress-service phải verify `lesson_id` thuộc `course_id` đó (gọi content-service hoặc cache mapping `lesson→course`)
2. **MVP rule:** Lesson **KHÔNG được chuyển course** (tránh inconsistency denormalized `course_id`). Post-MVP nếu cần → dùng event reconcile.
3. **Tính % hoàn thành:** `COUNT(status='COMPLETED') / total_lessons_in_course`

### Progress Indexes

```sql
CREATE INDEX idx_progress_user_course ON progress.lesson_progress (user_id, course_id);
CREATE INDEX idx_progress_course ON progress.lesson_progress (course_id);
CREATE INDEX idx_progress_lesson ON progress.lesson_progress (lesson_id);
```

---

## 5. Assessment Schema (`assessment`) — assessment-service :8085

> **MVP Decision:** Chỉ hỗ trợ **SINGLE_CHOICE** và **TRUE_FALSE**. ~~MULTIPLE_CHOICE~~ để post-MVP (cần thay đổi `attempt_answers` schema).

### 📐 Scoring Contract (FE/BE thống nhất)

```
1. score     = SUM(questions.points WHERE attempt_answers.is_correct = TRUE)
2. max_score = SUM(questions.points) cho toàn bộ quiz
3. passed    = (score / max_score * 100) >= quizzes.pass_score
4. Làm tròn: score và max_score giữ 2 decimal (DECIMAL(5,2))
5. Timing:  score/passed tính khi submit, KHÔNG tính lại sau đó
```

> FE chỉ hiển thị kết quả từ `attempts.score/max_score/passed`. Không tự tính lại ở client.

### 5.1 Bảng `quizzes`

```sql
CREATE TABLE assessment.quizzes (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id          UUID NOT NULL,  -- ref → course.courses
    title              VARCHAR(255) NOT NULL,
    description        TEXT,
    time_limit_minutes INTEGER,
    pass_score         DECIMAL(5,2) DEFAULT 50.00,
    max_attempts       INTEGER DEFAULT 1,
    is_published       BOOLEAN DEFAULT FALSE,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Bảng `questions`

```sql
CREATE TABLE assessment.questions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id    UUID NOT NULL REFERENCES assessment.quizzes(id) ON DELETE CASCADE,
    text       TEXT NOT NULL,
    type       VARCHAR(20) DEFAULT 'SINGLE_CHOICE'
               CHECK (type IN ('SINGLE_CHOICE', 'TRUE_FALSE')),  -- MVP: bỏ MULTIPLE_CHOICE
    points     DECIMAL(5,2) DEFAULT 1.00,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Bảng `choices`

```sql
CREATE TABLE assessment.choices (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES assessment.questions(id) ON DELETE CASCADE,
    text        VARCHAR(500) NOT NULL,
    is_correct  BOOLEAN DEFAULT FALSE,
    sort_order  INTEGER DEFAULT 0
);
```

### 5.4 Bảng `attempts`

```sql
CREATE TABLE assessment.attempts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id      UUID NOT NULL REFERENCES assessment.quizzes(id),
    student_id   UUID NOT NULL,  -- ref → auth.users
    score        DECIMAL(5,2),
    max_score    DECIMAL(5,2),
    passed       BOOLEAN,
    started_at   TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ
);
```

### 5.5 Bảng `attempt_answers`

```sql
CREATE TABLE assessment.attempt_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id  UUID NOT NULL REFERENCES assessment.attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment.questions(id),
    choice_id   UUID NOT NULL REFERENCES assessment.choices(id),
    is_correct  BOOLEAN,  -- snapshot tại thời điểm submit (xem note bên dưới)
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);
```

> **`is_correct` = snapshot:** Giá trị lưu tại thời điểm submit, dựa trên `choices.is_correct` lúc đó. Nếu instructor sửa quiz sau khi student đã submit → attempt cũ **KHÔNG bị đổi kết quả**. Post-MVP nếu cần quiz versioning (edit sau publish) → tách `quiz_versions` table.

### ⚠️ Assessment Validation Rule (BẮT BUỘC ở app layer)

> **Choice ∈ Question check:** DB không tự đảm bảo `choice_id` thuộc đúng `question_id` (FK tách rời). assessment-service **PHẢI verify** trước khi insert:
>
> ```java
> // assessment-service — khi nhận submit attempt
> Choice choice = choiceRepo.findById(choiceId);
> if (!choice.getQuestionId().equals(questionId)) {
>     throw new BadRequestException("Choice does not belong to this question");
> }
> ```
>
> Nếu không validate, user có thể gửi `choice_id` của câu khác → chấm sai hoặc "đúng giả".

> **Post-MVP MULTIPLE_CHOICE:**  
> Bỏ `UNIQUE (attempt_id, question_id)` → cho phép nhiều dòng/question.  
> Hoặc tách `attempt_answer_choices(answer_id FK, choice_id FK)`.

### Assessment Indexes

```sql
CREATE INDEX idx_quizzes_course ON assessment.quizzes (course_id);
CREATE INDEX idx_questions_quiz ON assessment.questions (quiz_id);
CREATE INDEX idx_choices_question ON assessment.choices (question_id);
CREATE INDEX idx_attempts_quiz ON assessment.attempts (quiz_id);
CREATE INDEX idx_attempts_student ON assessment.attempts (student_id);
CREATE INDEX idx_answers_attempt ON assessment.attempt_answers (attempt_id);
CREATE INDEX idx_answers_question ON assessment.attempt_answers (question_id);  -- analytics: thống kê câu khó
```

### Assessment ER

```
quizzes ──1:N──▶ questions ──1:N──▶ choices
   │                │
   └──1:N──▶ attempts ──1:N──▶ attempt_answers ◀── questions
                                    (1 answer/question — SINGLE_CHOICE/TRUE_FALSE)
                                    ⚠️ app layer verify: choice ∈ question
```

---

## 6. AI Tutor Schema (`ai_tutor`) — ai-tutor-service :8086

> **Extension:** `pgvector`  
> **Migration:** Alembic (Python)  
> **Embedding:** `text-embedding-ada-002` — **1536 dimensions (fixed MVP)**

### 6.1 Bảng `documents`

> **Versioning strategy: In-place update.** Mỗi lesson + source_type chỉ có 1 row. Khi re-ingest: update `content_hash`, tăng `version`, xoá chunks cũ (CASCADE), tạo chunks mới.
>
> **MVP constraint:** `UNIQUE(lesson_id, source_type)` → **1 lesson tối đa 1 document per source_type** (1 LESSON text, 1 FILE, 1 URL). Không hỗ trợ multi-file per lesson trong MVP. Post-MVP: đổi unique key hoặc cho phép nhiều FILE rows.

```sql
CREATE TABLE ai_tutor.documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID NOT NULL,
    lesson_id       UUID NOT NULL,
    source_type     VARCHAR(20) NOT NULL CHECK (source_type IN ('LESSON', 'FILE', 'URL')),
    source_url      VARCHAR(500),
    content_hash    VARCHAR(64) NOT NULL,  -- SHA-256 → skip re-ingest nếu hash không đổi
    embedding_model VARCHAR(50) DEFAULT 'text-embedding-ada-002',
    chunk_count     INTEGER DEFAULT 0,
    version         INTEGER DEFAULT 1,     -- tăng khi re-ingest (in-place update)
    status          VARCHAR(20) DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'PROCESSING', 'INDEXED', 'FAILED')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_document_source UNIQUE (lesson_id, source_type)  -- 1 row per lesson+source
);
```

| Column | Type | Mô tả |
|--------|------|-------|
| `content_hash` | VARCHAR(64) | SHA-256 — so sánh trước khi re-ingest, skip nếu trùng |
| `embedding_model` | VARCHAR(50) | Ghi model đang dùng (audit khi migrate model) |
| `version` | INTEGER | Tăng mỗi lần re-ingest cùng row |
| `source_type` | VARCHAR(20) | LESSON (text_content) / FILE (upload) / URL (external) |

> **Re-ingest flow:**
> 1. Tính SHA-256 của nội dung mới
> 2. So sánh với `documents.content_hash` → nếu trùng → skip
> 3. Nếu khác → UPDATE document (hash, version++, status=PROCESSING) → CASCADE xoá chunks cũ → tạo chunks mới → status=INDEXED

### 6.2 Bảng `document_chunks`

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE ai_tutor.document_chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES ai_tutor.documents(id) ON DELETE CASCADE,
    course_id   UUID NOT NULL,     -- denormalized cho filter nhanh
    lesson_id   UUID NOT NULL,     -- denormalized cho filter nhanh
    chunk_index INTEGER NOT NULL,
    text        TEXT NOT NULL,
    embedding   VECTOR(1536) NOT NULL,  -- 1536 dims = ada-002 (fixed, đổi model → migration)
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

> **Embedding dimension = 1536 (fixed MVP).** Nếu đổi model → cần Alembic migration đổi `VECTOR(N)` + re-embed toàn bộ chunks.

### 6.3 Bảng `chat_history`

```sql
CREATE TABLE ai_tutor.chat_history (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL,
    course_id  UUID NOT NULL,
    question   TEXT NOT NULL,
    answer     TEXT NOT NULL,
    citations  JSONB,  -- [{chunkId, lessonId, snippet}]
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.4 Bảng `jobs`

```sql
CREATE TABLE ai_tutor.jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,  -- BẮT BUỘC, format: "{type}:{courseId}:{lessonId}"
    type            VARCHAR(30) NOT NULL CHECK (type IN ('INGEST_CONTENT', 'GENERATE_QUIZ')),
    status          VARCHAR(20) DEFAULT 'QUEUED'
                    CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED')),
    payload         JSONB NOT NULL,
    error           TEXT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

> **`idempotency_key` là NOT NULL** — mọi job phải có key. PostgreSQL UNIQUE constraint chỉ chặn duplicate cho non-NULL values (nhiều NULL vẫn lọt), nên bắt buộc NOT NULL để đảm bảo không tạo job trùng.

### AI Tutor Indexes

```sql
-- Vector similarity search (IVFFlat)
CREATE INDEX idx_chunks_embedding ON ai_tutor.document_chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_chunks_document ON ai_tutor.document_chunks (document_id);
CREATE INDEX idx_chunks_course ON ai_tutor.document_chunks (course_id);
CREATE INDEX idx_chunks_lesson ON ai_tutor.document_chunks (lesson_id);
CREATE INDEX idx_documents_course ON ai_tutor.documents (course_id);
CREATE INDEX idx_documents_hash ON ai_tutor.documents (content_hash);
CREATE INDEX idx_chat_user_course ON ai_tutor.chat_history (user_id, course_id);
CREATE INDEX idx_jobs_status ON ai_tutor.jobs (status);
```

### ⚠️ IVFFlat Index Notes

> **Bắt buộc sau mỗi batch ingest:**
> ```sql
> ANALYZE ai_tutor.document_chunks;
> ```
> IVFFlat cần statistics cập nhật để phân bổ vectors vào lists hiệu quả. Không `ANALYZE` → recall giảm đáng kể.
>
> **`lists = 100` phù hợp cho MVP (vài nghìn → vài chục nghìn chunks).** Nếu data nhỏ (<1000 chunks), brute-force (`Seq Scan`) đôi khi nhanh hơn IVFFlat. Nếu data lớn (>100K chunks), tăng `lists` hoặc chuyển sang **HNSW** index.

---

## 7. Tổng hợp

### Schema Summary

| Schema | Service | Port | Bảng | Migration |
|--------|---------|------|------|-----------|
| `auth` | auth-service | 8081 | `users`, `refresh_tokens` | Flyway |
| `course` | course-service | 8082 | `courses`, `enrollments` | Flyway |
| `content` | content-service | 8083 | `lessons` | Flyway |
| `progress` | progress-service | 8084 | `lesson_progress` | Flyway |
| `assessment` | assessment-service | 8085 | `quizzes`, `questions`, `choices`, `attempts`, `attempt_answers` | Flyway |
| `ai_tutor` | ai-tutor-service | 8086 | `documents`, `document_chunks`, `chat_history`, `jobs` | Alembic |
| **Tổng** | **6 services** | | **15 bảng** | |

### Cross-Service Reference Map

```
auth.users.id ← ─ ─ (soft ref, KHÔNG FK) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
    ├── course.courses.instructor_id                                  │
    ├── course.enrollments.student_id                                 │
    ├── progress.lesson_progress.user_id                              │
    ├── assessment.attempts.student_id                                │
    └── ai_tutor.chat_history.user_id                                 │

course.courses.id ← ─ (soft ref) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
    ├── content.lessons.course_id                                     │
    ├── progress.lesson_progress.course_id                            │
    ├── assessment.quizzes.course_id                                  │
    └── ai_tutor.documents.course_id                                  │

content.lessons.id ← ─ (soft ref) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
    ├── progress.lesson_progress.lesson_id                            │
    └── ai_tutor.documents.lesson_id                                  │
```

### Aggregation Strategy (không join cross-schema)

Các "view" tổng hợp (vd: course detail + progress + quiz results) thực hiện qua:
1. **Gateway/BFF aggregation** — Gateway gọi song song các service APIs, merge response
2. **Read-model riêng** (post-MVP) — materialized view hoặc denormalized read DB

### Redis Data Design (MVP)

| Key Pattern | Type | TTL | Mục đích |
|-------------|------|-----|----------|
| `queue:jobs` | List/Stream | — | **Job queue** (FIFO) — core |
| `job:{jobId}` | Hash | 24h | Job status cache |
| `course:{courseId}` | Hash | 1h | Course detail cache (optional) |
| `progress:{userId}:{courseId}` | Hash | 30m | Progress % cache (optional) |

> ~~`session:{userId}`~~ — Bỏ. JWT stateless + refresh_tokens table đủ cho MVP.

---

## 8. Nguyên tắc thiết kế

### ✅ Tuân thủ

1. **Schema-per-service** — Mỗi service chỉ đọc/ghi schema riêng
2. **UUID v4** — `gen_random_uuid()` cho PK
3. **Soft reference** — Cross-service reference bằng UUID, KHÔNG FK constraint
4. **TIMESTAMPTZ** — Luôn timezone-aware
5. **Audit columns** — `created_at` + `updated_at` (app layer: `@PreUpdate` / SQLAlchemy `onupdate`)
6. **Denormalization có kiểm soát** — Chỉ khi access pattern rõ ràng
7. **Idempotency** — Jobs: `idempotency_key NOT NULL UNIQUE`; Documents: `content_hash` check
8. **Content rules** — Validate `content_url`/`text_content` theo `type` ở app layer
9. **Choice ∈ Question** — assessment-service verify `choice.question_id == question_id` trước insert
10. **ANALYZE sau ingest** — Chạy `ANALYZE` trên `document_chunks` sau mỗi batch ingest

### ❌ Tránh

1. **Cross-schema JOIN** — Vi phạm service boundary
2. **Shared tables** — Mỗi service sở hữu riêng data
3. **Cascading deletes cross-service** — Dùng async event
4. **LIKE cho text search** — Dùng pgvector / pg_trgm
5. **JSON blob cho structured data** — MCQ choices chuẩn hóa thành bảng
6. **DB trigger cho updated_at** — Dùng app layer (`@PreUpdate` / `onupdate`)
7. **idempotency_key = NULL** — Mọi job phải có key, NULL lọt qua UNIQUE

---

## 9. MVP Decisions Log

| # | Quyết định | Lý do | Post-MVP |
|---|-----------|-------|----------|
| 1 | UUID v4 (`gen_random_uuid()`) | Đơn giản, không cần lib | Đổi v7 nếu cần sortable |
| 2 | Single `role` column | 3 roles đủ cho MVP | Tách `roles`/`user_roles`/`permissions` |
| 3 | `updated_at` ở app layer | `@PreUpdate`/`onupdate` — portable, tường minh | Trigger nếu team muốn |
| 4 | Lesson `text_content` inline | Đơn giản cho AI ingestion | Tách `lesson_bodies` nếu bảng phình |
| 5 | Chỉ SINGLE_CHOICE + TRUE_FALSE | `attempt_answers` 1:1 question | Thêm MULTIPLE_CHOICE + schema change |
| 6 | Embedding 1536 dims (ada-002) | Cố định, lưu `embedding_model` cho audit | Migration + re-embed nếu đổi model |
| 7 | Lesson không chuyển course | Tránh inconsistency denormalized `course_id` | Event reconcile |
| 8 | Redis không session store | JWT stateless + `refresh_tokens` table | Token blacklist nếu cần |
| 9 | Documents in-place update | 1 row per lesson+source_type, đơn giản | Append-only nếu cần lịch sử |
| 10 | `idempotency_key NOT NULL` | Chặn duplicate jobs ở DB level | — |
| 11 | IVFFlat lists=100 | Phù hợp vài nghìn→vài chục nghìn chunks | HNSW cho >100K chunks |
| 12 | `is_correct` = snapshot | Attempt cũ không bị đổi khi instructor sửa quiz | Quiz versioning (`quiz_versions`) |
| 13 | 1 lesson tối đa 1 file | `UNIQUE(lesson_id, source_type)` đơn giản | Multi-file per lesson |
| 14 | LINK không ingest | Không có text để embed | Crawler fetch HTML → extract text |

---

## 10. Changelog

| Round | Thay đổi |
|-------|----------|
| **v1** | Thiết kế ban đầu: 6 schemas, 14 bảng |
| **v2** | + `last_login_at`, progress enum, `documents` table, `idempotency_key` → 15 bảng |
| **v3** | Fix UUID v4 wording, content rules, bỏ MULTIPLE_CHOICE MVP, + `embedding_model`, + `uq_attempt_question`, widen documents unique key, cleanup Redis scope |
| **v4** | + Coding rules (`@PreUpdate`/`onupdate`), + `lesson_progress.updated_at`, + choice∈question validation, + IVFFlat ANALYZE notes, `idempotency_key NOT NULL`, documents in-place |
| **v5 (final)** | + Scoring contract (5 rules FE/BE), `is_correct` snapshot note, 1-file-per-lesson constraint, LINK ingestion note, + `idx_answers_question` + `idx_lessons_published` |
