# 🤖 .github — GitHub Configuration

## Mục đích

Cấu hình **GitHub-specific**: CI/CD pipelines, issue templates, PR templates, code owners, và dependency management.

## Cấu trúc

```
.github/
├── CODEOWNERS                     ← Quy định owner của từng thư mục
├── dependabot.yml                 ← Tự động cập nhật dependencies
├── PULL_REQUEST_TEMPLATE.md       ← Template khi tạo Pull Request
├── ISSUE_TEMPLATE/                ← Templates cho Issues
│   ├── bug_report.md              ← Template báo lỗi
│   └── feature_request.md         ← Template yêu cầu tính năng
└── workflows/                     ← GitHub Actions CI/CD
    └── ci-pr.yml                  ← CI pipeline chạy khi mở PR
```

## Chi tiết từng phần

### `CODEOWNERS`

Xác định **ai review** code ở thư mục nào. GitHub tự gán reviewer khi mở PR.

### `PULL_REQUEST_TEMPLATE.md`

Template mặc định khi tạo PR — nhắc nhở developer viết mô tả, checklist, và liên kết issue.

### `ISSUE_TEMPLATE/`

| File | Mô tả |
|------|-------|
| `bug_report.md` | Form báo bug: steps to reproduce, expected vs actual |
| `feature_request.md` | Form yêu cầu tính năng: mô tả, lý do, giải pháp đề xuất |

### `dependabot.yml`

Tự động tạo PR cập nhật dependencies khi có phiên bản mới.

### `workflows/ci-pr.yml` — CI Pipeline

Pipeline **chạy tự động mỗi khi PR vào `main`**:

| Job | Mô tả | Luôn chạy? |
|-----|-------|-----------|
| `secret_scan` | Quét secrets bằng Gitleaks | ✅ |
| `pr_title` | Kiểm tra PR title theo Conventional Commits | ✅ |
| `conventions_branch` | Kiểm tra branch naming (`feat/`, `fix/`, ...) | ✅ |
| `conventions_commits` | Lint commit messages | ✅ |
| `changes` | Phát hiện thư mục nào thay đổi (path filter) | ✅ |
| `test_java` | Chạy Maven tests cho Java services (matrix) | Nếu Java thay đổi |
| `test_frontend` | `npm test` cho frontend | Nếu frontend thay đổi |
| `test_python` | `pytest` cho AI Tutor service | Nếu Python thay đổi |

**Smart filtering**: Chỉ chạy tests cho services bị thay đổi, tiết kiệm thời gian CI.

## Lưu ý cho team

- **PR title** phải theo format: `feat: add course CRUD`, `fix: login error`
- **Branch** phải theo format: `feat/course-crud`, `fix/login-bug`
- **Commits** phải theo [Conventional Commits](https://www.conventionalcommits.org/)
- CI sẽ **block merge** nếu bất kỳ check nào fail
