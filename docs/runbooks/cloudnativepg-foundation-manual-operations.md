# Hướng Dẫn Chạy Thủ Công CloudNativePG Foundation

Cập nhật: 2026-05-18, Asia/Saigon.

Runbook này ghi lại các lệnh đã dùng để chuyển phần database từ Cloud SQL sang CloudNativePG, bao gồm cloud foundation, Kubernetes foundation, runtime operator/plugin, PostgreSQL Cluster CR và backup kiểm chứng.

Không đưa secret value thật vào tài liệu này.

## Phạm Vi

Runbook này bao gồm:

- OpenTofu CloudNativePG backup foundation.
- Xóa Cloud SQL cũ khi môi trường cloud chưa có dữ liệu.
- Tạo Secret Manager version cho CloudNativePG.
- Bật lại GKE node pool sau khi đã pause compute.
- Apply Kubernetes namespace/KSA/ExternalSecret foundation.
- Cài CloudNativePG operator.
- Cài Barman Cloud Plugin.
- Tạo `ObjectStore`, `Cluster`, `ScheduledBackup`.
- Chạy kiểm chứng WAL archive và manual base backup.

Runbook này chưa bao gồm restore drill end-to-end hoặc migration dữ liệu ứng dụng thật.

## Trạng Thái Sau Lần Chạy 2026-05-18

- GKE node pool `sagelms-devsecops-main-pool` đã được tạo lại bằng OpenTofu.
- `kubectl get nodes` hiện có 2 node `Ready`.
- ESO deployments `external-secrets`, `external-secrets-cert-controller`, `external-secrets-webhook` đều `1/1`.
- `kubectl apply -k infra\k8s\devsecops` đã chạy thành công.
- ExternalSecrets mới đã `SecretSynced=True`:
  - `sagelms-data/sagelms-postgres-app-secret`
  - `sagelms-data/sagelms-postgres-superuser-secret`
  - `sagelms-devsecops/db-app-secret`
- cert-manager chart `v1.20.2`, CloudNativePG chart `0.28.2` và Barman Cloud Plugin chart `0.6.0` đã cài thành công.
- CloudNativePG Cluster `sagelms-data/sagelms-postgres` đã `Ready=True`, 1 instance, primary pod `sagelms-postgres-1`.
- PostgreSQL service chính: `sagelms-postgres-rw.sagelms-data.svc.cluster.local:5432`.
- `pgcrypto`, `vector` và 6 schema `auth`, `course`, `content`, `progress`, `assessment`, `ai_tutor` đã có trong database `sagelms`.
- Continuous archiving đã `ContinuousArchiving=True:ContinuousArchivingSuccess`.
- Manual backup `sagelms-postgres-manual-20260518214142` đã `phase=completed`.
- GCS đã có base backup `base/20260518T144145` và WAL objects dưới `wals/`.
- `tofu plan -no-color -detailed-exitcode` trả exit code `0`.

## Biến Dùng Chung

Chạy từ PowerShell:

```powershell
$projectId = "sagelms"
$projectNumber = "384858175117"
$region = "asia-southeast1"
$cluster = "sagelms-devsecops-gke"
$nodePool = "sagelms-devsecops-main-pool"
$redisInstance = "sagelms-devsecops-redis"
$prefix = "sagelms-devsecops"
$cnpgBackupBucket = "sagelms-cnpg-backup-sagelms"
$cnpgBackupGsa = "sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com"
$gcloud = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$env:Path = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin;$env:Path"
```

Nếu OpenTofu báo thiếu Application Default Credentials:

```powershell
$env:GOOGLE_OAUTH_ACCESS_TOKEN = & $gcloud auth print-access-token
```

## Các Lệnh Đã Chạy

### 1. Kiểm tra và chuẩn hóa OpenTofu

```powershell
cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu
tofu fmt -recursive

cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu\envs\devsecops
$env:GOOGLE_OAUTH_ACCESS_TOKEN = & $gcloud auth print-access-token
tofu init
tofu validate
```

### 2. Xóa Cloud SQL cũ

Vì cloud chưa có dữ liệu cần migrate, Cloud SQL cũ đã được xóa:

```powershell
& $gcloud sql instances describe sagelms-devsecops-postgres --project sagelms
& $gcloud sql instances delete sagelms-devsecops-postgres --project sagelms --quiet
```

Sau đó remove resource cũ khỏi OpenTofu state:

```powershell
cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu\envs\devsecops
tofu state rm 'module.cloud_sql.google_sql_database_instance.main[0]' 'module.project_services.google_project_service.required["sqladmin.googleapis.com"]'
```

Disable Cloud SQL Admin API vì baseline mới không dùng Cloud SQL:

```powershell
& $gcloud services disable sqladmin.googleapis.com --project sagelms --quiet
```

Kiểm tra Cloud SQL đã không còn:

```powershell
& $gcloud sql instances describe sagelms-devsecops-postgres --project sagelms --format="value(name)"
```

Kết quả mong muốn là lỗi `404: The Cloud SQL instance does not exist`.

### 3. Apply CloudNativePG backup foundation

Đã chạy targeted plan/apply để tránh tạo lại node pool khi vẫn muốn tiết kiệm compute:

```powershell
cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu\envs\devsecops
$env:GOOGLE_OAUTH_ACCESS_TOKEN = & $gcloud auth print-access-token
tofu plan -target='module.cnpg_backup[0]' -target='module.secret_manager' -out cnpg-foundation-targeted.tfplan
tofu apply cnpg-foundation-targeted.tfplan
```

Sau targeted apply, refresh outputs:

```powershell
tofu plan -refresh-only -out refresh-outputs.tfplan
tofu apply refresh-outputs.tfplan
```

Tài nguyên đã tạo:

- Bucket `gs://sagelms-cnpg-backup-sagelms`
- GSA `sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com`
- IAM `roles/storage.objectAdmin` trên bucket cho GSA
- IAM `roles/storage.legacyBucketReader` trên bucket cho GSA, cần cho Barman Cloud đọc metadata bucket bằng `storage.buckets.get`
- Workload Identity binding cho KSA `sagelms-data/sagelms-postgres`
- Secret Manager metadata `sagelms-devsecops-cnpg-app-username`
- Secret Manager metadata `sagelms-devsecops-cnpg-app-password`
- Secret Manager metadata `sagelms-devsecops-cnpg-superuser-password`

Nếu môi trường đã có `roles/storage.objectAdmin` nhưng WAL archive lỗi `storage.buckets.get`, chạy plan/apply bổ sung IAM binding:

```powershell
cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu\envs\devsecops
$env:GOOGLE_OAUTH_ACCESS_TOKEN = (& $gcloud auth print-access-token --project $projectId).Trim()
tofu plan -out cnpg-bucket-reader.tfplan
tofu apply cnpg-bucket-reader.tfplan
```

Plan mong muốn:

```text
Plan: 1 to add, 0 to change, 0 to destroy
module.cnpg_backup[0].google_storage_bucket_iam_member.backup_bucket_reader
```

### 4. Thêm Secret Manager versions cho CloudNativePG

Đã thêm version mới cho DB endpoint nội bộ và user/password CNPG.

Lưu ý quan trọng trên PowerShell: không dùng dạng `"value" | gcloud secrets versions add --data-file=-` cho username/password vì pipeline có thể thêm CRLF vào secret value. Dùng hàm dưới đây để ghi stdin không kèm newline:

```powershell
function New-SecretValue {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  [Convert]::ToBase64String($bytes)
}

function Add-GcpSecretVersionNoNewline {
  param(
    [Parameter(Mandatory = $true)][string]$SecretId,
    [Parameter(Mandatory = $true)][string]$Value
  )

  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $gcloud
  $psi.ArgumentList.Add("secrets")
  $psi.ArgumentList.Add("versions")
  $psi.ArgumentList.Add("add")
  $psi.ArgumentList.Add($SecretId)
  $psi.ArgumentList.Add("--project")
  $psi.ArgumentList.Add($projectId)
  $psi.ArgumentList.Add("--data-file=-")
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false

  $process = [System.Diagnostics.Process]::Start($psi)
  $process.StandardInput.Write($Value)
  $process.StandardInput.Close()
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  if ($process.ExitCode -ne 0) {
    throw "gcloud secrets versions add failed for $SecretId: $stderr"
  }

  $stdout
}

Add-GcpSecretVersionNoNewline -SecretId sagelms-devsecops-db-host -Value "sagelms-postgres-rw.sagelms-data.svc.cluster.local"
Add-GcpSecretVersionNoNewline -SecretId sagelms-devsecops-db-port -Value "5432"
Add-GcpSecretVersionNoNewline -SecretId sagelms-devsecops-db-name -Value "sagelms"
Add-GcpSecretVersionNoNewline -SecretId sagelms-devsecops-cnpg-app-username -Value "sagelms_app"

$appPassword = New-SecretValue
$superuserPassword = New-SecretValue
Add-GcpSecretVersionNoNewline -SecretId sagelms-devsecops-cnpg-app-password -Value $appPassword
Add-GcpSecretVersionNoNewline -SecretId sagelms-devsecops-cnpg-superuser-password -Value $superuserPassword
Remove-Variable appPassword, superuserPassword
```

Nếu đã lỡ tạo secret có newline, thêm version mới bằng hàm trên rồi ép ExternalSecret sync lại:

```powershell
$ts = Get-Date -Format o
kubectl annotate externalsecret sagelms-postgres-app-secret -n sagelms-data force-sync=$ts --overwrite
kubectl annotate externalsecret sagelms-postgres-superuser-secret -n sagelms-data force-sync=$ts --overwrite
kubectl annotate externalsecret db-app-secret -n sagelms-devsecops force-sync=$ts --overwrite
```

Kiểm tra version đã có:

```powershell
& $gcloud secrets versions list sagelms-devsecops-cnpg-app-username --project sagelms
& $gcloud secrets versions list sagelms-devsecops-cnpg-app-password --project sagelms
& $gcloud secrets versions list sagelms-devsecops-cnpg-superuser-password --project sagelms
```

### 5. Tạo Kubernetes namespace/KSA foundation

Đã lấy kubeconfig:

```powershell
& $gcloud container clusters get-credentials sagelms-devsecops-gke --region asia-southeast1 --project sagelms
```

Đã tạo namespace và KSA:

```powershell
kubectl create namespace cnpg-system --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace sagelms-data --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -k C:\NT548_Project\SageLMS\sagelms\infra\k8s\devsecops
```

Lưu ý: lần apply đầu tiên tạo được namespace và KSA `sagelms-data/sagelms-postgres`, nhưng 3 `ExternalSecret` chưa tạo được vì node pool đang tắt, `external-secrets-webhook` không có endpoint.

## Cách Chạy Lại Nếu Node Pool Đang Tắt

Hiện tại GKE cluster còn tồn tại nhưng node pool đang bị xóa để tiết kiệm chi phí. Full OpenTofu plan chỉ còn tạo lại node pool.

### 1. Tạo lại node pool

```powershell
cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu\envs\devsecops
$env:GOOGLE_OAUTH_ACCESS_TOKEN = & $gcloud auth print-access-token
tofu plan -out restore-node-pool.tfplan
tofu apply restore-node-pool.tfplan
```

Kết quả mong muốn:

```text
Plan: 1 to add, 0 to change, 0 to destroy
```

Resource được tạo lại:

```text
module.gke.google_container_node_pool.main
```

### 2. Kiểm tra node và ESO webhook

```powershell
& $gcloud container clusters get-credentials $cluster --region $region --project $projectId
kubectl get nodes
kubectl -n platform-system get deploy
kubectl -n platform-system rollout status deploy/external-secrets-webhook --timeout=180s
kubectl -n platform-system rollout status deploy/external-secrets --timeout=180s
kubectl -n platform-system rollout status deploy/external-secrets-cert-controller --timeout=180s
```

Kết quả mong muốn:

```text
external-secrets-webhook           1/1
external-secrets                   1/1
external-secrets-cert-controller   1/1
```

### 3. Apply lại Kubernetes foundation

```powershell
cd C:\NT548_Project\SageLMS\sagelms
kubectl apply -k infra\k8s\devsecops
```

Kiểm tra:

```powershell
kubectl get ns cnpg-system sagelms-data
kubectl -n sagelms-data get sa sagelms-postgres -o jsonpath='{.metadata.annotations.iam\.gke\.io/gcp-service-account}'
kubectl get externalsecret -n sagelms-data
kubectl get externalsecret db-app-secret -n sagelms-devsecops
kubectl get secret -n sagelms-data sagelms-postgres-app-secret
kubectl get secret -n sagelms-data sagelms-postgres-superuser-secret
kubectl get secret -n sagelms-devsecops db-app-secret
```

### 4. Kiểm tra cloud foundation

```powershell
& $gcloud storage buckets describe "gs://$cnpgBackupBucket" --format="value(name,location,versioning_enabled,uniform_bucket_level_access,public_access_prevention)"
& $gcloud iam service-accounts describe $cnpgBackupGsa --project $projectId --format="value(email)"
& $gcloud iam service-accounts get-iam-policy $cnpgBackupGsa --project $projectId
& $gcloud container node-pools list --cluster $cluster --region $region --project $projectId
```

### 5. Kiểm tra OpenTofu sau khi khôi phục

```powershell
cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu\envs\devsecops
$env:GOOGLE_OAUTH_ACCESS_TOKEN = & $gcloud auth print-access-token
tofu validate
tofu plan -no-color -detailed-exitcode
```

Nếu không có drift, `tofu plan -detailed-exitcode` trả exit code `0`.

## Cách Tạm Dừng Lại Để Tiết Kiệm Chi Phí

Nếu muốn tắt compute sau khi kiểm tra xong:

```powershell
& $gcloud container node-pools delete $nodePool `
  --cluster $cluster `
  --region $region `
  --project $projectId `
  --quiet
```

Lệnh này xóa worker nodes, không xóa GKE cluster, Redis, GCS backup bucket, Secret Manager hoặc OpenTofu state.

Không dùng cách này khi CloudNativePG đã có dữ liệu thật nhưng chưa xác nhận backup/WAL archive hoạt động.

## Bước Sau Khi Runtime Đã Chạy

Sau lần chạy ngày 2026-05-18, runtime CloudNativePG đã được cài và backup đã kiểm chứng ghi được lên GCS. Các bước còn lại trước khi đưa dữ liệu thật vào là:

1. Chạy restore drill tối thiểu sang cluster tạm để xác nhận base backup + WAL có thể phục hồi.
2. Chạy migration/schema chính thức của application nếu nhóm app có migration riêng.
3. Cập nhật service/application manifests để dùng host `sagelms-postgres-rw.sagelms-data.svc.cluster.local`.
4. Kiểm tra TLS/connection pool/secret contract của từng service trước rollout.

## Lệnh Cài Runtime Platform CloudNativePG

Các version đã kiểm tra bằng `helm search repo` ngày 2026-05-18:

| Component | Chart | Version |
|---|---|---|
| cert-manager | `jetstack/cert-manager` | `v1.20.2` |
| CloudNativePG operator | `cnpg/cloudnative-pg` | `0.28.2`, app `1.29.1` |
| Barman Cloud Plugin | `cnpg/plugin-barman-cloud` | `0.6.0`, app `v0.12.0` |

Thêm Helm repo:

```powershell
helm repo add jetstack https://charts.jetstack.io
helm repo add cnpg https://cloudnative-pg.github.io/charts
helm repo update
```

Cài cert-manager vì Barman Cloud Plugin cần cert-manager:

```powershell
helm upgrade --install cert-manager jetstack/cert-manager `
  --namespace cert-manager `
  --create-namespace `
  --version v1.20.2 `
  --set crds.enabled=true `
  --wait `
  --timeout 5m
```

Cài CloudNativePG operator:

```powershell
helm upgrade --install cnpg cnpg/cloudnative-pg `
  --namespace cnpg-system `
  --create-namespace `
  --version 0.28.2 `
  --wait `
  --timeout 5m
```

Cài Barman Cloud Plugin:

```powershell
helm upgrade --install plugin-barman-cloud cnpg/plugin-barman-cloud `
  --namespace cnpg-system `
  --version 0.6.0 `
  --wait `
  --timeout 5m
```

Kiểm tra:

```powershell
kubectl get deploy -n cert-manager
kubectl get deploy -n cnpg-system
kubectl get crds | Select-String -Pattern "postgresql.cnpg.io|barmancloud.cnpg.io"
```

## Lệnh Tạo PostgreSQL Cluster CloudNativePG

Manifest runtime nằm ở:

```text
infra/k8s/devsecops/cloudnativepg/
```

Nội dung chính:

- `ObjectStore` dùng `googleCredentials.gkeEnvironment: true`.
- `Cluster` tên `sagelms-postgres`, namespace `sagelms-data`.
- `instances: 1` để tiết kiệm chi phí giai đoạn đầu.
- `imageName: ghcr.io/cloudnative-pg/postgresql:16-standard-bookworm`, dùng standard image có pgvector.
- `serviceAccountName: sagelms-postgres`, dùng KSA đã annotate Workload Identity.
- `primaryUpdateStrategy: unsupervised` vì cluster đang chạy 1 instance tiết kiệm chi phí.
- `ScheduledBackup` chạy daily lúc 01:00.

Apply:

```powershell
kubectl apply --server-side --dry-run=server -k infra\k8s\devsecops\cloudnativepg
kubectl apply -k infra\k8s\devsecops\cloudnativepg
```

Theo dõi:

```powershell
kubectl get objectstore -n sagelms-data
kubectl get cluster -n sagelms-data
kubectl get pods -n sagelms-data
kubectl get svc -n sagelms-data
kubectl wait --for=condition=Ready cluster/sagelms-postgres -n sagelms-data --timeout=10m
```

Kiểm tra extension/schema sau khi cluster Ready:

```powershell
kubectl exec -n sagelms-data sagelms-postgres-1 -c postgres -- psql -U postgres -d sagelms -c "SELECT extname FROM pg_extension WHERE extname IN ('vector','pgcrypto') ORDER BY extname;"
kubectl exec -n sagelms-data sagelms-postgres-1 -c postgres -- psql -U postgres -d sagelms -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('auth','course','content','progress','assessment','ai_tutor') ORDER BY schema_name;"
```

Nếu `postInitSQL` chưa tạo extension/schema do secret bootstrap từng có newline, chạy lại idempotent:

```powershell
kubectl exec -n sagelms-data sagelms-postgres-1 -c postgres -- psql -U postgres -d sagelms -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION sagelms_app; CREATE SCHEMA IF NOT EXISTS course AUTHORIZATION sagelms_app; CREATE SCHEMA IF NOT EXISTS content AUTHORIZATION sagelms_app; CREATE SCHEMA IF NOT EXISTS progress AUTHORIZATION sagelms_app; CREATE SCHEMA IF NOT EXISTS assessment AUTHORIZATION sagelms_app; CREATE SCHEMA IF NOT EXISTS ai_tutor AUTHORIZATION sagelms_app;"
```

Kết quả đã kiểm chứng:

```text
pgcrypto
vector

ai_tutor
assessment
auth
content
course
progress
```

## Kiểm Tra WAL Archive Và Backup

Ép Postgres tạo WAL mới:

```powershell
kubectl exec -n sagelms-data sagelms-postgres-1 -c postgres -- psql -U postgres -d sagelms -c "SELECT pg_switch_wal();"
```

Kiểm tra condition:

```powershell
kubectl get cluster sagelms-postgres -n sagelms-data -o jsonpath="{range .status.conditions[*]}{.type}={.status}:{.reason}{'\n'}{end}"
```

Kết quả đã kiểm chứng:

```text
Ready=True:ClusterIsReady
ConsistentSystemID=True:Unique
ContinuousArchiving=True:ContinuousArchivingSuccess
LastBackupSucceeded=True:LastBackupSucceeded
```

Tạo manual backup:

```powershell
$backupName = "sagelms-postgres-manual-$(Get-Date -Format 'yyyyMMddHHmmss')"
$manifest = @"
apiVersion: postgresql.cnpg.io/v1
kind: Backup
metadata:
  name: $backupName
  namespace: sagelms-data
  labels:
    app.kubernetes.io/name: sagelms-postgres
    app.kubernetes.io/part-of: sagelms
    sagelms.io/component: database-backup
spec:
  cluster:
    name: sagelms-postgres
  method: plugin
  pluginConfiguration:
    name: barman-cloud.cloudnative-pg.io
"@
$manifest | kubectl apply -f -
kubectl get backup $backupName -n sagelms-data -o jsonpath="{.status.phase}"
```

Lưu ý: `Backup` CR báo trạng thái bằng `status.phase=completed`; không dùng `kubectl wait --for=condition=Completed` vì CR hiện không expose condition đó.

Kiểm tra object trên GCS:

```powershell
& $gcloud storage ls --recursive gs://sagelms-cnpg-backup-sagelms/sagelms-postgres
```

Kết quả đã kiểm chứng:

```text
gs://sagelms-cnpg-backup-sagelms/sagelms-postgres/sagelms-postgres/base/20260518T144145/backup.info
gs://sagelms-cnpg-backup-sagelms/sagelms-postgres/sagelms-postgres/base/20260518T144145/data.tar.gz
gs://sagelms-cnpg-backup-sagelms/sagelms-postgres/sagelms-postgres/wals/0000000100000000/000000010000000000000001.gz
```
