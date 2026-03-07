# 📖 docs — Project Documentation

## Mục đích

Tập trung **toàn bộ tài liệu** dự án, giúp team và người mới nhanh chóng hiểu và làm việc với SageLMS.

## Cấu trúc

```
docs/
├── onboarding.md              ← Hướng dẫn setup cho người mới (clone → first PR)
├── project-brief.md           ← Tóm tắt đề bài + MVP scope
├── NT548_DoAnWeb.md           ← Đề bài gốc (chi tiết đầy đủ)
│
├── architecture/
│   └── overview.md            ← Tổng quan kiến trúc (component diagram, request flow)
│
├── decisions/
│   └── 0001-repo-structure.md ← ADR #1: Mono-repo structure
│
└── runbooks/
    └── local-dev.md           ← Troubleshooting local development
```

## Quy ước

| Loại tài liệu | Thư mục | Format |
|---------------|---------|--------|
| Hướng dẫn nhanh | `docs/` (root) | Markdown |
| Kiến trúc & thiết kế | `docs/architecture/` | Markdown + diagrams |
| Architecture Decision Records | `docs/decisions/` | ADR format (`0001-title.md`) |
| Runbooks & troubleshooting | `docs/runbooks/` | Markdown |
| API specs | Trong từng service | OpenAPI 3.0 (YAML) |

## Đóng góp tài liệu

- Mở PR với prefix `docs/` (ví dụ: `docs/add-deployment-guide`).
- Tài liệu phải rõ ràng, có ví dụ, dễ follow.
- ADR đánh số tăng dần: `0002-xxx.md`, `0003-xxx.md`, ...
