# SageLMS Development Database Seed

This folder contains local development seed data for the core SageLMS services:

- `auth-service` -> `auth`
- `course-service` -> `course`
- `content-service` -> `content`
- `challenge-service` -> `challenge`

The seed is intended for manual testing through the web app and gateway.

## Seeded Data

The core seed currently inserts or updates:

- 12 users
- 28 courses
- 25 enrollments
- 63 lessons
- 6 challenges
- 9 challenge question sets
- 20 challenge questions
- 33 challenge choices
- 8 challenge attempts
- 19 challenge answers

It includes published, draft, and archived courses; active, dropped, and completed enrollments; and lesson content across `TEXT`, `VIDEO`, `PDF`, and `LINK`.
Challenge data includes both `MULTIPLE_CHOICE` and `ESSAY` questions, graded attempts, pending-review attempts, and sample file metadata for essay answers.

## Prerequisite

Start the database and core services once so Flyway creates the tables:

```powershell
cd infra/docker
docker compose --profile app up -d --build postgres auth-service course-service content-service gateway
```

If you also want challenge seed data, start `challenge-service` once before importing the seed so Flyway creates the `challenge` schema and tables:

```powershell
docker compose --profile app up -d --build postgres auth-service course-service content-service challenge-service gateway
```

## Import Seed Data

From the repository root:

```powershell
docker compose -f infra/docker/docker-compose.yml cp infra/database/seed-core-dev.sql postgres:/tmp/seed-core-dev.sql
docker compose -f infra/docker/docker-compose.yml exec -T postgres `
  psql -U sagelms -d sagelms -f /tmp/seed-core-dev.sql
```

Avoid importing this seed with `Get-Content ... | docker compose exec ... psql -f -` on Windows PowerShell. PowerShell can corrupt Vietnamese UTF-8 text before it reaches `psql`, resulting in values like `Ki???m tra`. Copying the SQL file into the Postgres container first preserves the original UTF-8 bytes.

If you still want to pipe from PowerShell, set the output encoding first:

```powershell
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Get-Content infra/database/seed-core-dev.sql | docker compose -f infra/docker/docker-compose.yml exec -T postgres `
  psql -U sagelms -d sagelms -f -
```

If you changed `POSTGRES_USER` or `POSTGRES_DB`, replace `sagelms` in the command.

## Verify

```powershell
docker compose -f infra/docker/docker-compose.yml cp infra/database/verify-core-dev.sql postgres:/tmp/verify-core-dev.sql
docker compose -f infra/docker/docker-compose.yml exec -T postgres `
  psql -U sagelms -d sagelms -f /tmp/verify-core-dev.sql
```

## Test Accounts

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Admin | `admin@sagelms.dev` | `Admin123!` | Can approve instructor applications |
| Instructor | `instructor@sagelms.dev` | `Instructor123!` | Approved, active |
| Instructor | `frontend.instructor@sagelms.dev` | `Instructor123!` | Approved, owns frontend/design courses |
| Instructor | `data.instructor@sagelms.dev` | `Instructor123!` | Approved, owns data/database/AI courses |
| Instructor | `devops.instructor@sagelms.dev` | `Instructor123!` | Approved, owns DevOps/security courses |
| Instructor | `product.instructor@sagelms.dev` | `Instructor123!` | Approved, owns product/education/marketing courses |
| Instructor | `pending.instructor@sagelms.dev` | `Instructor123!` | Pending, cannot login |
| Instructor | `rejected.instructor@sagelms.dev` | `Instructor123!` | Rejected, cannot login |
| Student | `student@sagelms.dev` | `Student123!` | Active and completed enrollment samples |
| Student | `student2@sagelms.dev` | `Student123!` | Active and dropped enrollment samples |
| Student | `student3@sagelms.dev` | `Student123!` | Active and completed enrollment samples |
| Student | `student4@sagelms.dev` | `Student123!` | Active and dropped enrollment samples |

## Notes

- The seed is idempotent. Running it multiple times updates the same dev records.
- It does not truncate or delete existing data.
- Course/content relations use stable UUIDs for courses and lessons.
- Challenge relations use stable UUIDs for challenges, question sets, questions, choices, attempts, and answers.
- User relations are resolved by email, so the seed still works if `auth-service` already created demo users with different UUIDs.
