## CD Deploy Summary

| Field | Value |
| --- | --- |
| Commit | `a8a0b63d1568f0c356d10a22fcb89abad429ef52` |
| Registry | `harbor.sagelms.id.vn` |
| Namespace | `sagelms-app` |
| Manifest | `infra/k8s/devsecops/apps/kustomization.yaml` |

### Images

| Service | Image | Digest | Trivy | SBOM | Cosign |
| --- | --- | --- | --- | --- | --- |
| auth-service | `harbor.sagelms.id.vn/sagelms-app/auth-service:a8a0b63d1568f0c356d10a22fcb89abad429ef52` | `sha256:9e436d64f9a39a65d8052c57d9da5abbf285f5b400f4c94610311fe543efa35d` | PASS | `reports/sbom/a8a0b63d1568f0c356d10a22fcb89abad429ef52/auth-service-sbom.cdx.json` | PASS |
