# Module: iam

Module này tạo identity nền cho CI/CD, GitOps, ESO và app runtime.

## Tài nguyên quản lý

- Google service accounts:
  - GitHub Actions
  - External Secrets Operator
  - FluxCD placeholder
  - App runtime placeholder
- GitHub Workload Identity Pool
- GitHub OIDC provider
- IAM binding cho GitHub Actions impersonate IaC service account
- IAM binding cho ESO Kubernetes service account dùng Google service account

## Tên service account

GCP giới hạn `account_id` tối đa 30 ký tự, nên module dùng tên rút gọn:

| Mục đích | Account ID |
|---|---|
| GitHub Actions | `sagelms-devsecops-gha-sa` |
| ESO | `sagelms-devsecops-eso-sa` |
| FluxCD | `sagelms-devsecops-flux-sa` |
| App runtime | `sagelms-devsecops-app-sa` |

## GitHub WIF

Provider giới hạn theo repository và branch:

```text
assertion.repository == "<github_owner>/<github_repository>"
assertion.ref == "refs/heads/<deploy_branch>"
```

Không dùng service account JSON key dài hạn.

## ESO Workload Identity

Mặc định:

```text
KSA: platform-system/external-secrets
GSA: sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com
```

## Input chính

- `github_owner`
- `github_repository`
- `deploy_branch`
- `iac_service_account_email`
- `eso_ksa_namespace`
- `eso_ksa_name`

## Output chính

- `github_actions_service_account_email`
- `eso_service_account_email`
- `flux_service_account_email`
- `app_runtime_service_account_email`
- `github_wif_provider_name`
