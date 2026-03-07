# ADR-0001: Mono-repo Structure

**Status:** Accepted  
**Date:** 2026-03-07  
**Deciders:** Team SageLMS

---

## Context

Dự án SageLMS có nhiều microservices (Java, Python), frontend (React/TypeScript), và infrastructure config (Docker, K8s, Terraform). Cần chọn cách tổ chức code: mono-repo hay multi-repo.

## Decision

Sử dụng **mono-repo** với cấu trúc thư mục phân tầng:

```
sagelms/
├── apps/web/               ← Frontend
├── services/<name>/        ← Backend microservices
├── infra/docker/           ← Docker Compose (local)
├── infra/k8s/              ← Kubernetes manifests
├── docs/                   ← Documentation
├── scripts/                ← Build/deploy scripts
```

## Rationale

| Tiêu chí | Mono-repo ✅ | Multi-repo ❌ |
|----------|-------------|--------------|
| Atomic changes cross-service | Dễ dàng | Khó, cần sync nhiều repo |
| Code review | 1 PR chứa đủ context | Review rải rác |
| Shared configs (.gitignore, CI) | Tập trung | Trùng lặp |
| Onboarding | Clone 1 repo là đủ | Clone nhiều repo |
| CI complexity | Trung bình (path filter) | Đơn giản per-repo |

## Consequences

- CI workflow cần **path filter** để chỉ build service bị thay đổi.
- Phải duy trì `.gitignore` multi-stack (Java + Python + Node).
- CODEOWNERS phải map rõ từng thư mục → reviewer.

## Alternatives Considered

- **Multi-repo**: mỗi service 1 repo → bỏ vì tăng overhead quản lý cho team nhỏ.
- **Git submodules**: phức tạp, không phù hợp team MVP.
