# 🔧 scripts — Build & Deploy Scripts

## Mục đích

Chứa các **script hỗ trợ** cho quá trình phát triển, build, và deploy.

## Cấu trúc dự kiến

```
scripts/
├── dev/              ← Scripts cho local development
│   ├── setup.sh      ← Initial setup (install deps, copy .env)
│   ├── seed.sh       ← Seed demo data
│   ├── sonarqube.ps1 ← Start/stop self-hosted SonarQube
│   └── sonarqube.sh  ← Bash wrapper cho self-hosted SonarQube
│   ├── github-runner.ps1 ← Bootstrap self-hosted GitHub Actions runner
│   └── github-runner.sh  ← Bash bootstrap for self-hosted runner
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

## Script chạy SonarQube

- PowerShell: `scripts/dev/sonarqube.ps1`
- Bash: `scripts/dev/sonarqube.sh`
- Compose file: `infra/docker/docker-compose.sonarqube.yml`

Mặc định SonarQube chạy tại `http://localhost:9000` với user `admin` / password `admin`.

## Script chạy GitHub Actions runner

- PowerShell: `scripts/dev/github-runner.ps1`
- Bash: `scripts/dev/github-runner.sh`

Runner cần `RUNNER_URL` và `RUNNER_TOKEN` để `setup`. Xem [docs/runbooks/self-hosted-github-runner.md](../docs/runbooks/self-hosted-github-runner.md).
