# Module: secret-manager

Module này tạo Secret Manager skeleton cho các secret runtime của SageLMS.

## Tài nguyên quản lý

- Secret Manager secret metadata
- IAM binding để ESO service account đọc secret

## Secret baseline

Nhóm secret chính:

- DB common: host, port, database name
- DB credentials theo service: auth, course, content, progress, assessment, ai-tutor
- Redis: host, port, password/AUTH string
- JWT secret
- Gateway shared secret
- LLM API key
- Harbor pull secret
- Grafana admin password

## Quan trọng

Module này không tạo secret value.

Thêm value ngoài OpenTofu:

```bash
printf '%s' '<SECRET_VALUE>' | gcloud secrets versions add sagelms-devsecops-jwt-secret --data-file=-
```

Không đưa secret value vào `terraform.tfvars`, Helm values plaintext hoặc Git.

## Input chính

- `project_id`
- `name_prefix`
- `eso_service_account_email`
- `secret_suffixes`

## Output chính

- `secret_ids`
- `secret_resource_names`
