# Module: gke

Module này tạo GKE Standard regional cluster cho môi trường DevSecOps.

## Tài nguyên quản lý

- GKE Standard regional cluster
- Custom node pool chính
- GKE node service account
- IAM roles tối thiểu cho node service account

## Cấu hình mặc định

- Cluster: `sagelms-devsecops-gke`
- Node pool: `sagelms-devsecops-main-pool`
- Machine type: `e2-standard-4`
- Disk: `pd-balanced`, 50 GB
- Private nodes: enabled
- Workload Identity: enabled
- Release channel: `REGULAR`
- Network Policy: enabled
- Intranode visibility: enabled
- Shielded nodes: enabled

## Control plane access

Cluster dùng private nodes nhưng control plane public endpoint được giới hạn bằng `master_authorized_networks`.

Không giả định GitHub hosted runner có IP cố định để `kubectl` trực tiếp vào cluster. Runtime deploy nên đi qua GitOps/FluxCD trong cluster.

## Input chính

- `project_id`
- `region`
- `zones`
- `network_name`
- `subnet_name`
- `pods_range`
- `services_range`
- `master_authorized_networks`

## Output chính

- `cluster_name`
- `cluster_location`
- `node_pool_name`
- `node_service_account_email`
- `workload_identity_pool`

## Lưu ý

Module có Checkov skip có lý do cho Binary Authorization và Google Groups RBAC vì các phần này thuộc workstream supply-chain/platform policy riêng.
