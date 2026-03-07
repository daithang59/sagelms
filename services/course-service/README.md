# 📚 services/course-service — Course Management

## Mục đích

Quản lý **khoá học** và **đăng ký học** (enrollment).

## Chức năng chính

| Feature | Mô tả |
|---------|--------|
| Course CRUD | Tạo, sửa, xoá, xem danh sách khoá học |
| Publish/Unpublish | Thay đổi trạng thái hiển thị khoá học |
| Enrollment | Học viên đăng ký khoá học |
| Roster | Instructor xem danh sách học viên đã enroll |

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| Spring Boot 3.x | Framework |
| JDK 17 | Runtime |
| PostgreSQL | Database (schema: `course`) |
| Flyway | Database migration |

## Port: `8082`

## Database Schema

```
course.courses     (id, title, description, status, instructor_id, ...)
course.enrollments (id, course_id, student_id, enrolled_at, ...)
```

## API Endpoints (dự kiến)

```
GET    /api/v1/courses
POST   /api/v1/courses          (instructor/admin)
GET    /api/v1/courses/:id
PUT    /api/v1/courses/:id      (instructor/admin)
DELETE /api/v1/courses/:id      (admin)
POST   /api/v1/courses/:id/enroll   (student)
GET    /api/v1/courses/:id/students  (instructor)
```
