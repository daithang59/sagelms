# 📜 contracts — API Contract Specs (Reference Only)

> ⚠️ **Contracts chỉ để tham khảo, không enforced bởi CI.**
> Source of truth là code trong từng service.

## Mục đích

Folder này chứa **OpenAPI / AsyncAPI specs** như tài liệu tham khảo để team thống nhất về API trước khi code. Không bắt buộc phải tuân theo 100% — phục vụ giao tiếp, không gây ràng buộc.

## Cấu trúc

```
contracts/
├── openapi/
│   ├── gateway.yaml
│   ├── auth.yaml
│   ├── course.yaml
│   ├── content.yaml
│   ├── progress.yaml
│   ├── assessment.yaml
│   └── ai-tutor.yaml
├── asyncapi/
│   └── jobs.yaml
└── README.md
```

## Conventions (gợi ý, không bắt buộc)

| Quy ước | Giá trị |
|---------|---------|
| Base path | `/api/v1` |
| Error format | `{ timestamp, path, errorCode, message, correlationId }` |
| Correlation header | `X-Correlation-Id` |
| Auth header | `Authorization: Bearer <token>` |
| ID format | UUID v4 |

## Sử dụng (optional)

```bash
# Preview docs
npx @redocly/cli preview-docs contracts/openapi/auth.yaml

# Generate client (nếu muốn)
npx openapi-generator-cli generate -i contracts/openapi/auth.yaml -g typescript-axios -o apps/web/src/generated/auth
```
