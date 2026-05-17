# SageLMS DevSecOps Environment

This environment provisions the shared GCP/GKE foundation for SageLMS.

## Usage

Run bootstrap first:

```bash
cd infra/opentofu/bootstrap
cp terraform.tfvars.example terraform.tfvars
tofu init
tofu plan
tofu apply
```

Then initialize this environment:

```bash
cd infra/opentofu/envs/devsecops
cp terraform.tfvars.example terraform.tfvars
# Replace GitHub owner and master_authorized_networks before plan/apply.
tofu init
tofu fmt -recursive
tofu validate
tofu plan
```

Apply phase-by-phase. Do not apply if the plan contains unexpected destroys.

## Kubeconfig

```bash
gcloud container clusters get-credentials sagelms-devsecops-gke --region asia-southeast1 --project sagelms
kubectl get nodes
```

## Secret Values

OpenTofu creates Secret Manager metadata only. Add values with `gcloud secrets versions add` outside OpenTofu so plaintext values do not enter tfvars.
