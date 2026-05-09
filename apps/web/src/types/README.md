# 📝 types — TypeScript Type Definitions

## Mục đích

Tập trung các **TypeScript interfaces và types** dùng chung trong ứng dụng. Giúp đảm bảo type safety khi gọi API và truyền data giữa components.

## Cấu trúc hiện tại

```
types/
└── auth.ts    ← Types liên quan đến Authentication
```

## `auth.ts` — Chi tiết

| Type/Interface | Mô tả |
|---|---|
| `UserRole` | Union type: `'ADMIN' \| 'INSTRUCTOR' \| 'STUDENT'` |
| `User` | Thông tin user: `id`, `email`, `fullName`, `role`, `createdAt` |
| `LoginRequest` | Body gửi lên API login: `email`, `password` |
| `RegisterRequest` | Body gửi lên API register: `email`, `password`, `fullName` |
| `AuthResponse` | Response từ API: `accessToken`, `refreshToken`, `user` |

## Quy ước thêm types mới

1. **Tạo file** theo tên feature: `types/<feature>.ts`
   - Ví dụ: `types/course.ts`, `types/assessment.ts`
2. **Đặt tên**: PascalCase cho interfaces, UPPERCASE cho enums
3. **Export**: Named exports (không dùng default export)
4. Types phải khớp với **API contract** (xem `contracts/openapi/`)

## Dự kiến bổ sung

```
types/
├── auth.ts           ← ✅ Hiện có
├── course.ts         ← Course, Enrollment, CourseStatus
├── content.ts        ← Lesson, ContentType
├── assessment.ts     ← Quiz, Question, Attempt, Choice
├── progress.ts       ← LessonProgress, ProgressStatus
└── ai-tutor.ts       ← AskRequest, AskResponse, Job
```
