# 📊 services/progress-service — Progress Tracking

## Mục đích

Theo dõi **tiến trình học tập** của sinh viên trong từng khoá học.

## Chức năng chính

| Feature | Mô tả |
|---------|--------|
| Mark complete | Đánh dấu hoàn thành lesson |
| Progress query | Truy vấn tiến trình theo course/student |
| Percentage | Tính % hoàn thành khoá học |

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| Spring Boot 3.x | Framework |
| JDK 17 | Runtime |
| PostgreSQL | Database (schema: `progress`) |
| Flyway | Database migration |

## Port: `8084`

## Database Schema

```
progress.lesson_progress (id, lesson_id, student_id, status, completed_at, ...)
```

## API Endpoints (dự kiến)

```
POST   /api/v1/progress/lessons/:lessonId/complete   (student)
GET    /api/v1/progress/courses/:courseId             (student — tiến trình cá nhân)
GET    /api/v1/progress/courses/:courseId/students     (instructor — tiến trình lớp)
```
