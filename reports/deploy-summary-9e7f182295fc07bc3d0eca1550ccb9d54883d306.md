## CD Deploy Summary

| Field | Value |
| --- | --- |
| Commit | `9e7f182295fc07bc3d0eca1550ccb9d54883d306` |
| Registry | `harbor.sagelms.id.vn` |
| Namespace | `sagelms-app` |
| Manifest | `infra/k8s/devsecops/apps/kustomization.yaml` |

### Images

| Service | Image | Digest | Trivy | SBOM |
| --- | --- | --- | --- | --- |
| gateway | `harbor.sagelms.id.vn/sagelms-app/gateway:9e7f182295fc07bc3d0eca1550ccb9d54883d306` | `sha256:27adf45f00bb8c0577278a919da1d27a01602a6eea2345e0566485a1c3d3752c` | PASS | `reports/sbom/9e7f182295fc07bc3d0eca1550ccb9d54883d306/gateway-sbom.cdx.json` |
| auth-service | `harbor.sagelms.id.vn/sagelms-app/auth-service:9e7f182295fc07bc3d0eca1550ccb9d54883d306` | `sha256:a87978b7569651c856eddc4a7e4ed8594887adc6f2c6190acdb265f9106e486b` | PASS | `reports/sbom/9e7f182295fc07bc3d0eca1550ccb9d54883d306/auth-service-sbom.cdx.json` |
| course-service | `harbor.sagelms.id.vn/sagelms-app/course-service:9e7f182295fc07bc3d0eca1550ccb9d54883d306` | `sha256:36f48c10a177913c26dc0f25912fd0ff342b78f13704d39f5dfbe5b2301e91a1` | PASS | `reports/sbom/9e7f182295fc07bc3d0eca1550ccb9d54883d306/course-service-sbom.cdx.json` |
| content-service | `harbor.sagelms.id.vn/sagelms-app/content-service:9e7f182295fc07bc3d0eca1550ccb9d54883d306` | `sha256:259547d49dbd4f1ec81abfb5d2f106ec5c4be3fa10f6385e662fae1b3673b9ce` | PASS | `reports/sbom/9e7f182295fc07bc3d0eca1550ccb9d54883d306/content-service-sbom.cdx.json` |
| progress-service | `harbor.sagelms.id.vn/sagelms-app/progress-service:9e7f182295fc07bc3d0eca1550ccb9d54883d306` | `sha256:784ec1a24fba8b6aedc6085e4cb36652e913f19062f6247019f7a870606e8539` | PASS | `reports/sbom/9e7f182295fc07bc3d0eca1550ccb9d54883d306/progress-service-sbom.cdx.json` |
| assessment-service | `harbor.sagelms.id.vn/sagelms-app/assessment-service:9e7f182295fc07bc3d0eca1550ccb9d54883d306` | `sha256:0db87ad73b77fe9e388d2f4a8f0abde59cc9f630185465f1a05651fdbc1eb308` | PASS | `reports/sbom/9e7f182295fc07bc3d0eca1550ccb9d54883d306/assessment-service-sbom.cdx.json` |
| challenge-service | `harbor.sagelms.id.vn/sagelms-app/challenge-service:9e7f182295fc07bc3d0eca1550ccb9d54883d306` | `sha256:1a3fdc9ce9c6400f709d3f7c545e810c106e32ab1199ce1bc31184b01415d60c` | PASS | `reports/sbom/9e7f182295fc07bc3d0eca1550ccb9d54883d306/challenge-service-sbom.cdx.json` |
| web | `harbor.sagelms.id.vn/sagelms-app/web:9e7f182295fc07bc3d0eca1550ccb9d54883d306` | `sha256:50226f18432cf2b34662a40f3e4a97565ca948de047ebd4abe341ab52aa7d79b` | PASS | `reports/sbom/9e7f182295fc07bc3d0eca1550ccb9d54883d306/web-sbom.cdx.json` |
