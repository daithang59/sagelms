# Environments

Thư mục này chứa các môi trường OpenTofu cấp cao.

## Môi trường hiện có

| Folder | Mục đích |
|---|---|
| `devsecops/` | Shared cloud DevSecOps environment trên GCP/GKE cho SageLMS |

## Quy tắc

- Mỗi environment tự khai báo provider, backend, variables, locals, module wiring và outputs.
- Không đặt logic tài nguyên trực tiếp quá nhiều trong environment; ưu tiên gọi module trong `../modules`.
- Mỗi environment có `terraform.tfvars.example`; file `terraform.tfvars` thật chỉ nằm local và không commit.
- Backend remote state của environment chính dùng GCS bucket do `bootstrap/` tạo.

## Thứ tự apply

```text
bootstrap -> envs/devsecops
```

Không apply environment khi bootstrap chưa hoàn tất remote state và quyền IAM nền.
