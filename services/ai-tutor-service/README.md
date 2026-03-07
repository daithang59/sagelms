# 🤖 services/ai-tutor-service — AI Tutor (RAG)

## Mục đích

Cung cấp **chatbot AI** hỏi đáp dựa trên nội dung khoá học, sử dụng mô hình **RAG** (Retrieval-Augmented Generation).

## Chức năng chính

| Feature | Mô tả |
|---------|--------|
| Ingestion | Nhận nội dung lesson → chunking → embedding → lưu pgvector |
| Ask (Q&A) | Nhận câu hỏi → vector search → compose prompt → gọi LLM → trả answer + citation |
| Scoped retrieval | Giới hạn retrieval theo `courseId` để tránh trả lời sai context |
| Job orchestration | Điều phối async jobs (ingest, generate quiz) qua Redis queue |

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| FastAPI | Web framework |
| Python 3.11+ | Runtime |
| LangChain | LLM orchestration |
| pgvector | Vector store (trong PostgreSQL) |
| Redis | Job queue |

## Port: `8086`

## RAG Pipeline

```
1. Extract   → lấy text từ content-service
2. Normalize → làm sạch văn bản
3. Chunking  → chia đoạn (500–1000 tokens, overlap 10–20%)
4. Embedding → tạo vector (model tuỳ chọn)
5. Store     → lưu vào ai.chunks (pgvector)

Query:
1. Vector search top-k chunks (filter by courseId)
2. Compose prompt (system + question + context)
3. Call LLM → answer
4. Return answer + citations (chunkId/lessonId)
```

## Database Schema

```
ai.documents (id, course_id, lesson_id, source_ref, ...)
ai.chunks    (id, document_id, chunk_text, metadata_json, embedding VECTOR, ...)
ai.jobs      (id, type, payload_json, status, result_json, error, created_at, ...)
```

## API Endpoints (dự kiến)

```
POST   /api/v1/ai/ingest         (trigger ingestion job)
POST   /api/v1/ai/ask            (hỏi đáp)
GET    /api/v1/ai/jobs/:id        (theo dõi job status)
```
