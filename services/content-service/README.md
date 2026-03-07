# 📄 services/content-service — Content Delivery

## Mục đích

Quản lý **nội dung bài giảng** (lessons, materials) và cung cấp metadata cho các service khác.

## Chức năng chính

| Feature | Mô tả |
|---------|--------|
| Lesson CRUD | Tạo/sửa/xoá bài học, gắn vào khoá học |
| Material metadata | Quản lý metadata file đính kèm (PDF, video, ...) |
| Content for AI | Cung cấp nội dung text cho AI Tutor ingestion |
| Ordering | Sắp xếp thứ tự bài học trong khoá học |

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| Spring Boot 3.x | Framework |
| JDK 17 | Runtime |
| PostgreSQL | Database (schema: `content`) |
| Flyway | Database migration |

## Port: `8083`

## Database Schema

```
content.lessons (id, course_id, title, content_type, content_ref, order_index, ...)
```

## API Endpoints (dự kiến)

```
GET    /api/v1/courses/:courseId/lessons
POST   /api/v1/courses/:courseId/lessons     (instructor)
GET    /api/v1/lessons/:id
PUT    /api/v1/lessons/:id                   (instructor)
DELETE /api/v1/lessons/:id                   (instructor)
GET    /api/v1/lessons/:id/content           (text content for AI)
```
