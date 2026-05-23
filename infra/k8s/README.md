# ☸ Kubernetes Manifests — SageLMS

## Overview

Thư mục này chứa các Kubernetes manifests cho môi trường **staging/demo** và overlay Kubernetes **devsecops**.

## Approach

| Aspect | Quyết định |
|--------|-----------|
| Namespace | `sagelms-dev` cho development/staging cũ; `sagelms-devsecops`, `cnpg-system`, `sagelms-data`, `platform-system`, `harbor`, `monitoring` cho môi trường DevSecOps |
| Config | `ConfigMap` cho non-secret, `Secret` cho credentials |
| Ingress | GKE/GCE Ingress cho DevSecOps; các môi trường khác có thể dùng controller riêng |
| Secrets | External Secrets Operator + Google Secret Manager cho DevSecOps |
| Package | Kustomize cho manifest app/foundation; Helm chỉ dùng cho chart bên ngoài như Harbor |

## Structure

```
infra/k8s/
├── namespaces/
│   └── dev.yaml          ← Namespace definition
├── base/                 ← Kustomize base cho application workloads
│   ├── README.md
│   └── kustomization.yaml
├── devsecops/            ← Overlay GKE DevSecOps cho app, database, Harbor, FluxCD và Cloudflare
│   ├── kustomization.yaml
│   ├── README.md
│   ├── apps/             ← Overlay deploy web/gateway/backend/worker bằng Harbor
│   ├── cloudnativepg/    ← CloudNativePG PostgreSQL + backup GCS
│   ├── harbor/           ← Harbor Helm/Flux manifests, GCS storage và pull secret
│   ├── fluxcd/           ← GitOps source/kustomization
│   └── cloudflare/       ← Cloudflare Tunnel connector
├── README.md             ← File này
```

Nếu mới học Kubernetes, nên đọc theo thứ tự:

1. [base/README.md](./base/README.md) — giải thích bộ khung app workload, Deployment, Service, ConfigMap, Secret, ServiceAccount và Kustomize base.
2. [devsecops/README.md](./devsecops/README.md) — giải thích overlay GKE DevSecOps, CloudNativePG, External Secrets, Ingress, Harbor và cách phân biệt Helm/Kustomize.
3. [devsecops/apps/README.md](./devsecops/apps/README.md) — hướng dẫn riêng cho overlay application runtime.

## Usage (khi đã có manifests)

```bash
# Apply namespace
kubectl apply -f infra/k8s/namespaces/dev.yaml

# Render all resources (Kustomize)
kubectl kustomize infra/k8s/base/

# Apply all base resources (chỉ dùng khi secret/database tương ứng đã sẵn sàng)
kubectl apply -k infra/k8s/base/
```

Render/apply toàn bộ overlay DevSecOps:

```bash
kubectl kustomize infra/k8s/devsecops/
kubectl apply -k infra/k8s/devsecops/
```

Phần `devsecops/` hiện gom app runtime, CloudNativePG, Harbor, FluxCD và Cloudflare Tunnel. Nếu cần thao tác hẹp hơn, apply từng lớp con như `devsecops/apps/`, `devsecops/cloudnativepg/` hoặc `devsecops/harbor/`.

Apply application workloads cho DevSecOps sau khi foundation/database/secret store đã sẵn sàng:

```bash
kubectl apply -k infra/k8s/devsecops/apps/
```

Render trước khi apply:

```bash
kubectl kustomize infra/k8s/devsecops/apps/
kubectl apply --dry-run=server -k infra/k8s/devsecops/apps/
```

## Lưu ý

- Môi trường DevSecOps định hướng GitOps bằng FluxCD, nhưng vẫn có thể render/dry-run từng Kustomize overlay trước khi reconcile.
