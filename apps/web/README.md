# 🌐 apps/web — Frontend Application

## Mục đích

Chứa mã nguồn **Frontend SPA** (Single Page Application) của SageLMS.

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| TailwindCSS | Styling |
| shadcn/ui (Radix) | UI component library |
| React Router v6+ | Client-side routing |
| TanStack Query | Server-state management |
| React Hook Form + Zod | Form handling & validation |
| Axios | HTTP client |

## Cấu trúc dự kiến

```
apps/web/
├── public/               ← Static assets
├── src/
│   ├── components/       ← Reusable UI components
│   ├── pages/            ← Route pages
│   ├── hooks/            ← Custom React hooks
│   ├── services/         ← API client functions
│   ├── lib/              ← Utilities
│   ├── types/            ← TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Chạy local

```bash
cd apps/web
npm install
npm run dev
# → http://localhost:3000
```

## Giao tiếp

Frontend gọi API thông qua **API Gateway** (`http://localhost:8080/api/v1/...`).
