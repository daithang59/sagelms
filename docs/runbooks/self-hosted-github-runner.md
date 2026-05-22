# 🛠 Runbook: Self-hosted GitHub Actions Runner

## Mục đích

Chạy **self-hosted GitHub Actions runner** để:
- build image có cache tốt hơn
- truy cập Harbor / SonarQube / GKE nội bộ
- chạy OpenTofu plan/apply trong mạng riêng
- tách runner cho PR, build, infra và security theo label

---

## Khi nào nên dùng

- SonarQube hoặc Harbor nằm trong mạng private
- cần quyền truy cập GCP/GKE nội bộ
- build Docker image thường xuyên
- muốn gắn label runner riêng cho từng job

Nếu chỉ cần lint/test đơn giản và mọi endpoint đều public, GitHub-hosted runner vẫn đủ cho PR pipeline.

---

## Kiến trúc khuyến nghị

| Loại runner | Label gợi ý | Mục đích |
|---|---|---|
| PR runner | `self-hosted,devsecops,pr` | Kiểm tra PR, không cấp quyền deploy |
| Build runner | `self-hosted,devsecops,build` | Build image, scan, push Harbor |
| Infra runner | `self-hosted,devsecops,infra` | OpenTofu plan/apply, GCP/GKE |
| Security runner | `self-hosted,devsecops,security` | SonarQube, Trivy, Checkov, Gitleaks |

---

## Prerequisites

- Một máy/VM riêng hoặc máy local dùng cho demo
- Quyền admin repo hoặc org để tạo registration token cho runner
- Kết nối outbound tới GitHub
- Docker nếu job cần build image
- Nếu chạy trên Linux và dùng Docker, cấu hình Docker daemon bình thường

---

## Bước 1: Tạo registration token

Trong GitHub:

1. Vào repo → **Settings** → **Actions** → **Runners**
2. Chọn **New self-hosted runner**
3. Chọn OS tương ứng
4. Copy giá trị `RUNNER_URL` và registration token

Lưu ý: token đăng ký thường chỉ sống trong thời gian ngắn, nên hãy chạy script ngay sau khi tạo token.

---

## Bước 2: Cài runner bằng script

### Windows / PowerShell

```powershell
$env:RUNNER_URL = 'https://github.com/<owner>/<repo>'
$env:RUNNER_TOKEN = '<registration-token>'
$env:RUNNER_LABELS = 'self-hosted,devsecops,build'
.\scripts\dev\github-runner.ps1 setup
```

Sau đó chạy runner:

```powershell
.\scripts\dev\github-runner.ps1 run
```

### Linux / macOS / WSL

```bash
export RUNNER_URL='https://github.com/<owner>/<repo>'
export RUNNER_TOKEN='<registration-token>'
export RUNNER_LABELS='self-hosted,devsecops,build'
bash scripts/dev/github-runner.sh setup
```

Chạy runner:

```bash
bash scripts/dev/github-runner.sh run
```

---

## Bước 3: Gắn label cho workflow

Trong workflow GitHub Actions, dùng:

```yaml
runs-on: [self-hosted, devsecops, build]
```

Hoặc tùy mục đích:

```yaml
runs-on: [self-hosted, devsecops, infra]
```

Ví dụ phân chia:

- PR validation → `self-hosted, devsecops, pr`
- Build/push image → `self-hosted, devsecops, build`
- SonarQube scan → `self-hosted, devsecops, security`
- OpenTofu apply → `self-hosted, devsecops, infra`

---

## Bước 4: Chạy runner như service

### Lựa chọn đơn giản


### Lựa chọn khuyến nghị cho máy riêng/VM


Mục tiêu là runner luôn online mà không cần mở terminal thủ công.

Nếu dùng các script Bash trong repo, cấp quyền thực thi một lần:

```bash
chmod +x scripts/dev/github-runner.sh scripts/dev/sonarqube.sh
```

### Ví dụ `systemd` service trên Linux

```ini
[Unit]
Description=SageLMS GitHub Actions Runner
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=simple
User=runner
WorkingDirectory=/home/runner/.sagelms/gha-runner
Environment=RUNNER_URL=https://github.com/<owner>/<repo>
Environment=RUNNER_LABELS=self-hosted,devsecops,build
ExecStart=/bin/bash /home/runner/sagelms/scripts/dev/github-runner.sh run
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Chỉnh đường dẫn cho đúng máy của bạn rồi bật service bằng `systemctl enable --now`.

---

## Bước 5: Gỡ runner

Nếu cần unregister:

### PowerShell

```powershell
$env:RUNNER_REMOVE_TOKEN = '<remove-token-if-needed>'
.\scripts\dev\github-runner.ps1 remove
```

### Bash

```bash
export RUNNER_REMOVE_TOKEN='<remove-token-if-needed>'
bash scripts/dev/github-runner.sh remove
```

Nếu bạn không có remove token, có thể xóa runner từ GitHub UI trước rồi xóa thư mục runner trên máy.

---

## Bảo mật

- Không dùng máy cá nhân thường ngày làm runner có quyền deploy production-like
- Tách runner theo label và trust boundary
- Không cấp secret môi trường DevSecOps cho runner PR nếu không cần
- Dùng branch protection + environment protection cho job nhạy cảm
- Nếu runner build image, giới hạn quyền trên máy và tài khoản service

---

## Kết nối với SonarQube tự host

Nếu SonarQube chạy cùng mạng với runner, workflow có thể dùng:

```yaml
env:
  SONAR_HOST_URL: http://sonarqube.internal:9000
```

Nếu runner nằm trên máy khác, đảm bảo URL SonarQube truy cập được từ runner.

---

## Checklist

- [ ] Tạo registration token
- [ ] Chạy `setup`
- [ ] Runner xuất hiện trong GitHub UI
- [ ] Gán label đúng mục đích
- [ ] Chạy workflow thử trên runner mới
- [ ] Nếu cần, chạy runner như service