# SageLMS DevSecOps Application Manifests

Kustomize overlay này deploy các workload ứng dụng SageLMS vào namespace `sagelms-devsecops`.

## Phạm Vi

Workload được deploy:

- `web`
- `gateway`
- `auth-service`
- `course-service`
- `content-service`
- `progress-service`
- `assessment-service`
- `worker`

Không deploy `ai-tutor-service` trong phạm vi hiện tại.

## Điều Kiện Trước Khi Apply

- Namespace và CloudNativePG foundation đã được apply bằng `infra/k8s/devsecops`.
- `ClusterSecretStore/gcpsm-sagelms-devsecops` đã Ready.
- CloudNativePG cluster tạo service `sagelms-postgres-rw.sagelms-data.svc.cluster.local`.
- Google Secret Manager có các secret:
  - `sagelms-devsecops-cnpg-app-username`
  - `sagelms-devsecops-cnpg-app-password`
  - `sagelms-devsecops-jwt-secret`
  - `sagelms-devsecops-gateway-shared-secret`
  - `sagelms-devsecops-internal-api-secret`
- Nếu Harbor là private registry, namespace `sagelms-devsecops` cần có `harbor-pull-secret`.

Tạo image pull secret tạm cho demo:

```powershell
kubectl create secret docker-registry harbor-pull-secret `
  --namespace sagelms-devsecops `
  --docker-server=harbor.sagelms.id.vn `
  --docker-username="<robot-account>" `
  --docker-password="<robot-password>"
```

## Render Và Apply

```powershell
kubectl kustomize infra\k8s\devsecops\apps
kubectl apply -k infra\k8s\devsecops\apps
```

## Kiểm Tra

```powershell
kubectl get externalsecret -n sagelms-devsecops
kubectl get secret db-app-secret app-shared-secret -n sagelms-devsecops
kubectl get pods -n sagelms-devsecops
kubectl get svc -n sagelms-devsecops
kubectl get ingress -n sagelms-devsecops
```

Rollout:

```powershell
kubectl rollout status deployment/gateway -n sagelms-devsecops
kubectl rollout status deployment/auth-service -n sagelms-devsecops
kubectl rollout status deployment/course-service -n sagelms-devsecops
kubectl rollout status deployment/content-service -n sagelms-devsecops
kubectl rollout status deployment/progress-service -n sagelms-devsecops
kubectl rollout status deployment/assessment-service -n sagelms-devsecops
kubectl rollout status deployment/worker -n sagelms-devsecops
kubectl rollout status deployment/web -n sagelms-devsecops
```

Port-forward nhanh:

```powershell
kubectl port-forward svc/gateway 8080:8080 -n sagelms-devsecops
kubectl port-forward svc/web 3000:80 -n sagelms-devsecops
```

Health checks:

```powershell
curl http://localhost:8080/actuator/health
curl http://localhost:3000/health
```

## Lưu Ý Runtime

- Gateway hiện route sẵn cho auth/course/content. Route progress/assessment đang comment trong `services/gateway/src/main/resources/application.yml`; chỉ bật khi backend tương ứng đã có API cần expose.
- Worker dùng `REDIS_HOST=redis` theo ConfigMap hiện tại. Nếu dùng Memorystore hoặc Redis service tên khác, cập nhật `infra/k8s/base/apps/worker/configmap.yaml` hoặc tạo overlay patch trước khi apply.
