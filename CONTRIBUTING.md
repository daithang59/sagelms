# 🤝 Contributing to SageLMS

Cảm ơn bạn đã quan tâm đóng góp cho SageLMS! Dưới đây là quy ước để mọi người cùng làm việc hiệu quả.

---

## 📌 Quy ước chung

- Đọc kỹ [README.md](./README.md) trước khi bắt đầu.
- Không commit trực tiếp vào `main` hoặc `develop`.
- Mọi thay đổi đều phải qua **Pull Request (PR)**.

---

## 🌿 Branch Naming

| Loại | Prefix | Ví dụ |
|------|--------|-------|
| Feature mới | `feat/` | `feat/add-quiz-module` |
| Sửa lỗi | `fix/` | `fix/login-redirect-loop` |
| Chore / refactor | `chore/` | `chore/upgrade-springboot` |
| Tài liệu | `docs/` | `docs/api-swagger-spec` |
| Hotfix (prod) | `hotfix/` | `hotfix/payment-null-pointer` |

---

## ✍️ Commit Convention

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

feat(auth): add Google OAuth login
fix(course): handle null syllabus field
chore(deps): bump spring-boot to 3.3.0
docs(readme): update docker instructions
```

**Types:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `ci`, `perf`

---

## 🔄 Pull Request Workflow

1. **Tạo branch** từ `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/your-feature
   ```

2. **Code & commit** theo convention ở trên.

3. **Push & mở PR** vào `develop`:
   ```bash
   git push origin feat/your-feature
   ```

4. **Điền PR template** (xem bên dưới).

5. **Chờ review** — ít nhất 1 approval + CI pipeline xanh.

6. **Merge** bằng **Squash and Merge** (giữ history sạch).

---

## 📋 PR Checklist

Khi mở PR, hãy đảm bảo:

- [ ] Branch name đúng convention (`feat/`, `fix/`, …)
- [ ] Commit messages đúng Conventional Commits
- [ ] Code build thành công (`mvn verify` / `npm run build`)
- [ ] Đã viết / cập nhật unit tests (nếu cần)
- [ ] Không commit file `.env`, secret, hay credentials
- [ ] Đã cập nhật docs / README nếu thay đổi API
- [ ] Đã self-review code trước khi request review

---

## 🧪 Chạy Tests

```bash
# Java (Spring Boot)
mvn test

# Node.js (NestJS)
npm run test

# Python (FastAPI)
pytest
```

---

## 💬 Cần hỗ trợ?

- Mở [GitHub Issue](../../issues) nếu gặp bug hoặc muốn đề xuất feature.
- Liên hệ team lead qua Slack / Discord channel của dự án.
