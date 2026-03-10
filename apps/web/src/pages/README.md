# 📄 pages — Page-level Components

## Mục đích

Mỗi **route** trong ứng dụng tương ứng với một page component. Đây là nơi chứa giao diện và logic nghiệp vụ của từng trang.

## Cấu trúc

```
pages/
├── NotFoundPage.tsx          ← Trang 404 (catch-all route)
├── auth/                     ← Trang xác thực (public)
│   ├── LoginPage.tsx         ← Form đăng nhập
│   └── RegisterPage.tsx      ← Form đăng ký tài khoản
├── dashboard/                ← Tổng quan sau khi đăng nhập
│   └── DashboardPage.tsx     ← Thống kê, khóa học gần đây
├── courses/                  ← Quản lý khoá học
│   └── CoursesPage.tsx       ← Danh sách khoá học, search, filter
├── assessment/               ← Bài kiểm tra
│   └── QuizzesPage.tsx       ← Danh sách quiz, làm bài
└── ai-tutor/                 ← AI Tutor chatbot
    └── AiTutorPage.tsx       ← Giao diện chat với AI
```

## Mapping Routes → Pages

| Route | Page Component | Layout | Auth |
|-------|---------------|--------|------|
| `/login` | `LoginPage` | `AuthLayout` | ❌ Public |
| `/register` | `RegisterPage` | `AuthLayout` | ❌ Public |
| `/dashboard` | `DashboardPage` | `DashboardLayout` | ✅ Protected |
| `/courses` | `CoursesPage` | `DashboardLayout` | ✅ Protected |
| `/quizzes` | `QuizzesPage` | `DashboardLayout` | ✅ Protected |
| `/ai-tutor` | `AiTutorPage` | `DashboardLayout` | ✅ Protected |
| `*` | `NotFoundPage` | — | ❌ |

## Quy ước tạo page mới

1. **Tạo folder** theo tên feature: `pages/<feature-name>/`
2. **Tạo file** page: `<FeatureName>Page.tsx`
3. **Thêm route** trong `App.tsx`:
   ```tsx
   import NewPage from '@/pages/new-feature/NewPage';
   // Trong Routes:
   <Route path="/new-feature" element={<NewPage />} />
   ```
4. Page **KHÔNG chứa** layout — layout xử lý bởi `layouts/`
5. Page có thể gọi API qua `lib/api.ts` và dùng components từ `components/ui/`
