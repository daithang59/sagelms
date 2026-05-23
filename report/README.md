# Báo cáo LaTeX SageLMS DevSecOps

Thư mục này chứa bản nháp báo cáo đồ án môn học cho SageLMS, tập trung vào pipeline DevSecOps cho web microservices.

## Cách build

Khuyến nghị dùng XeLaTeX vì báo cáo viết bằng tiếng Việt.

```powershell
cd report
latexmk -xelatex main.tex
```

Nếu không dùng `latexmk`, có thể chạy:

```powershell
xelatex main.tex
biber main
xelatex main.tex
xelatex main.tex
```

## Nơi cần điền sau

- `metadata.tex`: trường, khoa, lớp, giảng viên, MSSV.
- `figures/`: ảnh chụp GitHub Actions, Harbor, GKE, FluxCD, smoke test.
- `appendices/`: thêm log hoặc snippet nếu giảng viên yêu cầu phụ lục chi tiết.
