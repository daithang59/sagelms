# IAM Và Workload Identity

Cập nhật lần cuối: 2026-05-18, Asia/Saigon.

## Service Accounts GCP

GCP service account ID bị giới hạn 30 ký tự. Phần triển khai hiện dùng account ID rút gọn nhưng vẫn giữ display name rõ nghĩa.

| Mục đích | Service account |
|---|---|
| IaC | `sagelms-devsecops-iac-sa@sagelms.iam.gserviceaccount.com` |
| GitHub Actions | `sagelms-devsecops-gha-sa@sagelms.iam.gserviceaccount.com` |
| External Secrets Operator | `sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com` |
| FluxCD | `sagelms-devsecops-flux-sa@sagelms.iam.gserviceaccount.com` |
| App runtime | `sagelms-devsecops-app-sa@sagelms.iam.gserviceaccount.com` |
| CloudNativePG backup | `sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com` |

## GitHub Actions Truy Cập GCP

GitHub Actions phải dùng Workload Identity Federation. Cấu hình nền không dùng Google service account key JSON dài hạn.

Giá trị WIF mặc định:

```text
wif_pool_id     = sagelms-devsecops-github-pool
wif_provider_id = github
```

GitHub provider chỉ tin cậy repository và deploy branch đã cấu hình:

```text
assertion.repository == "daithang59/sagelms" && assertion.ref == "refs/heads/main"
```

Workflow apply chỉ nên chạy từ deploy branch đã bảo vệ và cần GitHub Environment approval.

## Kubernetes Truy Cập GCP

External Secrets Operator dùng Kubernetes Workload Identity:

```text
KSA: platform-system/external-secrets
GSA: sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com
IAM member: serviceAccount:sagelms.svc.id.goog[platform-system/external-secrets]
```

ESO được cấp `roles/secretmanager.secretAccessor` trên các Secret Manager metadata do OpenTofu tạo cho SageLMS.

Trạng thái thực tế hiện tại:

```text
KSA annotation: iam.gke.io/gcp-service-account=sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com
ClusterSecretStore: gcpsm-sagelms-devsecops
ClusterSecretStore status: Valid, Ready=True
```

FluxCD đã có Google service account chuẩn bị sẵn:

```text
GSA: sagelms-devsecops-flux-sa@sagelms.iam.gserviceaccount.com
```

Chưa có FluxCD KSA mapping được kích hoạt vì FluxCD chưa được bootstrap.

CloudNativePG backup dùng Kubernetes Workload Identity:

```text
KSA: sagelms-data/sagelms-postgres
GSA: sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com
IAM member: serviceAccount:sagelms.svc.id.goog[sagelms-data/sagelms-postgres]
```

GSA này được cấp `roles/storage.objectAdmin` trên bucket `sagelms-cnpg-backup-sagelms` để ghi base backup/WAL và đọc khi restore.

## Quy Ước Secret Cho Runtime

`auth-service` cần các environment variables sau:

| Env var | Kubernetes Secret/key nguồn |
|---|---|
| `DB_HOST` | `db-common-secret.DB_HOST` |
| `DB_PORT` | `db-common-secret.DB_PORT` |
| `DB_NAME` | `db-common-secret.DB_NAME` |
| `DB_USER` | `db-app-secret.DB_USER` |
| `DB_PASSWORD` | `db-app-secret.DB_PASSWORD` |
| `JWT_SECRET` | `jwt-secret.JWT_SECRET` |
| `GATEWAY_SHARED_SECRET` | `gateway-shared-secret.GATEWAY_SHARED_SECRET` |

OpenTofu chỉ tạo Secret Manager metadata. Secret versions phải được thêm ngoài OpenTofu bằng `gcloud secrets versions add`.
