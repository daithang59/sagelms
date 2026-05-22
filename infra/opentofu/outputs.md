# Thông Tin Bàn Giao Hạ Tầng SageLMS DevSecOps

Cập nhật lần cuối: 2026-05-21, Asia/Saigon.

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
- Số node Ready hiện tại: 2
- Trạng thái node pool hiện tại: đã tạo lại bằng OpenTofu, `tofu plan -no-color -detailed-exitcode` trả exit code `0`
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

## Ứng Dụng Web Và Endpoint Public

- Namespace workload ứng dụng: `sagelms-devsecops`
- Public domain hiện tại: `http://sagelms.id.vn`
- Static IP đang dùng: `8.233.61.249`
- Tên static IP trên GCP/GKE Ingress: `sagelms-web-ip`
- Ingress: `sagelms-devsecops/sagelms-ingress`
- Routing hiện tại:
  - `/` -> service `web:80`
  - `/api` -> service `gateway:8080`
- Health check HTTP đã kiểm chứng: `http://sagelms.id.vn/health` trả `200 OK` với body `ok`.
- API route đã kiểm chứng: `http://sagelms.id.vn/api/actuator/health` trả `401 Unauthorized`, xác nhận request đã đi tới `gateway`; endpoint này hiện bị bảo vệ bởi auth.
- DNS đã trỏ đúng: `sagelms.id.vn` resolve về `8.233.61.249`.

Trạng thái HTTPS:

- ManagedCertificate: `sagelms-devsecops/sagelms-web-cert`
- Domain trong certificate: `sagelms.id.vn`
- Trạng thái kiểm tra gần nhất: `certificateStatus=Provisioning`, `domainStatus=FailedNotVisible`
- Kết luận bàn giao: HTTPS chưa Active, hiện chỉ dùng HTTP để demo kỹ thuật; không nhập credential thật qua HTTP cho đến khi certificate Active và truy cập `https://sagelms.id.vn` hoạt động.

Trạng thái deploy app hiện tại:

- Overlay đang dùng để deploy tạm: `infra/k8s/devsecops/apps-artifact-registry`
- Registry tạm cho app images: `asia-southeast1-docker.pkg.dev/sagelms/sagelms-app`
- Web image hiện tại: `asia-southeast1-docker.pkg.dev/sagelms/sagelms-app/web:gke-temp-7b2ae13`
- Các deployment app hiện tại đều `1/1 Running`, restart `0`: `web`, `gateway`, `auth-service`, `course-service`, `content-service`, `progress-service`, `assessment-service`, `challenge-service`.
- `worker` đang được loại khỏi overlay tạm bằng patch delete trong `apps-artifact-registry/kustomization.yaml`; chưa coi worker là workload bàn giao cho demo web chính.

Trạng thái Harbor:

- Harbor runtime hiện đã có trong namespace `harbor`, các deployment/statefulset chính đang Running.
- `harbor-pull-secret` trong namespace `sagelms-devsecops` đã được ESO đồng bộ và test pull image Harbor đã có sự kiện pull thành công.
- App workload hiện tại vẫn chưa chuyển sang Harbor làm registry chính; đang dùng Artifact Registry tạm. Phần chuyển image sang Harbor, pin digest, Trivy image scan, SBOM và Cosign signing là phần bàn giao tiếp cho Member 2/Member 1.

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
- CloudNativePG operator: đã cài bằng Helm chart `cnpg/cloudnative-pg` version `0.28.2`, app `1.29.1`
- Barman Cloud Plugin: đã cài bằng Helm chart `cnpg/plugin-barman-cloud` version `0.6.0`, app `v0.12.0`
- cert-manager: đã cài bằng Helm chart `jetstack/cert-manager` version `v1.20.2`
- Cluster CR: `sagelms-postgres`
- Database: `sagelms`
- App user MVP: `sagelms_app`
- RW service: `sagelms-postgres-rw.sagelms-data.svc.cluster.local:5432`
- Runtime status: `Cluster in healthy state`, `Ready=True`, 1 instance ready, primary `sagelms-postgres-1`
- PostgreSQL extensions đã tạo: `pgcrypto`, `vector`
- Schemas đã tạo: `auth`, `course`, `content`, `progress`, `assessment`, `ai_tutor`

CloudNativePG backup foundation đã apply:

- Backup bucket: `gs://sagelms-cnpg-backup-sagelms`
- Object store destination path: `gs://sagelms-cnpg-backup-sagelms/sagelms-postgres`
- Bucket location: `ASIA-SOUTHEAST1`
- Versioning: đã bật
- Lifecycle retention: xóa object cũ sau 30 ngày
- Uniform bucket-level access: đã bật
- Public access prevention: enforced
- Backup GSA: `sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com`
- Bucket IAM cho backup GSA: `roles/storage.objectAdmin`, `roles/storage.legacyBucketReader`
- Backup KSA: `sagelms-data/sagelms-postgres`
- Workload Identity member: `serviceAccount:sagelms.svc.id.goog[sagelms-data/sagelms-postgres]`
- WAL archive: `ContinuousArchiving=True:ContinuousArchivingSuccess`
- Manual backup kiểm chứng: `sagelms-postgres-manual-20260518214142`, phase `completed`, backup ID `20260518T144145`
- GCS backup objects đã kiểm chứng: `base/20260518T144145/backup.info`, `base/20260518T144145/data.tar.gz`, các WAL `.gz` dưới `wals/`

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
- ESO deployments: `external-secrets`, `external-secrets-cert-controller`, `external-secrets-webhook` đều `1/1`.

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
- `sagelms-devsecops-internal-api-secret`
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
- Internal API secret
- Grafana admin password
- Harbor pull secret / Docker config JSON cho Harbor hiện tại

Các secret version còn chờ input từ nhóm:

- `sagelms-devsecops-llm-api-key`

## Kubernetes Secrets Được ESO Đồng Bộ

Namespace `sagelms-devsecops`:

- `db-common-secret`
- `db-app-secret`
- `app-shared-secret`
- `harbor-pull-secret`
- `jwt-secret`
- `gateway-shared-secret`
- `redis-secret`

Manifest Kubernetes foundation:

- `infra/k8s/devsecops/cnpg-foundation.yaml`
- `infra/k8s/devsecops/apps/app-shared-externalsecret.yaml`

Các ExternalSecret mới đã apply và đồng bộ:

- `sagelms-devsecops/db-app-secret`
- `sagelms-data/sagelms-postgres-app-secret`
- `sagelms-data/sagelms-postgres-superuser-secret`

Kubernetes foundation hiện đã chạy trên node pool đã khôi phục:

- Namespace `cnpg-system`
- Namespace `sagelms-data`
- KSA `sagelms-data/sagelms-postgres` với annotation Workload Identity tới backup GSA
- Secret `sagelms-data/sagelms-postgres-app-secret`
- Secret `sagelms-data/sagelms-postgres-superuser-secret`

Namespace `monitoring`:

- `grafana-admin-secret`

Chưa đồng bộ vì source secret chưa có value thật:

- `llm-secret`

## Trạng Thái Bàn Giao

- Phần Cloud/IaC foundation của Thắng đã đủ để bàn giao: OpenTofu validate được, Checkov không còn failed check trong `infra/opentofu`, GKE chạy được app workloads, ESO sync secret, CloudNativePG healthy và backup đã completed.
- Web app đã chạy được qua HTTP tại `http://sagelms.id.vn`; đây là trạng thái demo kỹ thuật hiện tại, chưa phải production-ready HTTPS.
- HTTPS còn pending vì `ManagedCertificate` chưa Active; cần theo dõi/fix cùng người phụ trách DNS/Ingress cho đến khi `https://sagelms.id.vn` hoạt động.
- GitOps/FluxCD final còn pending: workload hiện đang được apply bằng Kustomize overlay, chưa thấy FluxCD reconcile app runtime.
- Harbor final còn pending: Harbor đã có runtime và pull secret, nhưng app deployment hiện vẫn dùng Artifact Registry tạm; cần Member 2/Member 1 chuyển sang Harbor image digest, SBOM, Cosign và workflow build/publish chính thức.
- Thành viên 1 có thể dùng project, region, tên GKE cluster, WIF provider, GitHub Actions GSA, OpenTofu path và endpoint web hiện tại để hoàn thiện CI/CD workflow, infra plan/apply approval và smoke test.
- Thành viên 2 cần tiếp tục phần Harbor/supply-chain: Harbor project/robot account/retention, push image chính thức, resolve digest, Trivy image scan, SBOM, Cosign signing và cập nhật overlay/GitOps theo digest.
- Thành viên 3 có thể dùng GKE cluster, namespaces, ESO mapping, ClusterSecretStore, CloudNativePG runtime manifests, `sagelms-postgres-rw` service, backup/WAL archive và app overlay hiện tại để GitOps hóa runtime, hoàn thiện HTTPS, Kyverno, observability và runbook.
- Bước nên làm tiếp trước khi chốt nghiệm thu cuối: restore drill CloudNativePG tối thiểu, test end-to-end login/register/API, và quyết định chính thức về `worker`/`ai-tutor-service` trong scope demo.
