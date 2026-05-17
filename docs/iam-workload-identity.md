# IAM and Workload Identity

## Service Accounts

GCP service account IDs are limited to 30 characters. The implementation uses shortened account IDs while keeping clear display names.

| Purpose | Service account |
|---|---|
| IaC | `sagelms-devsecops-iac-sa@sagelms.iam.gserviceaccount.com` |
| GitHub Actions | `sagelms-devsecops-gha-sa@sagelms.iam.gserviceaccount.com` |
| External Secrets Operator | `sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com` |
| FluxCD | `sagelms-devsecops-flux-sa@sagelms.iam.gserviceaccount.com` |
| App runtime | `sagelms-devsecops-app-sa@sagelms.iam.gserviceaccount.com` |

## GitHub Actions to GCP

GitHub Actions must use Workload Identity Federation. Long-lived Google service account keys are not part of the baseline.

Default WIF values:

```text
wif_pool_id     = sagelms-devsecops-github-pool
wif_provider_id = github
```

The GitHub provider trusts only the configured repository:

```text
assertion.repository == "<github_owner>/sagelms"
```

Apply workflows should run only from the protected deploy branch and should require GitHub Environment approval.

## Kubernetes to GCP

External Secrets Operator uses Kubernetes Workload Identity:

```text
KSA: platform-system/external-secrets
GSA: sagelms-devsecops-eso-sa@sagelms.iam.gserviceaccount.com
IAM member: serviceAccount:sagelms.svc.id.goog[platform-system/external-secrets]
```

ESO receives `roles/secretmanager.secretAccessor` on the SageLMS secret metadata created by OpenTofu.

## Runtime Secret Contract

`auth-service` expects these environment variables:

| Env var | Source Kubernetes Secret/key |
|---|---|
| `DB_HOST` | `db-common-secret.DB_HOST` |
| `DB_PORT` | `db-common-secret.DB_PORT` |
| `DB_NAME` | `db-common-secret.DB_NAME` |
| `DB_USER` | `db-auth-secret.DB_USER` |
| `DB_PASSWORD` | `db-auth-secret.DB_PASSWORD` |
| `JWT_SECRET` | `jwt-secret.JWT_SECRET` |
| `GATEWAY_SHARED_SECRET` | `gateway-shared-secret.GATEWAY_SHARED_SECRET` |

OpenTofu creates Secret Manager metadata only. Add secret versions outside OpenTofu with `gcloud secrets versions add`.
