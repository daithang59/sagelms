# 🔧 scripts — Build & Deploy Scripts

## Mục đích

Chứa các **script hỗ trợ** cho quá trình phát triển, build, và deploy.

## Cấu trúc dự kiến

```
scripts/
├── dev/              ← Scripts cho local development
│   ├── setup.sh      ← Initial setup (install deps, copy .env)
│   └── seed.sh       ← Seed demo data
├── build/            ← Build scripts
│   ├── build-all.sh  ← Build tất cả services
│   └── build-images.sh ← Build Docker images
├── deploy/           ← Deploy scripts
│   ├── deploy-k8s.sh ← Deploy lên K8s
│   └── rollback.sh   ← Rollback deployment
└── demo/             ← Demo scripts
    ├── demo.sh       ← Chạy kịch bản demo end-to-end
    └── demo.postman_collection.json
```

## Quy ước

- Scripts phải có `#!/bin/bash` và `set -euo pipefail` ở đầu file.
- Tên file dùng **kebab-case** (ví dụ: `build-images.sh`).
- Mỗi script có comment mô tả mục đích ở đầu file.
- Hỗ trợ chạy từ **root repo** (dùng relative path từ root).
