# 🔒 Security Policy — SageLMS

## Nguyên tắc bảo mật

1. **Không bao giờ commit secret** — API keys, passwords, tokens, hay bất kỳ credentials nào **KHÔNG ĐƯỢC** xuất hiện trong source code.
2. Sử dụng file `.env` (đã được `.gitignore` loại trừ) để lưu biến môi trường nhạy cảm.
3. Chỉ commit file `.env.example` với các giá trị mẫu (placeholder).

---

## Quy tắc cụ thể

| ❌ Không làm | ✅ Nên làm |
|---|---|
| Hard-code DB password trong code | Đọc từ biến môi trường `DB_PASSWORD` |
| Commit file `.env` | Commit `.env.example` với giá trị mẫu |
| Lưu JWT secret trong repo | Sử dụng Secret Manager (Vault, AWS SSM…) |
| Log thông tin nhạy cảm | Mask/redact trước khi ghi log |

---

## Báo cáo lỗ hổng bảo mật

Nếu bạn phát hiện lỗ hổng bảo mật, **KHÔNG** tạo public issue. Thay vào đó:

1. Gửi email đến: **[security@sagelms.dev](mailto:security@sagelms.dev)** *(cập nhật email thật sau)*.
2. Mô tả chi tiết:
   - Loại lỗ hổng (XSS, SQL Injection, Auth Bypass, …)
   - Các bước tái tạo (nếu có)
   - Mức độ ảnh hưởng ước lượng
3. Team sẽ phản hồi trong vòng **48 giờ làm việc**.

---

## Công cụ kiểm tra

Dự án sử dụng / khuyến khích:

- **Pre-commit hooks** — Quét secret trước khi commit (ví dụ: `gitleaks`, `detect-secrets`).
- **Dependabot / Renovate** — Tự động cập nhật dependency có CVE.
- **SAST** — Quét mã nguồn tĩnh trong CI pipeline.

---

## Phiên bản được hỗ trợ

| Phiên bản | Được hỗ trợ |
|------------|-------------|
| `main` (latest) | ✅ |
| Các branch cũ | ❌ |

> Cảm ơn bạn đã giúp SageLMS an toàn hơn! 🙏
