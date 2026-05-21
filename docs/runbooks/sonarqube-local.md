# 🛠 Runbook: Self-hosted SonarQube local/server setup

## Mục đích

Chạy một **SonarQube self-hosted** instance bằng Docker Compose để cả team dùng chung cho:
- code quality
- SAST baseline
- quality gate trong PR pipeline

---

## Yêu cầu trước khi chạy

- Docker Desktop hoặc Docker Engine có Compose v2
- Máy đủ RAM cho SonarQube chạy ổn định; khuyến nghị tối thiểu 4 GB cho máy dev, 8 GB nếu muốn chạy cùng lúc nhiều service khác
- Nếu chạy trên Linux, đảm bảo `vm.max_map_count=262144`

### Linux kernel setting

```bash
sudo sysctl -w vm.max_map_count=262144
```

Nếu muốn áp dụng vĩnh viễn:

```bash
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## Cách chạy

### PowerShell trên Windows

```powershell
.\scripts\dev\sonarqube.ps1 start
```

### Bash trên Linux/macOS/WSL/Git Bash

```bash
bash scripts/dev/sonarqube.sh start
```

---

## Truy cập SonarQube

- URL: `http://localhost:9000`
- Tài khoản mặc định: `admin`
- Mật khẩu mặc định: `admin`
- Bắt buộc đổi password ở lần đăng nhập đầu tiên

---

## Lệnh hữu ích

```powershell
.\scripts\dev\sonarqube.ps1 status
.\scripts\dev\sonarqube.ps1 logs
.\scripts\dev\sonarqube.ps1 stop
.\scripts\dev\sonarqube.ps1 reset
```

```bash
bash scripts/dev/sonarqube.sh status
bash scripts/dev/sonarqube.sh logs
bash scripts/dev/sonarqube.sh stop
bash scripts/dev/sonarqube.sh reset
```

---

## Kết nối với GitHub Actions

Khi dùng SonarQube self-hosted, workflow cần 2 giá trị:

- `SONAR_HOST_URL`: URL của SonarQube server, ví dụ `http://localhost:9000` nếu runner chạy cùng máy/network
- `SONAR_TOKEN`: token được tạo trong SonarQube cho project hoặc user

### Lưu ý quan trọng

- Nếu GitHub Actions chạy trên GitHub-hosted runner, URL `localhost:9000` **không thể dùng được**.
- Để workflow gọi được SonarQube self-hosted, bạn cần một trong hai:
  - SonarQube có URL truy cập từ Internet/VPN/internal network mà runner đi tới được
  - hoặc dùng **self-hosted runner** nằm cùng mạng với SonarQube

---

## Checklist cho team

- [ ] Chạy được `start`
- [ ] Mở được `http://localhost:9000`
- [ ] Đổi password `admin`
- [ ] Tạo project token
- [ ] Đặt `SONAR_HOST_URL` và `SONAR_TOKEN` trong GitHub Secrets / environment
- [ ] Kiểm tra workflow PR gọi được SonarQube server