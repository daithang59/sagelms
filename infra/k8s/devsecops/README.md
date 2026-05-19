# Kubernetes DevSecOps CloudNativePG Manifests

File này giải thích các YAML trong `infra/k8s/devsecops` dùng để triển khai nền Kubernetes cho CloudNativePG trên GKE.

Các manifest ở đây không chứa secret value thật. Secret được lấy từ Google Secret Manager thông qua External Secrets Operator.

## Cấu Trúc Thư Mục

```text
infra/k8s/devsecops/
├── kustomization.yaml
├── namespaces.yaml
├── cnpg-foundation.yaml
├── apps/
│   ├── kustomization.yaml
│   ├── app-shared-externalsecret.yaml
│   ├── ingress.yaml
│   └── README.md
└── cloudnativepg-runtime/
    ├── kustomization.yaml
    ├── objectstore.yaml
    ├── cluster.yaml
    └── scheduledbackup.yaml
```

## Luồng Hoạt Động Tổng Quan

1. `namespaces.yaml` tạo namespace nền cho operator và database.
2. `cnpg-foundation.yaml` tạo Kubernetes ServiceAccount và các ExternalSecret cần cho CloudNativePG.
3. External Secrets Operator đọc secret từ Google Secret Manager và tạo Kubernetes Secret.
4. `cloudnativepg-runtime/objectstore.yaml` khai báo nơi lưu backup/WAL trên Google Cloud Storage.
5. `cloudnativepg-runtime/cluster.yaml` tạo PostgreSQL cluster bằng CloudNativePG operator.
6. `cloudnativepg-runtime/scheduledbackup.yaml` tạo lịch base backup định kỳ.
7. Barman Cloud Plugin dùng Workload Identity để ghi WAL/base backup lên GCS.
8. `apps/` deploy web, gateway, backend services và worker vào namespace `sagelms-devsecops` sau khi foundation/database/secret store đã sẵn sàng.

## `kustomization.yaml`

File:

```text
infra/k8s/devsecops/kustomization.yaml
```

Ý nghĩa:

- Gom các manifest foundation để apply cùng lúc bằng Kustomize.
- Hiện include:
  - `namespaces.yaml`
  - `cnpg-foundation.yaml`

Lệnh apply:

```powershell
kubectl apply -k infra\k8s\devsecops
```

Lệnh này chỉ apply phần foundation, chưa tạo PostgreSQL cluster runtime.

## `namespaces.yaml`

File này tạo 3 namespace:

```text
sagelms-devsecops
cnpg-system
sagelms-data
```

Ý nghĩa:

- `cnpg-system`: namespace dành cho CloudNativePG operator và Barman Cloud Plugin.
- `sagelms-devsecops`: namespace dành cho workload ứng dụng SageLMS.
- `sagelms-data`: namespace dành cho PostgreSQL cluster, PVC, service, backup CR và các secret DB.

Tách database sang `sagelms-data` giúp không trộn workload ứng dụng với workload stateful/database.

## `cnpg-foundation.yaml`

File này tạo 4 nhóm tài nguyên chính.

### ServiceAccount `sagelms-postgres`

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: sagelms-postgres
  namespace: sagelms-data
  annotations:
    iam.gke.io/gcp-service-account: sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com
```

Ý nghĩa:

- Đây là Kubernetes ServiceAccount mà PostgreSQL pod sẽ dùng.
- Annotation `iam.gke.io/gcp-service-account` map KSA này sang Google Service Account `sagelms-devsecops-cnpg-sa`.
- Nhờ Workload Identity, Barman Cloud Plugin trong pod có thể ghi backup/WAL lên GCS mà không cần JSON key.

Luồng quyền:

```text
Pod CloudNativePG
-> KSA sagelms-data/sagelms-postgres
-> GSA sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com
-> GCS bucket sagelms-cnpg-backup-sagelms
```

### ExternalSecret `sagelms-postgres-app-secret`

Secret này dùng cho application database owner/user `sagelms_app`.

Nguồn Google Secret Manager:

```text
sagelms-devsecops-cnpg-app-username
sagelms-devsecops-cnpg-app-password
```

Kubernetes Secret được tạo:

```text
sagelms-data/sagelms-postgres-app-secret
```

CloudNativePG dùng secret này trong bước `bootstrap.initdb` để tạo database owner.

### ExternalSecret `sagelms-postgres-superuser-secret`

Secret này dùng cho PostgreSQL superuser `postgres`.

Nguồn Google Secret Manager:

```text
sagelms-devsecops-cnpg-superuser-password
```

Kubernetes Secret được tạo:

```text
sagelms-data/sagelms-postgres-superuser-secret
```

File có template:

```yaml
username: postgres
password: "{{ .password }}"
```

CloudNativePG yêu cầu superuser secret có cả `username` và `password`, nên template này cố định username là `postgres`, còn password lấy từ Secret Manager.

### ExternalSecret `db-app-secret`

Secret này nằm ở namespace ứng dụng:

```text
sagelms-devsecops/db-app-secret
```

Ý nghĩa:

- Cung cấp `DB_USER` và `DB_PASSWORD` cho app services.
- Hiện cùng dùng user MVP `sagelms_app`.
- App sẽ kết hợp secret này với `db-common-secret` để có đủ `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

## `cloudnativepg-runtime/kustomization.yaml`

File:

```text
infra/k8s/devsecops/cloudnativepg-runtime/kustomization.yaml
```

Ý nghĩa:

- Gom 3 manifest runtime:
  - `objectstore.yaml`
  - `cluster.yaml`
  - `scheduledbackup.yaml`

Lệnh dry-run:

```powershell
kubectl apply --dry-run=server -k infra\k8s\devsecops\cloudnativepg-runtime
```

Lệnh apply:

```powershell
kubectl apply -k infra\k8s\devsecops\cloudnativepg-runtime
```

## `objectstore.yaml`

File này tạo Barman Cloud `ObjectStore`:

```text
sagelms-data/sagelms-postgres-backup-store
```

Ý nghĩa:

- Khai báo nơi CloudNativePG/Barman Cloud Plugin lưu WAL archive và base backup.
- Destination hiện tại:

```text
gs://sagelms-cnpg-backup-sagelms/sagelms-postgres
```

Điểm quan trọng:

```yaml
googleCredentials:
  gkeEnvironment: true
```

Trường này nói với Barman Cloud Plugin rằng credential sẽ lấy từ môi trường GKE/Workload Identity, không dùng static JSON key.

Backup/WAL được nén:

```yaml
wal:
  compression: gzip
data:
  compression: gzip
```

Retention:

```yaml
retentionPolicy: "30d"
```

Ý nghĩa là giữ backup theo chính sách 30 ngày ở tầng Barman Cloud. Bucket GCS cũng có lifecycle rule từ OpenTofu để dọn object cũ.

## `cluster.yaml`

File này tạo CloudNativePG `Cluster`:

```text
sagelms-data/sagelms-postgres
```

Đây là manifest quan trọng nhất. CloudNativePG operator đọc Cluster CR này và tự tạo các tài nguyên liên quan như:

- PostgreSQL pod `sagelms-postgres-1`
- PVC `sagelms-postgres-1`
- Services:
  - `sagelms-postgres-rw`
  - `sagelms-postgres-ro`
  - `sagelms-postgres-r`
- TLS/replication secrets nội bộ
- PostgreSQL configuration
- WAL archive hook thông qua Barman Cloud Plugin

### Số instance

```yaml
instances: 1
```

Hiện chạy 1 instance để tiết kiệm chi phí cho môi trường `devsecops`. Đây không phải cấu hình HA đầy đủ. Khi cần HA, tăng lên 3 instances và đảm bảo node pool đủ tài nguyên.

### PostgreSQL image

```yaml
imageName: ghcr.io/cloudnative-pg/postgresql:16-standard-bookworm
```

Image này dùng PostgreSQL 16 và có sẵn extension cần cho baseline như `pgvector`.

### ServiceAccount

```yaml
serviceAccountName: sagelms-postgres
```

PostgreSQL pod dùng KSA `sagelms-postgres`, nhờ đó Barman plugin có thể dùng Workload Identity để truy cập GCS.

### Storage

```yaml
storage:
  size: 20Gi
  storageClass: premium-rwo
```

CloudNativePG tạo PVC 20Gi bằng StorageClass `premium-rwo`. PVC giữ dữ liệu PostgreSQL khi pod restart. Tuy nhiên PVC không được coi là backup; backup thật nằm trên GCS.

### Superuser secret

```yaml
enableSuperuserAccess: true
superuserSecret:
  name: sagelms-postgres-superuser-secret
```

Cho phép dùng superuser `postgres` với password lấy từ Kubernetes Secret do ESO tạo.

### Bootstrap database

```yaml
bootstrap:
  initdb:
    database: sagelms
    owner: sagelms_app
    secret:
      name: sagelms-postgres-app-secret
```

Ý nghĩa:

- Khi cluster được tạo lần đầu, CloudNativePG tạo database `sagelms`.
- Tạo owner/user `sagelms_app`.
- Password của `sagelms_app` lấy từ `sagelms-postgres-app-secret`.

### `postInitSQL`

```yaml
postInitSQL:
  - CREATE EXTENSION IF NOT EXISTS vector;
  - CREATE EXTENSION IF NOT EXISTS pgcrypto;
  - CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION sagelms_app;
  - CREATE SCHEMA IF NOT EXISTS course AUTHORIZATION sagelms_app;
  - CREATE SCHEMA IF NOT EXISTS content AUTHORIZATION sagelms_app;
  - CREATE SCHEMA IF NOT EXISTS progress AUTHORIZATION sagelms_app;
  - CREATE SCHEMA IF NOT EXISTS assessment AUTHORIZATION sagelms_app;
  - CREATE SCHEMA IF NOT EXISTS ai_tutor AUTHORIZATION sagelms_app;
```

Ý nghĩa:

- Bật extension `vector` cho AI/RAG use case.
- Bật `pgcrypto` cho các chức năng cần cryptographic helpers.
- Tạo schema theo từng domain/service.

Lưu ý: `postInitSQL` chỉ chạy trong lần init cluster đầu tiên. Nếu secret bootstrap sai hoặc cluster đã được init trước đó, sửa manifest sẽ không tự chạy lại các câu SQL này. Khi đó cần chạy SQL idempotent thủ công hoặc qua migration job.

### Barman Cloud Plugin

```yaml
plugins:
  - name: barman-cloud.cloudnative-pg.io
    enabled: true
    isWALArchiver: true
    parameters:
      barmanObjectName: sagelms-postgres-backup-store
```

Ý nghĩa:

- Bật Barman Cloud Plugin cho cluster này.
- Cho phép plugin archive WAL liên tục.
- Trỏ tới `ObjectStore` tên `sagelms-postgres-backup-store`.

Nếu IAM/GCS sai, condition `ContinuousArchiving` sẽ báo `False`.

### Resource requests/limits

```yaml
resources:
  requests:
    cpu: "500m"
    memory: 1Gi
  limits:
    cpu: "2"
    memory: 4Gi
```

Ý nghĩa:

- Request đảm bảo PostgreSQL có tối thiểu 0.5 CPU và 1Gi RAM.
- Limit chặn PostgreSQL dùng quá 2 CPU và 4Gi RAM trong môi trường devsecops.

### PostgreSQL parameters

```yaml
postgresql:
  parameters:
    max_connections: "200"
    shared_buffers: 256MB
```

Ý nghĩa:

- `max_connections`: giới hạn số connection.
- `shared_buffers`: cấu hình bộ nhớ cache nội bộ PostgreSQL.

Các giá trị này đủ cho baseline demo, nhưng cần tuning lại nếu workload thật tăng.

## `scheduledbackup.yaml`

File này tạo CloudNativePG `ScheduledBackup`:

```text
sagelms-data/sagelms-postgres-daily-backup
```

Ý nghĩa:

- Tạo base backup định kỳ cho cluster `sagelms-postgres`.
- Dùng Barman Cloud Plugin để ghi backup lên GCS.
- WAL archive vẫn chạy liên tục thông qua cấu hình plugin trong `cluster.yaml`.

Schedule hiện tại:

```yaml
schedule: "0 0 1 * * *"
```

Đây là lịch 6 trường, cấu hình chạy hằng ngày lúc 01:00:00 theo scheduler của CloudNativePG controller.

Backup method:

```yaml
method: plugin
pluginConfiguration:
  name: barman-cloud.cloudnative-pg.io
```

Ý nghĩa là ScheduledBackup dùng Barman Cloud Plugin, không dùng cơ chế backup legacy.

## Thứ Tự Apply Khuyến Nghị

Điều kiện trước khi apply:

- GKE node pool đang chạy.
- External Secrets Operator đã Ready trong `platform-system`.
- `ClusterSecretStore gcpsm-sagelms-devsecops` đã Ready.
- cert-manager đã cài.
- CloudNativePG operator đã cài trong `cnpg-system`.
- Barman Cloud Plugin đã cài trong `cnpg-system`.
- OpenTofu đã tạo GCS bucket, backup GSA, bucket IAM và Workload Identity binding.
- Secret Manager đã có version cho các secret CNPG.

Apply foundation:

```powershell
kubectl apply -k infra\k8s\devsecops
```

Kiểm tra foundation:

```powershell
kubectl get ns cnpg-system sagelms-data
kubectl get sa sagelms-postgres -n sagelms-data
kubectl get externalsecret -n sagelms-data
kubectl get secret -n sagelms-data sagelms-postgres-app-secret
kubectl get secret -n sagelms-data sagelms-postgres-superuser-secret
```

Apply runtime:

```powershell
kubectl apply --dry-run=server -k infra\k8s\devsecops\cloudnativepg-runtime
kubectl apply -k infra\k8s\devsecops\cloudnativepg-runtime
```

Kiểm tra runtime:

```powershell
kubectl get objectstore -n sagelms-data
kubectl get cluster -n sagelms-data
kubectl get pods -n sagelms-data
kubectl get svc -n sagelms-data
kubectl get pvc -n sagelms-data
kubectl get scheduledbackup -n sagelms-data
```

Kiểm tra condition:

```powershell
kubectl get cluster sagelms-postgres -n sagelms-data -o jsonpath="{range .status.conditions[*]}{.type}={.status}:{.reason}{'\n'}{end}"
```

Kết quả mong muốn:

```text
Ready=True:ClusterIsReady
ConsistentSystemID=True:Unique
ContinuousArchiving=True:ContinuousArchivingSuccess
LastBackupSucceeded=True:LastBackupSucceeded
```

## Kiểm Tra Database

Kiểm tra extension:

```powershell
kubectl exec -n sagelms-data sagelms-postgres-1 -c postgres -- psql -U postgres -d sagelms -c "SELECT extname FROM pg_extension WHERE extname IN ('vector','pgcrypto') ORDER BY extname;"
```

Kiểm tra schema:

```powershell
kubectl exec -n sagelms-data sagelms-postgres-1 -c postgres -- psql -U postgres -d sagelms -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('auth','course','content','progress','assessment','ai_tutor') ORDER BY schema_name;"
```

Kiểm tra GCS backup/WAL:

```powershell
gcloud storage ls --recursive gs://sagelms-cnpg-backup-sagelms/sagelms-postgres
```

## Lưu Ý Khi Tạm Dừng Node Pool

Khi xóa hoặc scale node pool về 0:

- PostgreSQL pod sẽ không chạy.
- ScheduledBackup sẽ không chạy trong thời gian pause.
- PVC vẫn còn nếu không xóa namespace/PVC.
- GCS backup bucket và WAL đã archive vẫn còn.
- Khôi phục node pool xong, CloudNativePG operator sẽ reconcile lại cluster.

Trước khi pause qua đêm, nên kiểm tra:

```powershell
kubectl get cluster,backup,scheduledbackup -n sagelms-data
kubectl get cluster sagelms-postgres -n sagelms-data -o jsonpath="{range .status.conditions[*]}{.type}={.status}:{.reason}{'\n'}{end}"
gcloud storage ls --recursive gs://sagelms-cnpg-backup-sagelms/sagelms-postgres
```

## Lỗi Thường Gặp

### ExternalSecret không tạo Secret

Nguyên nhân thường gặp:

- ESO webhook chưa Ready.
- Node pool đang tắt.
- `ClusterSecretStore` chưa Ready.
- Secret Manager chưa có version.
- ESO GSA thiếu quyền `secretmanager.secretAccessor`.

Kiểm tra:

```powershell
kubectl get deploy -n platform-system
kubectl get clustersecretstore
kubectl describe externalsecret -n sagelms-data sagelms-postgres-app-secret
```

### WAL archive lỗi `storage.buckets.get`

Triệu chứng:

```text
does not have storage.buckets.get access
```

Nguyên nhân:

- GSA backup có `roles/storage.objectAdmin` nhưng thiếu quyền đọc metadata bucket.

Cách xử lý:

- Cấp thêm `roles/storage.legacyBucketReader` trên bucket cho GSA backup bằng OpenTofu module `cnpg-backup`.

### Secret username có newline

Triệu chứng trong log CloudNativePG:

```text
wrong username 'sagelms_app\r\n' in secret, expected 'sagelms_app'
```

Nguyên nhân:

- Thêm secret bằng PowerShell pipeline có thể làm giá trị có CRLF.

Cách xử lý:

- Thêm secret version mới bằng cách ghi stdin không kèm newline.
- Force sync ExternalSecret.
- Nếu cluster đã init nhưng extension/schema chưa tạo, chạy SQL idempotent thủ công hoặc qua migration job.
