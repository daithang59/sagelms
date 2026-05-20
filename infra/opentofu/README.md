# SageLMS OpenTofu Infrastructure

Thư mục này chứa toàn bộ IaC bằng OpenTofu để dựng nền GCP/GKE cho môi trường DevSecOps của SageLMS.

## Cấu trúc

```text
bootstrap/          # Bootstrap remote state và IaC service account
envs/               # Các môi trường triển khai
envs/devsecops/     # Môi trường cloud chính của đồ án
modules/            # Module OpenTofu tái sử dụng
outputs.md          # File handoff giá trị sau khi apply
```

## Luồng triển khai

1. Chạy `bootstrap/` trước để tạo GCS remote state bucket và IaC service account.
2. Chạy `envs/devsecops/` để tạo project services, VPC, GKE, IAM/WIF, Secret Manager, Cloud SQL, Redis và storage buckets.
3. Cập nhật `outputs.md` sau khi apply thành công để bàn giao cho các thành viên khác.

Runbook thao tác thủ công, tạm dừng chi phí, destroy và tạo lại tài nguyên nằm tại `docs/runbooks/devsecops-cloud-iac-manual-operations.md`.

## Công cụ cần có

- OpenTofu `>= 1.6.0`
- Google Cloud SDK
- `kubectl`
- Checkov
- Quyền GCP đủ để tạo IAM, network, GKE, Cloud SQL, Redis, Secret Manager và GCS trong project `sagelms`

## Lệnh kiểm tra chung

```bash
tofu fmt -recursive infra/opentofu
checkov -d infra/opentofu
```

Chạy `tofu validate` trong từng stack cụ thể:

```bash
cd infra/opentofu/bootstrap
tofu validate

cd ../envs/devsecops
tofu validate
```

## Lưu ý bảo mật

- Không commit `terraform.tfvars`, `*.tfvars`, `*.tfplan`, state files hoặc file local chứa secret.
- OpenTofu chỉ tạo Secret Manager metadata; secret value thật phải nhập ngoài OpenTofu.
- Cloud SQL user/password không được tạo bằng OpenTofu nếu không chấp nhận việc password đi vào state.
- Redis AUTH string là sensitive; hạn chế quyền đọc remote state bucket.
