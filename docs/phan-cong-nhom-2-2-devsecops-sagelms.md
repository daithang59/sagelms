# Phân công công việc triển khai CI/CD DevSecOps Pipeline cho SageLMS

> **Mô hình phân công đề xuất:** 2 nhóm, mỗi nhóm 2 thành viên  
> **Mục tiêu:** tối ưu phối hợp, giảm phụ thuộc vụn, bảo đảm triển khai được pipeline DevSecOps end-to-end cho một Shared Cloud DevSecOps Environment trên GCP/GKE.  

---

## 1. Mục tiêu phân công

Dự án SageLMS triển khai CI/CD DevSecOps pipeline cho hệ thống web microservices theo hướng production-oriented, sử dụng một môi trường cloud dùng chung để kiểm thử và trình diễn end-to-end.

Mục tiêu của bản phân công này:

1. Chia công việc theo các nhóm có quan hệ phụ thuộc tự nhiên.
2. Hạn chế tình trạng một thành viên phải đợi nhiều người khác hoàn thành trước.
3. Tránh chia quá rải rác từng tool nhỏ khiến việc phối hợp bị phức tạp.
4. Giữ rõ owner chính cho từng mảng để dễ nghiệm thu.
5. Tạo điều kiện tích hợp sớm bằng một service mẫu trước khi mở rộng toàn hệ thống.

---

## 2. Nguyên tắc chia việc

Thay vì chia 4 thành viên thành 4 mảng rời rạc, nhóm sẽ chia thành **2 nhóm lớn**, mỗi nhóm 2 người:

```text
Nhóm A: Platform & Runtime
- Thắng
- Member 3

Nhóm B: CI/CD & Supply Chain
- Member 1
- Member 2
```

Lý do chia theo nhóm 2-2:

- Các phần GCP, GKE, OpenTofu, IAM, Secret Manager, FluxCD, ESO và observability phụ thuộc chặt với nhau, nên gom vào một nhóm.
- Các phần GitHub Actions, PR checks, Dockerfile, Harbor, Trivy, SBOM, Cosign và GitOps update workflow phụ thuộc chặt với nhau, nên gom vào một nhóm.
- Mỗi nhóm có thể tự xử lý phần lớn vấn đề nội bộ trước khi cần phối hợp với nhóm còn lại.
- Ranh giới giữa hai nhóm rõ ràng: **Nhóm B tạo artifact đáng tin cậy**, **Nhóm A triển khai và vận hành artifact đó trên GKE**.

---

## 3. Bảng phân công tổng quan

| Nhóm | Thành viên | Vai trò | Phạm vi chính |
|---|---|---|---|
| **Nhóm A - Platform & Runtime** | **Thắng** | Cloud/IaC Owner | GCP, GKE, OpenTofu, VPC/Subnet, IAM, Workload Identity, Secret Manager, Cloud Storage, Cloud SQL/Redis optional |
| **Nhóm A - Platform & Runtime** | **Member 3** | Runtime Platform Owner | FluxCD, Helm, Kustomize, External Secrets Operator, Kyverno runtime policies, observability, runbooks |
| **Nhóm B - CI/CD & Supply Chain** | **Member 1** | CI/CD Automation Owner | GitHub Actions, PR validation, path filter, quality/security gates, infra plan, GitOps update workflow, approval, smoke test |
| **Nhóm B - CI/CD & Supply Chain** | **Member 2** | Artifact & Supply Chain Owner | Dockerfile, Docker BuildKit, Harbor, Trivy image scan, image digest, SBOM, Cosign, image-related policies |

---

# 4. Nhóm A - Platform & Runtime

## 4.1 Phạm vi của Nhóm A

Nhóm A chịu trách nhiệm toàn bộ phần **cloud foundation** và **runtime platform**:

```text
GCP/GKE
OpenTofu
VPC/Subnet
IAM/Workload Identity
Google Secret Manager
Cloud Storage
Cloud SQL/Redis optional
Namespace nền
FluxCD
Helm
Kustomize
External Secrets Operator
Kyverno runtime policies
Observability
Runbooks
```

Nói ngắn gọn: Nhóm A đảm bảo có một môi trường GKE dùng chung, có GitOps runtime, có secret management, có policy cơ bản và có khả năng quan sát hệ thống.

---

## 4.2 Thắng - Cloud/IaC Owner

### Trách nhiệm chính

Thắng phụ trách phần nền hạ tầng cloud bằng OpenTofu.

| Nhóm việc | Task cụ thể |
|---|---|
| GCP baseline | Chốt GCP project, region, naming convention |
| OpenTofu structure | Tạo cấu trúc `infra/opentofu`, module, environment `devsecops` |
| Remote state | Tạo GCS bucket cho OpenTofu state, bật versioning và access control |
| Network | Tạo VPC, subnet, secondary IP ranges cho GKE pods/services |
| GKE | Tạo GKE cluster, node pool hoặc Autopilot config |
| IAM | Tạo service accounts cho GitHub Actions, ESO, FluxCD, app runtime |
| Workload Identity | Cấu hình mapping giữa Kubernetes service account và Google service account |
| Secret Manager | Tạo secret skeleton, phân quyền đọc secret cho ESO |
| Cloud Storage | Tạo bucket cho object storage, artifact phụ hoặc backup/demo nếu cần |
| Cloud SQL optional | Thiết kế module Cloud SQL PostgreSQL, có thể bật/tắt bằng biến |
| Redis optional | Thiết kế module Memorystore Redis, có thể bật/tắt bằng biến |
| Namespace nền | Định nghĩa namespace `sagelms-devsecops`, `platform-system`, `harbor`, `monitoring` |
| Infra outputs | Xuất cluster name, region, workload identity pool, service account email, secret names |

### Deliverables

```text
infra/opentofu/envs/devsecops/
infra/opentofu/modules/project-services/
infra/opentofu/modules/network/
infra/opentofu/modules/gke/
infra/opentofu/modules/iam/
infra/opentofu/modules/secret-manager/
infra/opentofu/modules/storage/
infra/opentofu/modules/cloud-sql/      # optional
infra/opentofu/modules/redis/          # optional
infra/opentofu/README.md
infra/opentofu/outputs.md
docs/cloud-foundation.md
docs/iam-workload-identity.md
```

### Definition of Done của Thắng

```text
[ ] infra/opentofu có cấu trúc rõ ràng
[ ] tofu fmt chạy pass
[ ] tofu validate chạy pass
[ ] Checkov scan không còn lỗi Critical/High chưa giải thích
[ ] Remote state dùng GCS bucket, không commit local state vào Git
[ ] Có VPC/Subnet riêng cho môi trường DevSecOps
[ ] Có GKE cluster được tạo bằng OpenTofu
[ ] Workload Identity được bật
[ ] Có service accounts cho GitHub Actions, ESO, FluxCD và app runtime
[ ] Có Secret Manager skeleton cho các secret chính
[ ] Có quyền IAM tối thiểu cho ESO đọc secret
[ ] Có Cloud Storage bucket cần thiết
[ ] Cloud SQL/Redis có phương án rõ: managed hoặc in-cluster
[ ] Có outputs để Member 1, Member 2, Member 3 tích hợp
[ ] Có README hướng dẫn init, plan, apply, destroy
```

---

## 4.3 Member 3 - Runtime Platform Owner

### Trách nhiệm chính

Member 3 phụ trách runtime platform chạy trên GKE.

| Nhóm việc | Task cụ thể |
|---|---|
| Helm | Tạo Helm chart chung cho microservices |
| Kustomize base | Tạo `deploy/base` cho workload dùng chung |
| Kustomize overlay | Tạo `deploy/overlays/devsecops` cho môi trường cloud dùng chung |
| FluxCD | Bootstrap FluxCD, cấu hình source và reconcile overlay `devsecops` |
| External Secrets Operator | Deploy ESO và tạo ExternalSecret resources |
| Secret mapping | Map secret từ Google Secret Manager sang Kubernetes Secret |
| Kyverno runtime policies | Policy resource requests/limits, runAsNonRoot, disallow privileged, require probes |
| Observability basic | Prometheus, Grafana dashboard cơ bản |
| Observability nâng cao | Loki, Tempo, OpenTelemetry Collector nếu còn thời gian |
| Runtime runbooks | Rollback, debug Flux sync, debug ESO, debug Kyverno, debug rollout |

### Deliverables

```text
charts/sagelms-service/
deploy/base/
deploy/overlays/devsecops/
platform/flux/
platform/external-secrets/
platform/kyverno/runtime-policies/
platform/observability/
docs/runbooks/
```

### Definition of Done của Member 3

```text
[ ] Có Helm chart render được manifest cho service mẫu
[ ] Có Kustomize base và overlay devsecops
[ ] FluxCD được bootstrap vào GKE
[ ] FluxCD reconcile được overlay devsecops
[ ] External Secrets Operator được deploy
[ ] ExternalSecret tạo được Kubernetes Secret từ Google Secret Manager
[ ] Có Kyverno runtime policies cơ bản
[ ] Workload thiếu resource/probe/securityContext bị cảnh báo hoặc chặn theo policy
[ ] Có Prometheus/Grafana basic để xem trạng thái runtime
[ ] Có runbook rollback GitOps commit
[ ] Có runbook debug FluxCD, ESO, Kyverno và rollout lỗi
```

---

# 5. Nhóm B - CI/CD & Supply Chain

## 5.1 Phạm vi của Nhóm B

Nhóm B chịu trách nhiệm toàn bộ phần **CI/CD automation** và **software supply chain security**:

```text
GitHub Actions
PR validation
Path filter
Lint/test/typecheck
SonarQube
Gitleaks
Trivy dependency scan
Checkov
Dockerfile
Docker BuildKit
Harbor
Trivy image scan
Image digest
SBOM
Cosign
GitOps update workflow
Manual approval
Post-deploy verification
```

Nói ngắn gọn: Nhóm B đảm bảo code sau khi merge tạo ra image đáng tin cậy, được scan, có SBOM, có signature, được push vào Harbor và cập nhật vào GitOps overlay bằng digest.

---

## 5.2 Member 1 - CI/CD Automation Owner

### Trách nhiệm chính

Member 1 phụ trách automation bằng GitHub Actions.

| Nhóm việc | Task cụ thể |
|---|---|
| PR validation | Tạo workflow kiểm tra Pull Request |
| Path filter | Chỉ chạy job theo phần thay đổi trong repo |
| Code checks | Lint, format, unit test, typecheck |
| OpenAPI lint | Kiểm tra API contracts |
| SonarQube | Code quality/SAST quality gate |
| Gitleaks | Secret scanning |
| Trivy dependency | Dependency vulnerability scan |
| Checkov | Scan OpenTofu, Kubernetes, Helm, Kustomize, Dockerfile, workflow |
| Infra workflow | `tofu fmt`, `tofu validate`, `tofu plan` cho PR hạ tầng |
| Build workflow integration | Phối hợp Member 2 tạo workflow build/publish image |
| GitOps update workflow | Tự động cập nhật image digest vào `deploy/overlays/devsecops` |
| Manual approval | Cấu hình GitHub Environment hoặc GitOps PR approval |
| Post-deploy check | Smoke test health endpoint, rollout status, basic endpoint |
| Demo evidence | Lưu report/log/artifact phục vụ bảo vệ đồ án |

### Deliverables

```text
.github/workflows/pr-validation.yml
.github/workflows/infra-plan.yml
.github/workflows/build-publish.yml       # phối hợp Member 2
.github/workflows/gitops-update.yml
.github/workflows/post-deploy-check.yml
.github/path-filters.yml
docs/ci-cd-quality-gates.md
docs/deployment-approval-flow.md
```

### Definition of Done của Member 1

```text
[ ] PR pipeline chạy được khi mở Pull Request
[ ] Path filter chỉ chạy job liên quan đến phần thay đổi
[ ] Lint/test/typecheck được tự động hóa
[ ] SonarQube quality gate được tích hợp
[ ] Gitleaks chặn secret leak
[ ] Trivy dependency scan chạy được
[ ] Checkov scan chạy được cho IaC/config
[ ] OpenTofu fmt/validate/plan chạy khi thay đổi infra/opentofu
[ ] Build/publish workflow gọi đúng logic của Member 2
[ ] GitOps update workflow cập nhật đúng image digest
[ ] Manual approval được áp dụng trước khi runtime thay đổi
[ ] Có post-deploy smoke test cơ bản
```

---

## 5.3 Member 2 - Artifact & Supply Chain Owner

### Trách nhiệm chính

Member 2 phụ trách container artifact, Harbor registry và supply chain security.

| Nhóm việc | Task cụ thể |
|---|---|
| Dockerfile | Viết Dockerfile cho frontend, backend services, AI Tutor, worker |
| Docker BuildKit | Tối ưu build, cache layer, multi-stage build nếu cần |
| Image tag | Chuẩn hóa tag bằng git SHA hoặc semver, không dùng `latest` |
| Harbor | Cài đặt/chuẩn bị Harbor, tạo project, robot account, retention policy |
| Trivy image scan | Scan image trước khi deploy, chặn Critical/High nếu chưa xử lý |
| Digest | Resolve image digest sau khi push vào Harbor |
| SBOM | Generate SBOM bằng Trivy theo CycloneDX hoặc SPDX |
| Cosign | Ký image digest, không ký tag mutable |
| Image policy draft | Soạn image-related Kyverno policies: disallow latest, trusted registry, require digest, require signed image |
| Security evidence | Lưu scan report, SBOM, signature metadata để demo |

### Deliverables

```text
apps/web/Dockerfile
services/*/Dockerfile
services/ai-tutor-service/Dockerfile
docs/harbor-strategy.md
docs/image-tagging-digest-strategy.md
docs/sbom-cosign-strategy.md
platform/kyverno/image-policies/          # phối hợp Member 3 apply/test runtime
```

### Definition of Done của Member 2

```text
[ ] Các service quan trọng có Dockerfile build được
[ ] Image tag theo git SHA hoặc semver, không dùng latest
[ ] Harbor project được tạo rõ ràng
[ ] Harbor robot account tách quyền push/pull
[ ] Trivy image scan chạy được trong workflow
[ ] Image có Critical/High vulnerability bị chặn hoặc có allowlist hợp lệ
[ ] Pipeline resolve được image digest
[ ] SBOM được generate và lưu làm artifact
[ ] Image digest được ký bằng Cosign
[ ] Có tài liệu Harbor, image tagging, SBOM và Cosign
[ ] Có draft Kyverno image policies để Member 3 tích hợp runtime
```

---

# 6. Convention tích hợp bắt buộc giữa hai nhóm

Để tránh lệch convention giữa Nhóm A và Nhóm B, các quy ước sau phải được chốt ngay từ đầu và giữ nhất quán trong toàn bộ pipeline.

---

## 6.1 Service mẫu tích hợp đầu tiên

### Quyết định

Service mẫu đầu tiên để tích hợp end-to-end là:

```text
auth-service
```

### Lý do chọn `auth-service`

- Là service quan trọng trong hệ thống.
- Phù hợp để demo health check, Docker build, image scan, push, sign và deploy.
- Có thể kiểm thử bằng endpoint đơn giản trước khi cần toàn bộ hệ thống chạy hoàn chỉnh.
- Ít phụ thuộc hơn các service nghiệp vụ phức tạp như AI Tutor hoặc Assessment.

### Luồng vertical slice đầu tiên

```text
PR pass
→ merge main
→ build auth-service image
→ Trivy image scan
→ push image vào Harbor
→ resolve image digest
→ generate SBOM
→ Cosign sign digest
→ update deploy/overlays/devsecops
→ manual approval
→ FluxCD deploy lên GKE
→ smoke test health endpoint
```

### Sau khi auth-service chạy được

Sau vertical slice đầu tiên, nhóm mới nhân rộng sang:

```text
gateway
course-service
content-service
progress-service
assessment-service
ai-tutor-service
worker
apps/web
```

---

## 6.2 Image naming convention

### Format chuẩn

```text
<harbor-domain>/sagelms-app/<service-name>:<git-sha>
```

Ví dụ:

```text
harbor.sagelms.dev/sagelms-app/auth-service:9f3a1c2
harbor.sagelms.dev/sagelms-app/gateway:9f3a1c2
harbor.sagelms.dev/sagelms-app/web:9f3a1c2
harbor.sagelms.dev/sagelms-app/ai-tutor-service:9f3a1c2
```

### Quy tắc

```text
[ ] Không dùng tag latest
[ ] Tag chính dùng short git SHA hoặc full git SHA
[ ] Release chính thức có thể thêm semver tag
[ ] Runtime deployment phải pin bằng digest, không chỉ dùng tag
[ ] Digest là định danh chính để GitOps deploy
```

### Format digest trong GitOps

```text
<harbor-domain>/sagelms-app/<service-name>@sha256:<digest>
```

Ví dụ:

```text
harbor.sagelms.dev/sagelms-app/auth-service@sha256:abc123...
```

---

## 6.3 Namespace convention

### Namespace chuẩn

| Namespace | Mục đích | Owner chính |
|---|---|---|
| `sagelms-devsecops` | Workload chính của SageLMS | Nhóm A |
| `platform-system` | FluxCD, ESO, Kyverno và platform controllers | Nhóm A |
| `harbor` | Harbor registry nếu deploy trong GKE | Nhóm B phối hợp Nhóm A |
| `monitoring` | Prometheus, Grafana, Loki, Tempo, OpenTelemetry | Nhóm A |

### Quy tắc

```text
[ ] Không deploy app vào default namespace
[ ] Workload app chạy trong sagelms-devsecops
[ ] Platform controller chạy trong platform-system hoặc namespace riêng phù hợp
[ ] Observability stack ưu tiên chạy trong monitoring
[ ] Harbor nếu chạy trong cluster thì dùng namespace harbor
```

---

## 6.4 Secret naming convention

### Secret trong Google Secret Manager

Format:

```text
sagelms-devsecops-<component>-<purpose>
```

Ví dụ:

```text
sagelms-devsecops-db-password
sagelms-devsecops-redis-password
sagelms-devsecops-jwt-secret
sagelms-devsecops-llm-api-key
sagelms-devsecops-harbor-pull-secret
sagelms-devsecops-grafana-admin-password
```

### Kubernetes Secret do ESO tạo

Format:

```text
<component>-secret
```

Ví dụ:

```text
db-secret
redis-secret
jwt-secret
llm-secret
harbor-pull-secret
grafana-admin-secret
```

### Quy tắc

```text
[ ] Không commit secret value vào Git
[ ] Không ghi secret value vào Helm values plaintext
[ ] Không đưa secret value thật vào terraform.tfvars
[ ] OpenTofu chỉ tạo secret metadata hoặc IAM binding, không lưu plaintext secret vào state
[ ] ESO đọc secret từ Google Secret Manager và tạo Kubernetes Secret
[ ] GitHub Actions chỉ được truy cập secret cần thiết theo branch/environment
```

---

## 6.5 Format cập nhật image digest trong Kustomize overlay

### File mục tiêu

Image digest phải được cập nhật trong:

```text
deploy/overlays/devsecops/kustomization.yaml
```

### Format đề xuất

```yaml
images:
  - name: harbor.sagelms.dev/sagelms-app/auth-service
    newName: harbor.sagelms.dev/sagelms-app/auth-service
    digest: sha256:abc123...
```

Hoặc nếu nhóm chọn patch trực tiếp vào manifest:

```yaml
containers:
  - name: auth-service
    image: harbor.sagelms.dev/sagelms-app/auth-service@sha256:abc123...
```

### Quy tắc

```text
[ ] Runtime overlay phải dùng digest
[ ] Không dùng latest trong overlay devsecops
[ ] GitOps commit phải ghi rõ service name, git SHA và image digest
[ ] GitOps update phải đi qua approval trước khi FluxCD reconcile
[ ] Rollback thực hiện bằng cách revert GitOps commit hoặc trỏ lại digest cũ
```

### Commit message mẫu

```text
chore(gitops): update auth-service image to 9f3a1c2
```

Nội dung commit hoặc PR description nên có:

```text
Service: auth-service
Git SHA: 9f3a1c2
Image: harbor.sagelms.dev/sagelms-app/auth-service@sha256:abc123...
Trivy scan: passed
SBOM: generated
Cosign signature: verified
```

---

# 7. Luồng phối hợp giữa hai nhóm

## 7.1 Nhóm A bàn giao cho Nhóm B

```text
GCP project ID
Region
GKE cluster name
Namespace convention
Workload Identity pool
Service account names
Secret Manager names
Kubeconfig access guide
Ingress/domain convention nếu có
```

## 7.2 Nhóm B bàn giao cho Nhóm A

```text
Image naming convention
Harbor registry endpoint
Harbor project name
Harbor pull secret convention
Image digest
SBOM report
Cosign signature metadata
GitOps update format
```

## 7.3 Điểm tích hợp chung

Điểm tích hợp chính giữa hai nhóm là:

```text
deploy/overlays/devsecops
```

- Nhóm B cập nhật image digest vào overlay.
- Nhóm A đảm bảo FluxCD reconcile overlay đó vào GKE.
- Cả hai nhóm cùng kiểm tra rollout và smoke test service mẫu.

---

# 8. Thứ tự triển khai đề xuất

## Phase 1 - Skeleton song song

| Nhóm | Việc cần làm |
|---|---|
| Nhóm A | OpenTofu skeleton, VPC/Subnet, GKE plan, IAM/Secret Manager skeleton, Helm/Kustomize skeleton |
| Nhóm B | PR pipeline skeleton, Dockerfile auth-service, build image local, Trivy scan local, Harbor strategy |

### Kết quả mong đợi

```text
[ ] OpenTofu validate được
[ ] PR validation workflow chạy được
[ ] auth-service image build được local
[ ] Helm/Kustomize render được manifest auth-service
```

---

## Phase 2 - Tích hợp vertical slice auth-service

Luồng tích hợp:

```text
Code merge
→ CI pass
→ build auth-service image
→ Trivy image scan
→ push Harbor
→ resolve digest
→ generate SBOM
→ Cosign sign
→ update GitOps overlay
→ manual approval
→ FluxCD deploy
→ smoke test health endpoint
```

### Kết quả mong đợi

```text
[ ] auth-service image có trong Harbor
[ ] auth-service image có digest
[ ] auth-service image có SBOM
[ ] auth-service image được ký bằng Cosign
[ ] deploy/overlays/devsecops pin image bằng digest
[ ] FluxCD deploy auth-service lên GKE
[ ] Health endpoint trả về thành công
```

---

## Phase 3 - Mở rộng nhiều service

Sau khi auth-service chạy end-to-end, mở rộng sang:

```text
gateway
course-service
content-service
progress-service
assessment-service
ai-tutor-service
worker
apps/web
```

### Kết quả mong đợi

```text
[ ] Các service chính có Dockerfile
[ ] Các service chính có Helm/Kustomize manifest
[ ] Pipeline build/scan/push/sign hoạt động cho nhiều service
[ ] GitOps overlay quản lý được nhiều workload
[ ] ESO cung cấp secret runtime
[ ] Kyverno policy cơ bản được áp dụng
[ ] Grafana hiển thị trạng thái runtime cơ bản
```

---

## Phase 4 - Hardening và demo

Các việc cần hoàn thiện:

```text
Kyverno enforce dần các policy quan trọng
Hoàn thiện observability dashboard
Bổ sung Loki/Tempo/OpenTelemetry nếu còn thời gian
Viết runbook rollback/debug
Viết demo script
Thu thập evidence: CI logs, Trivy report, SBOM, Cosign signature, FluxCD rollout, Grafana dashboard
```

---

# 9. Mức ưu tiên Must-have / Should-have / Nice-to-have

## 9.1 Must-have

```text
[ ] PR validation pipeline
[ ] OpenTofu skeleton + GKE cluster
[ ] IAM/Workload Identity cơ bản
[ ] Secret Manager skeleton
[ ] Dockerfile cho auth-service
[ ] Harbor project hoặc registry endpoint
[ ] Trivy image scan
[ ] Image digest
[ ] SBOM generation
[ ] Cosign signing
[ ] Helm/Kustomize cho auth-service
[ ] FluxCD deploy auth-service bằng digest
[ ] Manual approval trước deploy
[ ] Smoke test health endpoint
[ ] README/runbook cơ bản
```

## 9.2 Should-have

```text
[ ] Dockerfile cho toàn bộ services chính
[ ] Pipeline build nhiều service theo path filter
[ ] ESO đồng bộ secret thật
[ ] Kyverno disallow latest
[ ] Kyverno require resource requests/limits
[ ] Kyverno require runAsNonRoot
[ ] Prometheus/Grafana dashboard basic
[ ] GitOps rollback bằng revert commit
```

## 9.3 Nice-to-have

```text
[ ] Loki logging stack
[ ] Tempo tracing stack
[ ] OpenTelemetry Collector đầy đủ
[ ] Alert rules nâng cao
[ ] Harbor retention policy chi tiết
[ ] Scheduled security scan
[ ] Cloud SQL/Memorystore managed nếu ngân sách cho phép
[ ] Full signed image verification bằng Kyverno trước admission
```

---

# 10. Ma trận review PR

| Loại PR | Owner chính | Reviewer bắt buộc |
|---|---|---|
| OpenTofu/GCP/GKE/IAM | Thắng | Member 3 |
| FluxCD/Helm/Kustomize/ESO | Member 3 | Thắng |
| PR validation/GitHub Actions | Member 1 | Member 2 |
| Build/publish image workflow | Member 1 + Member 2 | Thắng hoặc Member 3 |
| Dockerfile/Harbor/SBOM/Cosign | Member 2 | Member 1 |
| GitOps overlay update | Member 1 | Member 3 |
| Kyverno image policies | Member 2 | Member 3 |
| Kyverno runtime policies | Member 3 | Thắng |
| Observability/runbook | Member 3 | Thắng |

---

# 11. Rủi ro và phương án dự phòng

| Rủi ro | Ảnh hưởng | Phương án dự phòng |
|---|---|---|
| GKE tạo chậm hoặc tốn phí | Không có runtime để demo | Dùng cluster nhỏ, giảm replica, scale down ngoài giờ demo |
| Cloud SQL/Memorystore tốn chi phí | Vượt ngân sách | Dùng PostgreSQL/Redis in-cluster cho demo |
| Harbor setup phức tạp | Chậm build/push image | Dùng Harbor tối giản trước; nếu cần có thể dùng registry tạm rồi mô tả Harbor là target architecture |
| Kyverno signed image policy khó enforce | Workload bị chặn khi demo | Ban đầu để audit mode, enforce sau khi Cosign ổn định |
| Observability quá rộng | Không kịp dashboard/log/trace đầy đủ | Ưu tiên Prometheus/Grafana basic, Loki/Tempo để nice-to-have |
| Hai nhóm lệch convention | Tích hợp chậm | Chốt 5 convention bắt buộc trong mục 6 trước khi triển khai |
| Pipeline build nhiều service quá lâu | CI chậm | Dùng path filter, matrix build, cache và vertical slice trước |

---

# 12. Tiêu chí nghiệm thu cuối cùng

Pipeline và phân công được xem là đạt yêu cầu khi:

```text
[ ] Hai nhóm hoàn thành phần owner chính của mình
[ ] auth-service chạy được end-to-end từ PR đến GKE
[ ] PR pipeline có quality/security gates cơ bản
[ ] Image được build, scan, push, resolve digest, generate SBOM và sign
[ ] GitOps overlay devsecops pin image bằng digest
[ ] Manual approval được áp dụng trước khi deploy runtime
[ ] FluxCD deploy workload vào GKE
[ ] Secret runtime không nằm plaintext trong Git
[ ] ESO hoặc secret strategy hoạt động ở mức demo
[ ] Kyverno có policy cơ bản
[ ] Có dashboard hoặc quan sát runtime cơ bản
[ ] Có runbook rollback/debug
[ ] Có evidence để trình bày khi bảo vệ
```

---

# 13. Kết luận

Bản phân công 2 nhóm 2 người là phương án phù hợp nhất cho nhóm 4 thành viên trong phạm vi triển khai CI/CD DevSecOps pipeline cho SageLMS.

```text
Nhóm A: Thắng + Member 3
→ Platform & Runtime

Nhóm B: Member 1 + Member 2
→ CI/CD & Supply Chain
```

Cách chia này giúp:

1. Gom các phần có quan hệ phụ thuộc tự nhiên vào cùng nhóm.
2. Giảm phụ thuộc vụn giữa nhiều thành viên.
3. Giữ ranh giới rõ giữa artifact pipeline và runtime platform.
4. Cho phép làm song song và tích hợp sớm bằng `auth-service`.
5. Phù hợp với mục tiêu một Shared Cloud DevSecOps Environment trên GCP/GKE.

Điều quan trọng nhất là nhóm phải chốt và tuân thủ 5 convention bắt buộc:

```text
1. Service mẫu đầu tiên: auth-service
2. Image naming convention
3. Namespace convention
4. Secret naming convention
5. Format cập nhật image digest trong deploy/overlays/devsecops
```

