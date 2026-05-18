# Bằng Chứng Triển Khai Cloud Foundation DevSecOps

Ngày cập nhật: 2026-05-18, Asia/Saigon.

File kế hoạch gốc: `docs/ke-hoach-thuc-hien-phan-viec-thang-cloud-iac.md`.

## Đối Chiếu Phạm Vi

File kế hoạch hiện tại là đủ cho phạm vi Cloud/IaC mà Thắng phụ trách. Nội dung đã bao phủ GCP baseline, cấu trúc OpenTofu, remote state, VPC/Subnet, GKE, IAM, Workload Identity, Secret Manager, Cloud Storage, CloudNativePG backup foundation, Redis, namespaces, outputs, tài liệu và handoff.

File kế hoạch cũng ghi rõ các phần sau là công việc phối hợp/hỗ trợ, không phải phần Thắng làm chính:

- GitHub Actions PR/build/deploy workflow: Thành viên 1 phụ trách chính.
- Dockerfile, Harbor, Trivy, SBOM, Cosign: Thành viên 2 phụ trách chính.
- Helm/Kustomize, FluxCD runtime, ESO, Kyverno, observability: Thành viên 3 phụ trách chính.
- Vertical slice `auth-service`: Thắng cung cấp cloud foundation, namespaces, secret strategy và hỗ trợ kiểm tra rollout; image/build/manifests phụ thuộc các owner khác.

Vì vậy, chỉ làm đúng file kế hoạch này là đủ để hoàn thành phần Cloud/IaC được giao cho Thắng. Tuy nhiên, riêng file này không đủ để hoàn tất toàn bộ pipeline DevSecOps end-to-end nếu các phần phụ thuộc của Thành viên 1/2/3 chưa hoàn thành.

## Kết Quả Validation

- `tofu validate`: pass.
- `tofu apply cnpg-foundation-targeted.tfplan`: đã tạo CloudNativePG backup bucket, backup GSA, Workload Identity binding và secret metadata CNPG.
- `tofu plan -refresh-only` + `tofu apply refresh-outputs.tfplan`: đã đồng bộ lại outputs/state sau khi bỏ Cloud SQL.
- `tofu plan -no-color -detailed-exitcode`: exit code 2, hiện còn 1 thay đổi dự kiến là tạo lại GKE node pool `sagelms-devsecops-main-pool`, vì node pool đang bị xóa tạm thời để tiết kiệm compute. Không còn thay đổi Cloud SQL.
- `checkov -d infra/opentofu --quiet`: 109 passed, 0 failed, 18 skipped.
- Remote state bucket `sagelms-devsecops-tofu-state`: đã bật versioning, uniform bucket-level access và public access prevention.
- GKE cluster `sagelms-devsecops-gke`: đang chạy trong `asia-southeast1`.
- GKE node pool `sagelms-devsecops-main-pool`: hiện không tồn tại trong cloud do pause compute; OpenTofu sẽ tạo lại khi cần chạy runtime.
- Cloud SQL `sagelms-devsecops-postgres`: đã xóa; `gcloud sql instances describe` trả về 404.
- Cloud SQL Admin API `sqladmin.googleapis.com`: đã disable khỏi project sau khi bỏ Cloud SQL khỏi baseline.
- CloudNativePG backup bucket `sagelms-cnpg-backup-sagelms`: đã tạo ở `ASIA-SOUTHEAST1`, bật versioning, uniform bucket-level access, public access prevention và lifecycle xóa object sau 30 ngày.
- CloudNativePG backup GSA `sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com`: đã tạo.
- CloudNativePG Workload Identity binding: `serviceAccount:sagelms.svc.id.goog[sagelms-data/sagelms-postgres]` có quyền impersonate backup GSA.
- CloudNativePG Secret Manager values đã có version cho host nội bộ, port/name, `sagelms_app`, app password và superuser password.
- Memorystore Redis `sagelms-devsecops-redis`: host `10.204.0.4`, port `6378`, trạng thái `READY`, đã bật AUTH và transit encryption.
- Namespaces hiện tại: `sagelms-devsecops`, `platform-system`, `cnpg-system`, `sagelms-data`, `harbor`, `monitoring`.
- KSA `sagelms-data/sagelms-postgres` đã được tạo và annotate với backup GSA.
- Manifest `infra/k8s/devsecops/cnpg-foundation.yaml` đã chuẩn bị ExternalSecret cho `db-app-secret`, `sagelms-postgres-app-secret` và `sagelms-postgres-superuser-secret`.
- Apply ExternalSecret mới hiện bị chặn vì ESO validating webhook không có endpoint khi node pool đang tắt; cần apply lại `kubectl apply -k infra/k8s/devsecops` sau khi tạo lại node pool.
- External Secrets Operator đã được cài trong `platform-system`, nhưng hiện không có pod chạy vì node pool đang tắt.
- ClusterSecretStore object `gcpsm-sagelms-devsecops`: `Valid`, `Ready=True`.
- ExternalSecrets đã đồng bộ trong `sagelms-devsecops`: DB common, DB secret theo từng service, Redis, JWT, gateway shared secret.
- ExternalSecret đã đồng bộ trong `monitoring`: Grafana admin secret.

## Đã Hoàn Thành Trong Phạm Vi Của Thắng

- Cấu trúc OpenTofu module/environment.
- Bootstrap remote state bucket.
- Bật project services/APIs.
- VPC/Subnet, secondary ranges, Cloud NAT, Private Service Access.
- GKE Standard cluster và cấu hình node pool.
- Bật Workload Identity.
- Service accounts cho IaC, GitHub Actions, ESO, FluxCD, app runtime và GKE nodes.
- GitHub Workload Identity Federation provider cho `daithang59/sagelms` trên branch `main`.
- Secret Manager metadata cho DB, Redis, JWT, gateway shared secret, LLM, Harbor và Grafana.
- Cấp quyền để ESO đọc Secret Manager.
- Cloud Storage buckets cho evidence/materials.
- CloudNativePG backup foundation: GCS bucket, backup GSA, bucket IAM và Workload Identity binding cho KSA `sagelms-data/sagelms-postgres`.
- Memorystore Redis Standard HA private IP với AUTH và TLS.
- Áp dụng namespace convention.
- Bootstrap runtime tối thiểu cho ESO và ExternalSecrets.
- Cập nhật `infra/opentofu/outputs.md` để bàn giao.
- Cập nhật `docs/cloud-foundation.md` và `docs/iam-workload-identity.md`.

## Phần Còn Chờ Input Hoặc Phụ Thuộc Nhóm

- `sagelms-devsecops-harbor-pull-secret` chưa có secret version thật. Thành viên 2 cần cung cấp Harbor endpoint/project và robot credential hoặc Docker config JSON.
- `sagelms-devsecops-llm-api-key` chưa có secret version thật. Nhóm cần cung cấp API key thật của LLM provider.
- GKE node pool đang bị xóa để tiết kiệm chi phí; cần tạo lại node pool bằng OpenTofu trước khi deploy CloudNativePG runtime, ESO, FluxCD hoặc app workload.
- Cần apply lại `infra/k8s/devsecops` sau khi node pool chạy để tạo 3 ExternalSecret mới cho CloudNativePG.
- CloudNativePG operator, Barman Cloud Plugin, ObjectStore, Cluster CR và ScheduledBackup chưa deploy; đây là phần runtime/GitOps tiếp theo cần phối hợp Member 3.
- FluxCD chưa được bootstrap; `flux` CLI chưa có trong shell hiện tại. Thành viên 3 phụ trách runtime GitOps, Thắng hỗ trợ bằng thông tin GKE/namespace/IAM.
- `auth-service` chưa được deploy vì image digest, Harbor artifact và runtime manifests còn phụ thuộc các workstream application/supply-chain/runtime.
- GitHub Actions workflows chưa được implement trong bước Cloud/IaC này. Thành viên 1 phụ trách workflow, dùng WIF provider và service account đã chuẩn bị.
- Redis client phải được cấu hình TLS trước khi rollout ứng dụng.

## Các Khác Biệt Cần Ghi Rõ

- Cấu hình nền chính thức trong kế hoạch nhắc ba zones: `asia-southeast1-a`, `asia-southeast1-b`, `asia-southeast1-c`. Môi trường `devsecops` đang chạy hiện dùng hai zones: `asia-southeast1-b`, `asia-southeast1-c`. Đây là đánh đổi chấp nhận được về cost/quota nếu đã ghi rõ; có thể thêm lại `asia-southeast1-a` nếu cần bám tuyệt đối ba zones.
- Database baseline đã chuyển từ Cloud SQL sang CloudNativePG. Vì cloud chưa có dữ liệu cần migrate, Cloud SQL cũ đã được xóa thay vì migrate.
- Full OpenTofu plan hiện không no-op do node pool bị pause bằng cách xóa khỏi cloud. Đây là drift có chủ đích để tiết kiệm chi phí; apply full plan sẽ tạo lại node pool.
- Runtime CloudNativePG sẽ phụ thuộc GKE node pool. Không coi PVC là backup; bắt buộc cấu hình backup/WAL archive ra GCS và làm restore drill.
