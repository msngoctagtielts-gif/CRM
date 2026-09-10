# Di trú dữ liệu từ Google Sheets

Thư mục này chứa dữ liệu gốc đã xuất ra và công cụ soát lỗi **trước khi** nhập
vào MNEE Management System.

## Nguyên tắc

1. **Không tự sửa số tiền.** Mọi giá trị nghi vấn được báo cáo để Founder xác
   nhận, không được đoán.
2. **Giữ nguyên dữ liệu gốc** trong `*.tsv` để luôn đối chiếu lại được.
3. Dòng nghi vấn sẽ được nhập kèm cờ đánh dấu (theo quyết định của Founder ngày
   10/09/2026), hiện trong trang "Cần đối soát" của hệ thống mới.

## File

| File | Nội dung |
|---|---|
| `danh_sach_lop_2026-09-10.tsv` | Danh sách lớp xuất từ sheet "CRM ( 10/9)", 21 dòng |
| `validate_danh_sach_lop.py` | Soát trùng lặp, giá bất thường, level, lịch học |

## Chạy soát

```bash
python3 scripts/migration/validate_danh_sach_lop.py \
  scripts/migration/danh_sach_lop_2026-09-10.tsv
```

## Những gì script tự làm được

- Chuẩn hoá level: `pre A1`, `preA1`, `PreA1` → `PRE_A1` (8 mã chuẩn)
- Tách mục tiêu IELTS khỏi level: `a2+ ( Ielts 4.5+)` → `A2_PLUS` + IELTS `4.5+`
- Bóc lịch học dạng chữ thành thứ + giờ + thời lượng, gồm:
  - quy ước thứ Việt Nam (`T2`=Thứ Hai … `T7`=Thứ Bảy, `CN`=Chủ nhật)
  - dải thứ liền nhau: `T2-T6` → Thứ Hai đến Thứ Sáu
  - giờ viết tắt dùng chung: `T3 & T4: 3-4pm` → cả hai thứ đều 15:00–16:00
  - `11-12am` → 11:00–12:00 trưa (không phải 11:00–00:00)

## Những gì script KHÔNG tự quyết

- Đơn giá bất thường (ví dụ 1.790.009.190 ₫)
- Lệch giá giữa các file
- Lớp trùng mã nhưng khác trạng thái
- Lịch học để trống, thiếu giờ kết thúc, hoặc không rõ sáng/chiều

Những mục này phải do Founder xác nhận.
