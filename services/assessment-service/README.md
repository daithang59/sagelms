# 📝 services/assessment-service — Quizzes & Grading

## Mục đích

Quản lý **bài kiểm tra** (quiz), câu hỏi, và **chấm điểm tự động**.

## Chức năng chính

| Feature | Mô tả |
|---------|--------|
| Quiz CRUD | Tạo/sửa/xoá bài kiểm tra, gắn vào khoá học |
| Question CRUD | Tạo câu hỏi (MCQ, true/false, ...) |
| Attempt | Sinh viên làm bài kiểm tra |
| Auto-grading | Chấm điểm tự động dựa trên đáp án |
| Results | Lưu và trả kết quả |

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| Spring Boot 3.x | Framework |
| JDK 17 | Runtime |
| PostgreSQL | Database (schema: `assessment`) |
| Flyway | Database migration |

## Port: `8085`

## Database Schema

```
assessment.quizzes   (id, course_id, title, ...)
assessment.questions (id, quiz_id, type, prompt, options_json, answer_json, ...)
assessment.attempts  (id, quiz_id, student_id, started_at, submitted_at, score, ...)
```

## API Endpoints (dự kiến)

```
GET    /api/v1/courses/:courseId/quizzes
POST   /api/v1/courses/:courseId/quizzes        (instructor)
GET    /api/v1/quizzes/:id
POST   /api/v1/quizzes/:id/questions            (instructor)
POST   /api/v1/quizzes/:id/attempts             (student — bắt đầu làm bài)
PUT    /api/v1/attempts/:id/submit              (student — nộp bài)
GET    /api/v1/attempts/:id/result              (student — xem kết quả)
```
