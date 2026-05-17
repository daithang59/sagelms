# SageLMS DevSecOps Infra Outputs

Fill this file after each successful apply.

## GCP

- Project name: `SageLMS`
- Project ID: `sagelms`
- Project number: `384858175117`
- Environment: `devsecops`
- Region: `asia-southeast1`
- Zones: `asia-southeast1-a`, `asia-southeast1-b`, `asia-southeast1-c`

## GKE

- Cluster name:
- Cluster location:
- Node pool:
- Get credentials:

```bash
gcloud container clusters get-credentials sagelms-devsecops-gke --region asia-southeast1 --project sagelms
```

## Network

- VPC:
- Subnet:
- Pods secondary range:
- Services secondary range:
- Private Service Access connection:

## Cloud SQL PostgreSQL

- Instance:
- Private IP:
- Database:
- Connection name:
- DB users:

## Memorystore Redis

- Instance:
- Host:
- Port:
- AUTH enabled:

## Service Accounts

- IaC:
- GitHub Actions:
- ESO:
- FluxCD:
- App runtime:

## Workload Identity

- Workload pool:
- GitHub WIF provider:
- ESO KSA:
- ESO GSA:

## Secret Manager

- DB common:
- DB auth:
- Redis:
- JWT:
- Gateway shared secret:
- Harbor pull secret:
- Grafana admin:
