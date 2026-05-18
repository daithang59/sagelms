# DevSecOps Cloud/IaC Manual Operations Runbook

Last updated: 2026-05-18.

Runbook này dùng cho phần triển khai Cloud/IaC của Thắng trong project SageLMS. Nội dung bao gồm cách chạy thủ công, kiểm tra sau khi apply, tạm dừng để tiết kiệm chi phí, xóa tài nguyên và tạo lại môi trường.

## Phạm vi

Runbook này quản lý phần Cloud/IaC:

- OpenTofu bootstrap remote state.
- OpenTofu environment `devsecops`.
- GCP APIs, VPC, subnet, Cloud NAT, Private Service Access.
- GKE Standard, node pool, Workload Identity.
- IAM service accounts, GitHub WIF, ESO IAM.
- Secret Manager metadata.
- Cloud SQL PostgreSQL, Memorystore Redis, GCS buckets.
- Namespace nền và runtime bootstrap tối thiểu để ESO đọc Secret Manager.

Runbook này không thay thế phần của Member 1/2/3:

- GitHub Actions workflows.
- Harbor/image build/scan/SBOM/Cosign.
- Helm/Kustomize/FluxCD/Kyverno/observability.
- Manifest triển khai `auth-service`.

## Quy tắc an toàn

- Không commit `terraform.tfvars`, `*.tfplan`, state files, hoặc file chứa secret.
- Không đưa secret value vào OpenTofu variables.
- Không xóa tài nguyên bằng Cloud Console nếu tài nguyên đang do OpenTofu quản lý, trừ khi chấp nhận xử lý drift/import lại state.
- Trước khi chạy lệnh destroy, luôn chạy plan trước và đọc kỹ danh sách resource bị xóa.
- Không destroy bootstrap state bucket nếu chỉ muốn tạm dừng dự án. Giữ remote state giúp tạo lại môi trường dễ hơn.

## Biến Dùng Chung Trên PowerShell

Chạy các biến này từ repo root:

```powershell
$projectId = "sagelms"
$projectNumber = "384858175117"
$region = "asia-southeast1"
$cluster = "sagelms-devsecops-gke"
$nodePool = "sagelms-devsecops-main-pool"
$sqlInstance = "sagelms-devsecops-postgres"
$redisInstance = "sagelms-devsecops-redis"
$prefix = "sagelms-devsecops"
$gcloud = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$env:Path = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin;$env:Path"
```

Nếu `gcloud` đã có sẵn trong `PATH`, vẫn có thể dùng trực tiếp `gcloud` thay cho `& $gcloud`.

## Đăng Nhập GCP

```powershell
& $gcloud auth login
& $gcloud config set project $projectId
& $gcloud config set compute/region $region
```

OpenTofu nên dùng Application Default Credentials:

```powershell
& $gcloud auth application-default login
```

Nếu máy chưa có ADC hoặc `tofu` báo lỗi `could not find default credentials`, dùng access token tạm:

```powershell
$env:GOOGLE_OAUTH_ACCESS_TOKEN = & $gcloud auth print-access-token
```

Token này chỉ nên dùng trong phiên shell hiện tại.

## Chạy Bootstrap Remote State

Chỉ cần chạy bootstrap lần đầu, hoặc khi state bucket/IaC service account chưa tồn tại.

```powershell
cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu\bootstrap
Copy-Item terraform.tfvars.example terraform.tfvars
tofu init
tofu fmt
tofu validate
tofu plan -out bootstrap.tfplan
tofu apply bootstrap.tfplan
```

Kết quả mong muốn:

- Bucket `sagelms-devsecops-tofu-state`.
- Versioning enabled.
- Uniform bucket-level access enabled.
- Public access prevention enforced.
- Service account `sagelms-devsecops-iac-sa@sagelms.iam.gserviceaccount.com`.

Không destroy bootstrap nếu chỉ muốn xóa/tạo lại môi trường `devsecops`.

## Chạy Environment DevSecOps

```powershell
cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu\envs\devsecops
Copy-Item terraform.tfvars.example terraform.tfvars
```

Chỉnh `terraform.tfvars` trước khi apply:

- `github_owner = "daithang59"` hoặc owner repo thật.
- `github_repository = "sagelms"`.
- `deploy_branch = "main"`.
- `master_authorized_networks`: IP public hiện tại của máy hoặc bastion/self-hosted runner.
- Giữ `enable_cloud_sql = true`.
- Giữ `enable_managed_redis = true` nếu cần Redis.
- Giữ `cloud_sql_deletion_protection = true` khi vận hành bình thường.

Lấy IP public hiện tại:

```powershell
(Invoke-RestMethod "https://api.ipify.org") + "/32"
```

Chạy OpenTofu:

```powershell
tofu init
tofu fmt -recursive ..\..
tofu validate
tofu plan -out devsecops.tfplan
tofu apply devsecops.tfplan
```

Sau khi apply:

```powershell
tofu output
tofu plan -no-color -detailed-exitcode
```

Exit code `0` của `tofu plan -detailed-exitcode` nghĩa là hạ tầng đang khớp cấu hình, không có thay đổi.

## Kiểm Tra Sau Khi Apply

```powershell
checkov -d C:\NT548_Project\SageLMS\sagelms\infra\opentofu --quiet
```

Kiểm tra GCP:

```powershell
& $gcloud storage buckets describe gs://sagelms-devsecops-tofu-state
& $gcloud container clusters describe $cluster --region $region --project $projectId
& $gcloud sql instances describe $sqlInstance --project $projectId
& $gcloud redis instances describe $redisInstance --region $region --project $projectId
& $gcloud iam service-accounts list --project $projectId --filter="email:sagelms-devsecops"
& $gcloud secrets list --project $projectId --filter="name:sagelms-devsecops"
```

Lấy kubeconfig:

```powershell
& $gcloud container clusters get-credentials $cluster --region $region --project $projectId
kubectl config current-context
kubectl get nodes
kubectl get ns
```

Nếu `kubectl` báo thiếu `gke-gcloud-auth-plugin.exe`, thêm Cloud SDK vào `PATH`:

```powershell
$env:Path = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin;$env:Path"
```

## Bootstrap Kubernetes Tối Thiểu

OpenTofu hiện tạo cloud resources, còn namespace/ESO có thể bootstrap tạm bằng lệnh thủ công trước khi Member 3 đưa vào GitOps.

Tạo namespaces:

```powershell
kubectl create namespace sagelms-devsecops --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace platform-system --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace harbor --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
```

Cài External Secrets Operator:

```powershell
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm upgrade --install external-secrets external-secrets/external-secrets `
  --namespace platform-system `
  --create-namespace `
  --set installCRDs=true
```

Annotate KSA để dùng Workload Identity:

```powershell
kubectl -n platform-system annotate serviceaccount external-secrets `
  iam.gke.io/gcp-service-account=sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com `
  --overwrite
```

Kiểm tra:

```powershell
kubectl -n platform-system get deploy
kubectl -n platform-system get sa external-secrets -o jsonpath='{.metadata.annotations.iam\.gke\.io/gcp-service-account}'
```

FluxCD chưa nằm trong phần bootstrap thủ công này. Khi Member 3 bootstrap FluxCD, các manifest namespace/ESO/ExternalSecret nên được đưa vào GitOps để thay thế thao tác tay.

## Secret Manager Values

OpenTofu chỉ tạo Secret Manager metadata. Secret value thật phải thêm ngoài OpenTofu.

Thêm value không nhạy cảm:

```powershell
"10.204.1.3" | & $gcloud secrets versions add sagelms-devsecops-db-host --project $projectId --data-file=-
"5432" | & $gcloud secrets versions add sagelms-devsecops-db-port --project $projectId --data-file=-
"sagelms" | & $gcloud secrets versions add sagelms-devsecops-db-name --project $projectId --data-file=-
"10.204.0.4" | & $gcloud secrets versions add sagelms-devsecops-redis-host --project $projectId --data-file=-
"6378" | & $gcloud secrets versions add sagelms-devsecops-redis-port --project $projectId --data-file=-
```

Thêm value nhạy cảm qua prompt:

```powershell
$secure = Read-Host "Secret value" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
$plain | & $gcloud secrets versions add sagelms-devsecops-jwt-secret --project $projectId --data-file=-
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
Remove-Variable secure, plain
```

Lấy Redis AUTH string sau khi Redis được tạo:

```powershell
$redisAuth = & $gcloud redis instances get-auth-string $redisInstance --region $region --project $projectId --format="value(authString)"
$redisAuth | & $gcloud secrets versions add sagelms-devsecops-redis-password --project $projectId --data-file=-
Remove-Variable redisAuth
```

Các secret cần input từ nhóm:

- `sagelms-devsecops-harbor-pull-secret`: cần Harbor robot credential hoặc Docker config JSON từ Member 2.
- `sagelms-devsecops-llm-api-key`: cần API key thật từ nhóm.

Không dùng placeholder nếu cần deploy workload thật.

## Cloud SQL Users Và Schema

OpenTofu không tạo DB password để tránh lưu password vào state.

Lưu ý: lệnh `gcloud sql users create --password` phù hợp cho thao tác thủ công trong đồ án, nhưng password có thể xuất hiện trong process arguments trong thời gian lệnh chạy. Với môi trường nghiêm ngặt hơn, dùng quy trình secret/password rotation chính thức hoặc thao tác qua Cloud Console.

Tạo user bằng `gcloud` sau khi Cloud SQL sẵn sàng:

```powershell
$password = Read-Host "Password for sagelms_auth" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
& $gcloud sql users create sagelms_auth --instance $sqlInstance --project $projectId --password $plain
"sagelms_auth" | & $gcloud secrets versions add sagelms-devsecops-db-auth-username --project $projectId --data-file=-
$plain | & $gcloud secrets versions add sagelms-devsecops-db-auth-password --project $projectId --data-file=-
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
Remove-Variable password, plain
```

Lặp lại cùng pattern cho:

- `sagelms_course`
- `sagelms_content`
- `sagelms_progress`
- `sagelms_assessment`
- `sagelms_ai_tutor`

Schema cần có trong database `sagelms`:

- `auth`
- `course`
- `content`
- `progress`
- `assessment`
- `ai_tutor`

Nếu tạo schema từ trong cluster, dùng một pod PostgreSQL tạm thời trong namespace `sagelms-devsecops` và kết nối private IP Cloud SQL. Không chạy migration từ máy local nếu máy không nằm trong VPC.

## Tạm Dừng Để Tiết Kiệm Chi Phí

Chọn mức tạm dừng theo thời gian nghỉ và mức cần giữ dữ liệu.

| Mức | Khi dùng | Tiết kiệm | Mất dữ liệu |
|---|---|---|---|
| Level 1 | Nghỉ ngắn, vẫn cần platform nhanh chóng | Thấp | Không |
| Level 2 | Nghỉ qua đêm/cuối tuần | Trung bình | Không |
| Level 3 | Nghỉ nhiều ngày, chấp nhận xóa Redis | Cao hơn | Mất Redis cache |
| Level 4 | Tạm dừng dài hạn | Cao nhất | Mất tài nguyên runtime nếu không backup/export |

### Level 1: Scale Workload Về 0

Dùng khi đã có app workload nhưng chưa muốn đụng vào hạ tầng.

```powershell
kubectl -n sagelms-devsecops scale deploy --all --replicas=0
kubectl -n monitoring scale deploy --all --replicas=0
```

Khôi phục:

```powershell
kubectl -n sagelms-devsecops scale deploy --all --replicas=1
kubectl -n monitoring scale deploy --all --replicas=1
```

### Level 2: Scale GKE Node Pool Về 0 Và Stop Cloud SQL

Dùng khi muốn giảm compute cost nhưng vẫn giữ phần lớn resource.

Đưa GKE node pool về 0:

```powershell
& $gcloud container node-pools update $nodePool `
  --cluster $cluster `
  --region $region `
  --project $projectId `
  --enable-autoscaling `
  --min-nodes 0 `
  --max-nodes 2

& $gcloud container clusters resize $cluster `
  --node-pool $nodePool `
  --num-nodes 0 `
  --region $region `
  --project $projectId `
  --quiet
```

Stop Cloud SQL:

```powershell
& $gcloud sql instances patch $sqlInstance --project $projectId --activation-policy=NEVER
```

Lưu ý:

- Redis Memorystore không có chế độ pause; vẫn phát sinh chi phí nếu giữ Redis.
- Không chạy `tofu apply` khi đang pause bằng tay, trừ khi muốn OpenTofu đưa hạ tầng về cấu hình chuẩn.

Khôi phục Level 2:

```powershell
& $gcloud sql instances patch $sqlInstance --project $projectId --activation-policy=ALWAYS

& $gcloud container node-pools update $nodePool `
  --cluster $cluster `
  --region $region `
  --project $projectId `
  --enable-autoscaling `
  --min-nodes 1 `
  --max-nodes 2

& $gcloud container clusters resize $cluster `
  --node-pool $nodePool `
  --num-nodes 1 `
  --region $region `
  --project $projectId `
  --quiet
```

Sau khi khôi phục:

```powershell
kubectl get nodes
tofu plan -no-color -detailed-exitcode
```

### Level 3: Xóa Redis Nhưng Giữ Phần Còn Lại

Dùng khi muốn giảm thêm chi phí và chấp nhận mất Redis cache/session/job queue tạm thời.

Trong `infra/opentofu/envs/devsecops/terraform.tfvars`:

```hcl
enable_managed_redis = false
```

Apply:

```powershell
cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu\envs\devsecops
tofu plan -out pause-redis.tfplan
tofu apply pause-redis.tfplan
```

Tạo lại Redis:

```hcl
enable_managed_redis = true
```

```powershell
tofu plan -out restore-redis.tfplan
tofu apply restore-redis.tfplan
```

Sau khi tạo lại Redis, cập nhật lại Secret Manager versions:

```powershell
$redisHost = tofu output -raw redis_host
$redisPort = tofu output -raw redis_port
$redisAuth = & $gcloud redis instances get-auth-string $redisInstance --region $region --project $projectId --format="value(authString)"
$redisHost | & $gcloud secrets versions add sagelms-devsecops-redis-host --project $projectId --data-file=-
$redisPort | & $gcloud secrets versions add sagelms-devsecops-redis-port --project $projectId --data-file=-
$redisAuth | & $gcloud secrets versions add sagelms-devsecops-redis-password --project $projectId --data-file=-
Remove-Variable redisHost, redisPort, redisAuth
```

### Level 4: Destroy Toàn Bộ DevSecOps Stack

Dùng khi tạm dừng dài hạn và muốn giảm chi phí tối đa. Cách này xóa GKE, Cloud SQL, Redis, GCS evidence/materials buckets, Secret Manager metadata, IAM/WIF, network.

Trước khi destroy:

```powershell
cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu\envs\devsecops
tofu output
tofu plan -no-color -detailed-exitcode
```

Nếu cần giữ dữ liệu database, export trước khi destroy. Ví dụ:

```powershell
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
& $gcloud sql export sql $sqlInstance "gs://sagelms-devsecops-evidence/backups/sagelms-$timestamp.sql" `
  --database=sagelms `
  --project $projectId
```

Đặt `cloud_sql_deletion_protection = false` trong `terraform.tfvars`, rồi apply thay đổi protection:

```powershell
tofu plan -out disable-sql-protection.tfplan
tofu apply disable-sql-protection.tfplan
```

Nếu GCS buckets có object và bạn thật sự muốn xóa, dọn object trước. Lệnh này có tính phá hủy:

```powershell
& $gcloud storage rm -r gs://sagelms-devsecops-evidence/**
& $gcloud storage rm -r gs://sagelms-devsecops-materials/**
```

Destroy environment:

```powershell
tofu plan -destroy -out destroy-devsecops.tfplan
tofu apply destroy-devsecops.tfplan
```

Không chạy destroy trong `infra/opentofu/bootstrap` nếu còn muốn tạo lại dễ dàng.

## Tạo Lại Sau Khi Đã Destroy DevSecOps

Giữ bootstrap remote state, sau đó chạy lại environment:

```powershell
cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu\envs\devsecops
```

Đảm bảo `terraform.tfvars` có cấu hình đúng:

```hcl
enable_cloud_sql = true
enable_managed_redis = true
cloud_sql_deletion_protection = true
```

Chạy:

```powershell
tofu init
tofu validate
tofu plan -out recreate-devsecops.tfplan
tofu apply recreate-devsecops.tfplan
```

Sau khi tạo lại:

1. Lấy kubeconfig.
2. Tạo namespaces.
3. Cài ESO hoặc để Member 3 bootstrap FluxCD/ESO.
4. Tạo lại DB users.
5. Tạo lại schema.
6. Thêm lại Secret Manager versions.
7. Kiểm tra ExternalSecrets sync.
8. Cập nhật `infra/opentofu/outputs.md`.
9. Chạy lại evidence validation.

## Destroy Bootstrap Khi Không Còn Cần Dự Án

Chỉ làm bước này nếu chắc chắn không cần state và không cần tạo lại môi trường bằng state cũ.

Bootstrap bucket có `force_destroy = false`, nên destroy sẽ fail nếu bucket còn object. Không xóa state bucket khi chỉ tạm dừng ngắn hạn.

Trình tự nếu thật sự muốn xóa bootstrap:

```powershell
cd C:\NT548_Project\SageLMS\sagelms\infra\opentofu\bootstrap
tofu plan -destroy -out destroy-bootstrap.tfplan
tofu apply destroy-bootstrap.tfplan
```

Nếu bucket còn object, cần quyết định có xóa state history hay không. Với môi trường đồ án, nên giữ bootstrap bucket vì chi phí thấp và giảm rủi ro mất state.

## Checklist Trước Khi Bàn Giao Hoặc Tạm Nghỉ

```text
[ ] tofu validate pass
[ ] tofu plan no changes, hoặc plan destroy/pause đã được đọc kỹ
[ ] checkov pass hoặc exception đã ghi rõ
[ ] outputs.md đã cập nhật
[ ] evidence file đã cập nhật
[ ] Không có secret value trong Git
[ ] Harbor pull secret và LLM key đã ghi rõ trạng thái nếu chưa có value thật
[ ] Nếu tạm dừng Level 2/3/4, đã ghi lại cách khôi phục và trạng thái cuối cùng
```

## Khi Nào Nên Chọn Cách Nào

- Nghỉ vài giờ: không cần làm gì hoặc scale workload về 0.
- Nghỉ qua đêm/cuối tuần: Level 2.
- Nghỉ nhiều ngày nhưng vẫn cần tạo lại nhanh: Level 2 hoặc Level 3.
- Nghỉ dài hạn, muốn giảm chi phí tối đa: Level 4, nhưng export DB trước nếu cần dữ liệu.
- Không bao giờ xóa bootstrap trước, trừ khi muốn kết thúc hẳn môi trường IaC.
