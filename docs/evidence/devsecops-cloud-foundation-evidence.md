# Bằng Chứng Triển Khai Cloud Foundation DevSecOps

Ngày cập nhật: 2026-05-18, Asia/Saigon.

File kế hoạch gốc: `docs/ke-hoach-thuc-hien-phan-viec-thang-cloud-iac.md`.

## Đối Chiếu Phạm Vi

File kế hoạch hiện tại là đủ cho phạm vi Cloud/IaC mà Thắng phụ trách. Nội dung đã bao phủ GCP baseline, cấu trúc OpenTofu, remote state, VPC/Subnet, GKE, IAM, Workload Identity, Secret Manager, Cloud Storage, Cloud SQL, Redis, namespaces, outputs, tài liệu và handoff.

File kế hoạch cũng ghi rõ các phần sau là công việc phối hợp/hỗ trợ, không phải phần Thắng làm chính:

- GitHub Actions PR/build/deploy workflow: Thành viên 1 phụ trách chính.
- Dockerfile, Harbor, Trivy, SBOM, Cosign: Thành viên 2 phụ trách chính.
- Helm/Kustomize, FluxCD runtime, ESO, Kyverno, observability: Thành viên 3 phụ trách chính.
- Vertical slice `auth-service`: Thắng cung cấp cloud foundation, namespaces, secret strategy và hỗ trợ kiểm tra rollout; image/build/manifests phụ thuộc các owner khác.

Vì vậy, chỉ làm đúng file kế hoạch này là đủ để hoàn thành phần Cloud/IaC được giao cho Thắng. Tuy nhiên, riêng file này không đủ để hoàn tất toàn bộ pipeline DevSecOps end-to-end nếu các phần phụ thuộc của Thành viên 1/2/3 chưa hoàn thành.

## Kết Quả Validation

- `tofu validate`: pass.
- `tofu plan -no-color -detailed-exitcode`: exit code 0, no changes.
- `checkov -d infra/opentofu --quiet`: 126 passed, 0 failed, 19 skipped.
- Remote state bucket `sagelms-devsecops-tofu-state`: đã bật versioning, uniform bucket-level access và public access prevention.
- GKE cluster `sagelms-devsecops-gke`: đang chạy trong `asia-southeast1`.
- GKE node pool `sagelms-devsecops-main-pool`: `e2-standard-4`, zones `asia-southeast1-b` và `asia-southeast1-c`, 2 node Ready.
- Cloud SQL `sagelms-devsecops-postgres`: `POSTGRES_16`, private IP `10.204.1.3`, trạng thái `RUNNABLE`.
- Cloud SQL database: `sagelms`.
- Cloud SQL users: `sagelms_auth`, `sagelms_course`, `sagelms_content`, `sagelms_progress`, `sagelms_assessment`, `sagelms_ai_tutor`.
- Memorystore Redis `sagelms-devsecops-redis`: host `10.204.0.4`, port `6378`, trạng thái `READY`, đã bật AUTH và transit encryption.
- Namespaces đã tồn tại: `sagelms-devsecops`, `platform-system`, `harbor`, `monitoring`.
- External Secrets Operator đã được cài trong `platform-system`.
- ClusterSecretStore `gcpsm-sagelms-devsecops`: `Valid`, `Ready=True`.
- ExternalSecrets đã đồng bộ trong `sagelms-devsecops`: DB common, DB secret theo từng service, Redis, JWT, gateway shared secret.
- ExternalSecret đã đồng bộ trong `monitoring`: Grafana admin secret.

## Đã Hoàn Thành Trong Phạm Vi Của Thắng

- Cấu trúc OpenTofu module/environment.
- Bootstrap remote state bucket.
- Bật project services/APIs.
- VPC/Subnet, secondary ranges, Cloud NAT, Private Service Access.
- GKE Standard cluster và node pool.
- Bật Workload Identity.
- Service accounts cho IaC, GitHub Actions, ESO, FluxCD, app runtime và GKE nodes.
- GitHub Workload Identity Federation provider cho `daithang59/sagelms` trên branch `main`.
- Secret Manager metadata cho DB, Redis, JWT, gateway shared secret, LLM, Harbor và Grafana.
- Cấp quyền để ESO đọc Secret Manager.
- Cloud Storage buckets cho evidence/materials.
- Cloud SQL PostgreSQL 16 private IP và database `sagelms`.
- Memorystore Redis Standard HA private IP với AUTH và TLS.
- Áp dụng namespace convention.
- Bootstrap runtime tối thiểu cho ESO và ExternalSecrets.
- Cập nhật `infra/opentofu/outputs.md` để bàn giao.
- Cập nhật `docs/cloud-foundation.md` và `docs/iam-workload-identity.md`.

## Phần Còn Chờ Input Hoặc Phụ Thuộc Nhóm

- `sagelms-devsecops-harbor-pull-secret` chưa có secret version thật. Thành viên 2 cần cung cấp Harbor endpoint/project và robot credential hoặc Docker config JSON.
- `sagelms-devsecops-llm-api-key` chưa có secret version thật. Nhóm cần cung cấp API key thật của LLM provider.
- FluxCD chưa được bootstrap; `flux` CLI chưa có trong shell hiện tại. Thành viên 3 phụ trách runtime GitOps, Thắng hỗ trợ bằng thông tin GKE/namespace/IAM.
- `auth-service` chưa được deploy vì image digest, Harbor artifact và runtime manifests còn phụ thuộc các workstream application/supply-chain/runtime.
- GitHub Actions workflows chưa được implement trong bước Cloud/IaC này. Thành viên 1 phụ trách workflow, dùng WIF provider và service account đã chuẩn bị.
- Redis client phải được cấu hình TLS trước khi rollout ứng dụng.

## Các Khác Biệt Cần Ghi Rõ

- Cấu hình nền chính thức trong kế hoạch nhắc ba zones: `asia-southeast1-a`, `asia-southeast1-b`, `asia-southeast1-c`. Môi trường `devsecops` đang chạy hiện dùng hai zones: `asia-southeast1-b`, `asia-southeast1-c`. Đây là đánh đổi chấp nhận được về cost/quota nếu đã ghi rõ; có thể thêm lại `asia-southeast1-a` nếu cần bám tuyệt đối ba zones.
- Cloud SQL point-in-time recovery đang tắt theo cost profile hiện tại. Backup vẫn được bật.
- Cloud SQL dùng `ssl_mode = "ENCRYPTED_ONLY"` thay cho `require_ssl` đã deprecated.
