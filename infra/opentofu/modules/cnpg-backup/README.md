# CloudNativePG Backup Module

Module này tạo phần cloud foundation để CloudNativePG ghi base backup và WAL archive ra Google Cloud Storage.

## Tài nguyên

- GCS bucket backup, bật versioning, uniform bucket-level access và public access prevention.
- Lifecycle rule xóa object cũ theo `retention_days`.
- Google Service Account cho CloudNativePG backup/restore.
- IAM trên bucket cho GSA backup:
  - `roles/storage.objectAdmin` để ghi, đọc, xóa object backup/WAL.
  - `roles/storage.legacyBucketReader` để Barman Cloud đọc metadata bucket (`storage.buckets.get`) khi kiểm tra WAL archive destination.
- Workload Identity binding cho Kubernetes ServiceAccount của PostgreSQL cluster.

## Ranh giới trách nhiệm

Module này không tạo CloudNativePG operator, Cluster CR, ObjectStore CR hoặc ScheduledBackup. Các tài nguyên Kubernetes đó thuộc GitOps/FluxCD.

## Outputs quan trọng

- `bucket_name`
- `bucket_url`
- `object_store_destination_path`
- `service_account_email`
- `workload_identity_member`
- `ksa_namespace`
- `ksa_name`
