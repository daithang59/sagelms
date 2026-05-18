# Module: cloud-sql

Module này tạo Cloud SQL PostgreSQL 16 private IP cho SageLMS.

## Tài nguyên quản lý

- Cloud SQL PostgreSQL instance
- Database `sagelms`

## Không quản lý

Module không tạo DB users/password bằng OpenTofu để tránh password đi vào state.

DB users dự kiến:

```text
sagelms_auth
sagelms_course
sagelms_content
sagelms_progress
sagelms_assessment
sagelms_ai_tutor
```

User, password, schema và grant nên được tạo bằng quy trình hậu triển khai có kiểm soát.

## Cấu hình mặc định

- Version: `POSTGRES_16`
- Tier: `db-custom-2-7680`
- Availability: `ZONAL`
- Disk: SSD 50 GB, autoresize
- Public IP: disabled
- Private IP: enabled qua VPC/Private Service Access
- Backup: enabled
- Deletion protection: enabled ở environment
- PostgreSQL audit/logging flags: enabled

## Input chính

- `network_self_link`
- `private_service_access_connection_id`
- `database_version`
- `tier`
- `database_name`
- `db_users`
- `deletion_protection`

## Output chính

- `instance_name`
- `private_ip_address`
- `connection_name`
- `database_name`
- `db_usernames`
- `secret_names_for_passwords`

## Lưu ý

Provider có thể đưa metadata nhạy cảm của Cloud SQL vào state. Chỉ cấp quyền đọc state bucket cho người thật sự cần.
