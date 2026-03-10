# 🌐 contexts — React Context Providers

## Mục đích

Quản lý **global state** của ứng dụng thông qua React Context API. Thay vì dùng thư viện state management bên ngoài (Redux, Zustand), dự án sử dụng Context cho MVP.

## Hiện tại

```
contexts/
└── AuthContext.tsx    ← Quản lý trạng thái xác thực toàn app
```

## `AuthContext.tsx` — Chi tiết

### State được cung cấp

| Field | Type | Mô tả |
|-------|------|-------|
| `user` | `User \| null` | Thông tin user đang đăng nhập |
| `token` | `string \| null` | JWT access token |
| `isAuthenticated` | `boolean` | `true` nếu đã đăng nhập |
| `isLoading` | `boolean` | `true` khi đang restore session |

### Actions

| Method | Mô tả |
|--------|-------|
| `login(data)` | Gọi API login → lưu token + user vào localStorage + state |
| `register(data)` | Gọi API register → tương tự login |
| `logout()` | Xóa token khỏi localStorage + reset state |

### Cách sử dụng

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  // ...
}
```

### Session Persistence

- Token và user info được lưu trong **localStorage**
- Khi mount, `AuthProvider` tự khôi phục session từ localStorage
- Logout xóa toàn bộ localStorage keys

## Quy ước thêm Context mới

1. Tạo file `<FeatureName>Context.tsx` trong thư mục này
2. Export `<FeatureName>Provider` component và `use<FeatureName>()` hook
3. Wrap Provider trong `App.tsx`
4. Dùng `useMemo` cho value object để tránh re-render
