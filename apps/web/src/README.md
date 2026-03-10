# 📂 apps/web/src — Mã nguồn Frontend

## Mục đích

Chứa toàn bộ mã nguồn **React + TypeScript** của ứng dụng web SageLMS.

## Cấu trúc thư mục

```
src/
├── main.tsx            ← Entry point: render App vào DOM
├── App.tsx             ← Root component: định nghĩa Routes + AuthProvider
├── index.css           ← Global CSS (Tailwind directives)
├── vite-env.d.ts       ← Type declarations cho Vite
│
├── components/         ← Shared components dùng lại xuyên suốt app
│   ├── layout/         ← Header, Sidebar (khung chung của app)
│   ├── ui/             ← UI primitives: Button, Input, Card, Modal, ...
│   └── ProtectedRoute.tsx  ← HOC bảo vệ routes cần đăng nhập
│
├── pages/              ← Page-level components (mỗi route = 1 page)
│   ├── auth/           ← LoginPage, RegisterPage
│   ├── dashboard/      ← DashboardPage
│   ├── courses/        ← CoursesPage
│   ├── assessment/     ← QuizzesPage
│   ├── ai-tutor/       ← AiTutorPage
│   └── NotFoundPage.tsx← Trang 404
│
├── layouts/            ← Layout wrappers (Outlet-based)
│   ├── AuthLayout.tsx  ← Layout cho trang Login/Register
│   └── DashboardLayout.tsx ← Layout cho trang sau khi đăng nhập
│
├── contexts/           ← React Contexts (global state)
│   └── AuthContext.tsx ← Auth state: user, token, login/register/logout
│
├── lib/                ← Utility & API helpers
│   ├── axios.ts        ← Axios instance (baseURL, interceptors)
│   └── api.ts          ← Type-safe API wrapper (get/post/put/delete)
│
├── types/              ← TypeScript type definitions
│   └── auth.ts         ← User, LoginRequest, RegisterRequest, AuthResponse
│
└── test/               ← Test files & setup
    ├── setup.ts        ← Vitest setup (import testing-library)
    └── App.test.tsx    ← Smoke test cho App component
```

## Luồng hoạt động chính

```
main.tsx → BrowserRouter → App.tsx
  ├── AuthLayout (public)
  │   ├── /login  → LoginPage
  │   └── /register → RegisterPage
  │
  └── ProtectedRoute → DashboardLayout (private)
      ├── /dashboard → DashboardPage
      ├── /courses   → CoursesPage
      ├── /quizzes   → QuizzesPage
      └── /ai-tutor  → AiTutorPage
```

## Quy ước khi phát triển

| Quy tắc | Chi tiết |
|---------|----------|
| **Tạo page mới** | Tạo folder trong `pages/<feature>/`, thêm route trong `App.tsx` |
| **Tạo component** | UI primitives → `components/ui/`, Layout → `components/layout/` |
| **Thêm API call** | Dùng `lib/api.ts` (type-safe), KHÔNG gọi axios trực tiếp |
| **Thêm type mới** | Tạo file tương ứng trong `types/` |
| **Global state** | Tạo Context trong `contexts/`, wrap trong `App.tsx` |
| **Naming** | PascalCase cho components, camelCase cho functions/variables |
