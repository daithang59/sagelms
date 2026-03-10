# 🧩 components — Shared React Components

## Mục đích

Chứa các **React components dùng chung** xuyên suốt ứng dụng. Không chứa business logic cụ thể — chỉ UI và behavior tái sử dụng.

## Cấu trúc

```
components/
├── ProtectedRoute.tsx   ← Guard component: redirect về /login nếu chưa auth
├── layout/              ← Khung giao diện chính (Header, Sidebar)
│   ├── Header.tsx       ← Top bar: logo, user menu, navigation links
│   └── Sidebar.tsx      ← Side navigation: menu items theo role
└── ui/                  ← UI primitives tái sử dụng
    ├── Button.tsx       ← Nút bấm (variants: primary, secondary, danger, ghost)
    ├── Input.tsx        ← Input field có label, error, icon
    ├── Card.tsx         ← Card container
    ├── Badge.tsx        ← Badge hiển thị status/tag
    ├── Loading.tsx      ← Loading spinner/skeleton
    ├── Modal.tsx        ← Dialog/modal overlay
    └── index.ts         ← Barrel export tất cả UI components
```

## Chi tiết từng phần

### `ProtectedRoute.tsx`

- **Vai trò**: Higher-Order Component (HOC) bọc các routes cần đăng nhập.
- **Cơ chế**: Kiểm tra `isAuthenticated` từ `AuthContext`. Nếu chưa login → redirect `/login`.
- **Sử dụng**: Wrap trong `App.tsx` cho các route group cần bảo vệ.

### `layout/` — Layout Components

Components tạo **khung giao diện chính** sau khi đăng nhập:

| File | Chức năng |
|------|-----------|
| `Header.tsx` | Top navigation bar: logo, tên user, avatar, nút logout |
| `Sidebar.tsx` | Side menu trái: navigation links (Dashboard, Courses, Quizzes, AI Tutor) |

### `ui/` — UI Primitives

Thư viện components cơ bản, được thiết kế để **tái sử dụng** ở mọi nơi trong app:

| Component | Props chính | Mô tả |
|-----------|-------------|-------|
| `Button` | `variant`, `size`, `loading`, `disabled` | Nút bấm với nhiều style |
| `Input` | `label`, `error`, `icon`, `type` | Input field có validation |
| `Card` | `title`, `children`, `className` | Container dạng thẻ |
| `Badge` | `variant`, `children` | Label nhỏ hiển thị trạng thái |
| `Loading` | `size`, `fullScreen` | Spinner/skeleton loading |
| `Modal` | `isOpen`, `onClose`, `title` | Dialog overlay |

**Import**: Sử dụng barrel export từ `ui/index.ts`:
```tsx
import { Button, Input, Card } from '@/components/ui';
```

## Quy ước thêm component mới

1. **UI component** → Tạo trong `ui/`, export qua `ui/index.ts`
2. **Layout component** → Tạo trong `layout/`
3. **Feature guard** → Tạo cùng cấp (như `ProtectedRoute.tsx`)
4. Component phải có **TypeScript props interface** rõ ràng
5. Hỗ trợ `className` prop để cho phép custom styling
