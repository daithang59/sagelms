# ☸ Kubernetes Manifests — SageLMS

## Overview

Thư mục này chứa các Kubernetes manifests cho môi trường **staging/demo** và phần foundation Kubernetes nhẹ cho **devsecops**.

## Approach

| Aspect | Quyết định |
|--------|-----------|
| Namespace | `sagelms-dev` cho development/staging cũ; `sagelms-devsecops`, `cnpg-system`, `sagelms-data`, `platform-system`, `harbor`, `monitoring` cho môi trường DevSecOps |
| Config | `ConfigMap` cho non-secret, `Secret` cho credentials |
| Ingress | NGINX Ingress Controller (hoặc ALB trên EKS) |
| Secrets | External Secrets Operator + Google Secret Manager cho DevSecOps |
| Package | Kustomize cho foundation nhẹ; runtime app/operator sẽ chuyển sang GitOps/FluxCD |

## Structure

```
infra/k8s/
├── namespaces/
│   └── dev.yaml          ← Namespace definition
├── base/                 ← Kustomize base (sẽ bổ sung)
│   └── kustomization.yaml
├── devsecops/            ← Namespace/KSA/ExternalSecret foundation cho môi trường cloud
│   ├── kustomization.yaml
│   ├── namespaces.yaml
│   └── cnpg-foundation.yaml
├── README.md             ← File này
```

## Usage (khi đã có manifests)

```bash
# Apply namespace
kubectl apply -f infra/k8s/namespaces/dev.yaml

# Apply all resources (Kustomize)
kubectl apply -k infra/k8s/base/
```

Apply foundation nhẹ cho DevSecOps:

```bash
kubectl apply -k infra/k8s/devsecops/
```

Phần `devsecops/` chỉ tạo namespace, ServiceAccount `sagelms-data/sagelms-postgres` và ExternalSecret contract cho CloudNativePG. CloudNativePG operator, Barman plugin, Cluster CR và ScheduledBackup vẫn thuộc phần runtime/GitOps tiếp theo.

## Lưu ý

- **Chưa triển khai CD pipeline** — deploy thủ công theo hướng dẫn.
- Môi trường DevSecOps định hướng GitOps bằng FluxCD.
