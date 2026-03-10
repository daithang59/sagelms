# 🖼 layouts — Layout Wrappers

## Mục đích

Chứa các **layout components** định nghĩa khung giao diện chung cho nhóm pages. Sử dụng React Router `<Outlet />` để render page con bên trong layout.

## Cấu trúc

```
layouts/
├── AuthLayout.tsx        ← Layout cho trang Login/Register
└── DashboardLayout.tsx   ← Layout cho các trang sau khi đăng nhập
```

## Chi tiết

### `AuthLayout.tsx`

- **Dùng cho**: `/login`, `/register`
- **Giao diện**: Layout tối giản, trung tâm — chỉ hiển thị form
- **Không có**: Header, Sidebar (chưa đăng nhập)
- **Chứa**: `<Outlet />` để render LoginPage hoặc RegisterPage

### `DashboardLayout.tsx`

- **Dùng cho**: `/dashboard`, `/courses`, `/quizzes`, `/ai-tutor`
- **Giao diện**: Layout đầy đủ với Header + Sidebar + Main content
- **Cấu trúc UI**:
  ```
  ┌──────────────────────────────────┐
  │           Header                 │
  ├──────────┬───────────────────────┤
  │          │                       │
  │ Sidebar  │    <Outlet />         │
  │          │    (Page content)     │
  │          │                       │
  └──────────┴───────────────────────┘
  ```
- **Chứa**: `<Header />`, `<Sidebar />`, `<Outlet />`

## Cách sử dụng trong `App.tsx`

```tsx
<Route element={<AuthLayout />}>
  <Route path="/login" element={<LoginPage />} />
</Route>

<Route element={<DashboardLayout />}>
  <Route path="/dashboard" element={<DashboardPage />} />
</Route>
```

## Quy ước thêm layout mới

1. Tạo file `<Name>Layout.tsx` trong thư mục này
2. Sử dụng `<Outlet />` từ `react-router-dom` để render page con
3. Wrap Route group tương ứng trong `App.tsx`
