# SageLMS Development Database Seed

This folder contains local development seed data for the core SageLMS services:

- `auth-service` -> `auth`
- `course-service` -> `course`
- `content-service` -> `content`

The seed is intended for manual testing through the web app and gateway.

## Seeded Data

The core seed currently inserts or updates:

- 12 users
- 28 courses
- 25 enrollments
- 63 lessons

It includes published, draft, and archived courses; active, dropped, and completed enrollments; and lesson content across `TEXT`, `VIDEO`, `PDF`, and `LINK`.

## Prerequisite

Start the database and core services once so Flyway creates the tables:

```powershell
cd infra/docker
docker compose --profile app up -d --build postgres auth-service course-service content-service gateway
```

## Import Seed Data

From the repository root:

```powershell
docker compose -f infra/docker/docker-compose.yml exec -T postgres `
  psql -U sagelms -d sagelms -f - < infra/database/seed-core-dev.sql
```

PowerShell does not support Unix-style input redirection in this form. If you are running from PowerShell, use:

```powershell
Get-Content infra/database/seed-core-dev.sql | docker compose -f infra/docker/docker-compose.yml exec -T postgres `
  psql -U sagelms -d sagelms -f -
```

If you changed `POSTGRES_USER` or `POSTGRES_DB`, replace `sagelms` in the command.

## Verify

```powershell
docker compose -f infra/docker/docker-compose.yml exec -T postgres `
  psql -U sagelms -d sagelms -f - < infra/database/verify-core-dev.sql
```

PowerShell version:

```powershell
Get-Content infra/database/verify-core-dev.sql | docker compose -f infra/docker/docker-compose.yml exec -T postgres `
  psql -U sagelms -d sagelms -f -
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
- User relations are resolved by email, so the seed still works if `auth-service` already created demo users with different UUIDs.
