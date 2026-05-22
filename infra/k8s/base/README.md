# Kubernetes Base Manifests Cho SageLMS

README này giải thích thư mục `infra/k8s/base` theo góc nhìn người mới học Kubernetes.
Nếu chỉ nhớ một câu: **`base` là bộ khung chung của các workload SageLMS, còn môi trường thật như `devsecops` sẽ dùng Kustomize overlay để chỉnh namespace, image, secret và ingress.**

## Base Là Gì?

Trong Kustomize, `base` là phần cấu hình dùng lại được. Nó mô tả ứng dụng cần những Kubernetes resource nào, nhưng hạn chế gắn chặt vào một môi trường cụ thể.

Ở repo này, `infra/k8s/base` đang chứa:

- Namespace mặc định `sagelms-dev` cho môi trường dev cũ.
- Các workload ứng dụng SageLMS: `web`, `gateway`, các backend service và `worker`.
- Deployment, Service, ServiceAccount, ConfigMap cho từng service.
- Image mặc định dạng `harbor.sagelms.id.vn/sagelms-app/<service>:dev`.

Điểm quan trọng: `base` **không tự tạo đầy đủ secret thật**. Nhiều Deployment tham chiếu tới `db-app-secret` và `app-shared-secret`. Ở môi trường `devsecops`, các secret này được tạo bởi External Secrets Operator trong overlay `infra/k8s/devsecops/apps`.

## Cấu Trúc Thư Mục

```text
infra/k8s/base/
├── kustomization.yaml
├── namespace.yaml
└── apps/
    ├── kustomization.yaml
    ├── gateway/
    ├── auth-service/
    ├── course-service/
    ├── content-service/
    ├── progress-service/
    ├── assessment-service/
    ├── challenge-service/
    ├── worker/
    └── web/
```

Ý nghĩa nhanh:

| Đường dẫn | Vai trò |
| --- | --- |
| `kustomization.yaml` | Điểm vào Kustomize của toàn bộ base. Apply file này sẽ gom `namespace.yaml` và `apps/`. |
| `namespace.yaml` | Tạo namespace mặc định `sagelms-dev`. |
| `apps/kustomization.yaml` | Gom tất cả thư mục service bên dưới. Overlay `devsecops` dùng trực tiếp file này qua `../../base/apps`. |
| `apps/<service>/kustomization.yaml` | Gom các resource của một service cụ thể. |
| `apps/<service>/deployment.yaml` | Mô tả cách chạy container: image, port, env, probe, resource limit, security context. |
| `apps/<service>/service.yaml` | Tạo DNS/service nội bộ trong cluster để pod khác gọi tới. `worker` không có Service vì không nhận HTTP traffic. |
| `apps/<service>/serviceaccount.yaml` | Tạo danh tính Kubernetes cho pod. Hiện các workload tắt auto-mount token để giảm quyền mặc định. |
| `apps/<service>/configmap.yaml` | Chứa cấu hình không bí mật như port, host service khác, host database. `web` không có ConfigMap hiện tại. |

## Cách Kustomize Ghép File

File `infra/k8s/base/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: sagelms-dev

resources:
  - namespace.yaml
  - apps
```

Khi chạy:

```powershell
kubectl kustomize infra\k8s\base
```

Kustomize sẽ:

1. Đọc `namespace.yaml`.
2. Đi vào thư mục `apps`.
3. Đọc tiếp `apps/kustomization.yaml`.
4. Đi vào từng service: `gateway`, `auth-service`, `web`, ...
5. Gộp tất cả YAML thành một output lớn.
6. Gắn namespace `sagelms-dev` cho các resource namespaced nếu resource chưa tự khai báo namespace.

Khi chạy:

```powershell
kubectl apply -k infra\k8s\base
```

`kubectl` sẽ render Kustomize rồi gửi các resource đó lên cluster.

## Vì Sao DevSecOps Không Dùng `base` Trực Tiếp?

Môi trường `devsecops` không apply `infra/k8s/base` trực tiếp. Nó dùng:

```yaml
resources:
  - ../../base/apps
```

trong `infra/k8s/devsecops/apps/kustomization.yaml`.

Lý do:

- `devsecops` muốn namespace là `sagelms-devsecops`, không phải `sagelms-dev`.
- `devsecops` tự tạo namespace bằng `infra/k8s/devsecops/namespaces.yaml`.
- `devsecops` cần thêm ExternalSecret, Ingress, image digest, imagePullSecret và GKE NEG annotation.
- Nếu dùng cả `../../base`, overlay sẽ kéo theo `namespace.yaml` của `sagelms-dev`, dễ tạo nhầm namespace không cần thiết.

Vì vậy:

- Dùng `infra/k8s/base` khi muốn render/apply bộ dev mặc định.
- Dùng `infra/k8s/devsecops/apps` khi deploy ứng dụng lên GKE DevSecOps.

## Các Khái Niệm Kubernetes Trong Base

### Namespace

Namespace giống một "không gian làm việc" trong cluster. Resource trong namespace này thường không lẫn với namespace khác.

Ở base:

```yaml
metadata:
  name: sagelms-dev
```

Nghĩa là nếu apply base trực tiếp, app sẽ chạy trong namespace `sagelms-dev`.

### Deployment

Deployment nói Kubernetes phải chạy bao nhiêu bản sao của một app và chạy container nào.

Ví dụ `auth-service/deployment.yaml` có:

- `replicas: 1`: chạy 1 pod.
- `image: harbor.sagelms.id.vn/sagelms-app/auth-service:dev`: container image mặc định.
- `ports.containerPort: 8081`: app listen trong container ở port 8081.
- `envFrom.configMapRef`: lấy biến môi trường không bí mật từ ConfigMap.
- `envFrom.secretRef`: lấy biến môi trường bí mật từ Secret.
- `readinessProbe`: kiểm tra pod đã sẵn sàng nhận traffic chưa.
- `livenessProbe`: kiểm tra pod còn sống không; nếu fail nhiều lần Kubernetes restart pod.
- `resources.requests`: tài nguyên tối thiểu scheduler dùng để đặt pod lên node.
- `resources.limits`: mức tối đa container được dùng.
- `securityContext`: chạy non-root, drop Linux capabilities, chặn privilege escalation.

### Service

Service tạo tên DNS ổn định cho Deployment.

Ví dụ `auth-service` có Service tên `auth-service`, port `8081`. Pod khác có thể gọi:

```text
http://auth-service:8081
```

Trong cùng namespace, Kubernetes DNS tự resolve tên `auth-service` tới pod phía sau Service.

### ConfigMap

ConfigMap chứa cấu hình không bí mật.

Ví dụ `gateway-config` có:

```yaml
AUTH_SERVICE_HOST: "auth-service"
AUTH_SERVICE_PORT: "8081"
```

Gateway dùng các biến này để biết cần gọi auth service ở đâu.

Không đưa password, token, private key vào ConfigMap.

### Secret

Secret chứa dữ liệu nhạy cảm. Trong base, nhiều Deployment chỉ **tham chiếu** Secret:

```yaml
envFrom:
  - secretRef:
      name: db-app-secret
  - secretRef:
      name: app-shared-secret
```

Base không tạo giá trị secret thật. Ở DevSecOps, `db-app-secret` và `app-shared-secret` được tạo từ Google Secret Manager thông qua External Secrets Operator.

### ServiceAccount

ServiceAccount là danh tính Kubernetes của pod. Các Deployment trong base dùng ServiceAccount riêng theo từng app, ví dụ `gateway`, `auth-service`, `web`.

Hầu hết Deployment có:

```yaml
automountServiceAccountToken: false
```

Nghĩa là Kubernetes không tự mount token API vào pod. Đây là mặc định an toàn hơn nếu app không cần gọi Kubernetes API.

## Danh Sách Workload Trong Base

| Workload | Port Service | Có DB? | Secret dùng | Ghi chú |
| --- | ---: | --- | --- | --- |
| `web` | `80` | Không | Không | Frontend, container listen `8080`, Service expose `80`. |
| `gateway` | `8080` | Không | `app-shared-secret` | API gateway, route tới các backend service. |
| `auth-service` | `8081` | Có | `db-app-secret`, `app-shared-secret` | Backend xác thực/người dùng. |
| `course-service` | `8082` | Có | `db-app-secret`, `app-shared-secret` | Backend khóa học. |
| `content-service` | `8083` | Có | `db-app-secret`, `app-shared-secret` | Backend nội dung, có cấu hình gọi `course-service`. |
| `progress-service` | `8084` | Có | `db-app-secret` | Backend tiến độ học tập. |
| `assessment-service` | `8085` | Có | `db-app-secret`, `app-shared-secret` | Backend kiểm tra/đánh giá, có cấu hình gọi `course-service`. |
| `challenge-service` | `8086` | Có | `db-app-secret` | Backend challenge/lab. |
| `worker` | Không expose | Không trong manifest hiện tại | Không | Worker nền, cấu hình Redis qua `worker-config`. |

## Luồng Gọi Nội Bộ

Mô hình đơn giản:

```text
Người dùng
-> Ingress hoặc port-forward
-> web hoặc gateway
-> backend services qua Kubernetes Service DNS
-> PostgreSQL qua sagelms-postgres-rw.sagelms-data.svc.cluster.local
```

Trong base, các backend service có `DB_HOST` trỏ tới:

```text
sagelms-postgres-rw.sagelms-data.svc.cluster.local
```

Đây là Service do CloudNativePG tạo trong namespace `sagelms-data` ở môi trường DevSecOps. Nếu bạn apply base vào môi trường khác, bạn cần đảm bảo database endpoint này tồn tại hoặc tạo overlay patch để đổi `DB_HOST`.

## Cách Xem Manifest Sau Khi Kustomize Render

Render để xem output, chưa apply:

```powershell
kubectl kustomize infra\k8s\base
```

Render và kiểm tra với API server, chưa tạo resource:

```powershell
kubectl apply --dry-run=server -k infra\k8s\base
```

Apply thật:

```powershell
kubectl apply -k infra\k8s\base
```

Kiểm tra:

```powershell
kubectl get all -n sagelms-dev
kubectl get configmap -n sagelms-dev
kubectl get serviceaccount -n sagelms-dev
```

Rollout một Deployment:

```powershell
kubectl rollout status deployment/gateway -n sagelms-dev
```

Xem log:

```powershell
kubectl logs deployment/gateway -n sagelms-dev
```

## Khi Muốn Sửa Thì Sửa Ở Đâu?

| Muốn làm gì | Nên sửa ở đâu |
| --- | --- |
| Đổi cấu hình không bí mật mặc định | `infra/k8s/base/apps/<service>/configmap.yaml` nếu áp dụng cho mọi môi trường. |
| Đổi cấu hình chỉ cho DevSecOps | Tạo patch trong overlay `infra/k8s/devsecops/apps/kustomization.yaml`. |
| Đổi image/tag/digest cho môi trường DevSecOps | Sửa mục `images:` trong overlay `infra/k8s/devsecops/apps/kustomization.yaml`. |
| Thêm service mới | Tạo thư mục `infra/k8s/base/apps/<service>/`, thêm vào `infra/k8s/base/apps/kustomization.yaml`, rồi thêm image/patch cần thiết ở overlay. |
| Thêm secret thật | Không hardcode trong base. Tạo ExternalSecret trong overlay môi trường. |
| Expose service ra internet | Không sửa Service thành `LoadBalancer` nếu đang dùng GKE Ingress; thêm/sửa Ingress trong overlay môi trường. |

## Lỗi Dễ Gặp

### Pod báo thiếu Secret

Triệu chứng:

```text
Error: secret "db-app-secret" not found
```

Nguyên nhân: bạn apply `base` nhưng chưa tạo Secret mà Deployment cần.

Cách xử lý:

- Với DevSecOps, apply `infra/k8s/devsecops` và `infra/k8s/devsecops/apps`.
- Với môi trường dev tự dựng, tự tạo Secret tương ứng hoặc tạo overlay riêng.

### Pod chạy nhưng không Ready

Kiểm tra:

```powershell
kubectl describe pod -n sagelms-dev <pod-name>
kubectl logs -n sagelms-dev <pod-name>
```

Nguyên nhân thường gặp:

- App không start được do thiếu biến môi trường.
- Database endpoint không tồn tại.
- Secret sai key.
- Health endpoint `/actuator/health` hoặc `/health` trả lỗi.

### Sửa Base Làm Hỏng DevSecOps

Do overlay `devsecops/apps` dùng lại `../../base/apps`, mọi thay đổi trong base app có thể ảnh hưởng DevSecOps.

Quy tắc an toàn:

- Thay đổi chung cho mọi môi trường thì sửa base.
- Thay đổi riêng cho GKE/DevSecOps thì sửa overlay.
- Trước khi apply, luôn render:

```powershell
kubectl kustomize infra\k8s\devsecops\apps
```

