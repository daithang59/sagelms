# 🖥 apps/web — Frontend SPA

## Mục đích

Single-page application cho SageLMS. Giao diện cho student, instructor, và admin.

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| React 18 | UI library |
| Vite | Build tool & dev server |
| TypeScript | Type safety |
| Tailwind CSS 3 | Utility-first CSS framework |
| React Router 6 | Client-side routing |
| Axios | HTTP client (gọi API) |
| Vitest | Unit testing |
| Testing Library | Component testing |

## Cấu trúc thư mục (dự kiến)

```
apps/web/
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx            ← Entry point
    ├── App.tsx             ← Root component + routes
    ├── index.css           ← Tailwind directives
    ├── components/         ← Shared components
    ├── pages/              ← Page-level components
    ├── hooks/              ← Custom hooks
    ├── services/           ← API calls (Axios)
    ├── types/              ← TypeScript types
    └── test/               ← Test files
```

## Chạy local

```bash
cd apps/web
npm install     # lần đầu
npm run dev     # http://localhost:3000
```

## Chạy tests

```bash
npm test            # watch mode
npm test -- --run   # CI mode (1 lần)
```

## Port: `3000`

## Build

```bash
npm run build   # → dist/
npm run preview # preview production build
```

## Owner

@daithang59

## Links

- [Architecture Overview](../../docs/architecture/overview.md)
- [API Contracts](../../contracts/)
