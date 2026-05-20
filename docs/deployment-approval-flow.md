# SageLMS Deployment Approval Flow

Tài liệu này mô tả luồng approval cho các thay đổi runtime/hạ tầng của SageLMS trong môi trường shared DevSecOps.

## Nguyên tắc

- PR validation không được cấp quyền deploy hoặc apply hạ tầng.
- Mọi thay đổi runtime phải đi qua GitOps manifest trong Git.
- Image deploy lên GKE phải dùng digest, không dùng `latest`.
- Các bước có tác động tới GKE, Harbor private hoặc GCP phải chạy trên protected branch/environment.
- Manual approval được áp dụng trước khi cập nhật runtime hoặc apply hạ tầng.

## Môi trường hiện tại

Theo file bàn giao `docs/outputs.pdf`:

| Hạng mục | Giá trị |
|---|---|
| GCP project | `sagelms` |
| Region | `asia-southeast1` |
| GKE cluster | `sagelms-devsecops-gke` |
| Namespace workload | `sagelms-devsecops` |
| GitHub Actions GSA | `sagelms-devsecops-gha-sa@sagelms.iam.gserviceaccount.com` |
| WIF provider | `projects/384858175117/locations/global/workloadIdentityPools/sagelms-devsecops-github-pool/providers/github` |
| Deploy branch được WIF cho phép | `refs/heads/main` |

## Luồng PR

```text
feature branch
-> Pull Request vào main
-> PR Validation (Hybrid)
-> reviewer approve
-> merge main
```

PR chỉ cần quyền read và không dùng cloud secret. SonarQube chỉ bật khi có self-hosted runner cùng network.

## Luồng build/publish sau merge

Luồng này phối hợp với Member 2:

```text
main
-> detect changed service
-> build image
-> Trivy image scan
-> generate SBOM
-> sign digest bằng Cosign
-> push Harbor
-> resolve image digest
```

Quy ước image:

```text
<harbor-domain>/sagelms-app/<service-name>:<git-sha>
<harbor-domain>/sagelms-app/<service-name>@sha256:<digest>
```

## Luồng GitOps update

Sau khi image đã có digest và scan/sign pass:

```text
create GitOps change
-> update deploy/overlays/devsecops/kustomization.yaml
-> open PR hoặc dùng protected workflow
-> manual approval
-> merge GitOps change
-> FluxCD reconcile vào GKE
-> post-deploy smoke test
```

Format đề xuất trong `deploy/overlays/devsecops/kustomization.yaml`:

```yaml
images:
  - name: harbor.sagelms.dev/sagelms-app/auth-service
    newName: harbor.sagelms.dev/sagelms-app/auth-service
    digest: sha256:abc123...
```

Commit message mẫu:

```text
chore(gitops): update auth-service image to 9f3a1c2
```

## GitHub Environment đề xuất

Tạo environment:

| Environment | Dùng cho | Protection |
|---|---|---|
| `devsecops-build` | Build/push Harbor, sign image | Chỉ branch `main`, giới hạn secrets Harbor/Cosign |
| `devsecops-gitops` | Cập nhật overlay `deploy/overlays/devsecops` | Required reviewer |
| `devsecops-infra` | OpenTofu plan/apply có WIF | Required reviewer, chỉ branch `main` |

Secrets/variables nên gắn vào environment thay vì repository-wide nếu chỉ job protected cần dùng.

## OpenTofu approval

Luồng hạ tầng nên tách khỏi PR validation:

```text
PR sửa infra/opentofu
-> PR validation: fmt, validate, Checkov
-> reviewer xem diff
-> merge main
-> protected infra workflow tạo plan với WIF
-> manual approval
-> tofu apply
```

Không chạy `tofu apply` từ Pull Request. Không cấp quyền đọc remote state hoặc quyền GCP cho PR từ branch chưa được bảo vệ.

## Post-deploy smoke test

Sau khi FluxCD deploy, workflow hoặc runbook cần kiểm tra:

- Flux/Kustomization reconcile thành công.
- Deployment rollout complete trong namespace `sagelms-devsecops`.
- Endpoint health của `auth-service` trả về thành công.
- Không có pod `CrashLoopBackOff` hoặc rollout stuck.

## Rollback

Rollback runtime bằng Git:

```text
revert GitOps commit
-> FluxCD reconcile digest cũ
-> kiểm tra rollout
-> chạy smoke test
```

Rollback hạ tầng phải có plan rõ ràng và approval riêng. Không dùng workflow tự động để destroy tài nguyên shared DevSecOps nếu chưa có review.
