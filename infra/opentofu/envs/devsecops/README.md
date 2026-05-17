# SageLMS DevSecOps Environment

Environment này dựng nền cloud chính cho SageLMS trên GCP/GKE.

## Tài nguyên được tạo

- Project services/APIs cần thiết
- Custom VPC, subnet, secondary ranges, Cloud Router, Cloud NAT, Private Service Access
- GKE Standard regional cluster và node pool chính
- IAM service accounts, GitHub Workload Identity Federation, ESO Workload Identity binding
- Secret Manager skeleton
- Cloud Storage buckets cho materials/evidence
- Cloud SQL PostgreSQL 16 private IP
- Memorystore Redis 7 Standard HA private IP

## Cách chạy

Chạy bootstrap trước:

```bash
cd infra/opentofu/bootstrap
tofu apply
```

Sau đó chạy environment:

```bash
cd infra/opentofu/envs/devsecops
cp terraform.tfvars.example terraform.tfvars
tofu init
tofu fmt -recursive
tofu validate
tofu plan -out devsecops.tfplan
tofu apply devsecops.tfplan
```

## Biến bắt buộc cần chỉnh trong `terraform.tfvars`

- `github_owner`: GitHub org/user sở hữu repo, hiện dùng `daithang59`
- `master_authorized_networks`: CIDR được phép truy cập GKE control plane
- `cloud_sql_deletion_protection`: giữ `true` cho môi trường dùng chung
- `enable_cloud_sql`, `enable_managed_redis`: mặc định `true` cho baseline đồ án

## Kubeconfig

```bash
gcloud container clusters get-credentials sagelms-devsecops-gke --region asia-southeast1 --project sagelms
kubectl get nodes
```

## Secret values

OpenTofu chỉ tạo Secret Manager metadata. Thêm secret value ngoài OpenTofu:

```bash
printf '%s' '<SECRET_VALUE>' | gcloud secrets versions add sagelms-devsecops-jwt-secret --data-file=-
```

Không đưa secret value vào `terraform.tfvars`.

## Output cần bàn giao

Sau khi apply, chạy:

```bash
tofu output
```

Sau đó cập nhật `infra/opentofu/outputs.md` để Member 1/2/3 lấy thông tin tích hợp.
