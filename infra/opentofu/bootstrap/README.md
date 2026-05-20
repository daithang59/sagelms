# Bootstrap

Thư mục này là stack OpenTofu chạy đầu tiên để chuẩn bị nền tối thiểu cho các stack còn lại.

## Mục đích

Bootstrap tạo remote state và service account IaC cho môi trường `devsecops`.

Tài nguyên chính:

- GCS bucket `sagelms-devsecops-tofu-state`
- GCS bucket versioning, uniform bucket-level access, public access prevention
- Google service account `sagelms-devsecops-iac-sa`
- Bucket IAM để IaC service account đọc/ghi state
- Project-level IAM roles cho IaC service account

## Cách chạy

```bash
cd infra/opentofu/bootstrap
cp terraform.tfvars.example terraform.tfvars
tofu init
tofu fmt
tofu validate
tofu plan -out bootstrap.tfplan
tofu apply bootstrap.tfplan
```

Trên Windows có thể dùng access token từ Google Cloud SDK nếu chưa có ADC:

```powershell
$gcloud = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$env:GOOGLE_OAUTH_ACCESS_TOKEN = & $gcloud auth print-access-token
tofu plan
```

## Trạng thái hiện tại cần lưu ý

Stack này đã có thể tạo bucket state và IaC service account, nhưng project-level IAM bindings yêu cầu tài khoản chạy apply có quyền cập nhật IAM policy trên project, ví dụ `Owner` hoặc `Project IAM Admin`.

Nếu gặp lỗi:

```text
Error 403: Policy update access denied
```

thì cần cấp quyền IAM phù hợp cho tài khoản đang chạy `tofu apply`, sau đó chạy lại `tofu apply`.

## File local không commit

- `terraform.tfvars`
- `terraform.tfstate`
- `terraform.tfstate.backup`
- `*.tfplan`
- `.terraform/`

Các file này đã được `.gitignore` chặn.
