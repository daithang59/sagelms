# 📜 contracts — API Contract Specs

## Mục đích

Chứa **contract-first API specifications** cho tất cả services. Viết spec trước, generate client/server code sau.

## Cấu trúc

```
contracts/
├── openapi/
│   ├── gateway.yaml         ← API Gateway routes
│   ├── auth.yaml            ← Auth service
│   ├── course.yaml          ← Course service
│   ├── content.yaml         ← Content service
│   ├── progress.yaml        ← Progress service
│   ├── assessment.yaml      ← Assessment service
│   └── ai-tutor.yaml        ← AI Tutor service
├── asyncapi/
│   └── jobs.yaml            ← Async job events
└── README.md                ← File này
```

## Conventions

| Quy ước | Giá trị |
|---------|---------|
| Base path | `/api/v1` |
| Error format | `{ timestamp, path, errorCode, message, correlationId }` |
| Correlation header | `X-Correlation-Id` |
| Auth header | `Authorization: Bearer <token>` |
| ID format | UUID v4 |
| Date format | ISO 8601 (`2026-03-07T10:00:00Z`) |
| Pagination | `?page=1&size=20` → `{ data, meta: { page, size, total } }` |

## Sử dụng

```bash
# Validate specs
npx @redocly/cli lint contracts/openapi/*.yaml

# Generate client (TypeScript)
npx openapi-generator-cli generate -i contracts/openapi/auth.yaml -g typescript-axios -o apps/web/src/generated/auth

# Preview docs
npx @redocly/cli preview-docs contracts/openapi/gateway.yaml
```
