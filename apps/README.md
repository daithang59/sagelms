# 🖥 apps — Frontend Applications

## Mục đích

Chứa các **ứng dụng client-side** (frontend) của SageLMS. Hiện tại dự án có 1 ứng dụng web duy nhất.

## Cấu trúc

```
apps/
└── web/              ← Single Page Application (React + Vite + TypeScript)
```

## `web/` — Frontend SPA

Ứng dụng web chính cho SageLMS — giao diện cho **student**, **instructor**, và **admin**.

| Đặc điểm | Chi tiết |
|-----------|----------|
| **Framework** | React 18 |
| **Build tool** | Vite |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 3 |
| **Routing** | React Router 6 |
| **HTTP client** | Axios (qua `lib/api.ts`) |
| **Testing** | Vitest + React Testing Library |
| **Port** | `3000` |

### Chạy nhanh

```bash
cd apps/web
npm install     # Lần đầu
npm run dev     # Dev server: http://localhost:3000
npm test        # Chạy tests
npm run build   # Build production
```

## Mở rộng tương lai

Nếu cần thêm app client khác (ví dụ: mobile app, admin portal riêng), tạo thư mục mới trong `apps/`:

```
apps/
├── web/              ← Web SPA hiện tại
├── admin/            ← (dự kiến) Admin dashboard riêng
└── mobile/           ← (dự kiến) React Native app
```

> Chi tiết về frontend: xem [apps/web/README.md](./web/README.md) và [apps/web/src/README.md](./web/src/README.md)
