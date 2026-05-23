# Kubernetes DevSecOps Manifests Cho SageLMS

README này giải thích thư mục `infra/k8s/devsecops` theo góc nhìn người mới học Kubernetes, Kustomize và Helm.
Nếu chỉ nhớ một câu: **`devsecops` là overlay triển khai SageLMS lên môi trường GKE DevSecOps, còn `base` là bộ khung workload dùng lại.**

Các manifest ở đây không chứa secret value thật. Secret được lấy từ Google Secret Manager thông qua External Secrets Operator.

## Bức Tranh Tổng Thể

Môi trường DevSecOps có nhiều lớp:

```text
OpenTofu
-> tạo GCP/GKE/VPC/IAM/GCS/Secret Manager/Workload Identity

Kubernetes foundation trong infra/k8s/devsecops
-> tạo namespace, ServiceAccount, ExternalSecret contract

CloudNativePG runtime
-> tạo PostgreSQL cluster, backup object store, scheduled backup

Application overlay
-> lấy workload từ infra/k8s/base/apps, đổi namespace/image/secret/ingress cho GKE

Harbor runtime
-> HelmRelease/values để chạy Harbor và lưu registry storage trên GCS
```

Nói đơn giản:

- OpenTofu tạo hạ tầng cloud.
- Kubernetes manifest nói cluster phải chạy resource nào.
- Kustomize ghép và chỉnh YAML theo môi trường.
- Helm dùng riêng cho Harbor chart, không dùng cho app SageLMS trong thư mục này.

## Cấu Trúc Thư Mục

```text
infra/k8s/devsecops/
├── kustomization.yaml
├── apps/
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── app-shared-externalsecret.yaml
│   ├── harbor-pull-externalsecret.yaml
│   ├── ingress.yaml
│   ├── managed-certificate.yaml
│   └── README.md
├── cloudflare/
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── tunnel-token-externalsecret.yaml
│   └── deployment.yaml
├── cloudnativepg/
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── cnpg-foundation.yaml
│   ├── objectstore.yaml
│   ├── cluster.yaml
│   └── scheduledbackup.yaml
├── fluxcd/
│   ├── kustomization.yaml
│   ├── namespace.yaml
│   ├── gitrepository.yaml
│   ├── apps-kustomization.yaml
│   ├── harbor-kustomization.yaml
│   └── fluxcd-web-ui.yaml
└── harbor/
    ├── kustomization.yaml
    ├── namespace.yaml
    ├── harbor-foundation.yaml
    ├── harbor-pull-externalsecret.yaml
    ├── helmrepository.yaml
    ├── helmrelease.yaml
    ├── values-gcs.yaml
    └── registry-pvc-to-gcs-job.yaml
```

## Kustomize Và Helm Khác Nhau Thế Nào?

### Kustomize

Kustomize dùng các file `kustomization.yaml` để gom YAML và patch chúng.

Trong thư mục này, các đường dẫn dùng Kustomize là:

| Đường dẫn | Lệnh dùng | Vai trò |
| --- | --- | --- |
| `infra/k8s/devsecops` | `kubectl apply -k infra\k8s\devsecops` | Apply toàn bộ overlay DevSecOps: apps, CloudNativePG, Harbor, FluxCD và Cloudflare Tunnel. |
| `infra/k8s/devsecops/cloudnativepg` | `kubectl apply -k infra\k8s\devsecops\cloudnativepg` | Tạo namespace, secret contract, PostgreSQL cluster và backup runtime. |
| `infra/k8s/devsecops/apps` | `kubectl apply -k infra\k8s\devsecops\apps` | Deploy app từ `base/apps` bằng image Harbor. |
| `infra/k8s/devsecops/harbor` | `kubectl apply -k infra\k8s\devsecops\harbor` | Tạo resource Harbor qua Flux/Helm và Workload Identity. |
| `infra/k8s/devsecops/cloudflare` | `kubectl apply -k infra\k8s\devsecops\cloudflare` | Tạo Cloudflare Tunnel connector. |
| `infra/k8s/devsecops/fluxcd` | `kubectl apply -k infra\k8s\devsecops\fluxcd` | Tạo Flux source/kustomization cho GitOps. |

Render để xem trước, chưa apply:

```powershell
kubectl kustomize infra\k8s\devsecops\apps
```

Dry-run với API server:

```powershell
kubectl apply --dry-run=server -k infra\k8s\devsecops\apps
```

### Helm

Helm là package manager cho Kubernetes. Helm dùng chart và values.

Trong thư mục này, file Helm là:

```text
infra/k8s/devsecops/harbor/values-gcs.yaml
```

File này **không phải Kubernetes manifest hoàn chỉnh**. Không chạy:

```powershell
kubectl apply -f infra\k8s\devsecops\harbor\values-gcs.yaml
```

Thay vào đó, dùng nó làm values cho chart `harbor/harbor`:

```powershell
helm upgrade harbor harbor/harbor `
  -n harbor `
  --version 1.19.0 `
  --reuse-values `
  -f infra\k8s\devsecops\harbor\values-gcs.yaml
```

`--reuse-values` rất quan trọng vì file `values-gcs.yaml` chỉ override phần registry storage sang GCS. Nó không khai báo lại toàn bộ domain, TLS, generated secret hay admin password của Harbor release hiện tại.

## Lớp 1: Top-Level DevSecOps Overlay

Top-level overlay gom các lớp DevSecOps đang dùng: app runtime, CloudNativePG, Harbor, FluxCD và Cloudflare Tunnel.

Lệnh:

```powershell
kubectl apply -k infra\k8s\devsecops
```

File `infra/k8s/devsecops/kustomization.yaml` đang gom:

```yaml
resources:
  - apps
  - cloudnativepg
  - harbor
  - fluxcd
  - cloudflare
```

### Namespace manifests

Các namespace được khai báo trong từng lớp:

| Namespace | Dùng cho |
| --- | --- |
| `sagelms-devsecops` | Workload ứng dụng SageLMS: web, gateway, backend service. |
| `cnpg-system` | CloudNativePG operator và Barman Cloud Plugin. |
| `sagelms-data` | PostgreSQL cluster, PVC, DB secret, backup CR. |
| `harbor` | Harbor registry runtime. |
| `flux-system` | FluxCD source và reconciliation. |
| `cloudflare` | Cloudflare Tunnel connector. |

Tách namespace giúp dễ quản lý quyền, log, secret và vòng đời resource.

### `cloudnativepg/cnpg-foundation.yaml`

File này tạo các resource nền cho CloudNativePG.

#### ServiceAccount `sagelms-data/sagelms-postgres`

```yaml
metadata:
  name: sagelms-postgres
  namespace: sagelms-data
  annotations:
    iam.gke.io/gcp-service-account: sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com
```

Ý nghĩa:

- Đây là Kubernetes ServiceAccount của pod PostgreSQL.
- Annotation map nó sang Google Service Account `sagelms-devsecops-cnpg-sa`.
- Nhờ GKE Workload Identity, pod có thể ghi backup/WAL lên GCS mà không cần JSON key trong cluster.

Luồng quyền:

```text
PostgreSQL pod
-> KSA sagelms-data/sagelms-postgres
-> GSA sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com
-> GCS backup bucket
```

#### ExternalSecret `sagelms-postgres-app-secret`

Nguồn Google Secret Manager:

```text
sagelms-devsecops-cnpg-app-username
sagelms-devsecops-cnpg-app-password
```

Kubernetes Secret được tạo:

```text
sagelms-data/sagelms-postgres-app-secret
```

CloudNativePG dùng secret này khi bootstrap database `sagelms` và owner `sagelms_app`.

#### ExternalSecret `sagelms-postgres-superuser-secret`

Nguồn Google Secret Manager:

```text
sagelms-devsecops-cnpg-superuser-password
```

Kubernetes Secret được tạo:

```text
sagelms-data/sagelms-postgres-superuser-secret
```

Template trong YAML cố định:

```yaml
username: postgres
password: "{{ .password }}"
```

CloudNativePG cần secret superuser có cả `username` và `password`, nên template tạo đủ 2 key này.

#### ExternalSecret `db-app-secret`

Kubernetes Secret được tạo:

```text
sagelms-devsecops/db-app-secret
```

App backend dùng Secret này để lấy credential database:

```text
DB_USER
DB_PASSWORD
```

Các giá trị không bí mật như `DB_HOST`, `DB_PORT`, `DB_NAME` nằm trong ConfigMap ở `infra/k8s/base/apps/<service>/configmap.yaml`.

### `harbor/harbor-foundation.yaml`

File này tạo ServiceAccount:

```text
harbor/harbor-registry
```

ServiceAccount này được annotate tới GSA:

```text
sagelms-devsecops-harbor-gcs@sagelms.iam.gserviceaccount.com
```

Mục đích: cho Harbor registry dùng Workload Identity để đọc/ghi image layer vào bucket GCS `sagelms-devsecops-harbor-registry`.

## Lớp 2: CloudNativePG Runtime

Thư mục:

```text
infra/k8s/devsecops/cloudnativepg/
```

Apply:

```powershell
kubectl apply --dry-run=server -k infra\k8s\devsecops\cloudnativepg
kubectl apply -k infra\k8s\devsecops\cloudnativepg
```

Điều kiện trước khi apply:

- GKE cluster/node pool đang chạy.
- Namespace/foundation đã apply.
- External Secrets Operator đã Ready.
- `ClusterSecretStore/gcpsm-sagelms-devsecops` đã Ready.
- CloudNativePG operator đã cài trong `cnpg-system`.
- Barman Cloud Plugin đã cài.
- GCS bucket backup, GSA, IAM binding và Workload Identity binding đã được OpenTofu tạo.
- Google Secret Manager đã có version cho secret PostgreSQL.

### `objectstore.yaml`

Tạo Barman Cloud `ObjectStore`:

```text
sagelms-data/sagelms-postgres-backup-store
```

ObjectStore trả lời câu hỏi: **backup và WAL archive sẽ lưu ở đâu?**

Destination:

```text
gs://sagelms-cnpg-backup-sagelms/sagelms-postgres
```

Đoạn quan trọng:

```yaml
googleCredentials:
  gkeEnvironment: true
```

Nghĩa là plugin lấy credential từ môi trường GKE/Workload Identity, không dùng static key.

Backup và WAL đều nén `gzip`. `retentionPolicy: "30d"` nghĩa là giữ backup theo chính sách 30 ngày ở tầng Barman.

### `cluster.yaml`

Tạo CloudNativePG `Cluster`:

```text
sagelms-data/sagelms-postgres
```

Khi apply, CloudNativePG operator sẽ tự tạo nhiều resource phía sau:

- Pod PostgreSQL, ví dụ `sagelms-postgres-1`.
- PVC để giữ dữ liệu PostgreSQL.
- Service nội bộ:
  - `sagelms-postgres-rw`: endpoint ghi/đọc chính, app đang dùng.
  - `sagelms-postgres-ro`: endpoint read-only nếu có replica.
  - `sagelms-postgres-r`: endpoint replica.
- Secret nội bộ cho replication/TLS.
- Hook archive WAL qua Barman Cloud Plugin.

Các cấu hình đáng chú ý:

| Cấu hình | Ý nghĩa |
| --- | --- |
| `instances: 1` | Chạy 1 PostgreSQL instance để tiết kiệm chi phí demo; chưa phải HA đầy đủ. |
| `imageName: ghcr.io/cloudnative-pg/postgresql:16-standard-bookworm` | Image PostgreSQL 16. |
| `serviceAccountName: sagelms-postgres` | Pod PostgreSQL dùng KSA đã map Workload Identity. |
| `storage.size: 20Gi` | PVC dữ liệu PostgreSQL 20Gi. PVC không thay thế backup GCS. |
| `storageClass: premium-rwo` | Dùng disk class `premium-rwo` trên GKE. |
| `enableSuperuserAccess: true` | Cho phép dùng superuser secret. |
| `bootstrap.initdb.database: sagelms` | Tạo database `sagelms` lần đầu. |
| `bootstrap.initdb.owner: sagelms_app` | Tạo owner/user app `sagelms_app`. |
| `plugins.barmanObjectName` | Trỏ cluster tới ObjectStore backup. |
| `resources.requests/limits` | Đặt tài nguyên tối thiểu/tối đa cho PostgreSQL. |

`postInitSQL` tạo extension và schema:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION sagelms_app;
CREATE SCHEMA IF NOT EXISTS course AUTHORIZATION sagelms_app;
CREATE SCHEMA IF NOT EXISTS content AUTHORIZATION sagelms_app;
CREATE SCHEMA IF NOT EXISTS progress AUTHORIZATION sagelms_app;
CREATE SCHEMA IF NOT EXISTS assessment AUTHORIZATION sagelms_app;
CREATE SCHEMA IF NOT EXISTS ai_tutor AUTHORIZATION sagelms_app;
```

Lưu ý: `postInitSQL` chỉ chạy khi cluster init lần đầu. Nếu cluster đã tạo xong, sửa `postInitSQL` không tự chạy lại. Khi đó cần migration hoặc chạy SQL idempotent thủ công.

### `scheduledbackup.yaml`

Tạo CloudNativePG `ScheduledBackup`:

```text
sagelms-data/sagelms-postgres-daily-backup
```

Schedule:

```yaml
schedule: "0 0 1 * * *"
```

Đây là lịch 6 trường của CloudNativePG, chạy backup hằng ngày lúc `01:00:00` theo scheduler của controller.

Backup method:

```yaml
method: plugin
pluginConfiguration:
  name: barman-cloud.cloudnative-pg.io
```

Nghĩa là ScheduledBackup dùng Barman Cloud Plugin để ghi base backup lên GCS. WAL archive liên tục được bật trong `cluster.yaml`.

## Lớp 3: Application Overlay `apps`

Thư mục:

```text
infra/k8s/devsecops/apps/
```

Overlay này deploy app SageLMS vào namespace `sagelms-devsecops`.

Apply:

```powershell
kubectl apply --dry-run=server -k infra\k8s\devsecops\apps
kubectl apply -k infra\k8s\devsecops\apps
```

File `apps/kustomization.yaml` làm 4 việc lớn:

1. Kéo workload chung từ `../../base/apps`.
2. Tạo ExternalSecret cho app.
3. Tạo Ingress GKE.
4. Override image tag/digest và patch resource cho GKE.

### Kéo Workload Từ Base

```yaml
resources:
  - ../../base/apps
  - app-shared-externalsecret.yaml
  - harbor-pull-externalsecret.yaml
  - ingress.yaml
```

`../../base/apps` chứa Deployment/Service/ConfigMap/ServiceAccount của:

- `web`
- `gateway`
- `auth-service`
- `course-service`
- `content-service`
- `progress-service`
- `assessment-service`
- `challenge-service`
- `worker`

Overlay đặt:

```yaml
namespace: sagelms-devsecops
```

nên các resource app từ base sẽ được deploy vào namespace `sagelms-devsecops`.

### `app-shared-externalsecret.yaml`

Tạo Kubernetes Secret:

```text
sagelms-devsecops/app-shared-secret
```

Nó lấy 3 secret từ Google Secret Manager:

| Key trong Kubernetes Secret | Secret Manager key |
| --- | --- |
| `JWT_SECRET` | `sagelms-devsecops-jwt-secret` |
| `GATEWAY_SHARED_SECRET` | `sagelms-devsecops-gateway-shared-secret` |
| `INTERNAL_API_SECRET` | `sagelms-devsecops-internal-api-secret` |

Các backend và gateway dùng secret này qua `envFrom.secretRef`.

### `harbor-pull-externalsecret.yaml`

Tạo Kubernetes Secret:

```text
sagelms-devsecops/harbor-pull-secret
```

Type:

```text
kubernetes.io/dockerconfigjson
```

Secret này cho phép pod pull private image từ Harbor.

Nguồn Secret Manager:

```text
sagelms-devsecops-harbor-pull-secret
```

### `ingress.yaml`

Tạo GKE Ingress:

```text
sagelms-devsecops/sagelms-ingress
```

Route hiện tại:

| Path | Service backend |
| --- | --- |
| `/api` | `gateway:8080` |
| `/` | `web:80` |

Ingress dùng:

```yaml
ingressClassName: gce
```

Nghĩa là dùng GKE/GCE Ingress controller, không phải NGINX.

### `images:`

Overlay thay image mặc định trong base bằng image cụ thể cho DevSecOps.

Ví dụ:

```yaml
- name: harbor.sagelms.id.vn/sagelms-app/gateway
  newName: harbor.sagelms.id.vn/sagelms-app/gateway
  digest: sha256:...
```

Ý nghĩa:

- Base chỉ biết image mặc định `gateway:dev`.
- Overlay pin image theo digest để deploy đúng artifact đã build/scan.
- Một số workload còn dùng `newTag: dev` vì đang chờ supply-chain evidence, theo comment trong file.

### `patches:`

Overlay patch thêm:

| Patch | Ý nghĩa |
| --- | --- |
| Thêm `imagePullSecrets: harbor-pull-secret` vào ServiceAccount app | Cho pod pull private image từ Harbor. |
| Thêm annotation `cloud.google.com/neg` cho Service `gateway` | Cho GKE Ingress tạo Network Endpoint Group. |
| Thêm annotation `cloud.google.com/neg` cho Service `web` | Cho GKE Ingress route tới web. |

## Lớp 4: Harbor Helper

Thư mục:

```text
infra/k8s/devsecops/harbor/
```

### `values-gcs.yaml`

Đây là Helm values override cho chart `harbor/harbor`.

Nó đổi registry storage sang GCS:

```yaml
persistence:
  imageChartStorage:
    type: gcs
    gcs:
      bucket: sagelms-devsecops-harbor-registry
      useWorkloadIdentity: true
```

Nó cũng yêu cầu registry dùng ServiceAccount:

```yaml
registry:
  serviceAccountName: harbor-registry
  automountServiceAccountToken: true
```

Lệnh dùng:

```powershell
helm repo update
helm upgrade harbor harbor/harbor `
  -n harbor `
  --version 1.19.0 `
  --reuse-values `
  -f infra\k8s\devsecops\harbor\values-gcs.yaml
```

Không dùng file này để `helm install` từ đầu nếu bạn chưa có đầy đủ values cho domain, TLS và secret. README trong file cũng ghi rõ: **Do not install with this file alone.**

### `registry-pvc-to-gcs-job.yaml`

Đây là Kubernetes Job thủ công để copy dữ liệu registry cũ từ PVC sang GCS:

```text
PVC harbor-registry
-> gs://sagelms-devsecops-harbor-registry
```

File này có comment:

```text
Manual migration job. Do not add this file to kustomization.
```

Nghĩa là không được thêm nó vào `kustomization.yaml`. Chỉ chạy trong maintenance window khi đã hiểu rõ rollback plan.

Apply thủ công khi cần migration:

```powershell
kubectl apply -f infra\k8s\devsecops\harbor\registry-pvc-to-gcs-job.yaml
kubectl -n harbor wait --for=condition=complete job/harbor-registry-pvc-to-gcs --timeout=30m
kubectl -n harbor logs job/harbor-registry-pvc-to-gcs
```

## Thứ Tự Triển Khai Khuyến Nghị

### 1. Lấy credential vào GKE

```powershell
gcloud container clusters get-credentials sagelms-devsecops-gke `
  --region asia-southeast1 `
  --project sagelms
```

### 2. Apply foundation

```powershell
kubectl apply -k infra\k8s\devsecops
```

Kiểm tra:

```powershell
kubectl get ns sagelms-devsecops cnpg-system sagelms-data harbor
kubectl get sa sagelms-postgres -n sagelms-data
kubectl get sa harbor-registry -n harbor
kubectl get externalsecret -A
```

### 3. Apply CloudNativePG runtime

```powershell
kubectl apply --dry-run=server -k infra\k8s\devsecops\cloudnativepg
kubectl apply -k infra\k8s\devsecops\cloudnativepg
```

Kiểm tra:

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

### 4. Apply application overlay

```powershell
kubectl apply --dry-run=server -k infra\k8s\devsecops\apps
kubectl apply -k infra\k8s\devsecops\apps
```

Kiểm tra app:

```powershell
kubectl get externalsecret -n sagelms-devsecops
kubectl get secret db-app-secret app-shared-secret -n sagelms-devsecops
kubectl get pods -n sagelms-devsecops
kubectl get svc -n sagelms-devsecops
kubectl get ingress -n sagelms-devsecops
```

Rollout:

```powershell
kubectl rollout status deployment/gateway -n sagelms-devsecops
kubectl rollout status deployment/auth-service -n sagelms-devsecops
kubectl rollout status deployment/course-service -n sagelms-devsecops
kubectl rollout status deployment/content-service -n sagelms-devsecops
kubectl rollout status deployment/progress-service -n sagelms-devsecops
kubectl rollout status deployment/assessment-service -n sagelms-devsecops
kubectl rollout status deployment/challenge-service -n sagelms-devsecops
kubectl rollout status deployment/web -n sagelms-devsecops
```

Nếu overlay chính có `worker`:

```powershell
kubectl rollout status deployment/worker -n sagelms-devsecops
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

## Khi Nào Sửa File Nào?

| Mục tiêu | File nên sửa |
| --- | --- |
| Thêm namespace mới cho môi trường DevSecOps | `apps/namespace.yaml`, `cloudnativepg/namespace.yaml`, `harbor/namespace.yaml`, `fluxcd/namespace.yaml` hoặc `cloudflare/namespace.yaml` |
| Thêm secret database/app lấy từ Secret Manager | `cloudnativepg/cnpg-foundation.yaml` hoặc `apps/app-shared-externalsecret.yaml` |
| Đổi thông số PostgreSQL | `cloudnativepg/cluster.yaml` |
| Đổi lịch backup | `cloudnativepg/scheduledbackup.yaml` |
| Đổi bucket/path backup | `cloudnativepg/objectstore.yaml` |
| Đổi image app Harbor | `apps/kustomization.yaml`, mục `images:` |
| Đổi route public `/` hoặc `/api` | `apps/ingress.yaml` |
| Đổi cấu hình không bí mật dùng chung mọi môi trường | `infra/k8s/base/apps/<service>/configmap.yaml` |
| Đổi cấu hình chỉ riêng DevSecOps | Patch trong overlay `apps/kustomization.yaml` |
| Đổi Harbor registry storage sang GCS | `harbor/values-gcs.yaml` qua `helm upgrade` |
| Copy Harbor registry PVC sang GCS | `harbor/registry-pvc-to-gcs-job.yaml`, apply thủ công |

## Lỗi Thường Gặp

### ExternalSecret không tạo Secret

Nguyên nhân thường gặp:

- External Secrets Operator chưa Ready.
- `ClusterSecretStore/gcpsm-sagelms-devsecops` chưa Ready.
- Secret Manager chưa có version cho secret tương ứng.
- GSA của ESO thiếu quyền `secretmanager.secretAccessor`.
- Node pool đang tắt nên controller không chạy.

Kiểm tra:

```powershell
kubectl get deploy -n platform-system
kubectl get clustersecretstore
kubectl describe externalsecret -n sagelms-data sagelms-postgres-app-secret
kubectl describe externalsecret -n sagelms-devsecops app-shared-secret
```

### Pod app lỗi `ImagePullBackOff`

Nguyên nhân thường gặp:

- `harbor-pull-secret` chưa được ESO tạo.
- Secret docker config sai format.
- Image digest/tag trong `apps/kustomization.yaml` không tồn tại.
- Harbor credential không có quyền pull project `sagelms-app`.

Kiểm tra:

```powershell
kubectl get externalsecret harbor-pull-secret -n sagelms-devsecops
kubectl get secret harbor-pull-secret -n sagelms-devsecops -o jsonpath="{.type}"
kubectl describe pod -n sagelms-devsecops <pod-name>
```

### WAL archive lỗi quyền GCS

Triệu chứng trong condition/log:

```text
ContinuousArchiving=False
storage.buckets.get access denied
```

Nguyên nhân thường gặp:

- GSA backup có quyền object nhưng thiếu quyền đọc metadata bucket.
- Workload Identity binding giữa KSA `sagelms-postgres` và GSA backup chưa đúng.
- Bucket/path backup sai.

Kiểm tra:

```powershell
kubectl describe sa sagelms-postgres -n sagelms-data
kubectl get cluster sagelms-postgres -n sagelms-data -o yaml
gcloud storage buckets get-iam-policy gs://sagelms-cnpg-backup-sagelms
```

### Secret username có newline

Triệu chứng:

```text
wrong username 'sagelms_app\r\n' in secret, expected 'sagelms_app'
```

Nguyên nhân: thêm secret bằng PowerShell pipeline có thể làm giá trị có CRLF.

Cách xử lý:

- Thêm secret version mới không kèm newline.
- Force sync ExternalSecret.
- Nếu cluster đã init thiếu extension/schema, chạy SQL idempotent thủ công hoặc qua migration job.

### Apply nhầm Helm values bằng `kubectl`

Triệu chứng:

```text
error: unable to recognize "values-gcs.yaml"
```

Nguyên nhân: `values-gcs.yaml` là input cho Helm chart, không phải Kubernetes manifest.

Cách đúng:

```powershell
helm upgrade harbor harbor/harbor `
  -n harbor `
  --version 1.19.0 `
  --reuse-values `
  -f infra\k8s\devsecops\harbor\values-gcs.yaml
```

## Lưu Ý Khi Tạm Dừng Node Pool

Khi scale node pool về 0 hoặc xóa node pool:

- PostgreSQL pod không chạy.
- ScheduledBackup không chạy trong thời gian pause.
- PVC vẫn còn nếu không xóa namespace/PVC.
- GCS backup bucket và WAL đã archive vẫn còn.
- Khi node pool chạy lại, CloudNativePG operator sẽ reconcile cluster.

Trước khi pause, nên kiểm tra:

```powershell
kubectl get cluster,backup,scheduledbackup -n sagelms-data
kubectl get cluster sagelms-postgres -n sagelms-data -o jsonpath="{range .status.conditions[*]}{.type}={.status}:{.reason}{'\n'}{end}"
gcloud storage ls --recursive gs://sagelms-cnpg-backup-sagelms/sagelms-postgres
```
