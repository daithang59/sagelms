## CD Deploy Summary

| Field | Value |
| --- | --- |
| Commit | `9623b0ff0be1eb191d1f130791ea1e0c369b031c` |
| Registry | `harbor.sagelms.id.vn` |
| Namespace | `sagelms-app` |
| Manifest | `infra/k8s/devsecops/apps/kustomization.yaml` |

### Images

| Service | Image | Digest | Trivy | SBOM |
| --- | --- | --- | --- | --- |
| gateway | `harbor.sagelms.id.vn/sagelms-app/gateway:9623b0ff0be1eb191d1f130791ea1e0c369b031c` | `sha256:0a5084ddf70c3fe278eeeb75c05e57bc36848d3c11d66887db726fe41573041b` | PASS | `reports/sbom/9623b0ff0be1eb191d1f130791ea1e0c369b031c/gateway-sbom.cdx.json` |
| auth-service | `harbor.sagelms.id.vn/sagelms-app/auth-service:9623b0ff0be1eb191d1f130791ea1e0c369b031c` | `sha256:f753497a2661f9795df31e5adb9a6347ce5e2faf4d7c385d5ef181d5a29f9959` | PASS | `reports/sbom/9623b0ff0be1eb191d1f130791ea1e0c369b031c/auth-service-sbom.cdx.json` |
| course-service | `harbor.sagelms.id.vn/sagelms-app/course-service:9623b0ff0be1eb191d1f130791ea1e0c369b031c` | `sha256:12fedb4bc93b0ff4ae223746529b7a33b8d0f37297986b04f1888b0a01ae110a` | PASS | `reports/sbom/9623b0ff0be1eb191d1f130791ea1e0c369b031c/course-service-sbom.cdx.json` |
| content-service | `harbor.sagelms.id.vn/sagelms-app/content-service:9623b0ff0be1eb191d1f130791ea1e0c369b031c` | `sha256:49493deda8e1288dbf479c4a6f86879fcafd2becd457766a9b5bc643d7dd346e` | PASS | `reports/sbom/9623b0ff0be1eb191d1f130791ea1e0c369b031c/content-service-sbom.cdx.json` |
| progress-service | `harbor.sagelms.id.vn/sagelms-app/progress-service:9623b0ff0be1eb191d1f130791ea1e0c369b031c` | `sha256:a4ddebc8301c6d0352b127c2aa293ab6cefb30cebbfdc137fca3835f9c09a4b2` | PASS | `reports/sbom/9623b0ff0be1eb191d1f130791ea1e0c369b031c/progress-service-sbom.cdx.json` |
| assessment-service | `harbor.sagelms.id.vn/sagelms-app/assessment-service:9623b0ff0be1eb191d1f130791ea1e0c369b031c` | `sha256:8bff6fc406f23f58c6e17eaf55571117d480ab448ec558b4c65aa97619958dca` | PASS | `reports/sbom/9623b0ff0be1eb191d1f130791ea1e0c369b031c/assessment-service-sbom.cdx.json` |
| challenge-service | `harbor.sagelms.id.vn/sagelms-app/challenge-service:9623b0ff0be1eb191d1f130791ea1e0c369b031c` | `sha256:dcb30989914e42dbdff3774bf33218e191b46bde6967dcbe78ef29984eef682d` | PASS | `reports/sbom/9623b0ff0be1eb191d1f130791ea1e0c369b031c/challenge-service-sbom.cdx.json` |
| web | `harbor.sagelms.id.vn/sagelms-app/web:9623b0ff0be1eb191d1f130791ea1e0c369b031c` | `sha256:e3f943e49ccaf91c5124f44d5a342b26404c13565ddd70fa23fb0bb4101514d7` | PASS | `reports/sbom/9623b0ff0be1eb191d1f130791ea1e0c369b031c/web-sbom.cdx.json` |
