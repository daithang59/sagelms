# Kế hoạch thiết kế CI/CD DevSecOps Pipeline cho SageLMS trên GCP/GKE

> Phiên bản final đề xuất: giữ đầy đủ cấu trúc kế hoạch production-oriented, chuẩn hóa security tooling theo nguyên tắc **mỗi mục đích chọn một công cụ tối ưu**, chỉnh lại thứ tự supply chain cho sát triển khai thực tế: **Build → Scan → Push → Resolve digest → SBOM/attestation → Sign → GitOps**, đồng thời tối ưu phạm vi môi trường cho dự án môn học theo mô hình **một Shared Cloud DevSecOps Environment trên GCP/GKE**. Môi trường cloud này là nơi chính để xây dựng, kiểm thử và trình diễn pipeline CI/CD DevSecOps end-to-end; local chỉ giữ vai trò tối thiểu khi cần debug source code.

## 1. Bối cảnh và mục tiêu

SageLMS là hệ thống LMS theo kiến trúc microservices, tích hợp AI Tutor theo mô hình RAG. Hệ thống bao gồm các module chính như Auth & RBAC, LMS Core, Assessment, AI Tutor, Async Jobs và Frontend React SPA. Dự án hiện định hướng theo cloud-native, microservices, GitOps và DevSecOps nhằm tiến tới khả năng vận hành production.

Mục tiêu của kế hoạch pipeline là chuyển dự án từ mức MVP có thể chạy demo sang hướng production-grade. Pipeline không chỉ tự động build và deploy, mà còn phải kiểm soát chất lượng mã nguồn, bảo mật chuỗi cung ứng phần mềm, quản lý hạ tầng bằng mã nguồn, bảo vệ secret, triển khai có kiểm soát và cung cấp khả năng quan sát toàn hệ thống.

---

## 2. Stack production được chọn

| Nhóm | Công cụ |
|---|---|
| Source Control & CI | GitHub + GitHub Actions |
| Code Quality / SAST | SonarQube |
| Secret Scanning | Gitleaks |
| Dependency / Image / SBOM Scanning | Trivy |
| IaC / Config Scanning | Checkov |
| Infrastructure as Code | OpenTofu |
| Configuration / Day-2 Automation | Ansible |
| Cloud Platform | GCP |
| Kubernetes Runtime | GKE cho một Shared Cloud DevSecOps Environment |
| Container Registry | Harbor |
| Image Signing | Cosign |
| GitOps CD | FluxCD |
| Packaging | Helm |
| Environment Overlay | Kustomize với `base` + `overlays/devsecops` |
| Policy-as-Code / Admission Control | Kyverno |
| Secret Management | External Secrets Operator + Google Secret Manager |
| Database | Cloud SQL PostgreSQL + pgvector |
| Cache / Queue | Memorystore Redis |
| Object Storage | Cloud Storage |
| Observability | OpenTelemetry + Prometheus + Grafana + Loki + Tempo |

### 2.1 Nguyên tắc chọn security tooling

Bản thiết kế này không chọn một công cụ duy nhất cho mọi lớp bảo mật. Thay vào đó, mỗi mục đích chọn một công cụ chính phù hợp nhất để tránh trùng lặp và giảm độ phức tạp khi vận hành.

| Lớp kiểm soát | Tool chính | Lý do chọn |
|---|---|---|
| Code quality + SAST cơ bản | SonarQube | Phù hợp kiểm soát bugs, vulnerabilities, security hotspots, code smells, duplication và quality gate cho Java, TypeScript, Python. |
| Secret scanning | Gitleaks | Chuyên dụng cho phát hiện secret, token, API key, private key trong repository và Git history. |
| Dependency scanning | Trivy | Quét Maven, npm, pip dependencies và lockfiles; phù hợp với mono-repo nhiều ngôn ngữ. |
| Container image scanning | Trivy | Mạnh cho OS packages, application dependencies trong image và vulnerability report. |
| SBOM | Trivy | Có thể tạo SBOM theo CycloneDX/SPDX, đủ tốt cho supply chain security của đồ án. |
| IaC / config scanning | Checkov | Chuyên sâu cho OpenTofu/Terraform, Kubernetes, Helm, Kustomize, Dockerfile và cloud misconfiguration. |
| Image signing | Cosign | Ký image digest để đảm bảo artifact integrity. |
| Registry governance | Harbor | Private registry, project isolation, robot account, retention, audit và promotion flow. |
| Runtime admission policy | Kyverno | Enforce policy khi workload được deploy vào Kubernetes. |

Ghi chú triển khai: nếu chưa muốn vận hành SonarQube server ngay từ đầu, có thể dùng SonarCloud hoặc self-hosted SonarQube ở phase sau. Trong tài liệu, tên chung vẫn là **SonarQube** để chỉ lớp code quality/SAST gate.

### 2.2 Tool không đưa vào core pipeline

| Tool | Lý do không chọn trong bản chính |
|---|---|
| Semgrep | Có giá trị cho SAST rule tùy biến, nhưng bản này dùng SonarQube cho code quality/SAST cơ bản để tránh trùng scanner. |
| OWASP Dependency-Check | Trùng vai trò dependency vulnerability với Trivy. |
| Snyk | Tốt nhưng thường gắn với SaaS/commercial workflow; Trivy phù hợp hơn cho đồ án và self-hosted pipeline. |
| Syft | Trùng vai trò SBOM với Trivy trong phạm vi bản này. |
| Grype | Trùng vai trò vulnerability scan với Trivy. |
| Trivy config cho IaC chính | Trivy có thể scan config, nhưng Checkov được chọn làm IaC scanner chính vì chuyên sâu hơn cho IaC/cloud misconfiguration. |

### 2.3 Cách trình bày khi bảo vệ đồ án

Cách giải thích ngắn gọn:

> Nhóm không dùng nhiều scanner trùng chức năng. Mỗi lớp chọn một tool chính: SonarQube cho code quality/SAST, Gitleaks cho secrets, Checkov cho IaC/config, Trivy cho dependency/image/SBOM, Cosign cho signing, Harbor cho registry governance, Kyverno cho runtime policy và FluxCD cho GitOps deployment.

### 2.4 Nguyên tắc triển khai thực tế

Bản thiết kế này là **target architecture** cho pipeline production-oriented, nhưng không nên triển khai tất cả trong một lần. Thứ tự triển khai khuyến nghị:

| Phase | Mục tiêu | Thành phần ưu tiên |
|---|---|---|
| Phase 1 | CI baseline và PR quality gate | GitHub Actions, path filter, lint/test/typecheck, OpenAPI lint, SonarQube, Gitleaks, Trivy dependency scan, Checkov IaC scan. |
| Phase 2 | Chuẩn hóa container artifact | Dockerfile chuẩn, Docker BuildKit, Trivy image scan, Harbor, image tag bằng git SHA. |
| Phase 3 | Supply chain security | Image digest, Trivy SBOM, Cosign signing, security report artifact, promotion flow. |
| Phase 4 | GitOps deployment | FluxCD, Helm chart, Kustomize overlays, GitOps update bằng image digest. |
| Phase 5 | Runtime hardening và vận hành | Kyverno, External Secrets Operator, Google Secret Manager, observability, alerting, runbook, scheduled scan. |

Cách triển khai này giúp dự án bắt đầu nhanh từ PR pipeline, sau đó mở rộng dần sang artifact security, GitOps và runtime hardening mà không làm team bị quá tải.

## 3. Nguyên tắc thiết kế pipeline

Pipeline được thiết kế theo các nguyên tắc sau:

| Nguyên tắc | Ý nghĩa |
|---|---|
| CI và CD tách biệt | GitHub Actions chỉ kiểm thử, build, scan, sign, push artifact và cập nhật GitOps manifests. FluxCD mới là thành phần triển khai vào GKE. |
| Git là nguồn sự thật | Mã nguồn, hạ tầng, manifest triển khai, policy và cấu hình môi trường đều được quản lý bằng Git. |
| Shift-left security | Bảo mật được kiểm tra từ Pull Request, trước khi image được build và deploy. |
| GitOps-first | Mọi thay đổi runtime trên GKE phải đi qua GitOps, không deploy thủ công bằng lệnh trực tiếp. |
| Immutable artifact | Image sau khi build được tag bằng git SHA hoặc semver, scan, ký và lưu trong Harbor. Manifest của môi trường DevSecOps pin image bằng digest. |
| Least privilege | CI runner, service account, workload, GCP IAM và secret đều dùng quyền tối thiểu cần thiết. |
| Cloud DevSecOps Environment là môi trường chính | Vì nhóm tập trung xây pipeline hơn là sửa source web hằng ngày, một môi trường GCP/GKE dùng chung được chọn làm nơi chính để kiểm thử CI/CD, GitOps, Harbor, Cosign, Kyverno, ESO và observability. |
| Local chỉ giữ vai trò tối thiểu | Local không còn là trục chính. Developer chỉ cần local khi muốn smoke test nhanh hoặc debug source code sâu bằng IDE. |
| Không duy trì nhiều cloud environment | Dự án môn học không triển khai đồng thời dev/staging/prod trên cloud để tránh tốn tài nguyên. Một môi trường DevSecOps dùng chung đủ để kiểm thử và demo pipeline end-to-end. |
| Kustomize vẫn được giữ | Kustomize dùng để tách `deploy/base` khỏi `deploy/overlays/devsecops`; các overlay `staging/production` có thể bổ sung sau nếu dự án mở rộng. |
| Observability by design | Metrics, logs và traces phải được thiết kế ngay từ đầu để quan sát pipeline deployment và runtime behavior. |

Nguyên tắc quan trọng: trong phạm vi đồ án, **Shared Cloud DevSecOps Environment** là môi trường cloud duy nhất được triển khai thật. Đây không phải production thật, mà là môi trường dùng chung để xây dựng, kiểm thử và trình diễn pipeline DevSecOps end-to-end. Môi trường này vẫn áp dụng các thực hành production-oriented như GitOps, approval, image digest, SBOM, signing, secret management, policy enforcement, observability và rollback.

## 4. Kiến trúc pipeline tổng thể

Luồng Shared Cloud DevSecOps Environment tổng thể:

1. Thành viên tạo thay đổi liên quan đến pipeline, Dockerfile, Helm chart, Kustomize overlay, Kyverno policy, OpenTofu module, GitHub Actions workflow hoặc source code khi cần.
2. Thành viên tạo Pull Request trên GitHub.
3. GitHub Actions chạy PR pipeline.
4. Pipeline xác định service/path thay đổi bằng path filter.
5. Pipeline chạy lint, format, unit test, typecheck và OpenAPI lint ở mức cần thiết.
6. SonarQube kiểm tra code quality, bugs, vulnerabilities, security hotspots, code smells, duplication và coverage gate.
7. Gitleaks scan secret trong commit diff, repository hoặc Git history theo cấu hình.
8. Trivy scan dependency theo Maven/npm/pip lockfiles và project files.
9. Checkov scan OpenTofu, Kubernetes manifests, Helm, Kustomize, Dockerfile và GitHub Actions workflow nếu liên quan.
10. Sau khi PR pass và merge vào branch chính, GitHub Actions build image cho các service thay đổi hoặc service được chọn để kiểm thử pipeline.
11. Trivy scan container image trước khi deploy.
12. Image được push vào Harbor bằng tag bất biến như git SHA hoặc semver.
13. Pipeline resolve image digest từ Harbor, tạo SBOM/attestation bằng Trivy và ký image digest bằng Cosign.
14. GitHub Actions tạo commit hoặc Pull Request cập nhật `deploy/overlays/devsecops` bằng image digest đã scan/ký.
15. GitHub Environment hoặc GitOps PR yêu cầu manual approval trước khi cập nhật runtime.
16. FluxCD phát hiện thay đổi trong Git và reconcile vào GKE DevSecOps cluster/namespace.
17. Kyverno kiểm tra runtime policy trước khi workload được chấp nhận.
18. External Secrets Operator đồng bộ secret từ Google Secret Manager vào Kubernetes.
19. OpenTelemetry, Prometheus, Grafana, Loki và Tempo thu thập telemetry phục vụ giám sát.

Điểm quan trọng của kiến trúc này là CI không deploy trực tiếp vào cluster. CI chỉ tạo artifact đáng tin cậy, scan, ký, push và cập nhật GitOps state. FluxCD mới là thành phần triển khai vào GKE. Với phạm vi môn học, một Shared Cloud DevSecOps Environment giúp nhóm kiểm thử trọn vẹn pipeline, GitOps, security gates và runtime policy mà không phải duy trì nhiều môi trường cloud.

## 5. Chiến lược repository

Trước mắt sử dụng phương án mono-repo chứa cả source code và GitOps manifests. Cách này giúp giảm độ phức tạp, dễ review, dễ demo và dễ trace từ source code đến deployment.

Cấu trúc khuyến nghị:

| Thư mục | Vai trò |
|---|---|
| `apps/web` | Frontend React. Có thể ít thay đổi nếu trọng tâm là pipeline. |
| `services/*` | Các microservices backend và worker. Dùng để build image, scan, deploy và demo pipeline. |
| `contracts/openapi` | OpenAPI contracts. |
| `contracts/asyncapi` | AsyncAPI contracts cho job/event. |
| `infra/opentofu` | Hạ tầng GCP bằng OpenTofu cho Shared Cloud DevSecOps Environment. |
| `infra/ansible` | Playbook bootstrap runner, bastion, utility nodes. |
| `charts` | Helm chart dùng chung cho microservices. |
| `deploy/base` | Base manifests hoặc HelmRelease dùng chung cho các service. |
| `deploy/overlays/devsecops` | Overlay cloud duy nhất được triển khai thật trong phạm vi đồ án. |
| `platform/flux` | FluxCD bootstrap và cấu hình GitOps. |
| `platform/kyverno` | Policy-as-code. |
| `platform/external-secrets` | External Secrets Operator resources. |
| `platform/observability` | Prometheus, Grafana, Loki, Tempo, OpenTelemetry. |
| `.github/workflows` | GitHub Actions workflows. |

Không cần tạo sẵn `deploy/overlays/dev`, `deploy/overlays/staging`, `deploy/overlays/prod` nếu nhóm không triển khai nhiều môi trường cloud. Khi hệ thống trưởng thành hơn, có thể mở rộng tự nhiên thành:

```text
deploy/
├── base/
└── overlays/
    ├── devsecops/
    ├── staging/
    └── production/
```

Trong phạm vi môn học, cloud runtime dùng `deploy/overlays/devsecops`. Local chỉ dùng khi cần debug source code hoặc smoke test nhanh.

Khi hệ thống trưởng thành hơn, có thể tách thành hai repository:

| Repository | Vai trò |
|---|---|
| `sagelms-app` | Source code, contracts, tests. |
| `sagelms-gitops` | Deployment manifests, platform components, environment configs. |

## 6. Chiến lược môi trường

Vì nhóm hiện tập trung **xây dựng pipeline CI/CD DevSecOps** thay vì sửa source web hằng ngày, không nên đặt local-first làm trục chính của kế hoạch. Chiến lược tối ưu là sử dụng **một Shared Cloud DevSecOps Environment trên GCP/GKE** để xây, kiểm thử và demo pipeline end-to-end. Local chỉ giữ vai trò tối thiểu khi cần debug source code.

| Môi trường | Có triển khai thật không? | Vai trò | Công nghệ chính |
|---|---:|---|---|
| Shared Cloud DevSecOps Environment | Có | Môi trường cloud chính để kiểm thử CI/CD, GitOps deployment, Harbor, image scan/sign/SBOM, Kyverno policy, ESO secret sync, observability, rollback và demo đồ án. | GKE, Harbor, FluxCD, Helm, Kustomize, Kyverno, ESO, Google Secret Manager, observability, PostgreSQL/Redis tùy ngân sách. |
| Local minimal debug | Tùy chọn | Chỉ dùng khi cần chạy nhanh một service, debug breakpoint hoặc smoke test source code. Không phải môi trường chính của pipeline. | Docker Compose, PostgreSQL + pgvector, Redis, IDE, Vite frontend. |
| Dev cloud riêng | Không | Không triển khai riêng để tránh tốn tài nguyên; vai trò dev/test cloud được gộp vào Shared Cloud DevSecOps Environment. | Có thể bổ sung sau. |
| Staging cloud riêng | Không | Không triển khai riêng; thay bằng PR checks, security gates, manual approval và GitOps deployment vào môi trường DevSecOps. | Có thể bổ sung sau. |
| Production thật | Không | Không triển khai trong phạm vi đồ án; môi trường DevSecOps dùng để mô phỏng các thực hành production-oriented. | Có thể tách thành production thật sau MVP. |

### 6.1 Shared Cloud DevSecOps Environment

Đây là môi trường cloud duy nhất được triển khai thật và là nơi chính để nhóm thực nghiệm pipeline:

- Một GKE cluster hoặc một cluster Kubernetes tiết kiệm tài nguyên.
- Namespace chính: `sagelms-devsecops`.
- Platform namespaces: `platform-system`, `harbor` nếu Harbor chạy trong cluster, `monitoring` nếu muốn tách observability.
- FluxCD reconcile từ GitOps overlay `deploy/overlays/devsecops`.
- Image được pull từ Harbor bằng digest.
- Secret đồng bộ từ Google Secret Manager qua External Secrets Operator.
- Kyverno enforce hoặc audit các policy DevSecOps quan trọng.
- Observability đủ để xem rollout, logs, metrics, traces và debug vận hành.
- Các thành viên có quyền GCP/GKE phù hợp để quan sát, test, xem log và debug có kiểm soát.

### 6.2 Local minimal debug

Local không còn là môi trường chính. Local chỉ dùng khi cần:

- Chạy nhanh một service để kiểm tra lỗi source code.
- Debug breakpoint bằng IDE.
- Smoke test frontend/backend trước khi push nếu cần.
- Chạy PostgreSQL/Redis tạm thời bằng Docker Compose.

Nhóm không cần bắt buộc mọi thành viên phải chạy đầy đủ hệ thống local nếu mục tiêu chính là xây dựng pipeline.

### 6.3 Quyền truy cập GCP cho thành viên

Vì môi trường cloud là nơi dùng chung, cần phân quyền rõ ràng:

| Nhóm quyền | Đối tượng | Quyền nên có |
|---|---|---|
| Viewer / Debugger | Tất cả thành viên | Xem GKE workloads, logs, events, dashboards, rollout status; port-forward giới hạn nếu cần. |
| DevOps Operator | Leader hoặc người phụ trách pipeline | Trigger workflow, review GitOps PR, approve deployment, theo dõi rollout. |
| Infra Operator | Người phụ trách cloud/IaC | Review và apply OpenTofu sau approval, quản lý hạ tầng GCP. |
| CI/CD Service Account | GitHub Actions | Build, scan, push image, ký image, cập nhật GitOps theo quyền tối thiểu. |
| Runtime Service Account | FluxCD, ESO, workload identity | Reconcile manifests, pull image, đọc secret đúng phạm vi. |

Không nên cấp Owner hoặc cluster-admin rộng cho mọi thành viên. Việc deploy chính thức vẫn đi qua GitHub Actions, GitOps PR và FluxCD; không dùng tài khoản cá nhân để `kubectl apply` hoặc `helm upgrade` thường xuyên.

### 6.4 Manual approval và kiểm soát môi trường dùng chung

Vì chỉ có một môi trường cloud dùng chung, deployment cần có gate kiểm soát:

1. Pull Request phải pass CI/security gates.
2. Merge vào branch chính.
3. Build/scan/push/sign image.
4. Cập nhật GitOps overlay `devsecops` bằng image digest.
5. Yêu cầu manual approval qua GitHub Environment hoặc GitOps Pull Request.
6. FluxCD reconcile vào môi trường cloud.

Cách này cho phép nhóm dùng cloud làm nơi chính để test pipeline, nhưng vẫn giữ nguyên tắc production-oriented: artifact phải được scan/ký, runtime thay đổi qua Git, có approval, có rollback và có audit trail.

## 7. Pull Request Pipeline

Pull Request pipeline có nhiệm vụ phát hiện lỗi càng sớm càng tốt trước khi code được merge.

### 7.1 Mục tiêu

- Ngăn code lỗi đi vào branch chính.
- Kiểm soát chất lượng mã nguồn và security hotspot bằng SonarQube.
- Phát hiện secret leak bằng Gitleaks.
- Phát hiện dependency vulnerability bằng Trivy.
- Phát hiện IaC, Kubernetes, Helm, Kustomize và Dockerfile misconfiguration bằng Checkov.
- Kiểm tra contract API.
- Chỉ chạy pipeline cho phần thay đổi để tiết kiệm thời gian.

### 7.2 Các bước chính

| Bước | Tool | Nội dung |
|---|---|---|
| Detect changes | GitHub Actions path filter | Xác định service, frontend, infra hoặc contract nào thay đổi. |
| Checkout & setup | GitHub Actions | Chuẩn hóa môi trường build/test. |
| Lint & format | Tool native | Java Spotless/Checkstyle, Python ruff/black, TypeScript ESLint/Prettier. |
| Unit test | JUnit/pytest/Vitest | Chạy test tương ứng với service thay đổi. |
| Typecheck | TypeScript | Kiểm tra TypeScript frontend. |
| OpenAPI lint | Spectral hoặc tương đương | Kiểm tra chất lượng API contracts. |
| Code quality / SAST | SonarQube | Quét bugs, vulnerabilities, security hotspots, code smells, duplication, coverage. |
| Secret scan | Gitleaks | Phát hiện token, password, API key, private key bị commit. |
| Dependency scan | Trivy | Quét lỗ hổng trong Maven, npm, pip dependencies thông qua lockfiles/project files. |
| IaC/config scan | Checkov | Quét OpenTofu, Kubernetes manifests, Helm, Kustomize, Dockerfile và GitHub Actions workflow nếu có thay đổi. |
| Quality gate | GitHub branch protection | Tổng hợp kết quả, chặn merge nếu gate quan trọng fail. |

### 7.3 Điều kiện pass

Một PR chỉ được merge khi:

- Tất cả test liên quan pass.
- Lint, format và typecheck pass.
- SonarQube Quality Gate pass.
- Không có secret leak do Gitleaks phát hiện.
- Không có dependency vulnerability mức Critical/High chưa được xử lý hoặc chưa có allowlist hợp lệ.
- Không có IaC/config misconfiguration mức Critical/High từ Checkov.
- OpenAPI contract hợp lệ nếu có thay đổi API.
- OpenTofu validate/plan hợp lệ nếu có thay đổi hạ tầng.
- Có reviewer approve.
- Branch protection và required checks đều pass.

### 7.4 Chiến lược path filter

Do SageLMS là mono-repo, pipeline nên chạy theo path thay đổi:

| Path thay đổi | Job nên chạy |
|---|---|
| `apps/web/**` | Frontend lint, typecheck, test, SonarQube, Trivy dependency scan. |
| `services/*/**` | Service lint/test, SonarQube, Trivy dependency scan. |
| `contracts/openapi/**` | OpenAPI lint. |
| `infra/opentofu/**` | OpenTofu fmt/validate/plan, Checkov scan. |
| `charts/**`, `deploy/**`, `platform/**` | Checkov scan, GitOps manifest validation nếu có. |
| `Dockerfile`, `services/*/Dockerfile` | Checkov Dockerfile scan, build pipeline sau merge. |
| `.github/workflows/**` | Checkov workflow scan nếu rule set hỗ trợ, review bắt buộc. |

## 8. Build & Publish Pipeline

Pipeline này chạy sau khi code được merge vào branch chính hoặc khi tạo release.

### 8.1 Mục tiêu

- Build container image đáng tin cậy.
- Scan image bằng Trivy trước khi promote/deploy.
- Push image vào Harbor bằng tag bất biến.
- Resolve image digest để dùng làm định danh artifact chính.
- Tạo SBOM/attestation bằng Trivy cho image digest.
- Ký image digest bằng Cosign để đảm bảo tính toàn vẹn.
- Cập nhật GitOps manifests bằng digest để FluxCD triển khai.

### 8.2 Các bước chính

| Bước | Tool | Nội dung |
|---|---|---|
| Detect changed services | GitHub Actions path filter | Chỉ build những service thay đổi. |
| Build image | Docker BuildKit | Build Docker image cho từng service. |
| Tag image | Git SHA / semver | Gắn tag bất biến theo git SHA, branch hoặc semver; không dùng `latest`. |
| Image scan | Trivy image | Quét OS packages và application dependencies trong image trước khi promote/deploy. |
| Push Harbor | Harbor | Đẩy image đã scan vào Harbor project tương ứng. |
| Resolve digest | Docker/Crane/Skopeo | Lấy image digest từ Harbor để dùng cho signing, SBOM và GitOps. |
| Generate SBOM / attestation | Trivy | Tạo SBOM theo CycloneDX/SPDX và lưu như artifact hoặc OCI attachment nếu cần. |
| Sign image digest | Cosign | Ký image digest, không ký tag mutable. |
| Update GitOps manifests | GitHub Actions | Cập nhật image digest trong overlay devsecops. |
| Notify | Slack/Discord/email nếu cần | Gửi trạng thái pipeline. |

### 8.3 Quy tắc image

| Quy tắc | Mô tả |
|---|---|
| Không dùng `latest` | Mọi image phải dùng git SHA, semver hoặc digest. |
| Ưu tiên digest | Môi trường DevSecOps nên pin image theo digest để tránh tag bị ghi đè. |
| Image phải được scan | Không deploy image chưa có Trivy image scan. |
| Image phải được ký | Môi trường DevSecOps chỉ nhận image digest đã ký bằng Cosign. |
| Có SBOM | Mỗi image dùng cho môi trường DevSecOps phải có SBOM từ Trivy, gắn với image digest cụ thể. |
| Có provenance | Nên lưu thông tin build provenance để truy vết nguồn gốc artifact. |
| Không overwrite release tag | Tránh tag mutable gây khó rollback và audit. |

### 8.4 Thứ tự khuyến nghị

```text
Build image
→ Trivy image scan
→ Push image vào Harbor
→ Resolve image digest
→ Trivy SBOM / attestation
→ Cosign sign image digest
→ Update GitOps manifest bằng image digest
→ FluxCD reconcile
```

Lưu ý: scan có thể chạy trên local image trước khi push hoặc trên image reference sau khi push vào Harbor. Tuy nhiên, **GitOps overlay devsecops phải luôn pin theo digest** và Cosign nên ký digest đã resolve từ registry.

Môi trường DevSecOps chỉ nên nhận image khi:

- Image không có Critical/High vulnerability chưa xử lý hoặc chưa được allowlist.
- Image có SBOM đi kèm.
- Image được ký bằng Cosign.
- GitOps manifest pin bằng digest thay vì tag mutable.

## 9. Harbor Registry Strategy

Harbor đóng vai trò trusted private registry của platform. Vì dự án chỉ triển khai một Shared Cloud DevSecOps Environment, Harbor không cần tách nhiều project theo dev/staging/prod ngay từ đầu.

### 9.1 Vai trò của Harbor

| Vai trò | Mô tả |
|---|---|
| Private registry | Lưu container images của frontend, backend, worker và platform components. |
| Project isolation | Tách project theo nhóm artifact thay vì theo nhiều môi trường cloud. |
| Robot account | Cấp credential riêng cho CI push image và FluxCD pull image. |
| Registry governance | Quản lý project, retention, audit, access control và promotion flow. |
| Vulnerability visibility | Có thể hiển thị kết quả scan nếu cấu hình scanner; security gate chính vẫn là Trivy trong CI. |
| Retention policy | Xóa image cũ theo chính sách để tiết kiệm storage. |
| Audit log | Ghi nhận hoạt động push, pull, delete, scan, promote. |

### 9.2 Cấu trúc project Harbor khuyến nghị

| Project | Mục đích |
|---|---|
| `sagelms-app` | Image của frontend, backend services và worker dùng cho Shared Cloud DevSecOps Environment. |
| `platform` | Image/charts phục vụ platform như observability, security tools nếu cần. |
| `proxy-cache` | Cache base images từ Docker Hub, GHCR hoặc registry khác. |

Nếu giảng viên hoặc yêu cầu đồ án muốn thấy phân tách production rõ hơn, có thể đặt tên project là `sagelms-prod` thay cho `sagelms-app`. Tuy nhiên, không cần tạo `sagelms-dev` và `sagelms-staging` khi không triển khai các môi trường đó.

### 9.3 Chính sách Harbor

| Chính sách | Mô tả |
|---|---|
| Tag bất biến | Image dùng git SHA hoặc semver; không dùng `latest`. |
| Digest là định danh chính | GitOps manifest luôn pin image bằng digest. |
| Scan trước deploy | Trivy image scan chạy trong CI trước khi cập nhật GitOps. |
| Signature bắt buộc | Image digest dùng cho môi trường DevSecOps phải được ký bằng Cosign. |
| Retention hợp lý | Giữ các image theo số lượng release gần nhất để tiết kiệm storage. |
| Robot account least privilege | CI có quyền push; FluxCD/runtime có quyền pull; không dùng credential cá nhân. |

### 9.4 Quan hệ giữa Harbor và Trivy

Harbor không thay thế Trivy trong CI. Trivy là security gate trước khi artifact được deploy. Harbor là nơi lưu trữ, kiểm soát quyền truy cập, audit và quản lý vòng đời artifact.

---

## 10. GitOps CD với FluxCD

FluxCD là thành phần triển khai chính vào GKE Shared Cloud DevSecOps Environment.

### 10.1 Vai trò của FluxCD

| Vai trò | Mô tả |
|---|---|
| Reconcile desired state | Theo dõi Git và đồng bộ trạng thái mong muốn vào Kubernetes. |
| Tách CI khỏi CD | CI không cần quyền deploy trực tiếp vào cluster. |
| Rollback bằng Git | Rollback bằng cách revert commit GitOps. |
| Single Shared Cloud DevSecOps Environment | Trong phạm vi đồ án, FluxCD chỉ cần reconcile overlay `devsecops`. |
| Drift detection | Phát hiện và sửa drift giữa cluster và Git. |

### 10.2 Luồng GitOps

1. GitHub Actions cập nhật image digest trong `deploy/overlays/devsecops`.
2. Thay đổi này đi qua GitOps Pull Request hoặc GitHub Environment approval.
3. Sau khi được duyệt, commit được merge vào branch GitOps được FluxCD theo dõi.
4. FluxCD render Helm/Kustomize manifests.
5. FluxCD apply vào namespace `sagelms-devsecops` trên GKE.
6. Kubernetes rollout workload.
7. Prometheus và OpenTelemetry ghi nhận trạng thái runtime.

### 10.3 Quy tắc GitOps

- Không deploy thủ công bằng lệnh trực tiếp vào cluster.
- Mọi thay đổi runtime phải có commit Git.
- Overlay chính trong phạm vi đồ án là `deploy/overlays/devsecops`.
- DevSecOps deployment cần approval trước khi cập nhật runtime.
- Rollback bằng cách revert commit hoặc trỏ lại image digest cũ.
- GitOps commit cần ghi rõ service, version, image digest và lý do thay đổi.

### 10.4 Mở rộng sau MVP

Nếu sau này cần môi trường staging thật, có thể tách overlay hiện tại thành:

```text
deploy/overlays/staging
deploy/overlays/production
```

Thiết kế `base + devsecops overlay` hiện tại vẫn giữ được khả năng mở rộng này.

---

## 11. Helm + Kustomize Strategy

Sử dụng kết hợp Helm và Kustomize để đạt cả tính tái sử dụng và tính linh hoạt theo môi trường. Việc chỉ có một cloud environment không làm mất ý nghĩa của Kustomize; Kustomize vẫn dùng để tách cấu hình dùng chung khỏi overlay triển khai.

### 11.1 Vai trò của Helm

Helm dùng để đóng gói template triển khai chung cho microservices.

Helm chart chung nên bao gồm:

- Deployment.
- Service.
- Ingress.
- ConfigMap.
- ServiceAccount.
- HorizontalPodAutoscaler.
- PodDisruptionBudget.
- ServiceMonitor.
- Resource requests/limits.
- Health probes.
- Security context.
- Environment variables.
- Common labels và annotations.

### 11.2 Vai trò của Kustomize trong phạm vi đồ án

Kustomize dùng theo mô hình:

```text
deploy/
├── base/
│   ├── gateway/
│   ├── auth-service/
│   ├── course-service/
│   ├── content-service/
│   ├── progress-service/
│   ├── assessment-service/
│   ├── ai-tutor-service/
│   └── worker/
└── overlays/
    └── devsecops/
```

Trong `base`, đặt cấu hình dùng chung:

- Deployment/Service/HPA/PDB chuẩn.
- Common labels.
- Security context mặc định.
- Health probes.
- ServiceAccount.
- ServiceMonitor.

Trong `overlays/devsecops`, patch cấu hình phụ thuộc môi trường:

- Namespace.
- Replica count.
- Image digest.
- Resource requests/limits.
- Ingress hostname.
- Environment variables non-secret.
- ExternalSecret reference.
- HPA min/max.
- Feature flags.
- Observability annotations.
- Kyverno labels/annotations.

### 11.3 Cách phân chia

| Thành phần | Dùng Helm | Dùng Kustomize |
|---|---|---|
| Template workload dùng chung | Có | Không |
| Deployment/Service/HPA/PDB chuẩn | Có | Không |
| Overlay devsecops | Không | Có |
| Patch image digest | Không | Có |
| Patch resource cloud runtime | Không | Có |
| Chuẩn hóa nhiều service giống nhau | Có | Có |

### 11.4 Khả năng mở rộng

Nếu sau này có thêm staging hoặc production thật, chỉ cần thêm overlay mới mà không viết lại base:

```text
deploy/overlays/staging
deploy/overlays/production
```

Do đó, Kustomize vẫn có ý nghĩa ngay cả khi hiện tại chỉ triển khai một devsecops overlay.

---

## 12. OpenTofu Infrastructure Pipeline

OpenTofu quản lý hạ tầng GCP bằng mã nguồn. Trong phạm vi đồ án, OpenTofu chỉ cần tạo hạ tầng cho một Shared Cloud DevSecOps Environment thay vì nhiều stack dev/staging/prod.

### 12.1 Hạ tầng do OpenTofu quản lý

| Hạng mục | Vai trò |
|---|---|
| VPC / Subnet | Network nền tảng cho GKE và managed services. |
| GKE Cluster | Runtime chính cho Shared Cloud DevSecOps Environment. |
| Cloud SQL PostgreSQL | Database chính, tích hợp pgvector cho AI Tutor nếu ngân sách cho phép. |
| Memorystore Redis | Queue/cache cho async jobs nếu ngân sách cho phép; có thể thay bằng Redis in-cluster để tiết kiệm. |
| Cloud Storage | Lưu tài liệu, artifacts, backups, state nếu cần. |
| Google Secret Manager | Quản lý secret tập trung. |
| IAM / Workload Identity | Cấp quyền tối thiểu cho workloads. |
| Cloud DNS / Load Balancer | Public endpoint cho ứng dụng và Harbor nếu cần. |
| Service Accounts | Phân quyền cho CI, FluxCD, ESO và workload. |

### 12.2 Luồng thay đổi hạ tầng

1. Developer tạo Pull Request thay đổi trong `infra/opentofu`.
2. CI chạy `tofu fmt` và `tofu validate`.
3. Checkov scan OpenTofu modules.
4. CI tạo OpenTofu plan cho DevSecOps stack.
5. Checkov scan plan nếu workflow hỗ trợ để phát hiện misconfiguration theo resource cuối cùng.
6. Reviewer kiểm tra plan.
7. Apply hạ tầng DevSecOps yêu cầu manual approval.
8. Output hạ tầng được dùng bởi FluxCD hoặc External Secrets khi cần.

### 12.3 Quy tắc hạ tầng

- Không tạo hạ tầng thủ công ngoài OpenTofu.
- Mọi thay đổi hạ tầng phải đi qua Pull Request.
- DevSecOps apply cần approval.
- State phải lưu remote backend.
- State cần encryption và access control.
- Không lưu secret plaintext trong state nếu có thể tránh.
- Module nên tái sử dụng được để sau này tách staging/production nếu cần.
- Checkov finding mức Critical/High cần được xử lý hoặc có ghi chú allowlist rõ lý do.

### 12.4 Lý do dùng Checkov cho IaC

Checkov được chọn làm IaC/config scanner chính vì đây là công cụ chuyên dụng cho static analysis của infrastructure-as-code. Trong dự án SageLMS, Checkov chịu trách nhiệm:

- Scan OpenTofu/Terraform modules.
- Phát hiện GCP IAM, network, firewall, database và storage misconfiguration.
- Scan Kubernetes manifests.
- Scan Helm charts và Kustomize overlay devsecops.
- Scan Dockerfile security baseline ở mức cấu hình.
- Hỗ trợ policy/compliance checks theo rule set.

Trivy vẫn được dùng cho dependency, image và SBOM. Không dùng Trivy làm IaC scanner chính để tránh chồng vai trò với Checkov.

---

## 13. Ansible Automation Strategy

Ansible không thay thế OpenTofu hoặc FluxCD. Ansible chỉ dùng cho bootstrap và Day-2 operations.

### 13.1 Vai trò của Ansible

| Use case | Mô tả |
|---|---|
| Bootstrap self-hosted runner | Cài Docker/BuildKit, Sonar Scanner, Gitleaks, Checkov, Trivy, Cosign, Helm, kubectl, Flux CLI. |
| Hardening VM | Cấu hình user, firewall, SSH, audit, logrotate. |
| Bastion/utility node | Cấu hình máy phục vụ vận hành hoặc debug. |
| Patch management | Cập nhật OS và tooling định kỳ. |
| Backup automation | Tạo script backup hoặc kiểm tra backup cho Harbor/runner nếu cần. |
| Day-2 operations | Tự động hóa các thao tác vận hành lặp lại. |

### 13.2 Quy tắc sử dụng Ansible

- Không dùng Ansible để deploy app trực tiếp lên GKE DevSecOps; deployment phải đi qua FluxCD.
- Không dùng Ansible để apply Kubernetes manifests thay FluxCD.
- Không hardcode secret trong playbook.
- Playbook phải idempotent.
- Inventory phải tách môi trường.
- Các thay đổi Ansible cũng phải qua Pull Request.

### 13.3 Toolchain runner cần chuẩn hóa

| Nhóm | Tool |
|---|---|
| Build | Docker, BuildKit |
| Code quality | Sonar Scanner |
| Secret scanning | Gitleaks |
| IaC scanning | Checkov |
| Dependency/image/SBOM | Trivy |
| Signing | Cosign |
| Kubernetes/GitOps | kubectl, Helm, Kustomize, Flux CLI |
| IaC | OpenTofu |

## 14. Quản lý key, secret và environment theo từng môi trường

Secret được quản lý bằng Google Secret Manager và đồng bộ vào Kubernetes bằng External Secrets Operator. Vì dự án chỉ có local minimal debug và một Shared Cloud DevSecOps Environment, chiến lược secret/environment cần đơn giản nhưng vẫn đúng nguyên tắc production.

### 14.1 Phân loại cấu hình

| Loại | Ví dụ | Cách quản lý |
|---|---|---|
| Non-secret config | `LOG_LEVEL`, `APP_ENV`, feature flags, service URL nội bộ | GitOps/Kustomize ConfigMap hoặc Helm values non-secret. |
| Runtime secret | DB password, Redis password, JWT signing key, LLM API key | Google Secret Manager → External Secrets Operator → Kubernetes Secret. |
| CI/CD secret | Harbor robot credential, GCP service account/OIDC config, Cosign key nếu dùng key-based signing | GitHub Environments/Actions secrets, ưu tiên OIDC/keyless khi có thể. |
| Signing material | Cosign key hoặc keyless identity config | Ưu tiên Cosign keyless/OIDC; nếu dùng key thì lưu trong secret manager và giới hạn quyền. |
| Local secret | `.env` local cho developer | `.env` không commit; cung cấp `.env.example`. |

### 14.2 Quy ước theo môi trường

| Môi trường | Cách quản lý config | Cách quản lý secret |
|---|---|---|
| Local minimal debug | `.env`, Docker Compose override, config local | `.env` local, không commit; chỉ dùng credential dev/test. |
| Shared Cloud DevSecOps Environment | `deploy/overlays/devsecops`, ConfigMap, Helm values non-secret | Google Secret Manager + External Secrets Operator. |

Không cần duy trì secret set riêng cho dev/staging/prod nếu các môi trường cloud đó không tồn tại trong phạm vi đồ án.

### 14.3 Luồng secret cho môi trường DevSecOps

1. Secret thật được lưu trong Google Secret Manager.
2. External Secrets Operator đọc secret bằng Workload Identity.
3. ESO tạo Kubernetes Secret trong namespace `sagelms-devsecops`.
4. Pod mount secret qua environment variables hoặc volume.
5. Ứng dụng sử dụng secret tại runtime.
6. Secret rotation được thực hiện tại Google Secret Manager và rollout lại workload khi cần.

### 14.4 Secret cần quản lý

| Secret | Dùng cho |
|---|---|
| Database credentials | Kết nối Cloud SQL PostgreSQL hoặc PostgreSQL runtime. |
| Redis credentials | Kết nối Memorystore Redis hoặc Redis runtime nếu bật auth. |
| JWT signing keys | Auth service và Gateway. |
| LLM provider API key | AI Tutor. |
| Harbor robot account | CI push image hoặc FluxCD/runtime pull image. |
| Cosign key hoặc keyless identity config | Image signing. |
| OAuth/OIDC client secrets | Nếu có đăng nhập qua provider ngoài. |
| Grafana admin credential | Nếu triển khai Grafana self-hosted. |

### 14.5 Quản lý environment config bằng Kustomize

`deploy/overlays/devsecops` nên quản lý các giá trị non-secret:

- Namespace.
- Replica count.
- Resource requests/limits.
- Ingress hostname.
- Feature flags.
- Log level.
- Service endpoint nội bộ.
- ExternalSecret references.
- Observability annotations.

Các giá trị secret không được ghi plaintext trong GitOps repo.

### 14.6 GitHub Actions secrets và environments

- PR jobs không được truy cập secret của môi trường DevSecOps.
- Build/release jobs chỉ chạy trên protected branch hoặc tag.
- DevSecOps deployment nên dùng GitHub Environment có required reviewers.
- Ưu tiên Workload Identity Federation/OIDC thay vì long-lived cloud keys.
- Harbor robot account tách quyền push và pull.

### 14.7 Quy tắc secret

- Không commit secret vào Git.
- Không lưu secret trong Helm values plaintext.
- Không ghi secret vào log.
- Dùng least privilege cho service account đọc secret.
- Có quy trình rotate secret.
- CI chỉ được truy cập secret cần thiết theo branch/environment.
- Gitleaks phải chạy trên PR để giảm rủi ro secret leak.

---

## 15. Kyverno Policy Strategy

Kyverno kiểm soát workload trước khi được triển khai vào GKE Shared Cloud DevSecOps Environment.

### 15.1 Policy bắt buộc

| Policy | Mục tiêu |
|---|---|
| Disallow latest tag | Không cho dùng image tag `latest`. |
| Require trusted registry | Chỉ cho pull image từ Harbor hoặc registry được phê duyệt. |
| Require signed image | Môi trường DevSecOps chỉ nhận image đã ký. |
| Require resource requests/limits | Tránh workload chiếm tài nguyên không kiểm soát. |
| Disallow privileged containers | Ngăn container chạy privileged. |
| Require runAsNonRoot | Giảm rủi ro container escape. |
| Require probes | Bắt buộc liveness/readiness/startup probes. |
| Require labels | Chuẩn hóa labels cho cost, owner, service, environment. |
| Restrict hostPath | Ngăn mount host filesystem trừ khi được cho phép. |
| Restrict secret exposure | Ngăn cấu hình secret không an toàn trong manifest. |

### 15.2 Mức enforce trong phạm vi đồ án

Vì chỉ có một Shared Cloud DevSecOps Environment, policy nên áp dụng theo mức tăng dần:

| Giai đoạn | Mức kiểm soát |
|---|---|
| Ban đầu | Audit các policy phức tạp, enforce các rule an toàn cơ bản như disallow latest, require resource, disallow privileged. |
| Trước demo | Enforce các policy quan trọng: trusted registry, signed image, probes, runAsNonRoot, resource requests/limits. |
| Post-MVP | Tách policy theo staging/production nếu có thêm môi trường cloud. |

---

## 16. Database & Migration Strategy

Dự án dùng PostgreSQL + pgvector với mô hình schema-per-service; mỗi service sở hữu schema riêng và không join cross-schema. Redis được dùng cho job queue và cache tùy chọn.

### 16.1 Database runtime

| Thành phần | Dịch vụ GCP / phương án tiết kiệm |
|---|---|
| PostgreSQL | Ưu tiên Cloud SQL PostgreSQL nếu cần điểm production; có thể dùng PostgreSQL in-cluster cho demo tiết kiệm. |
| Vector store | pgvector extension trong PostgreSQL. |
| Queue/cache | Memorystore Redis nếu ngân sách cho phép; có thể dùng Redis in-cluster cho demo tiết kiệm. |
| File/object | Cloud Storage hoặc storage tương đương cho tài liệu/artifacts. |

### 16.2 Migration

| Service | Migration tool |
|---|---|
| Java services | Flyway |
| Python AI Tutor | Alembic |

### 16.3 Quy tắc migration trong pipeline

- Migration phải nằm trong source code.
- Migration phải được review cùng PR.
- PR thay đổi entity/schema phải kèm migration.
- CI cần kiểm tra migration chạy được trên database test/local.
- Migration trên môi trường DevSecOps cần backup hoặc seed/restore plan trước demo quan trọng.
- Không sửa migration đã chạy trên môi trường DevSecOps; tạo migration mới.
- Với breaking change, dùng expand-and-contract strategy.
- Nếu dùng database in-cluster cho demo, cần có script seed/reset dữ liệu rõ ràng.

---

## 17. Observability Strategy

Observability được thiết kế cho cả microservices và AI Tutor RAG pipeline.

### 17.1 Thành phần observability

| Tín hiệu | Công cụ |
|---|---|
| Metrics | Prometheus |
| Dashboard | Grafana |
| Logs | Loki |
| Traces | Tempo |
| Instrumentation | OpenTelemetry SDK |
| Telemetry pipeline | OpenTelemetry Collector |
| Alerting | Prometheus Alertmanager hoặc Grafana Alerting |

### 17.2 Metrics cần theo dõi

| Nhóm | Metrics |
|---|---|
| API Gateway | Request rate, error rate, latency, auth failures. |
| Backend services | HTTP latency, DB latency, error count, thread/heap metrics. |
| AI Tutor | Retrieval latency, embedding latency, LLM latency, token usage, answer failure rate. |
| PostgreSQL | Connections, slow queries, CPU, storage, replication/backup status. |
| Redis | Queue length, job latency, memory usage, failed jobs. |
| Kubernetes | Pod restart, CPU/memory, HPA scaling, deployment health. |
| CI/CD | Build duration, failure rate, vulnerability count, deployment frequency. |

### 17.3 Tracing

Trace cần đi xuyên suốt:

1. Frontend request.
2. Gateway.
3. Service backend.
4. Database call.
5. Redis job enqueue.
6. Worker processing.
7. AI Tutor retrieval.
8. pgvector search.
9. LLM call.
10. Response trả về người dùng.

---

## 18. Branching & Release Strategy

Vì dự án chỉ có một Shared Cloud DevSecOps Environment, branching strategy nên đơn giản để tránh overhead. Khuyến nghị dùng GitHub Flow hoặc trunk-based nhẹ.

### 18.1 Branching model

| Branch | Vai trò |
|---|---|
| `main` | Branch ổn định, nguồn để build image và cập nhật GitOps overlay devsecops sau approval. |
| `feature/*` | Phát triển tính năng. Tạo Pull Request vào `main`. |
| `fix/*` | Sửa lỗi thông thường. |
| `hotfix/*` | Sửa lỗi khẩn cấp cho Shared Cloud DevSecOps Environment. |
| `release/*` | Tùy chọn, chỉ dùng nếu nhóm muốn gom nhiều thay đổi trước demo. |

Không bắt buộc dùng `develop` nếu team muốn tối giản. PR checks và manual approval thay thế vai trò kiểm soát của staging riêng.

### 18.2 Versioning

| Artifact | Version |
|---|---|
| Local minimal debug | Không bắt buộc có image chính thức; chỉ dùng khi cần debug source code bằng Docker Compose/IDE. |
| DevSecOps image | Git SHA hoặc semver + digest. |
| Helm chart | Semver nếu chart được version hóa riêng. |
| GitOps release | Commit SHA + image digest + release note. |

### 18.3 Release flow

1. Developer tạo PR từ `feature/*` vào `main`.
2. PR chạy CI/security gates.
3. Reviewer approve và merge vào `main`.
4. GitHub Actions build, scan, push image vào Harbor.
5. Pipeline resolve digest, tạo SBOM/attestation và ký image digest bằng Cosign.
6. Pipeline tạo commit/PR cập nhật `deploy/overlays/devsecops`.
7. Manual approval qua GitHub Environment hoặc GitOps PR.
8. FluxCD triển khai Shared Cloud DevSecOps Environment.
9. Theo dõi dashboard và alert.
10. Rollback bằng Git revert hoặc quay lại digest cũ nếu health check thất bại.

---

## 19. Rollback Strategy

Rollback cần dựa trên GitOps và immutable artifact.

### 19.1 Rollback ứng dụng

- Revert commit GitOps đã cập nhật image digest trong `deploy/overlays/devsecops`.
- FluxCD reconcile lại trạng thái cũ.
- Kubernetes rollout về ReplicaSet/image digest trước.
- Theo dõi health check và metrics sau rollback.

### 19.2 Rollback database

Database rollback phức tạp hơn application rollback. Quy tắc:

- Ưu tiên forward-compatible migration.
- Không drop column ngay khi release.
- Dùng expand-and-contract.
- Backup hoặc snapshot trước migration môi trường DevSecOps quan trọng.
- Với migration nguy hiểm, cần manual approval.
- Có runbook restore Cloud SQL hoặc restore database in-cluster nếu dùng phương án tiết kiệm.

### 19.3 Rollback infrastructure

- OpenTofu changes phải có plan rõ ràng.
- Không auto-apply thay đổi hạ tầng lớn vào môi trường DevSecOps nếu chưa review.
- Có backup state.
- Có review trước khi destroy resource.
- Không xóa resource cloud bằng pipeline tự động nếu chưa có approval.

---

## 20. Security Gates

### 20.1 PR security gates

| Gate | Tool | Điều kiện chặn |
|---|---|---|
| Code quality / SAST | SonarQube | Quality Gate fail, bug/vulnerability/security hotspot nghiêm trọng chưa xử lý. |
| Secret scan | Gitleaks | Phát hiện secret thật hoặc pattern nguy hiểm. |
| Dependency scan | Trivy | Dependency có CVE Critical/High chưa xử lý hoặc chưa allowlist. |
| IaC/config scan | Checkov | Cấu hình OpenTofu/GCP/Kubernetes/Helm/Kustomize/Dockerfile không an toàn ở mức nghiêm trọng. |
| OpenAPI lint | Spectral hoặc tương đương | API contract sai format hoặc thiếu chuẩn cơ bản. |
| OpenTofu validate/plan | OpenTofu | Hạ tầng không validate được hoặc plan có thay đổi rủi ro chưa review. |

### 20.2 Build security gates

| Gate | Tool | Điều kiện chặn |
|---|---|---|
| Image scan | Trivy | Image có Critical/High vulnerability chưa allowlist. |
| SBOM | Trivy | Image dùng cho môi trường DevSecOps không có SBOM. |
| Signing | Cosign | Image dùng cho môi trường DevSecOps chưa được ký hoặc signature không verify được. |
| Registry | Harbor | Push sai project hoặc vi phạm tag/digest convention. |
| Provenance | Build metadata | Build metadata không truy vết được commit nguồn. |

### 20.3 Runtime security gates

| Gate | Tool | Điều kiện chặn |
|---|---|---|
| Registry policy | Kyverno | Image không đến từ Harbor hoặc registry được phê duyệt. |
| Signature policy | Kyverno + Cosign | Môi trường DevSecOps chạy image chưa ký hoặc verify signature fail. |
| Pod security | Kyverno | Container privileged, chạy root không cần thiết, host namespace/hostPath không hợp lệ. |
| Resource policy | Kyverno | Thiếu resource requests/limits. |
| Probe policy | Kyverno | Thiếu liveness/readiness/startup probes. |
| Secret policy | Kyverno + ESO convention | Secret plaintext xuất hiện trong manifest hoặc cấu hình không đúng chuẩn. |

---

## 21. CI/CD Workflow đề xuất

### 21.1 Workflow 1: Pull Request Validation

Mục đích: kiểm tra mọi thay đổi trước khi merge.

Nội dung chính:

- Detect changed paths.
- Run lint/test theo service thay đổi.
- Run frontend typecheck nếu frontend thay đổi.
- Run OpenAPI lint nếu contract thay đổi.
- Run SonarQube Quality Gate.
- Run Gitleaks secret scan.
- Run Trivy dependency scan.
- Run Checkov IaC/config scan nếu infra, manifest, chart, Dockerfile hoặc workflow thay đổi.
- Generate OpenTofu plan nếu hạ tầng thay đổi.
- Gửi status về Pull Request.

### 21.2 Workflow 2: Build & Publish Image

Mục đích: tạo artifact sau khi merge vào `main` hoặc khi tạo release tag.

Nội dung chính:

- Build image theo service thay đổi.
- Tag image bằng git SHA hoặc semver; không dùng `latest`.
- Scan image bằng Trivy.
- Push image vào Harbor.
- Resolve image digest từ Harbor.
- Generate SBOM/attestation bằng Trivy cho digest.
- Sign image digest bằng Cosign.
- Upload security reports/SBOM/signature metadata.
- Chuẩn bị thay đổi GitOps overlay `devsecops` bằng image digest.

### 21.3 Workflow 3: Shared Cloud DevSecOps GitOps Deployment

Mục đích: triển khai artifact đã kiểm chứng vào Shared Cloud DevSecOps Environment.

Nội dung chính:

- Verify image digest khớp artifact trong Harbor.
- Verify Trivy image scan result.
- Verify SBOM/attestation tồn tại.
- Verify Cosign signature.
- Cập nhật `deploy/overlays/devsecops` bằng digest đã verify.
- Yêu cầu manual approval qua GitHub Environment hoặc GitOps Pull Request.
- Merge GitOps change.
- FluxCD triển khai Shared Cloud DevSecOps Environment.
- Theo dõi health check và alert.

### 21.4 Workflow 4: Infrastructure Plan & Apply

Mục đích: quản lý hạ tầng GCP Shared Cloud DevSecOps Environment bằng OpenTofu.

Nội dung chính:

- Format và validate OpenTofu.
- Checkov scan OpenTofu modules.
- Generate OpenTofu plan cho PR.
- Checkov scan plan nếu workflow hỗ trợ.
- Apply hạ tầng DevSecOps sau approval.
- Lưu artifact plan và log.

### 21.5 Workflow 5: Scheduled Security Scan

Mục đích: phát hiện lỗ hổng mới trong dependency, image cũ và hạ tầng sau khi đã merge/deploy.

Nội dung chính:

- Trivy re-scan dependencies định kỳ.
- Trivy re-scan image digest đang lưu trong Harbor hoặc đang được GitOps sử dụng.
- Checkov re-scan IaC, Kubernetes manifests, Helm và Kustomize định kỳ.
- Gitleaks scan repository history định kỳ nếu cần.
- SonarQube scheduled analysis nếu muốn đo trend code quality.
- Tạo issue nếu phát hiện lỗi nghiêm trọng.
- Gửi thông báo cho team.

---

## 22. Runner Strategy

### 22.1 Giai đoạn đầu

Có thể dùng GitHub-hosted runners cho PR pipeline cơ bản.

Phù hợp cho:

- Lint.
- Unit test.
- Typecheck.
- SonarQube scan nếu dùng SonarCloud hoặc SonarQube server reachable.
- Gitleaks secret scan.
- Trivy dependency scan.
- Checkov IaC/config scan.
- OpenAPI lint.

### 22.2 Giai đoạn triển khai trên môi trường DevSecOps

Nên bổ sung self-hosted runners nếu Harbor, SonarQube hoặc cluster nằm trong mạng private.

Phù hợp cho:

- Build image có cache.
- Push Harbor private registry.
- Chạy OpenTofu plan/apply với quyền kiểm soát tốt hơn.
- Kết nối nội bộ đến GKE cluster của môi trường DevSecOps.
- Truy cập SonarQube nội bộ nếu self-hosted.

### 22.3 Phân loại runner

| Runner | Vai trò |
|---|---|
| PR runner | Không có secret của môi trường DevSecOps, dùng cho Pull Request. |
| Build runner | Có quyền build image, chạy Trivy image scan, ký image và push Harbor. |
| Release runner | Chỉ chạy protected branch/tag, có quyền ký image và cập nhật GitOps overlay devsecops. |
| Infra runner | Chạy OpenTofu plan/apply, apply cần approval. |
| Security runner | Có cache vulnerability DB/ruleset cho SonarQube, Gitleaks, Checkov, Trivy nếu cần tối ưu. |

### 22.4 Ansible cho runner

Ansible dùng để chuẩn hóa self-hosted runner:

- Cài Docker/BuildKit.
- Cài Sonar Scanner.
- Cài Gitleaks.
- Cài Checkov.
- Cài Trivy.
- Cài Cosign.
- Cài Helm, kubectl, Flux CLI và OpenTofu.
- Cấu hình cache.
- Hardening OS.
- Register runner.
- Cập nhật định kỳ.

---

## 23. Deployment Strategy trên GKE

### 23.1 Namespace strategy

Vì chỉ có một Shared Cloud DevSecOps Environment, namespace strategy nên gọn:

| Namespace | Vai trò |
|---|---|
| `sagelms-devsecops` | Workload chính của SageLMS trong Shared Cloud DevSecOps Environment. |
| `platform-system` | FluxCD, ESO, Kyverno, observability controllers. |
| `harbor` | Harbor registry nếu deploy Harbor trên GKE. |
| `monitoring` | Tùy chọn nếu muốn tách Prometheus/Grafana/Loki/Tempo khỏi platform-system. |

Không cần tạo `sagelms-dev` và `sagelms-staging` nếu không triển khai các môi trường cloud đó.

### 23.2 Workload strategy

Mỗi service cần có:

- Deployment.
- Service.
- Ingress hoặc Gateway route.
- ConfigMap.
- ExternalSecret.
- ServiceAccount.
- HPA.
- PDB.
- ServiceMonitor.
- Resource requests/limits.
- Liveness/readiness probes.
- Security context.
- Standard labels.

### 23.3 Scaling strategy

| Service | Scaling |
|---|---|
| Gateway | Scale theo request rate/CPU. Với đồ án có thể bắt đầu 1-2 replicas. |
| Auth service | Scale theo login/session traffic. |
| Course/content/progress/assessment | Scale theo API traffic. |
| AI Tutor | Scale riêng, ưu tiên latency và resource. Có thể giới hạn replica để tiết kiệm chi phí. |
| Worker | Scale theo Redis queue length. |
| Frontend | Scale nhẹ, có thể cache static content. |

### 23.4 Tối ưu tài nguyên cho đồ án

Để tránh tốn chi phí:

- Chỉ chạy một cluster cho Shared Cloud DevSecOps Environment.
- Dùng node pool nhỏ hoặc autopilot nếu phù hợp ngân sách.
- Chạy Cloud SQL/Memorystore managed nếu cần điểm production; dùng Postgres/Redis in-cluster nếu cần tiết kiệm.
- Giới hạn replica mặc định là 1 cho hầu hết service, chỉ tăng khi demo scaling.
- Dùng resource requests/limits thấp nhưng rõ ràng.
- Có thể scale down ngoài giờ demo nếu không cần chạy liên tục.

---

## 24. Data & AI Tutor Considerations

AI Tutor dùng RAG pipeline với ingestion, embedding, vector search và answer generation. pgvector được dùng làm vector store trong PostgreSQL, Redis được dùng cho tác vụ nặng và bất đồng bộ.

### 24.1 Pipeline AI Tutor

| Bước | Mục tiêu |
|---|---|
| Ingestion | Lấy nội dung bài học/tài liệu. |
| Chunking | Chia nhỏ tài liệu. |
| Embedding | Vector hóa nội dung. |
| Store | Lưu vector vào pgvector. |
| Retrieval | Tìm top-k chunks theo course/lesson context. |
| Answering | Gọi LLM và trả lời kèm citation. |
| Logging/tracing | Ghi latency từng bước. |

### 24.2 CI/CD cho AI Tutor

AI Tutor cần kiểm tra thêm:

- Test chunking logic.
- Test prompt safety.
- Test fallback khi không đủ context.
- Test retrieval filter theo course.
- Test citation output.
- Test Redis async job.
- Test pgvector query.
- Monitor LLM latency và error rate.

---

## 25. Alerting & Incident Response

### 25.1 Alert quan trọng

| Alert | Ý nghĩa |
|---|---|
| Deployment failed | FluxCD sync hoặc Kubernetes rollout lỗi. |
| High error rate | Service trả lỗi 5xx tăng cao. |
| High latency | P95/P99 latency vượt ngưỡng. |
| Pod crash loop | Pod restart liên tục. |
| Redis queue backlog | Worker xử lý không kịp. |
| DB connection saturation | Cloud SQL gần hết connection. |
| AI Tutor LLM latency high | LLM hoặc retrieval chậm. |
| Vulnerability detected | Trivy scheduled scan phát hiện CVE mới hoặc Checkov phát hiện misconfiguration mới. |
| Secret sync failed | ESO không đồng bộ được secret. |

### 25.2 Runbook cần có

- Rollback application.
- Rollback GitOps commit.
- Restore Cloud SQL backup.
- Rotate secret.
- Restart worker.
- Debug FluxCD sync error.
- Debug Kyverno policy block.
- Debug Harbor push/pull error.
- Debug OpenTelemetry trace missing.
- Scale worker khi queue tăng.

---

## 26. Roadmap triển khai

### Sprint 1: Foundation & CI Baseline

Mục tiêu: hoàn thiện CI cơ bản và chuẩn hóa repository.

Deliverables:

- GitHub Actions PR pipeline.
- Path filter theo service.
- Lint/test/typecheck.
- OpenAPI lint.
- SonarQube Quality Gate.
- Gitleaks secret scan.
- Trivy dependency scan.
- Checkov IaC/config scan cho OpenTofu/Kubernetes/Helm/Kustomize/Dockerfile.
- OpenTofu validate/plan cơ bản cho DevSecOps stack.
- Chuẩn branch protection và required checks.

Kết quả mong đợi:

- PR lỗi test bị chặn.
- PR chứa secret bị chặn bằng Gitleaks.
- PR có dependency vulnerability nghiêm trọng bị chặn bằng Trivy.
- PR có IaC/config misconfiguration nghiêm trọng bị chặn bằng Checkov.
- Code quality được kiểm soát bằng SonarQube.
- Chỉ service thay đổi mới chạy pipeline tương ứng.
- Contract API được kiểm tra tự động.

### Sprint 2: Build, Harbor & Supply Chain Security

Mục tiêu: chuẩn hóa artifact và registry.

Deliverables:

- Dockerfile chuẩn cho toàn bộ service.
- Harbor registry.
- Harbor project `sagelms-app` hoặc `sagelms-prod`.
- GitHub Actions build image.
- Image tag bằng git SHA.
- Trivy image scan.
- Push image vào Harbor.
- Resolve image digest.
- Trivy SBOM/attestation generation.
- Cosign signing theo digest.

Kết quả mong đợi:

- Mỗi service có image trong Harbor.
- Image Critical/High bị chặn trước deploy bằng Trivy.
- Image dùng cho môi trường DevSecOps có SBOM và signature.
- Không dùng image `latest`.
- GitOps manifest pin image digest.

### Sprint 3: GitOps CD với FluxCD cho Shared Cloud DevSecOps Environment

Mục tiêu: triển khai tự động lên GKE bằng GitOps.

Deliverables:

- GKE DevSecOps cluster bằng OpenTofu.
- FluxCD bootstrap.
- Helm chart chung cho microservices.
- Kustomize `deploy/base` và `deploy/overlays/devsecops`.
- External Secrets Operator.
- Google Secret Manager integration.
- GitOps deploy vào môi trường DevSecOps.
- Manual approval trước khi cập nhật runtime.

Kết quả mong đợi:

- Merge vào branch chính có thể tạo artifact đã scan/ký.
- GitOps overlay devsecops được cập nhật bằng image digest.
- FluxCD reconcile workload vào GKE.
- Secret không nằm trong Git.
- Rollback bằng Git revert.

### Sprint 4: Policy, Observability & DevSecOps Hardening

Mục tiêu: hoàn thiện bảo mật runtime và khả năng vận hành.

Deliverables:

- Kyverno policies.
- Policy verify image từ Harbor.
- Policy require signed image cho môi trường DevSecOps.
- OpenTelemetry Collector.
- Prometheus metrics.
- Grafana dashboards.
- Loki logs.
- Tempo traces.
- Alert rules.
- Runbooks.
- Load test nhẹ.
- Failure drill.
- DevSecOps readiness checklist.

Kết quả mong đợi:

- Workload sai policy bị chặn.
- Có dashboard theo service.
- Trace được request Gateway -> services -> AI Tutor.
- Có alert khi rollout lỗi hoặc latency cao.
- Có tài liệu rollback và incident response.

---

## 27. RACI đề xuất

| Vai trò | Trách nhiệm |
|---|---|
| Cloud/Platform Engineer | Thiết kế GCP, GKE, OpenTofu modules, IAM, network, Cloud SQL, Redis, Storage. |
| DevSecOps Engineer | Thiết kế GitHub Actions, Harbor, image signing, SBOM, security gates, FluxCD. |
| SRE/Security Engineer | Kyverno, observability, alerting, runbooks, policy, incident response. |
| Backend/AI Developer | Service readiness, Dockerfile, health checks, migration, OpenTelemetry instrumentation, RAG pipeline. |
| Frontend Developer | Frontend build, test, deployment, observability frontend nếu cần. |

---

## 28. KPI và tiêu chí nghiệm thu

| Nhóm | KPI |
|---|---|
| CI performance | Giảm 30-50% thời gian CI nhờ path filter, matrix build và cache. |
| Code quality | 100% PR bắt buộc pass SonarQube Quality Gate. |
| Secret safety | 0 secret plaintext trong Git; Gitleaks chạy trên PR. |
| Dependency security | Critical/High dependency vulnerability được xử lý hoặc allowlist hợp lệ. |
| IaC security | Critical/High Checkov findings được xử lý trước khi apply hạ tầng. |
| Environment cost | Chỉ duy trì một Shared Cloud DevSecOps Environment để tiết kiệm tài nguyên. |
| Deployment frequency | Có thể deploy lên Shared Cloud DevSecOps Environment sau mỗi merge hợp lệ và approval. |
| Lead time | Thời gian từ merge đến DevSecOps deployment dưới 15-20 phút cho service nhỏ. |
| Image security | 100% image dùng cho môi trường DevSecOps được Trivy scan trước deploy. |
| Supply chain | 100% image dùng cho môi trường DevSecOps có SBOM từ Trivy và Cosign signature. |
| Runtime policy | 100% workload trong môi trường DevSecOps pass Kyverno policy bắt buộc. |
| Observability | 90%+ request chính có trace/correlation ID. |
| Reliability | Rollback application thực hiện bằng GitOps trong thời gian ngắn. |
| Database safety | 100% schema changes có migration và review. |

---

## 29. Definition of Done cho pipeline production-oriented

Pipeline được xem là đạt yêu cầu production-oriented khi:

- Pull Request pipeline hoạt động đầy đủ.
- Path filter chạy đúng theo service thay đổi.
- Lint/test/typecheck/OpenAPI lint hoạt động ổn định.
- SonarQube Quality Gate được áp dụng cho PR.
- Gitleaks secret scan được áp dụng cho PR.
- Trivy dependency scan được áp dụng cho PR.
- Checkov IaC/config scan được áp dụng cho OpenTofu/Kubernetes/Helm/Kustomize/Dockerfile.
- OpenTofu validate/plan chạy tự động khi hạ tầng thay đổi.
- Hạ tầng Shared Cloud DevSecOps Environment được quản lý bằng OpenTofu.
- Local minimal debug chạy được bằng Docker Compose khi cần debug source code.
- Build image tự động sau merge.
- Image được Trivy scan, push vào Harbor, có digest, có SBOM/attestation và được Cosign ký theo digest.
- DevSecOps manifest pin image theo digest.
- FluxCD triển khai từ GitOps manifests.
- Helm + Kustomize quản lý được `deploy/base` và `deploy/overlays/devsecops`.
- Secret được lấy từ Google Secret Manager qua ESO.
- Không có secret plaintext trong GitOps repo.
- Kyverno chặn workload sai policy.
- Ansible bootstrap được runner hoặc utility host nếu dùng self-hosted runner.
- PostgreSQL + pgvector chạy ổn định, bằng Cloud SQL hoặc in-cluster tùy ngân sách.
- Redis phục vụ async job/cache, bằng Memorystore hoặc in-cluster tùy ngân sách.
- Cloud Storage hoặc storage tương đương phục vụ tài liệu và object storage nếu cần demo.
- Observability có metrics, logs và traces.
- Có rollback runbook.
- Có alert cho deployment failure, service error, latency, Redis backlog, DB issue và vulnerability findings nghiêm trọng.
- Tài liệu giải thích rõ vì sao dự án chỉ triển khai một Shared Cloud DevSecOps Environment để tối ưu tài nguyên.

---

## 30. Kết luận

Stack được chọn gồm GitHub + GitHub Actions, SonarQube, Gitleaks, Trivy, Checkov, OpenTofu, Ansible, GCP/GKE, Harbor, Cosign, FluxCD, Helm + Kustomize, Kyverno, External Secrets Operator + Google Secret Manager, Cloud SQL PostgreSQL + pgvector, Memorystore Redis, Cloud Storage, OpenTelemetry + Prometheus + Grafana + Loki + Tempo là một hướng thiết kế phù hợp cho SageLMS production-oriented.

Bản thiết kế này chọn tool theo nguyên tắc **một mục đích, một công cụ chính**:

| Lớp kiểm soát | Tool chính |
|---|---|
| Code quality / SAST | SonarQube |
| Secret scanning | Gitleaks |
| Dependency scanning | Trivy |
| Container image scanning | Trivy |
| SBOM | Trivy |
| IaC / config scanning | Checkov |
| Image signing | Cosign |
| Registry governance | Harbor |
| Runtime admission policy | Kyverno |
| GitOps deployment | FluxCD |

Điểm điều chỉnh quan trọng so với mô hình production đầy đủ là dự án không triển khai đồng thời `dev`, `staging`, `production` trên cloud. Thay vào đó, dự án dùng chiến lược:

```text
Local minimal debug bằng Docker Compose
+ một Shared Cloud DevSecOps Environment bằng GKE/GitOps
```

Cách này phù hợp hơn với dự án môn học vì tiết kiệm tài nguyên, giảm độ phức tạp vận hành, nhưng vẫn chứng minh được các thực hành production quan trọng: PR quality gate, security scanning, image digest, SBOM, signing, Harbor registry, GitOps deployment, secret management, admission policy, observability và rollback.

Thiết kế này giúp dự án đạt được bốn mục tiêu lớn:

1. Tự động hóa delivery: từ PR, test, scan, build, sign, push đến GitOps deployment.
2. Tăng bảo mật: kiểm soát code quality, secret, dependency, IaC, image, SBOM, signature và runtime policy bằng các công cụ đúng vai trò.
3. Tăng khả năng vận hành: observability đầy đủ, rollback bằng Git, alert và runbook rõ ràng.
4. Phù hợp phạm vi môn học: chỉ duy trì một môi trường Shared Cloud DevSecOps Environment, nhưng vẫn giữ kiến trúc mở rộng được sang staging/production thật sau MVP.

So với bản chỉ dùng một scanner duy nhất, bản này thực tế hơn vì chọn đúng tool cho từng lớp. So với bản dùng quá nhiều công cụ, bản này gọn hơn vì loại bỏ các tool trùng chức năng như Semgrep, Syft, Grype, OWASP Dependency-Check trong core pipeline. So với mô hình ba môi trường cloud, bản này tiết kiệm và khả thi hơn cho nhóm sinh viên nhưng không làm mất ý nghĩa của Helm, Kustomize, FluxCD hoặc DevSecOps.

