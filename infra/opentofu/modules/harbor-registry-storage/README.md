# Harbor Registry Storage Module

Module này tạo nền tảng GCS cho Harbor registry khi Harbor chạy trong GKE:

- GCS bucket riêng để lưu image blobs.
- Google Service Account riêng cho Harbor registry.
- Bucket IAM tối thiểu:
  - `roles/storage.objectAdmin` để registry đọc/ghi/xóa objects.
  - `roles/storage.legacyBucketReader` để registry đọc metadata bucket.
- Workload Identity binding cho Kubernetes ServiceAccount của registry.

Module không tạo Kubernetes ServiceAccount và không chạy Helm upgrade Harbor. Hai bước đó nằm ở Kubernetes/Helm runtime để tránh trộn cloud foundation với release state.

## Inputs Chính

- `bucket_name`
- `service_account_id`
- `ksa_namespace`
- `ksa_name`
- `versioning_enabled`

## Safety

`force_destroy` mặc định là `false` để tránh xóa image blobs khi destroy nhầm stack. Không bật lifecycle xóa live object ở bucket này; retention/cleanup image nên cấu hình trong Harbor.
