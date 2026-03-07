# 🗺 Roadmap — SageLMS

## Overview

Roadmap chia thành 2 phase chính, mỗi phase có các milestones rõ ràng.

---

## Phase 1: Web Microservices MVP

> **Mục tiêu:** Hệ thống chạy end-to-end, đủ chức năng demo, có CI mức PR.

### Milestone 1.1 — Repo Bootstrap ✅
- [x] Cấu trúc mono-repo
- [x] Governance kit (.github templates, CODEOWNERS, CI)
- [x] Infra skeleton (Docker Compose, K8s placeholder)
- [x] Docs (onboarding, architecture, ADR)
- [x] API contracts skeleton

### Milestone 1.2 — Auth & Gateway
- [ ] auth-service: User CRUD, login/register, JWT
- [ ] Gateway: routing, JWT validation, RBAC, correlation-id
- [ ] Database migration (Flyway)
- [ ] OpenAPI spec hoàn chỉnh
- [ ] Unit tests

### Milestone 1.3 — Core LMS
- [ ] course-service: Course CRUD, enrollment
- [ ] content-service: Lesson CRUD, material metadata
- [ ] progress-service: Lesson completion, % tracking
- [ ] Database migrations
- [ ] Integration tests

### Milestone 1.4 — Assessment
- [ ] assessment-service: Quiz/question CRUD
- [ ] Attempt & auto-grading
- [ ] Score reporting

### Milestone 1.5 — AI Tutor (RAG)
- [ ] ai-tutor-service: Ingestion pipeline (chunking + embedding)
- [ ] pgvector setup & vector search
- [ ] LLM integration (Q&A + citation)
- [ ] Worker: async job processing

### Milestone 1.6 — Frontend MVP
- [ ] Auth pages (login, register)
- [ ] Course listing & detail
- [ ] Lesson viewer & progress tracking
- [ ] Quiz taking & results
- [ ] AI Tutor chat interface

### Milestone 1.7 — Integration & Demo
- [ ] End-to-end testing
- [ ] Demo script & seed data
- [ ] Postman collection
- [ ] Deployment guide (K8s)

---

## Phase 2: DevSecOps & CI/CD Pipeline

> **Mục tiêu:** Tự động hoá build/test/deploy, security scanning, monitoring.

### Milestone 2.1 — CI/CD Pipeline
- [ ] Build & push Docker images (GitHub Actions)
- [ ] Automated tests in pipeline
- [ ] Image tagging & versioning
- [ ] Deploy to staging (K8s/EKS)

### Milestone 2.2 — Security Hardening
- [ ] SAST scanning (Semgrep)
- [ ] Dependency scanning (Dependabot/Renovate)
- [ ] Container image scanning (Trivy)
- [ ] Secret rotation strategy

### Milestone 2.3 — Observability
- [ ] Centralized logging (ELK/Loki)
- [ ] Distributed tracing (Jaeger/Tempo)
- [ ] Metrics & dashboards (Prometheus/Grafana)
- [ ] Alerting

### Milestone 2.4 — Production Readiness
- [ ] Helm charts hoàn chỉnh
- [ ] GitOps (ArgoCD)
- [ ] Terraform IaC (EKS, RDS, ElastiCache)
- [ ] Load testing & performance tuning
