# 📄 docs/templates — Tài liệu mẫu

## Mục đích

Chứa các **template** giúp team tạo tài liệu mới một cách thống nhất.

## Nội dung hiện tại

```
templates/
└── service-readme-template.md    ← Template README cho service mới
```

### `service-readme-template.md`

Template chuẩn để viết README.md khi tạo microservice mới. Bao gồm các section:
- Mục đích
- Chức năng chính
- Tech Stack
- Port
- Database Schema
- API Endpoints
- Cách chạy local
- Cách chạy tests
- Owner

## Cách sử dụng

Khi tạo service mới:
1. Copy `service-readme-template.md` vào `services/<new-service>/README.md`
2. Thay thế placeholder bằng thông tin thực tế
3. Commit cùng với code service
