# SageLMS Cloud Foundation

## Baseline

- Cloud: Google Cloud project `sagelms`
- Region: `asia-southeast1`
- Environment: `devsecops`
- IaC: OpenTofu under `infra/opentofu`
- Remote state: GCS bucket `sagelms-devsecops-tofu-state`
- Runtime: GKE Standard regional cluster `sagelms-devsecops-gke`

## Network

- Custom VPC: `sagelms-devsecops-vpc`
- Subnet: `sagelms-devsecops-subnet`
- Primary CIDR: `10.10.0.0/20`
- Pods range: `10.20.0.0/16`
- Services range: `10.30.0.0/20`
- Private Google Access: enabled
- Cloud NAT: enabled for private GKE nodes
- Private Service Access: enabled for Cloud SQL and Memorystore Redis

## Managed Services

- Cloud SQL PostgreSQL 16 is provisioned with private IP only.
- Database name is `sagelms`.
- Service-specific DB usernames are documented as outputs, but passwords are not created by OpenTofu.
- Memorystore Redis 7 Standard HA is provisioned with private IP.
- Redis AUTH is enabled by default. Treat the generated AUTH string as sensitive and store it in Secret Manager outside OpenTofu workflows.

## GKE

- Cluster type: GKE Standard regional
- Nodes: private nodes without external IP
- Control plane: public endpoint restricted by master authorized networks
- Workload Identity: enabled with pool `<project_id>.svc.id.goog`
- Node pool: `e2-standard-4`, one node per zone initially, autoscaling 1-2 nodes per zone

## Operational Notes

- Apply bootstrap before the main environment.
- Apply changes phase-by-phase and review every plan before apply.
- Do not commit `terraform.tfvars`, state files, tfplans, or local secret files.
- Keep existing `infra/k8s` namespace `sagelms-dev` untouched; cloud runtime uses `sagelms-devsecops`.

## Known Risks

- Cloud SQL deletion protection is enabled by default; intentional destroy requires changing the variable first.
- Cloud SQL DB users and grants need a controlled post-provision step because passwords should not be stored in OpenTofu state.
- Redis AUTH string may be visible to the OpenTofu state because the provider exposes it as a generated sensitive attribute. Limit state bucket access.
