# Module: storage

Module này tạo GCS buckets phục vụ app/demo/evidence.

## Tài nguyên quản lý

- `sagelms-devsecops-materials`
- `sagelms-devsecops-evidence`

## Không quản lý

Module này không tạo hoặc sửa state bucket `sagelms-devsecops-tofu-state`. State bucket thuộc stack `bootstrap/`.

## Cấu hình mặc định

- Uniform bucket-level access: enabled
- Public access prevention: enforced
- Versioning: enabled
- Lifecycle delete sau 30 ngày
- `force_destroy = false`

## Input chính

- `project_id`
- `region`
- `name_prefix`
- `bucket_suffixes`
- `lifecycle_age_days`

## Output chính

- `bucket_names`

## Lưu ý

Bucket access logging được Checkov skip có lý do vì baseline dùng Cloud Audit Logs và không tạo thêm dedicated log bucket trong phạm vi đồ án.
