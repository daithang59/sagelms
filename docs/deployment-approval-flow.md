# SageLMS Deployment Approval Flow

Tài liệu này mô tả luồng approval cho các thay đổi runtime/hạ tầng của SageLMS trong môi trường shared DevSecOps.

Cập nhật hiện tại: CI đã có PR validation, OpenTofu remote plan thủ công, và workflow build/publish image lên Harbor cho nhiều service. GitOps update, Cosign signing và post-deploy smoke test vẫn là các bước sau, sau khi Dockerfile và image pipeline ổn định.

## Nguyên Tắc

- PR validation không được cấp quyền deploy hoặc apply hạ tầng.
- Mọi thay đổi runtime nên đi qua GitOps manifest trong Git.
- Image deploy lên GKE phải hướng tới digest, không dùng `latest`.
- Các bước có tác động tới GKE, Harbor private hoặc GCP phải chạy trên protected branch/environment.
- Manual approval được áp dụng trước khi cập nhật runtime hoặc apply hạ tầng.

## Môi Trường Hiện Tại

Theo thông tin bàn giao hạ tầng và Harbor:

| Hạng mục | Giá trị |
|---|---|
| GCP project | `sagelms` |
| Region | `asia-southeast1` |
| GKE cluster | `sagelms-devsecops-gke` |
| Namespace workload | `sagelms-devsecops` |
| Harbor registry | `harbor.sagelm.id.vn` |
| Harbor project | `sagelms-app` |
| Kubernetes pull secret | `harbor-pull-secret` |
| GitHub Actions GSA | `sagelms-devsecops-gha-sa@sagelms.iam.gserviceaccount.com` |
| WIF provider | `projects/384858175117/locations/global/workloadIdentityPools/sagelms-devsecops-github-pool/providers/github` |

Ghi chú: pull secret `harbor-pull-secret` thuộc runtime/GKE. GitHub Actions chỉ cần robot account push trong GitHub Environment `devsecops-build`.

## Luồng PR

```text
feature branch
-> Pull Request vào main
-> PR Validation (Hybrid)
-> reviewer approve
-> merge main
```

PR validation chỉ cần quyền read và không dùng cloud secret. SonarCloud chạy trên GitHub-hosted runner nếu repository variables/secrets đã bật.

## Luồng Build/Publish Sau Merge

Workflow:

```text
.github/workflows/build-publish.yml
```

Luồng hiện tại:

```text
merge/push vào main
-> build image theo matrix service
-> Trivy image scan
-> generate CycloneDX SBOM
-> upload SBOM artifact
-> login Harbor bằng GitHub Environment devsecops-build
-> push image lên Harbor bằng full commit SHA tag
-> resolve image digest
-> upload digest artifact
```

Các service đang trong scope:

```text
web
gateway
auth-service
course-service
content-service
assessment-service
challenge-service
```

`progress-service` và `worker` chưa nằm trong scope publish/deploy hiện tại. Khi hai service này có code/runtime flow hoàn chỉnh, nhóm có thể thêm lại vào matrix build/publish và GitOps overlay.

Quy ước image tag:

```text
<REGISTRY_HOST>/<REGISTRY_NAMESPACE>/<service-name>:<github.sha>
```

Ví dụ:

```text
harbor.sagelm.id.vn/sagelms-app/auth-service:<github.sha>
```

Quy ước digest:

```text
<REGISTRY_HOST>/<REGISTRY_NAMESPACE>/<service-name>@sha256:<digest>
```

Digest artifact do workflow tạo có dạng:

```text
service=<service>
tagged_image=<registry>/<namespace>/<service>:<github.sha>
digest_image=<registry>/<namespace>/<service>@sha256:<digest>
```

## GitHub Environment `devsecops-build`

Workflow publish image dùng GitHub Environment:

```text
devsecops-build
```

Environment variables:

```text
REGISTRY_HOST=harbor.sagelm.id.vn
REGISTRY_NAMESPACE=sagelms-app
```

Environment secrets:

```text
REGISTRY_USERNAME=<harbor-push-robot-username>
REGISTRY_PASSWORD=<harbor-push-robot-token>
```

Khuyến nghị protection:

```text
Deployment branches: main only
Required reviewers: bật nếu nhóm muốn approve trước khi push image lên Harbor
```

## Luồng GitOps Update

GitOps update chưa nên tự động hóa cho đến khi Dockerfile, image scan, SBOM và digest report ổn định. Sau đó luồng mục tiêu là:

```text
image được push lên Harbor
-> resolve digest
-> tạo GitOps change cập nhật overlay bằng digest
-> mở PR hoặc chạy protected workflow
-> manual approval
-> merge GitOps change
-> FluxCD reconcile vào GKE
-> post-deploy smoke test
```

Format đề xuất trong Kustomize overlay:

```yaml
images:
  - name: harbor.sagelm.id.vn/sagelms-app/auth-service
    newName: harbor.sagelm.id.vn/sagelms-app/auth-service
    digest: sha256:abc123...
```

Hoặc nếu patch trực tiếp manifest:

```yaml
containers:
  - name: auth-service
    image: harbor.sagelm.id.vn/sagelms-app/auth-service@sha256:abc123...
```

Commit message mẫu:

```text
chore(gitops): update auth-service image to <github-sha>
```

PR description nên ghi:

```text
Service: auth-service
Git SHA: <github-sha>
Image: harbor.sagelm.id.vn/sagelms-app/auth-service@sha256:<digest>
Trivy scan: passed
SBOM: generated
Cosign signature: pending hoặc verified
```

## Cosign Signing

Cosign signing chưa nằm trong workflow hiện tại. Khi thêm signing, nên ký theo digest, không ký tag mutable:

```text
cosign sign <image>@sha256:<digest>
```

Thứ tự mục tiêu:

```text
push image
-> resolve digest
-> generate SBOM
-> sign digest bằng Cosign
-> verify signature
-> cập nhật GitOps bằng digest
```

Nếu dùng keyless signing qua GitHub OIDC, workflow cần thêm quyền:

```yaml
permissions:
  contents: read
  id-token: write
```

Nếu dùng key-based signing, cần GitHub Environment secrets:

```text
COSIGN_PRIVATE_KEY
COSIGN_PASSWORD
```

## GitHub Environment Đề Xuất

| Environment | Dùng cho | Protection |
|---|---|---|
| `devsecops-build` | Build/push Harbor, sau này sign image | Chỉ branch `main`, giới hạn secrets Harbor/Cosign |
| `devsecops-gitops` | Cập nhật overlay GitOps bằng image digest | Required reviewer |
| `devsecops-infra` | OpenTofu remote plan/apply có WIF | Required reviewer, chỉ branch `main` |

Secrets/variables nên gắn vào environment thay vì repository-wide nếu chỉ job protected cần dùng.

## OpenTofu Approval

Luồng hạ tầng nên tách khỏi PR validation:

```text
PR sửa infra/opentofu
-> PR validation: fmt, validate, Checkov
-> reviewer xem diff
-> merge main
-> protected infra workflow tạo plan với WIF
-> manual approval
-> tofu apply nếu nhóm bật apply sau này
```

Không chạy `tofu apply` từ Pull Request. Không cấp quyền đọc remote state hoặc quyền GCP cho PR từ branch chưa được bảo vệ.

Workflow `.github/workflows/infra-plan.yml` tách thành hai lớp:

| Job | Trigger | Quyền cloud | Mục đích |
|---|---|---|---|
| `validate` | Pull Request hoặc manual | Không | `tofu init -backend=false`, `tofu fmt`, `tofu validate` |
| `checkov` | Pull Request hoặc manual | Không | Scan static OpenTofu bằng Checkov |
| `plan` | `workflow_dispatch` | Có, qua GitHub Environment `devsecops-infra` | Tạo remote plan với GCS backend |

`workflow_dispatch` không nhận input để tuân thủ Checkov rule `CKV_GHA_7`. Khi chạy manual workflow này, job `plan` sẽ chạy sau khi `validate` và `checkov` pass.

Environment `devsecops-infra` cần các biến:

```text
GCP_WORKLOAD_IDENTITY_PROVIDER=projects/384858175117/locations/global/workloadIdentityPools/sagelms-devsecops-github-pool/providers/github
GCP_SERVICE_ACCOUNT=sagelms-devsecops-gha-sa@sagelms.iam.gserviceaccount.com
TF_VAR_GITHUB_OWNER=daithang59
```

Optional secret:

```text
TOFU_TFVARS=<nội dung HCL an toàn>
```

Không đưa secret value thật vào `TOFU_TFVARS`.

## Post-Deploy Smoke Test

Sau khi FluxCD deploy, workflow hoặc runbook cần kiểm tra:

- Flux/Kustomization reconcile thành công.
- Deployment rollout complete trong namespace `sagelms-devsecops`.
- Endpoint health trả về thành công.
- Không có pod `CrashLoopBackOff` hoặc rollout stuck.

Post-deploy smoke test để sau khi GitOps/FluxCD flow hoàn chỉnh.

## Rollback

Rollback runtime bằng Git:

```text
revert GitOps commit
-> FluxCD reconcile digest cũ
-> kiểm tra rollout
-> chạy smoke test
```

Rollback hạ tầng phải có plan rõ ràng và approval riêng. Không dùng workflow tự động để destroy tài nguyên shared DevSecOps nếu chưa có review.
