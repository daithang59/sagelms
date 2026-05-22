# SageLMS Docker Images

This document covers the P0 Docker image work for SageLMS. It is independent from GKE, Harbor, and FluxCD setup. Those pieces can consume these images later.

## P0 image scope

| Image | Build context | Status |
| --- | --- | --- |
| `sagelms/web:<tag>` | `apps/web` | P0 |
| `sagelms/gateway:<tag>` | `services/gateway` | P0 |
| `sagelms/auth-service:<tag>` | `services/auth-service` | P0 |
| `sagelms/course-service:<tag>` | `services/course-service` | P0 |
| `sagelms/content-service:<tag>` | `services/content-service` | P0 |
| `sagelms/assessment-service:<tag>` | `services/assessment-service` | P0 |
| `sagelms/challenge-service:<tag>` | `services/challenge-service` | P0 |

Optional/out of P0:

| Service | Note |
| --- | --- |
| `services/ai-tutor-service` | Optional for MVP. |
| `services/progress-service` | Add after P0 if runtime needs it. |
| `services/worker` | Add after P0 if runtime needs it. |

## Image conventions

- Use immutable tags such as Git SHA or SemVer.
- Do not deploy `latest`.
- Runtime images run as non-root where possible.
- Java services use multi-stage builds and accept optional `JAVA_OPTS`.
- Frontend is built with Node and served by unprivileged Nginx on port `8080`.

## Build all P0 images locally

From the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\docker\build-images.ps1 -Tag dev
```

Use a registry prefix when Harbor is ready:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\docker\build-images.ps1 -RegistryPrefix harbor.example.com/sagelms -Tag <git-sha>
```

Push after login:

```powershell
docker login harbor.example.com
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\docker\build-images.ps1 -RegistryPrefix harbor.example.com/sagelms -Tag <git-sha> -Push
```

The `-ExecutionPolicy Bypass` flag applies only to this command invocation. It does not change the machine policy.

## Build one image

```powershell
docker build -t sagelms/web:dev apps/web
docker build -t sagelms/gateway:dev services/gateway
docker build -t sagelms/auth-service:dev services/auth-service
docker build -t sagelms/course-service:dev services/course-service
docker build -t sagelms/content-service:dev services/content-service
docker build -t sagelms/assessment-service:dev services/assessment-service
docker build -t sagelms/challenge-service:dev services/challenge-service
```

## Docker Compose local runtime

```powershell
docker compose -f infra/docker/docker-compose.yml --profile app up -d --build
```

Frontend defaults:

- Container port: `8080`
- Host port: `${WEB_PORT:-3000}`
- Build arg: `${VITE_API_URL:-http://localhost:8080/api/v1}`

## Trivy image scan

Run the P1 scan helper after building images:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\docker\scan-images.ps1 -Tag dev -IgnoreUnfixed
```

By default the helper is report-only so P1 can capture current risk as evidence.
To enforce a local failing gate, add `-FailOnFindings`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\docker\scan-images.ps1 -Tag dev -IgnoreUnfixed -FailOnFindings
```

Scan one image:

```powershell
trivy image --severity HIGH,CRITICAL sagelms/auth-service:dev
```

Scan all P0 images after local build:

```powershell
$images = @(
  "sagelms/web:dev",
  "sagelms/gateway:dev",
  "sagelms/auth-service:dev",
  "sagelms/course-service:dev",
  "sagelms/content-service:dev",
  "sagelms/assessment-service:dev",
  "sagelms/challenge-service:dev"
)

foreach ($image in $images) {
  trivy image --severity HIGH,CRITICAL $image
}
```

## SBOM

Generate CycloneDX SBOM for all P0 images:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\docker\generate-sbom.ps1 -Tag dev
```

Generate CycloneDX SBOM for one image:

```powershell
New-Item -ItemType Directory -Force reports/sbom | Out-Null
trivy image --format cyclonedx --output reports/sbom/auth-service.cdx.json sagelms/auth-service:dev
```

## Digest

After push, resolve image digest:

```powershell
docker inspect --format='{{index .RepoDigests 0}}' harbor.example.com/sagelms/auth-service:<git-sha>
```

Generate a local digest report for pushed or pulled images:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\docker\inspect-digests.ps1 -RegistryPrefix harbor.example.com/sagelms -Tag <git-sha>
```

Deploy manifests should prefer digest references when FluxCD/GitOps is ready.

## CI image evidence

The PR workflow builds all P0 images and uploads one artifact per image:

- `trivy-<service>.txt`
- `sbom-<service>.cdx.json`

The CI report covers `HIGH` and `CRITICAL` findings and uploads the evidence for review.
The current P1 workflow is report-only because existing base and framework dependencies may require a separate remediation PR.

## Cosign

Cosign signing is blocked until the team finalizes registry and key strategy.

Expected flow later:

```powershell
cosign sign harbor.example.com/sagelms/auth-service@sha256:<digest>
cosign verify harbor.example.com/sagelms/auth-service@sha256:<digest>
```
