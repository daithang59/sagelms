# Module: redis

Module này tạo Memorystore Redis cho queue/cache của SageLMS.

## Tài nguyên quản lý

- Memorystore Redis instance `sagelms-devsecops-redis`

## Cấu hình mặc định

- Version: Redis 7
- Tier: `STANDARD_HA`
- Memory: 5 GB
- Network: private IP qua VPC
- Connect mode: Private Service Access
- AUTH: enabled
- In-transit encryption: `SERVER_AUTHENTICATION`

## Input chính

- `project_id`
- `region`
- `name_prefix`
- `network_self_link`
- `memory_size_gb`
- `redis_version`
- `tier`
- `auth_enabled`
- `transit_encryption_mode`

## Output chính

- `instance_name`
- `host`
- `port`
- `current_location_id`
- `alternative_location_id`
- `auth_string`
- `secret_names_for_connection_info`

## Lưu ý bảo mật

`auth_string` là sensitive output. Cần đưa giá trị này vào Secret Manager secret `sagelms-devsecops-redis-password` ngoài OpenTofu workflow và hạn chế quyền đọc remote state.
