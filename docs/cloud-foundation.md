# Nền Tảng Cloud SageLMS

## Cấu Hình Nền

- Cloud: Google Cloud project `sagelms`
- Region: `asia-southeast1`
- Môi trường: `devsecops`
- IaC: OpenTofu trong thư mục `infra/opentofu`
- Remote state: GCS bucket `sagelms-devsecops-tofu-state`
- Runtime: GKE Standard regional cluster `sagelms-devsecops-gke`
- Cập nhật lần cuối: 2026-05-18, Asia/Saigon

## Mạng

- Custom VPC: `sagelms-devsecops-vpc`
- Subnet: `sagelms-devsecops-subnet`
- Primary CIDR: `10.10.0.0/20`
- Pods range: `10.20.0.0/16`
- Services range: `10.30.0.0/20`
- Private Google Access: đã bật
- Cloud NAT: đã bật cho private GKE nodes
- Private Service Access: đã bật cho Memorystore Redis và Google managed services cần PSA

## Database Và Dịch Vụ Managed

- Database baseline đã chuyển sang CloudNativePG trên GKE với PostgreSQL 16.
- Cloud SQL cũ `sagelms-devsecops-postgres` đã xóa vì môi trường cloud chưa có dữ liệu cần migrate.
- Cloud SQL Admin API đã disable khỏi project sau khi loại Cloud SQL khỏi baseline.
- OpenTofu chỉ quản lý CloudNativePG backup foundation: GCS bucket, Google Service Account, bucket IAM và Workload Identity binding cho KSA `sagelms-data/sagelms-postgres`.
- CloudNativePG runtime gồm operator, Barman Cloud Plugin, Cluster CR, ObjectStore và ScheduledBackup sẽ được quản lý bằng GitOps/FluxCD.
- Database name là `sagelms`.
- App user MVP là `sagelms_app`.
- Endpoint runtime dự kiến là `sagelms-postgres-rw.sagelms-data.svc.cluster.local:5432`.
- Secret Manager đã có version cho DB host/port/name, CNPG app username/password và CNPG superuser password.
- Memorystore Redis 7 Standard HA được provision với private IP.
- Redis AUTH được bật mặc định. AUTH string do Google sinh ra là dữ liệu nhạy cảm và phải được lưu vào Secret Manager ngoài workflow OpenTofu.
- Redis transit encryption đã bật. Workload client phải được cấu hình TLS.

## GKE

- Kiểu cluster: GKE Standard regional
- Nodes: private nodes, không có external IP
- Control plane: public endpoint nhưng bị giới hạn bằng master authorized networks
- Workload Identity: đã bật với pool `<project_id>.svc.id.goog`
- Node pool theo cấu hình: `e2-standard-4`, ban đầu một node trên mỗi configured zone, autoscaling 1-2 nodes/zone
- Node locations hiện tại của `devsecops`: `asia-southeast1-b`, `asia-southeast1-c`
- Trạng thái vận hành hiện tại: node pool đang bị xóa tạm thời để tiết kiệm compute; apply OpenTofu full plan sẽ tạo lại node pool.

## Runtime Bootstrap Hiện Tại

- Namespace convention: `sagelms-devsecops`, `platform-system`, `cnpg-system`, `sagelms-data`, `harbor`, `monitoring`.
- Namespace `cnpg-system` và `sagelms-data` đã tạo trên cluster.
- KSA `sagelms-data/sagelms-postgres` đã annotate với `sagelms-devsecops-cnpg-sa@sagelms.iam.gserviceaccount.com`.
- External Secrets Operator đã từng được bootstrap trong namespace `platform-system`; khi node pool đang bị xóa, controller workload không chạy cho đến khi node pool được tạo lại.
- ESO dùng KSA `platform-system/external-secrets` map với GSA `sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com`.
- ClusterSecretStore `gcpsm-sagelms-devsecops` đang `Ready=True`.
- ExternalSecrets cho DB, Redis, JWT, gateway shared secret và Grafana admin đã đồng bộ.
- Manifest ExternalSecret mới cho CloudNativePG nằm ở `infra/k8s/devsecops`; apply hiện bị chặn cho tới khi ESO webhook chạy lại trên node pool.
- Harbor pull secret và LLM API key hiện mới có metadata, chờ value thật từ nhóm.

## Ghi Chú Vận Hành

- Chạy bootstrap trước environment chính.
- Apply thay đổi theo từng phase và đọc kỹ mọi plan trước khi apply.
- Không commit `terraform.tfvars`, state files, tfplans hoặc file local chứa secret.
- Giữ nguyên namespace `sagelms-dev` cũ trong `infra/k8s`; cloud runtime mới dùng `sagelms-devsecops`.
- Trên workstation này, Cloud SDK nằm tại `C:\Users\THANG\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin`; thêm path này vào `PATH` nếu `gcloud` hoặc `gke-gcloud-auth-plugin.exe` không được tìm thấy.

## Rủi Ro Đã Biết

- Full OpenTofu plan hiện còn pending tạo lại node pool do trạng thái pause compute có chủ đích. Không apply full plan nếu vẫn muốn giữ GKE không có worker node.
- CloudNativePG chạy cùng failure domain với GKE. Không coi PVC là backup; phải bật base backup/WAL archive ra GCS và chạy restore drill trước khi bàn giao dữ liệu thật.
- CloudNativePG secret value được tạo ngoài OpenTofu để tránh đưa password vào state.
- Redis AUTH string có thể xuất hiện trong OpenTofu state vì provider expose nó như một sensitive generated attribute. Cần giới hạn quyền đọc state bucket.
- Redis TLS có thể yêu cầu cấu hình trust-store ở phía ứng dụng. Cần validate từng service client trước khi rollout.
- `devsecops` hiện dùng hai GKE node zones thay vì mục tiêu ba zones ban đầu. Cần giữ ghi chú này như một đánh đổi về cost/quota, hoặc thêm `asia-southeast1-a` nếu cần bám sát cấu hình nền ba zones.
