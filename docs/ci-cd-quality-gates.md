# SageLMS CI/CD Quality Gates

Tài liệu này mô tả các quality/security gate đang áp dụng cho phần CI/CD của SageLMS, chủ yếu trong workflow `.github/workflows/ci-pr.yml` và workflow build/publish image `.github/workflows/build-publish.yml`.

Cập nhật hiện tại: PR validation chạy trên GitHub-hosted runner. Build/publish image đã mở rộng cho toàn bộ service có Dockerfile trong scope hiện tại. GitOps update, Cosign signing và post-deploy smoke test vẫn là các bước sau.

## PR Validation

Workflow:

```text
.github/workflows/ci-pr.yml
```

Trigger:

```text
pull_request vào main
types: opened, reopened, synchronize, edited, ready_for_review
```

`edited` được bật để khi sửa PR title thì job validate title có thể chạy lại.

## Gate Đang Bật

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
| Dependency scan | `dependency_scan` | Khi app/infra/docker thay đổi | Trivy filesystem scan fail |
| IaC/config scan | `checkov_infra`, `checkov_workflows` | Khi infra/platform/workflow thay đổi | Checkov finding không được xử lý |
| OpenTofu validate | `infra_validate` | Khi infra/platform/workflow thay đổi | `tofu fmt` hoặc `tofu validate` fail |
| Dockerfile lint | `dockerfile_lint` | Khi Docker-related files thay đổi | Hadolint fail |
| Dockerfile static scan | `dockerfile_checkov` | Khi Docker-related files thay đổi | Đang `soft_fail: true`, chỉ report |
| Docker build + image scan | `docker_build` | Khi image context liên quan thay đổi | `docker build` fail hoặc Trivy image scan có HIGH/CRITICAL fixed vulnerability |
| SonarCloud quality gate | `sonarcloud` | Khi `ENABLE_SONARCLOUD=true` và có thay đổi liên quan | SonarCloud scan/quality gate fail |
| Branch-protection status | `ci_status` | Mọi PR | Một job required bị `failure` hoặc `cancelled` |

## Path Filter

Path filter được tách ra file:

```text
.github/path-filters.yml
```

Filter hiện tại gồm:

```text
gateway
auth_service
course_service
content_service
challenge_service
progress_service
assessment_service
worker
frontend
infra
docker
```

Workflow tạo dynamic matrix từ các filter này. Ví dụ PR chỉ sửa `services/auth-service/**` thì chỉ chạy Maven test/package và Docker build/scan cho `auth-service`.

Docker filter bắt các file liên quan:

```text
apps/web/Dockerfile
apps/web/.dockerignore
apps/web/nginx.conf
services/*/Dockerfile
services/*/.dockerignore
infra/docker/**
scripts/docker/**
docs/docker-images.md
```

## Dockerfile Và Image Gates Trong PR

Khi Docker-related files thay đổi, PR workflow chạy:

```text
Hadolint
Checkov Dockerfile scan
Docker build
Trivy image scan
Upload Trivy image scan report
```

Trivy image scan trong PR dùng:

```text
severity: HIGH,CRITICAL
ignore-unfixed: true
exit-code: 1
```

Nghĩa là image có vulnerability HIGH/CRITICAL đã có bản fix sẽ làm PR fail. SBOM không generate trong PR để tránh artifact nặng; SBOM được generate trong workflow build/publish sau merge.

## SonarCloud

Workflow hiện dùng SonarCloud trên GitHub-hosted runner thay cho SonarQube self-hosted.

Repository variables:

```text
ENABLE_SONARCLOUD=true
SONAR_PROJECT_KEY=<sonarcloud-project-key>
SONAR_ORGANIZATION=<sonarcloud-organization-key>
```

Repository secret:

```text
SONAR_TOKEN=<sonarcloud-token>
```

Job SonarCloud compile các Java service trước khi scan và truyền:

```text
sonar.java.binaries=services/*/target/classes
```

Lý do: Sonar Java sensor cần compiled classes khi repo có file `.java`.

## OpenTofu

PR pipeline chỉ chạy validate không dùng cloud credential:

```text
tofu -chdir=infra/opentofu/envs/devsecops init -backend=false
tofu fmt -check -recursive infra/opentofu
tofu -chdir=infra/opentofu/envs/devsecops validate
```

Remote plan dùng workflow riêng `.github/workflows/infra-plan.yml`, chạy manual bằng `workflow_dispatch` và dùng GitHub Environment `devsecops-infra`.

## Build/Publish Image Sau Merge

Workflow:

```text
.github/workflows/build-publish.yml
```

Workflow này build/push image cho các service có Dockerfile đang trong scope:

```text
web
gateway
auth-service
course-service
content-service
assessment-service
challenge-service
```

`progress-service` và `worker` hiện chưa nằm trong scope build/publish image vì chưa được dùng trong luồng runtime chính. Khi hai service này sẵn sàng, chỉ cần thêm lại vào matrix của `.github/workflows/build-publish.yml`.

Mỗi image được:

```text
build
Trivy image scan
generate CycloneDX SBOM
upload SBOM artifact
push lên registry/Harbor
resolve digest
upload digest artifact
```

Image tag hiện dùng full commit SHA:

```text
<REGISTRY_HOST>/<REGISTRY_NAMESPACE>/<service>:<github.sha>
```

Ví dụ với Harbor hiện tại của nhóm:

```text
harbor.sagelm.id.vn/sagelms-app/auth-service:<github.sha>
```

Digest artifact ghi dạng:

```text
service=<service>
tagged_image=<registry>/<namespace>/<service>:<github.sha>
digest_image=<registry>/<namespace>/<service>@sha256:<digest>
```

## Evidence Cho Bảo Vệ Đồ Án

Nên lưu/chụp các bằng chứng:

- Screenshot workflow `PR Validation (Hybrid)` pass.
- Log `changes` cho thấy matrix chỉ chứa service thay đổi.
- Log `secret_scan` pass.
- Log `dependency_scan` pass.
- Log `dockerfile_lint` và `dockerfile_checkov`.
- Log `docker_build` cho thấy Docker build và Trivy image scan pass.
- Log `sonarcloud` quality gate pass nếu bật SonarCloud.
- Artifact SBOM từ `Build and Publish Images`.
- Artifact digest từ `Build and Publish Images`.

## Required Check Đề Xuất

Trong GitHub branch protection cho `main`, đặt required status check:

```text
CI Status
```

`CI Status` luôn chạy và tổng hợp failure/cancelled của các gate con, trong khi các job con có thể skip hợp lệ theo path filter.
