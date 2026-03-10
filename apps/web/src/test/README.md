# 🧪 test — Test Files & Configuration

## Mục đích

Chứa **test setup** và **test files** cho ứng dụng frontend.

## Cấu trúc

```
test/
├── setup.ts         ← Vitest global setup (import @testing-library/jest-dom)
└── App.test.tsx     ← Smoke test cho App component
```

## Công cụ testing

| Tool | Vai trò |
|------|---------|
| **Vitest** | Test runner (tương thích Vite, nhanh hơn Jest) |
| **React Testing Library** | Render components, tương tác DOM |
| **@testing-library/jest-dom** | Custom matchers (toBeInTheDocument, ...) |

## Chạy tests

```bash
cd apps/web

# Watch mode (development)
npm test

# CI mode (chạy 1 lần, exit)
npm test -- --run
```

## Quy ước viết test

1. **Đặt test file** cùng thư mục với file được test, hoặc trong `test/`
2. **Naming**: `<ComponentName>.test.tsx` hoặc `<module>.test.ts`
3. **Pattern**: Arrange → Act → Assert
4. Ưu tiên test **behavior** (user interaction) hơn implementation detail
5. Mock API calls bằng `vi.mock()` hoặc MSW (nếu cần)

## Ví dụ test cơ bản

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```
