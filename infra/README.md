# 🏗 infra — Infrastructure Configuration

## Mục đích

Chứa toàn bộ cấu hình **hạ tầng** cho SageLMS: local development (Docker) và deployment (Kubernetes).

## Cấu trúc

```
infra/
├── docker/
│   ├── docker-compose.yml   ← Local dependencies (Postgres + Redis)
│   └── README.md
│
└── k8s/
    ├── namespaces/
    │   └── dev.yaml         ← Namespace sagelms-dev
    ├── base/
    │   └── kustomization.yaml ← Kustomize base
    └── README.md
```

## Phân biệt

| Thư mục | Mục đích | Khi nào dùng |
|---------|----------|-------------|
| `infra/docker/` | Local dev dependencies | Hàng ngày khi phát triển |
| `infra/k8s/` | Staging/production deploy | Deploy lên cluster |

## Xem thêm

- [infra/docker/README.md](./docker/README.md) — Hướng dẫn Docker Compose
- [infra/k8s/README.md](./k8s/README.md) — Chiến lược K8s deployment
