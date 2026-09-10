# DECISIONS.md — Quyết định nghiệp vụ đã được Founder xác nhận

Mỗi dòng dưới đây là một quy tắc **đã được Founder chốt**, không phải giả định.
Khi code và tài liệu khác xung đột với file này, file này đúng.

Giả định chưa xác nhận vẫn nằm ở `PROJECT_PLAN.md` mục 6.

---

## 10/09/2026 — Vòng 1: mô hình nghiệp vụ

| # | Quyết định | Ảnh hưởng |
|---|---|---|
| D1 | **Giữ cả hai hình thức đóng học phí**: "Cuối tháng" (trả sau, đối soát cuối tháng) và "Gói 10 buổi" (trả trước) | `student_enrollments.billing_mode`; thêm bảng `tuition_statements` cho kỳ đối soát tháng |
| D2 | **Hạn nộp báo cáo 24 giờ** (không phải 10 giờ như bản mô tả ban đầu), đúng tham số `GIO_TRE_BAO_CAO` đang dùng | `settings.report_deadline_hours = 24` |
| D3 | **Báo cáo "đủ" chấm theo 6 tiêu chí + điểm QC 0–100, ngưỡng đạt 60**: có video · có timestamp đối chiếu · có trích nguyên văn lời học viên · điểm mạnh đủ sâu · phần cần cải thiện đủ sâu · homework có mẫu câu | Thêm các cột QC vào `teaching_reports`; `qc_score` tính tự động |
| D4 | **Lương vẫn tính dù báo cáo thiếu video/bài tập/nhận xét** — chỉ gắn cờ để Founder thấy | `fn_generate_payable_lesson` bỏ điều kiện báo cáo đủ |
| D5 | **Điều kiện CỨNG để tính lương: giáo viên phải ghi ngày + giờ dạy + tên.** Thiếu thì báo động đỏ ghi thẳng cho giáo viên kèm cảnh báo "không cung cấp thì không tính lương" | Chỉ cần `start_time`/`end_time`; thiếu thì không sinh buổi tính lương và tạo cảnh báo gửi riêng giáo viên đó |
| D6 | **Khi giáo viên đưa link video/record, AI tự viết và điền vào feedback** | Thêm `authored_by` để biết nội dung do giáo viên hay AI viết |
| D7 | **Cho học vượt số tiền đã đóng.** Số buổi còn lại được phép âm, hệ thống tự ghi công nợ và cảnh báo KHẨN | `fn_pick_enrollment` bỏ điều kiện `remaining > 0` |
| D8 | **Nhập dữ liệu cũ nguyên trạng, đánh dấu dòng nghi vấn** để Founder sửa trong hệ thống mới. Không tự đoán số tiền | Thêm `needs_review` + `review_note`; view `v_data_review` |
| D9 | **Tạo Supabase project mới**, không dùng project cũ `yevsupsuelpbodwawfyw`. Dùng gói Free để làm tiếp, **nâng Pro trước khi nhập dữ liệu thật** (gói Free tự tạm dừng khi không dùng và không sao lưu hằng ngày) | ⏸ **Chưa tạo** — Founder dừng lại ở bước này ngày 10/09/2026 |

## 10/09/2026 — Vòng 2: đối soát dữ liệu sheet "CRM ( 10/9)"

| # | Quyết định | Chi tiết |
|---|---|---|
| D10 | **Thảo: 250.000 ₫/buổi** (không phải 249.000 trong danh sách lớp) | Theo bảng giá, căn cứ "Founder chốt 13/08/2026", chứng từ 3 lần × 2.500.000 = 30 buổi |
| D11 | **Bé Ngân: 179.000 ₫ đến 31/08/2026, rồi 190.000 ₫ từ 01/09/2026** | Sửa ô lỗi 1.790.009.190 ₫. Chứng từ: 716.000 = 4 buổi, 1.432.000 = 8 buổi. ⇒ **đơn giá học phí phải có ngày hiệu lực**, không phải một số cố định |
| D12 | **THIENAI-KO (Thiên Ái – Mr. Kobe): tạm ngưng** | Dòng 11 và 21 trùng mã lớp và trùng sheet feedback ⇒ nhập thành một lớp, trạng thái tạm ngưng |
| D13 | **Y Khoa là lớp nhóm 3 người: tách thành 3 học viên riêng** (Ms. Min, Mr. Max, Mr. John) để điểm danh và nhận xét từng người, nhưng **học phí gắn vào một hợp đồng do một người đại diện đóng** | 360.000 ₫/buổi cho cả nhóm − 150.000 ₫/tháng. ⚠ **Chưa biết ai đứng tên đóng** |

---

## Còn thiếu để hoàn tất việc nhập dữ liệu

Những mục này chỉ cần tra cứu, không cần quyết định lớn:

### Lịch học chưa có (6 lớp)
`LINH-PH` (Ms. Linh) · `KIEN-SH` (Kiên) · `VY-SH` (Vy) · `NHI-PH` (Nhi) · `THIENAI-KO` (Thiên Ái)

### Thiếu giờ kết thúc (3 lớp) — tạm hiểu là 60 phút, cần xác nhận
| Lớp | Ô gốc | Tôi hiểu là |
|---|---|---|
| `PHUC-PH` | `CN 10h15` | Chủ nhật 10:15–11:15 |
| `NGOC-HO` | `T3, T5, T7 6pm` | Thứ Ba/Năm/Bảy 18:00–19:00 |
| `HANG-PH` | `T3, T5, T6 2pm` | Thứ Ba/Năm/Sáu 14:00–15:00 |

### Không rõ sáng hay chiều (1 lớp)
`TAN-SH` — `T7 9:30-10:30 & CN 4:30-5:30`. Buổi Chủ nhật là **16:30–17:30** hay **04:30–05:30**?

### Khác
- `NGOC-HO` (Bảo Ngọc): hình thức đóng ghi **"Chưa xác định"** — Cuối tháng hay Gói?
- **Công Duy**: có trong bảng giá (chưa có học phí) nhưng không có lớp nào trong file mới. Còn học không?
- **Ms. Tuyết (Golf)**: trạng thái "đang đợi", chưa có mã lớp ⇒ tôi nhập thành *lead*, không phải học viên
- **Số dư mở đầu**: bảng giá chỉ có mốc "đã đóng đủ đến ngày" cho 2 người (Bé Ngân 31/08/2026, Y Khoa 31/07/2026). 16 học viên còn lại cần lấy từ tab "LỊCH SỬ THANH TOÁN" — tôi sẽ tự đọc, không cần cô làm gì
