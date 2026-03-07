# 🤝 Working Agreements — SageLMS

## Definition of Done (DoD)

Một task/story được coi là **Done** khi:

- [ ] Code đã được review & merge vào `develop`
- [ ] CI pipeline pass (lint, test, secret scan)
- [ ] Unit tests cover logic mới (nếu có)
- [ ] API endpoint có OpenAPI spec cập nhật
- [ ] Database migration đã tạo (nếu thay đổi schema)
- [ ] README / docs đã cập nhật (nếu thay đổi API hoặc config)
- [ ] Không có TODO/FIXME bỏ lại mà không có issue tracker

---

## PR Guidelines

### Kích thước PR

| Size | Lines changed | Guideline |
|------|--------------|-----------|
| 🟢 Small | < 200 | Ideal — review nhanh |
| 🟡 Medium | 200–500 | OK — chia nếu được |
| 🔴 Large | > 500 | Nên tách thành nhiều PR |

> **Rule of thumb:** 1 PR = 1 feature/fix. Không mix nhiều mục đích trong 1 PR.

### Review SLA

| Priority | Response time |
|----------|-------------|
| 🔴 Hotfix | < 2 giờ |
| 🟡 Feature PR | < 24 giờ |
| 🟢 Docs/chore | < 48 giờ |

---

## Branch Naming

```
feat/<short-description>     ← Tính năng mới
fix/<short-description>      ← Sửa lỗi
chore/<short-description>    ← Refactor, deps, config
docs/<short-description>     ← Tài liệu
hotfix/<short-description>   ← Fix khẩn cấp trên prod
```

---

## Commit Convention

Sử dụng [**Conventional Commits**](https://www.conventionalcommits.org/):

```
<type>(<scope>): <message>

Ví dụ:
feat(auth): add JWT refresh token endpoint
fix(course): handle null instructor_id
chore(ci): add path-filter to workflow
```

---

## Merge Strategy

- **Squash and Merge** vào `develop` (giữ history sạch)
- **Merge commit** từ `develop` vào `main` (khi release)

---

## Code Review Checklist

Reviewer nên kiểm tra:

- [ ] Logic đúng, không có edge case bị bỏ qua
- [ ] Tên biến/hàm rõ ràng, dễ hiểu
- [ ] Không có hardcoded secrets/credentials
- [ ] Error handling đầy đủ
- [ ] Tests cover happy path + error path
- [ ] Không duplicate code (DRY)
- [ ] Performance: không N+1 query, không load toàn bộ data

---

## Daily Standups

- **Thời gian:** 9:00 AM (15 phút)
- **Format:** What I did / What I'll do / Blockers
- **Channel:** Slack/Discord dự án
