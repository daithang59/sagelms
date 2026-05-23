## CD Deploy Summary

| Field | Value |
| --- | --- |
| Commit | `fd70df563a1a5c350adcc3315a0199ef6a7828a9` |
| Registry | `harbor.sagelms.id.vn` |
| Namespace | `sagelms-app` |
| Manifest | `infra/k8s/devsecops/apps/kustomization.yaml` |

### Images

| Service | Image | Digest | Trivy | SBOM | Cosign |
| --- | --- | --- | --- | --- | --- |
| gateway | `harbor.sagelms.id.vn/sagelms-app/gateway:fd70df563a1a5c350adcc3315a0199ef6a7828a9` | `sha256:d7bce40c3ed9d73e0f2ac45e976362f31ced6fa8933048cf420fc6dd8237ff8b` | PASS | `reports/sbom/fd70df563a1a5c350adcc3315a0199ef6a7828a9/gateway-sbom.cdx.json` | PASS |
