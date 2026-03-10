# 🔧 lib — Utility & API Helpers

## Mục đích

Chứa các **utility functions** và **API client** dùng chung trong toàn ứng dụng. Đây là lớp trung gian giữa components/pages và backend API.

## Cấu trúc

```
lib/
├── axios.ts    ← Axios instance cấu hình sẵn (baseURL, interceptors)
└── api.ts      ← Type-safe API wrapper (get/post/put/patch/delete)
```

## Chi tiết

### `axios.ts` — Axios Instance

Tạo một Axios instance với cấu hình mặc định:

| Config | Giá trị | Mô tả |
|--------|---------|-------|
| `baseURL` | Gateway URL (env) | Mọi request đi qua API Gateway |
| `Authorization` | `Bearer <token>` | Tự động gắn JWT từ localStorage |
| `Content-Type` | `application/json` | Default content type |

**Interceptors**:
- **Request**: Tự động thêm `Authorization: Bearer <token>` từ localStorage
- **Response**: Xử lý lỗi 401 → redirect về `/login`

### `api.ts` — Type-safe API Wrapper

Wrap Axios instance với generic methods:

```tsx
import api from '@/lib/api';

// GET request
const courses = await api.get<Course[]>('/courses');

// POST request
const newCourse = await api.post<Course>('/courses', { title: 'React 101' });

// PUT request
await api.put<Course>('/courses/123', { title: 'Updated Title' });

// DELETE request
await api.delete('/courses/123');
```

## ⚠️ Quy ước quan trọng

1. **LUÔN** dùng `api.ts` để gọi API — KHÔNG import `axios` trực tiếp
2. URL truyền vào là **relative path** (ví dụ: `/courses`, không phải `http://...`)
3. API Gateway tự động route đến đúng service dựa trên path prefix
