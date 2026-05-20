# SageLMS CI/CD Quality Gates

Tài liệu này mô tả các quality/security gate đang áp dụng cho phần việc Member 1 trong workflow `.github/workflows/ci-pr.yml`.

## Phạm vi hiện tại

Workflow PR validation chạy khi mở Pull Request vào `main` và ưu tiên GitHub-hosted runner để không phụ thuộc SonarQube/Harbor/GKE nội bộ.

Các gate hiện đang bật:

| Gate | Job | Khi chạy | Điều kiện fail |
|---|---|---|---|
| PR title convention | `pr_title` | Mọi PR | PR title không theo Conventional Commits |
| Branch convention | `conventions_branch` | Mọi PR | Branch không theo `<type>/<slug>` hoặc không phải `dependabot/*` |
| Commit convention | `conventions_commits` | Mọi PR | Commit message trong PR không hợp lệ |
| Secret scan | `secret_scan` | Mọi PR | Gitleaks phát hiện secret/pattern nguy hiểm |
| Path filter | `changes` | Mọi PR | Không đọc được `.github/path-filters.yml` hoặc filter lỗi |
| Java tests | `test_java` | Khi service Java thay đổi | Maven test fail |
| Java package smoke | `build_java` | Khi service Java thay đổi | Maven package fail |
| Frontend lint | `lint_frontend` | Khi `apps/web/**` thay đổi | ESLint fail |
| Frontend typecheck | `typecheck_frontend` | Khi `apps/web/**` thay đổi | TypeScript fail |
| Frontend tests | `test_frontend` | Khi `apps/web/**` thay đổi | Vitest fail |
| Frontend build | `build_frontend` | Khi `apps/web/**` thay đổi | Production build fail |
| Dependency scan | `dependency_scan` | Khi app/infra/docker thay đổi | Trivy job fail |
| IaC/config scan | `checkov_infra`, `checkov_workflows` | Khi infra/platform/workflow thay đổi | Checkov finding không được xử lý hoặc allowlist |
| OpenTofu validate | `infra_validate` | Khi infra/platform/workflow thay đổi | `tofu fmt` hoặc `tofu validate` fail |
| Docker smoke build | `docker_build` | Khi service có Dockerfile thay đổi | `docker build` fail |
| SonarQube optional | `sonar_optional` | Chỉ khi `ENABLE_SONAR=true` | SonarScanner/quality gate fail |
| Branch-protection status | `ci_status` | Mọi PR | Một job required bị failure/cancelled |

## Path filter

Path filter được tách ra file `.github/path-filters.yml` để dễ review và mở rộng.

Các service Java được tách riêng:

- `gateway`
- `auth_service`
- `course_service`
- `content_service`
- `progress_service`
- `assessment_service`
- `worker`

Workflow tạo dynamic matrix từ các filter này, nên PR sửa một service chỉ chạy Maven test/package cho service đó.

## SonarQube

SonarQube đang được giữ ở chế độ optional:

- Bật bằng repository variable `ENABLE_SONAR=true`.
- Cần `SONAR_HOST_URL`, `SONAR_PROJECT_KEY` trong repository variables.
- Cần `SONAR_TOKEN` trong GitHub Secrets.
- Job chạy trên runner label `[self-hosted, devsecops, security]`.

Lý do tắt mặc định: SonarQube self-hosted thường không reachable từ GitHub-hosted runner. Khi team đã có runner cùng network với SonarQube, bật gate này mà không cần đổi workflow.

## OpenTofu

PR pipeline hiện chạy:

```text
tofu -chdir=infra/opentofu/envs/devsecops init -backend=false
tofu fmt -check -recursive infra/opentofu
tofu -chdir=infra/opentofu/envs/devsecops validate
```

`tofu plan` với remote state/GCP credentials nên đặt ở workflow riêng hoặc job protected, dùng Workload Identity Federation và GitHub Environment approval. PR validation không dùng secret cloud để tránh cấp quyền hạ tầng cho PR chưa được review.

## Evidence cho bảo vệ đồ án

Các bằng chứng cần chụp/lưu khi demo:

- Screenshot workflow `PR Validation (Hybrid)` pass.
- Log `changes` cho thấy matrix chỉ chứa service thay đổi.
- Log `secret_scan` pass.
- Log `dependency_scan` Trivy pass.
- Log `checkov_infra` hoặc `checkov_workflows` pass khi sửa infra/workflow.
- Log `infra_validate` pass khi sửa `infra/opentofu`.
- Nếu bật SonarQube: screenshot quality gate pass trong SonarQube và log `sonar_optional`.

## Required check đề xuất

Trong GitHub branch protection cho `main`, đặt required status check:

```text
CI Status
```

Các job con có thể thay đổi theo path filter, nhưng `CI Status` luôn chạy và tổng hợp failure/cancelled của các gate.
