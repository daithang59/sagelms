# 📁 src/ — Mã nguồn Java Service

## Mục đích

Thư mục `src/` chứa toàn bộ mã nguồn Java của service, tuân theo cấu trúc **Maven chuẩn**.

## Cấu trúc chung cho mọi Java service

```
src/
├── main/
│   ├── java/dev/sagelms/<service-name>/
│   │   ├── <ServiceName>Application.java   ← Entry point (Spring Boot main class)
│   │   ├── api/                             ← REST Controllers
│   │   │   └── PingController.java          ← Health check endpoint (/ping)
│   │   ├── config/                          ← Cấu hình Spring
│   │   │   └── SecurityConfig.java          ← Security rules (public/protected routes)
│   │   ├── entity/                          ← JPA Entities (ánh xạ DB tables)
│   │   │   ├── BaseEntity.java              ← Base class (id, createdAt, updatedAt)
│   │   │   └── <Entity>.java               ← Domain entities
│   │   ├── repository/                      ← (dự kiến) Spring Data JPA Repositories
│   │   ├── service/                         ← (dự kiến) Business logic layer
│   │   └── dto/                             ← (dự kiến) Data Transfer Objects
│   │
│   └── resources/
│       ├── application.yml                  ← Cấu hình Spring Boot (port, DB, ...)
│       └── db/migration/
│           └── V1__create_<service>_tables.sql  ← Flyway migration SQL
│
└── test/
    └── java/dev/sagelms/<service-name>/
        └── <ServiceName>ApplicationTests.java  ← Smoke test (context loads)
```

## Giải thích từng package

### `<ServiceName>Application.java`
- **Vai trò**: Entry point — class có `@SpringBootApplication`
- **Chạy**: `./mvnw spring-boot:run`

### `api/` — REST Controllers
- Chứa các `@RestController`
- Mỗi controller xử lý 1 nhóm endpoints
- Nhận request → gọi service → trả response

### `config/` — Configuration
- `SecurityConfig.java`: Định nghĩa routes nào public, routes nào cần auth
- Thêm các `@Configuration` class khác nếu cần (CORS, Jackson, ...)

### `entity/` — JPA Entities
- Mỗi entity ánh xạ 1 bảng trong database
- `BaseEntity.java`: Class cha chung với `id` (UUID), `createdAt`, `updatedAt`
- Sử dụng **enums** cho các trường status/role

### `repository/` — Data Access (dự kiến)
- Interfaces extend `JpaRepository<Entity, UUID>`
- Spring Data tự tạo implementation

### `service/` — Business Logic (dự kiến)
- Chứa `@Service` classes
- Xử lý logic nghiệp vụ, validation, orchestration
- Gọi repository để truy xuất data

### `dto/` — Data Transfer Objects (dự kiến)
- Objects dùng cho request/response body
- Tách biệt với entity (không expose DB structure ra API)

### `resources/application.yml`
- Cấu hình port, datasource, Flyway, logging
- Sử dụng env variables cho sensitive values

### `resources/db/migration/`
- **Flyway migration files**: tự chạy khi service start
- Format: `V<version>__<description>.sql`
- **KHÔNG SỬA file migration đã có** — chỉ thêm file mới

## Chi tiết các entities hiện có theo service

| Service | Entities | Enums |
|---------|----------|-------|
| **auth-service** | `User`, `RefreshToken` | `UserRole` |
| **course-service** | `Course`, `Enrollment` | `CourseStatus`, `EnrollmentStatus` |
| **content-service** | `Lesson` | `ContentType` |
| **assessment-service** | `Quiz`, `Question`, `Choice`, `Attempt`, `AttemptAnswer` | `QuestionType` |
| **progress-service** | `LessonProgress` | `ProgressStatus` |

## Quy ước phát triển

1. **Thêm entity**: Tạo class trong `entity/`, viết migration SQL mới trong `db/migration/`
2. **Thêm API**: Tạo Controller trong `api/`, Service trong `service/`, DTO trong `dto/`
3. **Naming**: PascalCase cho class, camelCase cho method/field, UPPER_SNAKE cho enum
4. **Testing**: Sử dụng H2 in-memory DB cho unit tests (không cần PostgreSQL chạy)
5. **Package**: `dev.sagelms.<service-name>.<layer>`
