# 📁 docs/architecture — Kiến trúc hệ thống

## Mục đích

Chứa tài liệu **kiến trúc tổng quan** và các **diagram** mô tả hệ thống SageLMS.

## Nội dung hiện tại

```
architecture/
└── overview.md    ← Tổng quan kiến trúc microservices
```

### `overview.md`

Bao gồm:
- **Component Diagram**: Mối quan hệ giữa các services
- **Tech Stack Summary**: Công nghệ sử dụng ở từng layer
- **Request Flow**: Luồng xử lý request từ client → gateway → services
- **Nguyên tắc thiết kế**: Schema-per-service, API-first, Correlation ID, ...

## Dự kiến bổ sung

```
architecture/
├── overview.md           ← ✅ Hiện có
├── data-model.md         ← ERD / Database schema chi tiết
├── sequences/            ← Sequence diagrams cho các flow quan trọng
│   ├── login-flow.md
│   ├── create-course.md
│   └── rag-pipeline.md
└── deployment.md         ← Kiến trúc deployment (Docker/K8s)
```
