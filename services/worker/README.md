# ⚙️ services/worker — Background Job Processor

## Mục đích

Consume và xử lý **tác vụ nặng / async** từ Redis queue, tách biệt khỏi request path chính.

## Chức năng chính

| Feature | Mô tả |
|---------|--------|
| Job consumer | Lắng nghe Redis queue, pick up job |
| Ingest content | Chạy ingestion pipeline (chunking + embedding) |
| Generate quiz | Tạo quiz/câu hỏi tự động từ nội dung |
| Status tracking | Cập nhật trạng thái job (`QUEUED → RUNNING → SUCCEEDED / FAILED`) |
| Retry | Retry 1–3 lần khi gặp lỗi; lỗi cuối → FAILED + error log |

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| Spring Boot 3.x | Framework |
| JDK 17 | Runtime |
| Redis | Message broker / queue |
| PostgreSQL | Job state persistence |

## Port: không expose (chỉ consume queue)

## Job Model

```json
{
  "id": "uuid",
  "type": "INGEST_CONTENT | GENERATE_QUIZ",
  "payload": { "courseId": "...", "lessonId": "..." },
  "status": "QUEUED | RUNNING | SUCCEEDED | FAILED",
  "result": { ... },
  "error": "...",
  "created_at": "...",
  "updated_at": "..."
}
```

## Lưu ý

- Worker có thể **scale độc lập** (tăng số replicas khi job queue dài).
- Sử dụng **idempotency key** để tránh chạy trùng job.
