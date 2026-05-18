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
- Private Service Access: đã bật cho Cloud SQL và Memorystore Redis

## Dịch Vụ Managed

- Cloud SQL PostgreSQL 16 được provision với private IP only.
- Database name là `sagelms`.
- DB username theo từng service được ghi trong outputs. Password được tạo ngoài OpenTofu và lưu trong Secret Manager.
- Cloud SQL yêu cầu encrypted connection với `ssl_mode = "ENCRYPTED_ONLY"`.
- Memorystore Redis 7 Standard HA được provision với private IP.
- Redis AUTH được bật mặc định. AUTH string do Google sinh ra là dữ liệu nhạy cảm và phải được lưu vào Secret Manager ngoài workflow OpenTofu.
- Redis transit encryption đã bật. Workload client phải được cấu hình TLS.

## GKE

- Kiểu cluster: GKE Standard regional
- Nodes: private nodes, không có external IP
- Control plane: public endpoint nhưng bị giới hạn bằng master authorized networks
- Workload Identity: đã bật với pool `<project_id>.svc.id.goog`
- Node pool: `e2-standard-4`, ban đầu một node trên mỗi configured zone, autoscaling 1-2 nodes/zone
- Node locations hiện tại của `devsecops`: `asia-southeast1-b`, `asia-southeast1-c`

## Runtime Bootstrap Hiện Tại

- Namespaces đã tồn tại: `sagelms-devsecops`, `platform-system`, `harbor`, `monitoring`.
- External Secrets Operator đã được cài trong namespace `platform-system`.
- ESO dùng KSA `platform-system/external-secrets` map với GSA `sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com`.
- ClusterSecretStore `gcpsm-sagelms-devsecops` đang `Ready=True`.
- ExternalSecrets cho DB, Redis, JWT, gateway shared secret và Grafana admin đã đồng bộ.
- Harbor pull secret và LLM API key hiện mới có metadata, chờ value thật từ nhóm.

## Ghi Chú Vận Hành

- Chạy bootstrap trước environment chính.
- Apply thay đổi theo từng phase và đọc kỹ mọi plan trước khi apply.
- Không commit `terraform.tfvars`, state files, tfplans hoặc file local chứa secret.
- Giữ nguyên namespace `sagelms-dev` cũ trong `infra/k8s`; cloud runtime mới dùng `sagelms-devsecops`.
- Trên workstation này, Cloud SDK nằm tại `C:\Users\THANG\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin`; thêm path này vào `PATH` nếu `gcloud` hoặc `gke-gcloud-auth-plugin.exe` không được tìm thấy.

## Rủi Ro Đã Biết

- Cloud SQL deletion protection được bật ở cấp OpenTofu resource; nếu destroy có chủ đích thì cần đổi biến trước.
- Cloud SQL DB users và schemas được tạo bằng bước post-provision có kiểm soát vì password không nên nằm trong OpenTofu state.
- Redis AUTH string có thể xuất hiện trong OpenTofu state vì provider expose nó như một sensitive generated attribute. Cần giới hạn quyền đọc state bucket.
- Redis TLS có thể yêu cầu cấu hình trust-store ở phía ứng dụng. Cần validate từng service client trước khi rollout.
- `devsecops` hiện dùng hai GKE node zones thay vì mục tiêu ba zones ban đầu. Cần giữ ghi chú này như một đánh đổi về cost/quota, hoặc thêm `asia-southeast1-a` nếu cần bám sát cấu hình nền ba zones.
