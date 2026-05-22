# Module: network

Module này tạo nền network riêng cho GKE private nodes, CloudNativePG workloads và Memorystore Redis private IP.

## Tài nguyên quản lý

- Custom VPC
- Subnet regional
- Secondary IP ranges cho GKE Pods/Services
- Private Google Access
- Cloud Router
- Cloud NAT
- Reserved internal range cho Private Service Access
- Service Networking connection
- Firewall rule nội bộ tối thiểu

## CIDR mặc định

| Mục | CIDR |
|---|---|
| Subnet primary | `10.10.0.0/20` |
| GKE Pods | `10.20.0.0/16` |
| GKE Services | `10.30.0.0/20` |

## Input chính

- `project_id`
- `region`
- `name_prefix`
- `subnet_cidr`
- `pods_cidr`
- `services_cidr`

## Output chính

- `vpc_name`
- `vpc_self_link`
- `subnet_name`
- `subnet_self_link`
- `pods_range_name`
- `services_range_name`
- `private_service_access_connection_id`

## Lưu ý

Module `redis` phụ thuộc vào output network, đặc biệt là `vpc_self_link` và Private Service Access. CloudNativePG chạy trong GKE nên dùng subnet/pod range của cluster và backup ra GCS qua egress/NAT/Private Google Access.
