# Báo cáo LaTeX SageLMS DevSecOps

Thư mục này chứa bản nháp báo cáo đồ án môn học cho SageLMS, tập trung vào pipeline DevSecOps cho web microservices.

## Cách build

Khuyến nghị dùng XeLaTeX vì báo cáo viết bằng tiếng Việt.

```powershell
cd report
latexmk -xelatex main.tex
```

Nếu không dùng `latexmk`, có thể chạy:

```powershell
xelatex main.tex
biber main
xelatex main.tex
xelatex main.tex
```

## Nơi cần điền sau

- `metadata.tex`: trường, khoa, lớp, giảng viên, MSSV.
- `figures/` hoặc `../images/`: ảnh chụp GitHub Actions, Harbor, GKE, FluxCD, smoke test và AI Tutor UI.
- `appendices/`: thêm log hoặc snippet nếu giảng viên yêu cầu phụ lục chi tiết.

## Ảnh minh chứng đã gắn

Bản hiện tại đã thay các placeholder chính bằng ảnh thật trong `../images/`:

- `10-github-actions-pr-validation-pass.png`: PR validation pass.
- `11-cd-workflow-ai-tutor-summary.png`: CD workflow mới cho AI Tutor.
- `12-cd-workflow-ai-tutor-build-scan-push.png`: job build, scan, SBOM và ghi digest.
- `13-ai-tutor-ui-chat-runtime.png`: AI Tutor đang trả lời trên trang `/ai-tutor`.
- `14-post-deploy-check-rollout-smoke.png`: post-deploy rollout và smoke test pass.
- `15-report-evidence-artifacts.png`: thư mục `reports` chứa deploy summary, image digest, Trivy và SBOM.
- `16-web-demo-dashboard-runtime.png` đến `22-admin-instructor-approval-runtime.png`: các màn hình demo web và quản trị.
- `23-gke-workloads-sagelms-devsecops-ready.png`: GKE workloads trong namespace runtime.
- `24-gke-ai-tutor-deployment-ready.png`: deployment AI Tutor đã Ready.
- `25-fluxcd-runtime-ready.png`: trạng thái FluxCD reconcile.
- `26-harbor-sagelms-app-artifacts.png`: Harbor project chứa image artifact.
- `27-grafana-monitoring-dashboard.png`: Grafana monitoring dashboard.

Ảnh có thể bổ sung nếu muốn phần bảo vệ chi tiết hơn: log mở rộng của bước `cosign verify` và `cosign verify-attestation` cho riêng image `ai-tutor-service` trong run CD mới nhất.
