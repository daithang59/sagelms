# ☸ Kubernetes Manifests — SageLMS

## Overview

Thư mục này chứa các Kubernetes manifests cho môi trường **staging/demo** (phase 2).

## Approach

| Aspect | Quyết định |
|--------|-----------|
| Namespace | `sagelms-dev` cho development/staging |
| Config | `ConfigMap` cho non-secret, `Secret` cho credentials |
| Ingress | NGINX Ingress Controller (hoặc ALB trên EKS) |
| Secrets | K8s Secret (MVP) → External Secrets Operator (post-MVP) |
| Package | Kustomize (MVP) → Helm chart (post-MVP) |

## Structure

```
infra/k8s/
├── namespaces/
│   └── dev.yaml          ← Namespace definition
├── base/                 ← Kustomize base (sẽ bổ sung)
│   └── kustomization.yaml
├── README.md             ← File này
```

## Usage (khi đã có manifests)

```bash
# Apply namespace
kubectl apply -f infra/k8s/namespaces/dev.yaml

# Apply all resources (Kustomize)
kubectl apply -k infra/k8s/base/
```

## Lưu ý

- **Chưa triển khai CD pipeline** — deploy thủ công theo hướng dẫn.
- Sau MVP sẽ chuyển sang GitOps (ArgoCD) + Helm chart hoàn chỉnh.
