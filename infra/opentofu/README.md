# SageLMS OpenTofu Infrastructure

This directory provisions the SageLMS shared DevSecOps foundation on GCP.

## Structure

```text
bootstrap/          # One-time local-state bootstrap for remote state
envs/devsecops/     # Main GCP/GKE environment
modules/            # Reusable OpenTofu modules
outputs.md          # Handoff values after apply
```

## Prerequisites

- OpenTofu `>= 1.6.0`
- Google Cloud SDK
- `kubectl`
- Checkov
- Permission on project `sagelms` to create IAM, networking, GKE, Cloud SQL, Redis, Secret Manager, and GCS resources

## Bootstrap Remote State

```bash
cd infra/opentofu/bootstrap
cp terraform.tfvars.example terraform.tfvars
tofu init
tofu fmt -recursive
tofu validate
tofu plan
tofu apply
```

The bootstrap stack creates:

- GCS bucket `sagelms-devsecops-tofu-state`
- IaC service account `sagelms-devsecops-iac-sa`
- Project IAM roles needed for later OpenTofu applies

## Provision DevSecOps Environment

```bash
cd infra/opentofu/envs/devsecops
cp terraform.tfvars.example terraform.tfvars
tofu init
tofu fmt -recursive
tofu validate
tofu plan
tofu apply
```

Apply in phases by reviewing the plan carefully. Do not apply if the plan contains unexpected destroys.

## Security Notes

- Do not commit `terraform.tfvars`, `*.tfvars`, `*.tfplan`, state files, or local secret scratch files.
- OpenTofu creates Secret Manager metadata only; secret values must be added outside OpenTofu.
- Cloud SQL user passwords must not be generated through OpenTofu unless a documented exception is accepted.
- Redis AUTH is enabled by default; the generated AUTH string is sensitive and must be handled as a secret.
