## CD Deploy Summary

| Field | Value |
| --- | --- |
| Commit | `9229a5baad32c94d5f355c98329b7d149af4e587` |
| Registry | `harbor.sagelms.id.vn` |
| Namespace | `sagelms-app` |
| Manifest | `infra/k8s/devsecops/apps/kustomization.yaml` |

### Images

| Service | Image | Digest | Trivy | SBOM | Cosign |
| --- | --- | --- | --- | --- | --- |
| gateway | `harbor.sagelms.id.vn/sagelms-app/gateway:9229a5baad32c94d5f355c98329b7d149af4e587` | `sha256:4a31743c51daabdb9c2fccb829ac3ed999be53616bfb3e8226d51fbe8990de89` | PASS | `reports/sbom/9229a5baad32c94d5f355c98329b7d149af4e587/gateway-sbom.cdx.json` | PASS |
| auth-service | `harbor.sagelms.id.vn/sagelms-app/auth-service:9229a5baad32c94d5f355c98329b7d149af4e587` | `sha256:2de63881fe5f72a28ba019858960881e5015a35d19d0034b514277ebce0ac516` | PASS | `reports/sbom/9229a5baad32c94d5f355c98329b7d149af4e587/auth-service-sbom.cdx.json` | PASS |
| course-service | `harbor.sagelms.id.vn/sagelms-app/course-service:9229a5baad32c94d5f355c98329b7d149af4e587` | `sha256:7293b5f6ddb82fab8653fd94b2cf269b495279c1ac0b160ada1b745e9a0af805` | PASS | `reports/sbom/9229a5baad32c94d5f355c98329b7d149af4e587/course-service-sbom.cdx.json` | PASS |
| content-service | `harbor.sagelms.id.vn/sagelms-app/content-service:9229a5baad32c94d5f355c98329b7d149af4e587` | `sha256:514c25f57f91885f1c1346dd4a4280becd7471c02c4a954f59ee70b2fa30001b` | PASS | `reports/sbom/9229a5baad32c94d5f355c98329b7d149af4e587/content-service-sbom.cdx.json` | PASS |
| progress-service | `harbor.sagelms.id.vn/sagelms-app/progress-service:9229a5baad32c94d5f355c98329b7d149af4e587` | `sha256:dfb15ce96fdf13219feb9c2d2992e1824be510c82c0cd6571007d766cb3385d8` | PASS | `reports/sbom/9229a5baad32c94d5f355c98329b7d149af4e587/progress-service-sbom.cdx.json` | PASS |
| assessment-service | `harbor.sagelms.id.vn/sagelms-app/assessment-service:9229a5baad32c94d5f355c98329b7d149af4e587` | `sha256:4391acea9119080965b4145f76ea4fb22248bf85751a353eaa61da9f6cb80eb1` | PASS | `reports/sbom/9229a5baad32c94d5f355c98329b7d149af4e587/assessment-service-sbom.cdx.json` | PASS |
| challenge-service | `harbor.sagelms.id.vn/sagelms-app/challenge-service:9229a5baad32c94d5f355c98329b7d149af4e587` | `sha256:1f683777a6c061e6e1f74795cb449530be5411e9d6034892a35d6bd10f419c04` | PASS | `reports/sbom/9229a5baad32c94d5f355c98329b7d149af4e587/challenge-service-sbom.cdx.json` | PASS |
| web | `harbor.sagelms.id.vn/sagelms-app/web:9229a5baad32c94d5f355c98329b7d149af4e587` | `sha256:4835beaa07a60003fc8ffc0fd311f93e9eebd8053cbef22e44e3387d50c14706` | PASS | `reports/sbom/9229a5baad32c94d5f355c98329b7d149af4e587/web-sbom.cdx.json` | PASS |
