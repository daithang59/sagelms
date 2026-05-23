# Modules

Thư mục này chứa các module OpenTofu tái sử dụng cho môi trường `devsecops`.

## Danh sách module

| Module | Mục đích |
|---|---|
| `project-services` | Bật các Google Cloud APIs cần thiết |
| `network` | Tạo VPC, subnet, secondary ranges, NAT và Private Service Access |
| `gke` | Tạo GKE Standard regional cluster và node pool |
| `iam` | Tạo service accounts, GitHub WIF, ESO Workload Identity binding |
| `secret-manager` | Tạo Secret Manager metadata và IAM cho ESO đọc secret |
| `storage` | Tạo non-state GCS buckets cho app/demo/evidence |
| `cnpg-backup` | Tạo GCS bucket, GSA và Workload Identity cho CloudNativePG backup/WAL |
| `harbor-registry-storage` | Tạo GCS bucket, GSA và Workload Identity cho Harbor registry blobs |
| `redis` | Tạo Memorystore Redis 7 Standard HA private IP |

## Quy tắc thiết kế

- Module không tự đọc `terraform.tfvars`.
- Module nhận input qua `variables.tf` và trả output qua `outputs.tf`.
- Module không chứa backend config.
- Module không hardcode secret value.
- Module không tạo state bucket; state bucket thuộc `bootstrap/`.

## Cách dùng

Module được gọi từ `envs/devsecops/main.tf`. Không chạy `tofu apply` trực tiếp trong thư mục module.
