# Secret Manager Values Guide

Tài liệu này giải thích các value trong Google Secret Manager của môi trường
`devsecops`: value lấy từ đâu, ai nên cung cấp, và thêm vào bằng cách nào.

> Không ghi secret value thật vào Git, Markdown, issue, chat log, `terraform.tfvars`,
> OpenTofu output hoặc terminal log. File này chỉ ghi nguồn value và lệnh thao tác.

## 1. Trạng Thái Hiện Tại

Ngày kiểm tra gần nhất: `2026-05-21`.

Các secret đã có version/value enabled:

| Nhóm | Secret |
| --- | --- |
| CloudNativePG | `sagelms-devsecops-cnpg-app-username` |
| CloudNativePG | `sagelms-devsecops-cnpg-app-password` |
| CloudNativePG | `sagelms-devsecops-cnpg-superuser-password` |
| DB legacy/per-service | `sagelms-devsecops-db-auth-username` |
| DB legacy/per-service | `sagelms-devsecops-db-auth-password` |
| DB legacy/per-service | `sagelms-devsecops-db-course-username` |
| DB legacy/per-service | `sagelms-devsecops-db-course-password` |
| DB legacy/per-service | `sagelms-devsecops-db-content-username` |
| DB legacy/per-service | `sagelms-devsecops-db-content-password` |
| DB legacy/per-service | `sagelms-devsecops-db-progress-username` |
| DB legacy/per-service | `sagelms-devsecops-db-progress-password` |
| DB legacy/per-service | `sagelms-devsecops-db-assessment-username` |
| DB legacy/per-service | `sagelms-devsecops-db-assessment-password` |
| DB legacy/per-service | `sagelms-devsecops-db-ai-tutor-username` |
| DB legacy/per-service | `sagelms-devsecops-db-ai-tutor-password` |
| DB common | `sagelms-devsecops-db-host` |
| DB common | `sagelms-devsecops-db-port` |
| DB common | `sagelms-devsecops-db-name` |
| Redis | `sagelms-devsecops-redis-host` |
| Redis | `sagelms-devsecops-redis-port` |
| Redis | `sagelms-devsecops-redis-password` |
| App security | `sagelms-devsecops-jwt-secret` |
| App security | `sagelms-devsecops-gateway-shared-secret` |
| App security | `sagelms-devsecops-internal-api-secret` |
| Monitoring | `sagelms-devsecops-grafana-admin-password` |

Các secret còn chờ input từ nhóm:

| Secret | Ai cung cấp | Nguồn value |
| --- | --- | --- |
| `sagelms-devsecops-harbor-pull-secret` | Member 2 | Harbor robot credential hoặc Docker config JSON |
| `sagelms-devsecops-llm-api-key` | Nhóm AI Tutor/LLM | API key thật từ LLM provider |

## 2. Nguyên Tắc Chung

OpenTofu chỉ tạo:

```text
Secret Manager metadata
IAM cho ESO đọc secret
```

OpenTofu không nên tạo hoặc lưu secret value thật, vì value có thể đi vào state.

Luồng runtime:

```text
Google Secret Manager
        |
        v
External Secrets Operator
        |
        v
Kubernetes Secret
        |
        v
Pod đọc qua environment variables
```

## 3. Cách Kiểm Tra Secret Đã Có Value Chưa

Lệnh này chỉ liệt kê version, không đọc value:

```powershell
gcloud secrets versions list sagelms-devsecops-internal-api-secret `
  --project sagelms `
  --filter="state:enabled" `
  --format="table(name,state,createTime)"
```

Nếu kết quả có ít nhất một version `enabled`, secret đã có value.

## 4. Cách Thêm Value Không Nhạy Cảm

Một số value không nhạy cảm, ví dụ DB host, DB port, DB name, Redis host, Redis
port. Có thể pipe trực tiếp vào `gcloud`.

Ví dụ:

```powershell
"5432" | gcloud secrets versions add sagelms-devsecops-db-port `
  --project sagelms `
  --data-file=-
```

## 5. Cách Thêm Value Nhạy Cảm Bằng Prompt

Dùng cách này khi value là password, signing secret hoặc API key.

```powershell
$secretId = "sagelms-devsecops-jwt-secret"
$secure = Read-Host "Secret value" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
$plain | gcloud secrets versions add $secretId --project sagelms --data-file=-
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
Remove-Variable secure, plain, bstr, secretId
```

Không dùng `Write-Host` để in value ra terminal.

## 6. Cách Generate Random Secret

Dùng cho JWT secret, gateway shared secret, internal API secret, Grafana admin
password, hoặc password mới khi chưa có yêu cầu cụ thể.

```powershell
$secretId = "sagelms-devsecops-internal-api-secret"
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$value = [Convert]::ToBase64String($bytes)
$value | gcloud secrets versions add $secretId --project sagelms --data-file=-
Remove-Variable value, bytes, secretId
```

`sagelms-devsecops-internal-api-secret` đã được thêm value bằng cách này.

## 7. Nguồn Value Theo Từng Nhóm Secret

### DB Common

| Secret | Value lấy từ đâu | Value hiện tại theo contract |
| --- | --- | --- |
| `sagelms-devsecops-db-host` | Kubernetes service nội bộ của CloudNativePG | `sagelms-postgres-rw.sagelms-data.svc.cluster.local` |
| `sagelms-devsecops-db-port` | PostgreSQL port chuẩn trong cluster | `5432` |
| `sagelms-devsecops-db-name` | Database name đã chốt cho SageLMS | `sagelms` |

Cách thêm:

```powershell
"sagelms-postgres-rw.sagelms-data.svc.cluster.local" | gcloud secrets versions add sagelms-devsecops-db-host --project sagelms --data-file=-
"5432" | gcloud secrets versions add sagelms-devsecops-db-port --project sagelms --data-file=-
"sagelms" | gcloud secrets versions add sagelms-devsecops-db-name --project sagelms --data-file=-
```

Các value này không phải password, nhưng vẫn đưa vào Secret Manager để app lấy
theo cùng một contract qua ESO.

### CloudNativePG App User

| Secret | Value lấy từ đâu |
| --- | --- |
| `sagelms-devsecops-cnpg-app-username` | User ứng dụng đã chốt cho MVP: `sagelms_app` |
| `sagelms-devsecops-cnpg-app-password` | Password random do người vận hành tạo |
| `sagelms-devsecops-cnpg-superuser-password` | Password random do người vận hành tạo |

Cách thêm username:

```powershell
"sagelms_app" | gcloud secrets versions add sagelms-devsecops-cnpg-app-username --project sagelms --data-file=-
```

Cách generate và thêm password:

```powershell
function New-SecretValue {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  [Convert]::ToBase64String($bytes)
}

$appPassword = New-SecretValue
$superuserPassword = New-SecretValue
$appPassword | gcloud secrets versions add sagelms-devsecops-cnpg-app-password --project sagelms --data-file=-
$superuserPassword | gcloud secrets versions add sagelms-devsecops-cnpg-superuser-password --project sagelms --data-file=-
Remove-Variable appPassword, superuserPassword
```

Lưu ý: nếu database đã chạy với password hiện tại, không tự ý rotate password
khi chưa có kế hoạch rollout app và CloudNativePG.

### DB Credentials Riêng Theo Service

Các secret này hiện có value nhưng trong MVP app đang ưu tiên dùng chung
`cnpg-app-username/password` qua `db-app-secret`.

| Service | Username secret | Password secret | Nguồn value nếu dùng thật |
| --- | --- | --- | --- |
| Auth | `sagelms-devsecops-db-auth-username` | `sagelms-devsecops-db-auth-password` | DB role/user tương ứng trong PostgreSQL |
| Course | `sagelms-devsecops-db-course-username` | `sagelms-devsecops-db-course-password` | DB role/user tương ứng trong PostgreSQL |
| Content | `sagelms-devsecops-db-content-username` | `sagelms-devsecops-db-content-password` | DB role/user tương ứng trong PostgreSQL |
| Progress | `sagelms-devsecops-db-progress-username` | `sagelms-devsecops-db-progress-password` | DB role/user tương ứng trong PostgreSQL |
| Assessment | `sagelms-devsecops-db-assessment-username` | `sagelms-devsecops-db-assessment-password` | DB role/user tương ứng trong PostgreSQL |
| AI Tutor | `sagelms-devsecops-db-ai-tutor-username` | `sagelms-devsecops-db-ai-tutor-password` | DB role/user tương ứng trong PostgreSQL |

Nếu sau này tách quyền theo service, cần làm đủ 2 việc:

1. Tạo user/role thật trong PostgreSQL và cấp quyền schema tương ứng.
2. Thêm username/password đó vào Secret Manager.

Ví dụ thêm một username/password mới:

```powershell
"sagelms_auth" | gcloud secrets versions add sagelms-devsecops-db-auth-username --project sagelms --data-file=-

$secretId = "sagelms-devsecops-db-auth-password"
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$value = [Convert]::ToBase64String($bytes)
$value | gcloud secrets versions add $secretId --project sagelms --data-file=-
Remove-Variable value, bytes, secretId
```

Không chỉ thêm Secret Manager value mà quên tạo DB user thật, vì app sẽ không
login được PostgreSQL.

### Redis

| Secret | Value lấy từ đâu |
| --- | --- |
| `sagelms-devsecops-redis-host` | OpenTofu output hoặc `gcloud redis instances describe` |
| `sagelms-devsecops-redis-port` | OpenTofu output hoặc `gcloud redis instances describe` |
| `sagelms-devsecops-redis-password` | `gcloud redis instances get-auth-string` |

Lấy host/port:

```powershell
gcloud redis instances describe sagelms-devsecops-redis `
  --region asia-southeast1 `
  --project sagelms `
  --format="value(host,port)"
```

Thêm host/port:

```powershell
"10.204.0.4" | gcloud secrets versions add sagelms-devsecops-redis-host --project sagelms --data-file=-
"6378" | gcloud secrets versions add sagelms-devsecops-redis-port --project sagelms --data-file=-
```

Lấy và thêm Redis AUTH string:

```powershell
$redisAuth = gcloud redis instances get-auth-string sagelms-devsecops-redis `
  --region asia-southeast1 `
  --project sagelms `
  --format="value(authString)"
$redisAuth | gcloud secrets versions add sagelms-devsecops-redis-password --project sagelms --data-file=-
Remove-Variable redisAuth
```

### App Security Secrets

| Secret | Value lấy từ đâu | Ai chốt |
| --- | --- | --- |
| `sagelms-devsecops-jwt-secret` | Random secret đủ mạnh | Auth owner / runtime owner |
| `sagelms-devsecops-gateway-shared-secret` | Random secret đủ mạnh | Gateway/Auth owner |
| `sagelms-devsecops-internal-api-secret` | Random secret đủ mạnh | Runtime owner |

Cách thêm:

```powershell
$secretId = "sagelms-devsecops-gateway-shared-secret"
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$value = [Convert]::ToBase64String($bytes)
$value | gcloud secrets versions add $secretId --project sagelms --data-file=-
Remove-Variable value, bytes, secretId
```

Nếu rotate các secret này, cần rollout lại các deployment đang đọc secret để pod
nhận value mới.

### Grafana Admin Password

| Secret | Value lấy từ đâu |
| --- | --- |
| `sagelms-devsecops-grafana-admin-password` | Random password do monitoring/platform owner tạo |

Cách thêm giống nhóm random secret:

```powershell
$secretId = "sagelms-devsecops-grafana-admin-password"
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$value = [Convert]::ToBase64String($bytes)
$value | gcloud secrets versions add $secretId --project sagelms --data-file=-
Remove-Variable value, bytes, secretId
```

### Harbor Pull Secret

Secret này đang chờ input từ Member 2.

| Secret | Value lấy từ đâu |
| --- | --- |
| `sagelms-devsecops-harbor-pull-secret` | Harbor robot account hoặc Docker config JSON |

Nếu app cần image pull secret dạng Kubernetes Docker config, value thường là nội
dung JSON `.dockerconfigjson`, ví dụ lấy từ file local không commit:

```powershell
gcloud secrets versions add sagelms-devsecops-harbor-pull-secret `
  --project sagelms `
  --data-file=.\local-harbor-dockerconfig.json
```

File `local-harbor-dockerconfig.json` phải nằm ngoài Git hoặc bị `.gitignore`.
Sau khi thêm xong, xóa file local nếu không cần nữa.

Không tự bịa value cho Harbor pull secret. Nếu credential sai, GKE sẽ pull image
thất bại với lỗi `ImagePullBackOff` hoặc `ErrImagePull`.

### LLM API Key

Secret này đang chờ input từ nhóm AI Tutor/LLM.

| Secret | Value lấy từ đâu |
| --- | --- |
| `sagelms-devsecops-llm-api-key` | API key thật từ provider LLM mà nhóm dùng |

Cách thêm qua prompt:

```powershell
$secretId = "sagelms-devsecops-llm-api-key"
$secure = Read-Host "LLM API key" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
$plain | gcloud secrets versions add $secretId --project sagelms --data-file=-
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
Remove-Variable secure, plain, bstr, secretId
```

Không dùng API key cá nhân lâu dài cho demo nhóm nếu có thể tạo key riêng cho
project hoặc môi trường DevSecOps.

## 8. Sau Khi Thêm Value Cần Kiểm Tra Gì?

Kiểm tra Secret Manager có version:

```powershell
gcloud secrets versions list sagelms-devsecops-internal-api-secret `
  --project sagelms `
  --filter="state:enabled"
```

Kiểm tra ExternalSecret trong Kubernetes:

```powershell
kubectl get externalsecret -A
kubectl describe externalsecret app-shared-secret -n sagelms-devsecops
```

Kiểm tra Kubernetes Secret đã được ESO tạo:

```powershell
kubectl get secret app-shared-secret -n sagelms-devsecops
```

Không cần decode Kubernetes Secret nếu chỉ muốn xác nhận sync.

## 9. Khi Nào Cần Tạo Version Mới?

Tạo version mới khi:

- Secret bị lộ.
- Cần rotate credential định kỳ.
- Redis instance bị tạo lại và AUTH string đổi.
- Harbor robot account bị rotate.
- LLM API key đổi provider hoặc bị revoke.
- JWT/gateway/internal API secret cần rotate theo chính sách bảo mật.

Sau khi tạo version mới, ESO sẽ sync theo `refreshInterval`, nhưng workload có
thể cần rollout để đọc lại environment variable mới:

```powershell
kubectl rollout restart deployment/auth-service -n sagelms-devsecops
kubectl rollout restart deployment/gateway -n sagelms-devsecops
```

