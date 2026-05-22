# 🛠 docs/runbooks — Hướng dẫn vận hành

## Mục đích

Chứa các **runbook** — hướng dẫn từng bước để xử lý các tình huống vận hành, troubleshooting, và setup.

## Nội dung hiện tại

```
runbooks/
├── local-dev.md                              ← Hướng dẫn troubleshooting local development
├── sonarqube-local.md                        ← Hướng dẫn chạy SonarQube self-hosted
├── self-hosted-github-runner.md              ← Hướng dẫn setup GitHub Actions runner
├── devsecops-cloud-iac-manual-operations.md ← Vận hành thủ công Cloud/IaC DevSecOps
├── member-3-gcp-gcloud-setup.md             ← Hướng dẫn Member 3 cài gcloud và truy cập GKE
└── cloudnativepg-foundation-manual-operations.md ← Chạy thủ công CloudNativePG foundation/runtime
```

### `local-dev.md`

Hướng dẫn khắc phục các lỗi thường gặp khi chạy local:
- Lỗi kết nối PostgreSQL
- Port bị chiếm
- Flyway migration conflict
- Docker Compose issues
- Vite dev server errors

### `sonarqube-local.md`

Hướng dẫn chạy SonarQube self-hosted bằng Docker Compose:
- start/stop/reset bằng script
- URL và default login
- lưu ý `vm.max_map_count` trên Linux
- cách dùng với GitHub Actions và self-hosted runner

### `self-hosted-github-runner.md`

Hướng dẫn tạo, cấu hình và phân label cho self-hosted GitHub Actions runner:
- setup bằng PowerShell/Bash script
- gắn label cho PR/build/infra/security
- chạy runner như service
- unregister khi không dùng nữa

### `devsecops-cloud-iac-manual-operations.md`

Hướng dẫn vận hành phần Cloud/IaC DevSecOps:
- Chạy bootstrap và environment bằng OpenTofu
- Kiểm tra GKE, CloudNativePG backup foundation, Redis, Secret Manager, ESO
- Tạm dừng để tiết kiệm chi phí
- Xóa và tạo lại tài nguyên đúng thứ tự

### `member-3-gcp-gcloud-setup.md`

Hướng dẫn cho Member 3:
- Cài Google Cloud CLI, `kubectl`, `gke-gcloud-auth-plugin`, Helm và Flux CLI
- Đăng nhập GCP, lấy kubeconfig GKE và kiểm tra quyền
- Dùng các lệnh `gcloud`/`kubectl` thường gặp cho Runtime Platform
- Phân biệt khi nào cần SSH key và khi nào không cần

### `cloudnativepg-foundation-manual-operations.md`

Ghi lại lệnh đã chạy khi chuyển từ Cloud SQL sang CloudNativePG, gồm OpenTofu foundation, bật lại node pool, namespace/KSA/ExternalSecret, operator/plugin, Cluster CR, WAL archive và manual backup.

## Dự kiến bổ sung

```
runbooks/
├── local-dev.md           ← ✅ Hiện có
├── devsecops-cloud-iac-manual-operations.md ← ✅ Hiện có
├── member-3-gcp-gcloud-setup.md ← ✅ Hiện có
├── db-migration.md        ← Hướng dẫn tạo/chạy database migration
├── deploy-staging.md      ← Deploy lên staging (K8s)
└── incident-response.md   ← Quy trình xử lý sự cố
```
