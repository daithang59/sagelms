# 📋 docs/decisions — Architecture Decision Records (ADR)

## Mục đích

Ghi nhận các **quyết định kiến trúc** quan trọng của dự án. Mỗi quyết định được lưu trữ như một ADR (Architecture Decision Record) để team hiểu **tại sao** chọn giải pháp này.

## Danh sách ADR hiện tại

| # | Title | Mô tả |
|---|-------|-------|
| [0001](./0001-repo-structure.md) | Repo Structure | Quyết định dùng mono-repo, cấu trúc thư mục |
| [0002](./0002-tech-stack-choice.md) | Tech Stack Choice | Lý do chọn Spring Boot, React, FastAPI, PostgreSQL |

## Format ADR

Mỗi file ADR bao gồm:
1. **Title**: Tiêu đề quyết định
2. **Status**: `Accepted` / `Proposed` / `Deprecated`
3. **Context**: Bối cảnh, vấn đề cần giải quyết
4. **Decision**: Quyết định được đưa ra
5. **Consequences**: Hệ quả (tích cực & tiêu cực)

## Thêm ADR mới

1. Tạo file: `docs/decisions/00XX-<tiêu-đề>.md`
2. Đánh số tăng dần: `0003`, `0004`, ...
3. Sử dụng template ở trên
4. Mở PR với prefix `docs/`
