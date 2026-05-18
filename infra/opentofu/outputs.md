# Thông Tin Bàn Giao Hạ Tầng SageLMS DevSecOps

Cập nhật lần cuối: 2026-05-18, Asia/Saigon.

File này chứa các thông tin bàn giao an toàn cho Thành viên 1, Thành viên 2 và Thành viên 3. Không thêm secret value thật vào file này.

## GCP

- Tên project: `SageLMS`
- Project ID: `sagelms`
- Project number: `384858175117`
- Môi trường: `devsecops`
- Region: `asia-southeast1`
- Prefix đặt tên tài nguyên: `sagelms-devsecops`

## State Từ Xa

- Bucket lưu state: `sagelms-devsecops-tofu-state`
- Location: `ASIA-SOUTHEAST1`
- Versioning: đã bật
- Uniform bucket-level access: đã bật
- Public access prevention: enforced

## GKE

- Tên cluster: `sagelms-devsecops-gke`
- Vị trí cluster: `asia-southeast1`
- Kiểu cluster: GKE Standard regional
- Node pool theo cấu hình OpenTofu: `sagelms-devsecops-main-pool`
- Node locations: `asia-southeast1-b`, `asia-southeast1-c`
- Số node Ready hiện tại: 0
- Trạng thái node pool hiện tại: đã xóa tạm thời để tiết kiệm compute; OpenTofu plan hiện sẽ tạo lại node pool khi cần chạy workload
- Machine type: `e2-standard-4`
- Disk: `pd-balanced`, 50 GB
- Private nodes: đã bật
- Workload Identity pool: `sagelms.svc.id.goog`
- Master authorized networks: IP `/32` của máy leader trong file `terraform.tfvars` local, file này đang được `.gitignore`

Lấy credentials cho Kubernetes:

```bash
gcloud container clusters get-credentials sagelms-devsecops-gke --region asia-southeast1 --project sagelms
```

Ghi chú cho Windows:

```powershell
$env:Path = "C:\Users\THANG\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin;" + $env:Path
```

## Mạng

- VPC: `sagelms-devsecops-vpc`
- Subnet: `sagelms-devsecops-subnet`
- Primary subnet CIDR: `10.10.0.0/20`
- Secondary range cho Pods: `pods` / `10.20.0.0/16`
- Secondary range cho Services: `services` / `10.30.0.0/20`
- Reserved range cho Private Service Access: `sagelms-devsecops-psa-range`
- Cloud NAT: `sagelms-devsecops-nat`

## CloudNativePG PostgreSQL

- Baseline database hiện tại: CloudNativePG trên GKE, PostgreSQL 16.
- Cloud SQL cũ `sagelms-devsecops-postgres`: đã xóa khỏi project vì cloud chưa có dữ liệu cần migrate.
- OpenTofu hiện không còn tạo Cloud SQL module hoặc output Cloud SQL.
- Cloud SQL Admin API `sqladmin.googleapis.com`: đã disable khỏi project.
- Namespace operator: `cnpg-system`
- Namespace database: `sagelms-data`
- Cluster CR dự kiến: `sagelms-postgres`
- Database: `sagelms`
- App user MVP: `sagelms_app`
- RW service dự kiến: `sagelms-postgres-rw.sagelms-data.svc.cluster.local:5432`
- Runtime CloudNativePG chưa deploy vì node pool đang bị xóa tạm thời.

CloudNativePG backup foundation đã apply:

- Backup bucket: `gs://sagelms-cnpg-backup-sagelms`
- Object store destination path: `gs://sagelms-cnpg-backup-sagelms/sagelms-postgres`
- Bucket location: `ASIA-SOUTHEAST1`
- Versioning: đã bật
- Lifecycle retention: xóa object cũ sau 30 ngày
- Uniform bucket-level access: đã bật
- Public access prevention: enforced
- Backup GSA: `sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com`
- Backup KSA dự kiến: `sagelms-data/sagelms-postgres`
- Workload Identity member: `serviceAccount:sagelms.svc.id.goog[sagelms-data/sagelms-postgres]`

## Memorystore Redis

- Instance: `sagelms-devsecops-redis`
- Version: `REDIS_7_0`
- Tier: `STANDARD_HA`
- Trạng thái: `READY`
- Host: `10.204.0.4`
- Port: `6378`
- AUTH: đã bật
- Transit encryption: `SERVER_AUTHENTICATION`

Runtime client phải dùng TLS. Smoke test đã chạy được với `redis-cli --tls --insecure`; application client cần cấu hình TLS/trust-store tương ứng.

## Cloud Storage

- Evidence bucket: `sagelms-devsecops-evidence`
- Materials bucket: `sagelms-devsecops-materials`

Cả hai bucket đều được OpenTofu quản lý, đã bật uniform bucket-level access, versioning và public access prevention.

## Namespaces

- `sagelms-devsecops`
- `platform-system`
- `cnpg-system`
- `sagelms-data`
- `harbor`
- `monitoring`

## Platform Controllers

- Namespace của External Secrets Operator: `platform-system`
- ESO KSA: `platform-system/external-secrets`
- ESO GSA: `sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com`
- Annotation trên ESO KSA: `iam.gke.io/gcp-service-account=sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com`
- ClusterSecretStore: `gcpsm-sagelms-devsecops`
- Trạng thái ClusterSecretStore object: `Valid`, `Ready=True`
- Lưu ý: khi node pool đang bị xóa, ESO controller/webhook không có pod chạy; cần tạo lại node pool trước khi apply ExternalSecret mới hoặc đồng bộ secret mới.

## Service Accounts GCP

- IaC: `sagelms-devsecops-iac-sa@sagelms.iam.gserviceaccount.com`
- GitHub Actions: `sagelms-devsecops-gha-sa@sagelms.iam.gserviceaccount.com`
- ESO: `sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com`
- FluxCD: `sagelms-devsecops-flux-sa@sagelms.iam.gserviceaccount.com`
- App runtime: `sagelms-devsecops-app-sa@sagelms.iam.gserviceaccount.com`
- CloudNativePG backup: `sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com`
- GKE nodes: `sagelms-devsecops-gke-nodes@sagelms.iam.gserviceaccount.com`

## Workload Identity

- GKE workload pool: `sagelms.svc.id.goog`
- GitHub WIF provider: `projects/384858175117/locations/global/workloadIdentityPools/sagelms-devsecops-github-pool/providers/github`
- Điều kiện GitHub WIF theo repository: `daithang59/sagelms`
- Điều kiện GitHub WIF theo branch: `refs/heads/main`
- ESO Kubernetes principal: `serviceAccount:sagelms.svc.id.goog[platform-system/external-secrets]`
- CloudNativePG backup principal: `serviceAccount:sagelms.svc.id.goog[sagelms-data/sagelms-postgres]`

## Secret Manager

Đã có metadata cho các secret sau:

- `sagelms-devsecops-db-host`
- `sagelms-devsecops-db-port`
- `sagelms-devsecops-db-name`
- `sagelms-devsecops-cnpg-app-username`
- `sagelms-devsecops-cnpg-app-password`
- `sagelms-devsecops-cnpg-superuser-password`
- `sagelms-devsecops-db-auth-username`
- `sagelms-devsecops-db-auth-password`
- `sagelms-devsecops-db-course-username`
- `sagelms-devsecops-db-course-password`
- `sagelms-devsecops-db-content-username`
- `sagelms-devsecops-db-content-password`
- `sagelms-devsecops-db-progress-username`
- `sagelms-devsecops-db-progress-password`
- `sagelms-devsecops-db-assessment-username`
- `sagelms-devsecops-db-assessment-password`
- `sagelms-devsecops-db-ai-tutor-username`
- `sagelms-devsecops-db-ai-tutor-password`
- `sagelms-devsecops-redis-host`
- `sagelms-devsecops-redis-port`
- `sagelms-devsecops-redis-password`
- `sagelms-devsecops-jwt-secret`
- `sagelms-devsecops-gateway-shared-secret`
- `sagelms-devsecops-llm-api-key`
- `sagelms-devsecops-harbor-pull-secret`
- `sagelms-devsecops-grafana-admin-password`

Các secret version đã được thêm value:

- DB common values cho CloudNativePG: host nội bộ, port `5432`, database `sagelms`
- CloudNativePG app username/password cho `sagelms_app`
- CloudNativePG superuser password
- DB username/password cũ theo từng service user vẫn còn trong Secret Manager để tương thích lịch sử, nhưng baseline mới ưu tiên secret `cnpg-app-*`
- Redis host/port/password
- JWT secret
- Gateway shared secret
- Grafana admin password

Các secret version còn chờ input từ nhóm:

- `sagelms-devsecops-harbor-pull-secret`
- `sagelms-devsecops-llm-api-key`

## Kubernetes Secrets Được ESO Đồng Bộ

Namespace `sagelms-devsecops`:

- `db-common-secret`
- `jwt-secret`
- `gateway-shared-secret`
- `redis-secret`

Manifest đã chuẩn bị nhưng cần apply lại sau khi node pool chạy để ESO admission webhook có endpoint:

- `infra/k8s/devsecops/cnpg-foundation.yaml`

Các ExternalSecret mới trong manifest đó:

- `sagelms-devsecops/db-app-secret`
- `sagelms-data/sagelms-postgres-app-secret`
- `sagelms-data/sagelms-postgres-superuser-secret`

Kubernetes foundation đã tạo được dù node pool đang tắt:

- Namespace `cnpg-system`
- Namespace `sagelms-data`
- KSA `sagelms-data/sagelms-postgres` với annotation Workload Identity tới backup GSA

Namespace `monitoring`:

- `grafana-admin-secret`

Chưa đồng bộ vì source secret chưa có value thật:

- `harbor-pull-secret`
- `llm-secret`

## Trạng Thái Bàn Giao

- Thành viên 1 có thể dùng project, region, tên GKE cluster, WIF provider, GitHub Actions GSA và OpenTofu path để làm CI/CD workflow.
- Thành viên 2 cần cung cấp Harbor endpoint/project/robot credential hoặc Docker config JSON cho `sagelms-devsecops-harbor-pull-secret`.
- Thành viên 3 có thể dùng GKE cluster, namespaces, ESO mapping, ClusterSecretStore, CloudNativePG backup bucket/GSA và Kubernetes secret contract để viết runtime manifests.
- Trước khi deploy runtime CloudNativePG/operator/app, cần tạo lại node pool bằng OpenTofu vì hiện node pool đang được xóa để tiết kiệm chi phí.
