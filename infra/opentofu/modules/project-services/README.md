# Module: project-services

Module này bật các Google Cloud APIs cần thiết cho môi trường `devsecops`.

## Tài nguyên quản lý

- `google_project_service.required`

## APIs mặc định

Bao gồm các nhóm chính:

- Compute/VPC: `compute.googleapis.com`
- GKE: `container.googleapis.com`
- IAM/WIF: `iam.googleapis.com`, `iamcredentials.googleapis.com`, `sts.googleapis.com`
- Secret Manager: `secretmanager.googleapis.com`
- Redis: `redis.googleapis.com`
- Private Service Access: `servicenetworking.googleapis.com`
- Storage: `storage.googleapis.com`
- Logging/Monitoring: `logging.googleapis.com`, `monitoring.googleapis.com`
- Artifact Registry fallback: `artifactregistry.googleapis.com`

## Input chính

- `project_id`
- `services`

## Output chính

- `enabled_services`

## Lưu ý

`disable_on_destroy = false` để tránh destroy IaC làm tắt API dùng chung trong project.
