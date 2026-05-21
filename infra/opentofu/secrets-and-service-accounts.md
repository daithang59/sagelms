# SageLMS DevSecOps Secrets và Service Accounts

Tài liệu này giải thích cách đặt tên và cách hoạt động của `secret_ids` và
`service_account_emails` trong môi trường `devsecops` của SageLMS.

> Không ghi giá trị secret thật vào file Markdown, Git, commit, issue, chat log
> hoặc Terraform/OpenTofu output. File này chỉ ghi tên secret và mục đích sử dụng.

## 1. Bối Cảnh Chung

Môi trường hiện tại:

| Thành phần | Giá trị |
| --- | --- |
| GCP project | `sagelms` |
| Region | `asia-southeast1` |
| Name prefix | `sagelms-devsecops` |
| VPC | `sagelms-devsecops-vpc` |
| Subnet | `sagelms-devsecops-subnet` |
| GKE Workload Identity pool | `sagelms.svc.id.goog` |
| Redis instance | `sagelms-devsecops-redis` |
| Redis host | `10.204.0.4` |
| Redis port | `6378` |

Trong repo, OpenTofu dùng `name_prefix = "sagelms-devsecops"` làm tiền tố đặt
tên tài nguyên. Vì vậy hầu hết tài nguyên đều bắt đầu bằng:

```text
sagelms-devsecops-...
```

Ý nghĩa:

```text
sagelms   = tên project/hệ thống
devsecops = tên môi trường hoặc nhóm triển khai
```

## 2. `secret_ids` Là Gì?

`secret_ids` là danh sách tên secret trong Google Secret Manager.

Nó là tên của "két chứa bí mật", không phải giá trị bí mật.

Ví dụ:

```text
sagelms-devsecops-jwt-secret
```

Đây là tên secret trong Google Secret Manager. Giá trị thật bên trong có thể là
một chuỗi JWT signing secret, nhưng giá trị đó không nên xuất hiện trong source
code hoặc tài liệu.

Google Secret Manager có 2 lớp cần nhớ:

| Lớp | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| Secret ID | Tên cái két | `sagelms-devsecops-jwt-secret` |
| Secret version | Giá trị thật bên trong két | `<SECRET_VALUE>` |

OpenTofu trong project này chủ yếu tạo Secret ID. Giá trị thật cần được thêm vào
sau bằng `gcloud` hoặc bằng giao diện Google Cloud Console.

## 3. Công Thức Đặt Tên Secret

Công thức chung:

```text
<name_prefix>-<nhóm/chức-năng>-<loại-giá-trị>
```

Trong môi trường hiện tại:

```text
sagelms-devsecops-<nhóm/chức-năng>-<loại-giá-trị>
```

Ví dụ:

```text
sagelms-devsecops-db-auth-password
```

Đọc như sau:

| Phần | Ý nghĩa |
| --- | --- |
| `sagelms-devsecops` | Tài nguyên thuộc môi trường DevSecOps của SageLMS |
| `db` | Liên quan database |
| `auth` | Dùng cho auth service |
| `password` | Giá trị là mật khẩu |

## 4. Danh Sách Secret Và Mục Đích

### Database Chung

| Secret ID | Mục đích |
| --- | --- |
| `sagelms-devsecops-db-host` | Host database |
| `sagelms-devsecops-db-port` | Port database |
| `sagelms-devsecops-db-name` | Tên database |

### CloudNativePG

| Secret ID | Mục đích |
| --- | --- |
| `sagelms-devsecops-cnpg-app-username` | Username PostgreSQL cho ứng dụng |
| `sagelms-devsecops-cnpg-app-password` | Password PostgreSQL cho ứng dụng |
| `sagelms-devsecops-cnpg-superuser-password` | Password superuser PostgreSQL |

`cnpg` là viết tắt của CloudNativePG, operator dùng để chạy PostgreSQL trên
Kubernetes.

### Database Credentials Riêng Cho Từng Service

| Secret ID | Mục đích |
| --- | --- |
| `sagelms-devsecops-db-auth-username` | Username database cho auth service |
| `sagelms-devsecops-db-auth-password` | Password database cho auth service |
| `sagelms-devsecops-db-course-username` | Username database cho course service |
| `sagelms-devsecops-db-course-password` | Password database cho course service |
| `sagelms-devsecops-db-content-username` | Username database cho content service |
| `sagelms-devsecops-db-content-password` | Password database cho content service |
| `sagelms-devsecops-db-progress-username` | Username database cho progress service |
| `sagelms-devsecops-db-progress-password` | Password database cho progress service |
| `sagelms-devsecops-db-assessment-username` | Username database cho assessment service |
| `sagelms-devsecops-db-assessment-password` | Password database cho assessment service |
| `sagelms-devsecops-db-ai-tutor-username` | Username database cho AI tutor service |
| `sagelms-devsecops-db-ai-tutor-password` | Password database cho AI tutor service |

Nhóm này phù hợp khi muốn tách quyền database theo từng microservice. Mỗi service
có user/password riêng, giúp giảm rủi ro nếu một service bị lộ credential.

Tại thời điểm viết tài liệu này, manifest Kubernetes trong repo đang dùng chung
`cnpg-app-username` và `cnpg-app-password` qua Kubernetes Secret
`db-app-secret`. Các secret riêng theo service có thể là phần chuẩn bị cho bước
tách quyền sau.

### Redis

| Secret ID | Mục đích |
| --- | --- |
| `sagelms-devsecops-redis-host` | Host Redis |
| `sagelms-devsecops-redis-port` | Port Redis |
| `sagelms-devsecops-redis-password` | Password Redis |

Redis hiện tại:

```text
host = 10.204.0.4
port = 6378
```

Nếu Redis bật authentication, app cần password từ
`sagelms-devsecops-redis-password`.

### App Và Security

| Secret ID | Mục đích |
| --- | --- |
| `sagelms-devsecops-jwt-secret` | Secret ký/xác thực JWT |
| `sagelms-devsecops-gateway-shared-secret` | Secret dùng chung giữa gateway và backend |
| `sagelms-devsecops-internal-api-secret` | Secret xác thực các API nội bộ giữa service |
| `sagelms-devsecops-llm-api-key` | API key cho LLM provider |
| `sagelms-devsecops-harbor-pull-secret` | Credential pull image từ Harbor private registry |
| `sagelms-devsecops-grafana-admin-password` | Password admin Grafana |

### Ghi Chú Về `internal-api-secret`

File Kubernetes `infra/k8s/devsecops/apps/app-shared-externalsecret.yaml` đang
tham chiếu secret:

```text
sagelms-devsecops-internal-api-secret
```

Secret này đã được thêm vào danh sách `secret_suffixes` của module
`secret-manager`, nên OpenTofu quản lý Secret ID này. Value thật đã được thêm
vào Google Secret Manager bằng một chuỗi random mạnh, không lưu trong Git hoặc
OpenTofu state.

## 5. Cách Thêm Giá Trị Vào Secret

Tạo Secret ID bằng OpenTofu không đồng nghĩa với việc secret đã có giá trị.
Cần thêm secret version.

Kiểm tra secret đã tồn tại:

```powershell
gcloud secrets describe sagelms-devsecops-jwt-secret --project sagelms
```

Thêm giá trị cho secret:

```powershell
gcloud secrets versions add sagelms-devsecops-jwt-secret --data-file=-
```

Sau khi chạy lệnh trên, nhập hoặc paste giá trị secret vào terminal, rồi kết
thúc input theo cách terminal yêu cầu.

Liệt kê các version:

```powershell
gcloud secrets versions list sagelms-devsecops-jwt-secret --project sagelms
```

Đọc giá trị secret mới nhất, chỉ dùng khi thật sự cần kiểm tra:

```powershell
gcloud secrets versions access latest --secret sagelms-devsecops-jwt-secret --project sagelms
```

## 6. Kubernetes Lấy Secret Như Thế Nào?

Luồng hoạt động:

```text
Google Secret Manager
        |
        v
External Secrets Operator / ESO
        |
        v
Kubernetes Secret
        |
        v
Pod / Deployment đọc thành biến môi trường
```

Ví dụ trong Kubernetes:

```yaml
remoteRef:
  key: sagelms-devsecops-jwt-secret
```

Nghĩa là External Secrets Operator sẽ đọc secret tên
`sagelms-devsecops-jwt-secret` từ Google Secret Manager.

Sau đó nó tạo Kubernetes Secret, ví dụ:

```text
app-shared-secret
```

Deployment có thể đọc thành biến môi trường:

```text
JWT_SECRET
GATEWAY_SHARED_SECRET
INTERNAL_API_SECRET
```

## 7. `service_account_emails` Là Gì?

`service_account_emails` là danh sách Google Service Account email.

Service Account là tài khoản kỹ thuật cho máy, CI/CD, Kubernetes operator, GKE
node hoặc workload tự động. Nó không phải tài khoản người dùng.

Công thức đặt tên:

```text
<name_prefix>-<vai-trò>-sa@<project_id>.iam.gserviceaccount.com
```

Trong project này:

```text
sagelms-devsecops-<vai-trò>-sa@sagelms.iam.gserviceaccount.com
```

Ví dụ:

```text
sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com
```

Đọc như sau:

| Phần | Ý nghĩa |
| --- | --- |
| `sagelms-devsecops` | Môi trường DevSecOps của SageLMS |
| `eso-sa` | Service account cho External Secrets Operator |
| `sagelms.iam.gserviceaccount.com` | Thuộc GCP project `sagelms` |

## 8. Danh Sách Service Account Và Vai Trò

| Key trong output | Email | Vai trò |
| --- | --- | --- |
| `iac` | `sagelms-devsecops-iac-sa@sagelms.iam.gserviceaccount.com` | Chạy OpenTofu/IaC để tạo và sửa hạ tầng |
| `github_actions` | `sagelms-devsecops-gha-sa@sagelms.iam.gserviceaccount.com` | Cho GitHub Actions đăng nhập GCP qua Workload Identity Federation |
| `eso` | `sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com` | Cho External Secrets Operator đọc Google Secret Manager |
| `flux` | `sagelms-devsecops-flux-sa@sagelms.iam.gserviceaccount.com` | Danh tính cho FluxCD/GitOps nếu cần truy cập GCP |
| `app_runtime` | `sagelms-devsecops-app-sa@sagelms.iam.gserviceaccount.com` | Danh tính dự kiến cho app runtime |
| `cnpg_backup` | `sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com` | Cho CloudNativePG backup lên GCS |
| `gke_nodes` | `sagelms-devsecops-gke-nodes@sagelms.iam.gserviceaccount.com` | Service account gắn cho VM node của GKE |

## 9. Service Account Liên Quan Gì Đến Secret?

Service account quan trọng nhất với secret là:

```text
sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com
```

OpenTofu cấp cho service account này quyền:

```text
roles/secretmanager.secretAccessor
```

Quyền này cho phép đọc giá trị secret trong Google Secret Manager.

Luồng quyền:

```text
Kubernetes ServiceAccount external-secrets
        |
        | Workload Identity
        v
Google Service Account sagelms-devsecops-eso-sa
        |
        | roles/secretmanager.secretAccessor
        v
Google Secret Manager
```

Nghĩa là pod `external-secrets` trong Kubernetes không cần cầm file key JSON.
Nó dùng GKE Workload Identity để map sang Google Service Account và đọc secret
một cách an toàn hơn.

## 10. Workload Identity Là Gì?

Workload Identity là cơ chế để Kubernetes ServiceAccount có thể dùng danh tính
Google Service Account.

Trong project này:

```text
workload_identity_pool = sagelms.svc.id.goog
```

Ví dụ principal của ESO có dạng:

```text
serviceAccount:sagelms.svc.id.goog[platform-system/external-secrets]
```

Đọc như sau:

| Phần | Ý nghĩa |
| --- | --- |
| `sagelms.svc.id.goog` | Workload Identity pool của GKE project `sagelms` |
| `platform-system` | Kubernetes namespace |
| `external-secrets` | Kubernetes ServiceAccount |

Khi Kubernetes ServiceAccount này được gắn annotation tới GCP Service Account
và được cấp IAM `roles/iam.workloadIdentityUser`, pod có thể dùng danh tính GCP
tương ứng.

## 11. Tóm Tắt Phân Biệt Nhanh

| Khái niệm | Dùng để làm gì? | Ví dụ |
| --- | --- | --- |
| Secret ID | Đặt tên nơi lưu dữ liệu bí mật | `sagelms-devsecops-jwt-secret` |
| Secret value/version | Giá trị bí mật thật | JWT secret, password, API key |
| Service Account | Danh tính kỹ thuật để cấp quyền | `sagelms-devsecops-eso-sa@...` |
| IAM role | Quyền gắn cho Service Account | `roles/secretmanager.secretAccessor` |
| Kubernetes Secret | Bản sao secret bên trong cluster | `app-shared-secret` |
| ExternalSecret | Cấu hình kéo secret từ GCP về Kubernetes | `remoteRef.key` |
| Workload Identity | Cầu nối KSA -> GSA | `platform-system/external-secrets` -> `eso-sa` |

## 12. Checklist Quản Lý Secret

Khi thêm một secret mới:

1. Đặt tên theo format:

   ```text
   sagelms-devsecops-<nhóm>-<mục-đích>
   ```

2. Thêm suffix vào `infra/opentofu/modules/secret-manager/variables.tf` nếu
   muốn OpenTofu quản lý Secret ID.

3. Chạy OpenTofu để tạo Secret ID.

4. Thêm giá trị thật vào Google Secret Manager bằng `gcloud` hoặc Console.

5. Tạo hoặc sửa `ExternalSecret` để map:

   ```text
   Google Secret Manager secret -> Kubernetes Secret key
   ```

6. Sửa Deployment/ConfigMap nếu app cần đọc biến môi trường mới.

7. Kiểm tra sync:

   ```powershell
   kubectl get externalsecret -A
   kubectl get secret -n sagelms-devsecops
   ```

## 13. Checklist Quản Lý Service Account

Khi thêm một service account mới:

1. Đặt tên theo format:

   ```text
   sagelms-devsecops-<vai-trò>-sa
   ```

2. Chỉ cấp IAM role đúng mức cần thiết.

3. Nếu workload chạy trong Kubernetes, cấu hình Workload Identity thay vì dùng
   service account key JSON.

4. Nếu workload là GitHub Actions, dùng Workload Identity Federation thay vì lưu
   GCP key trong GitHub Secret.

5. Kiểm tra ai có quyền impersonate service account đó.

## 14. Nguyên Tắc An Toàn

- Không commit giá trị secret thật.
- Không đưa secret value vào OpenTofu output.
- Không dùng chung một password cho nhiều service nếu có thể tách riêng.
- Không cấp quyền `Owner` hoặc `Editor` nếu chỉ cần đọc secret.
- Ưu tiên Workload Identity/Workload Identity Federation thay cho service
  account key JSON.
- Xoay vòng secret nếu nghi ngờ bị lộ.
- Đặt tên secret rõ mục đích để sau này audit dễ hơn.
