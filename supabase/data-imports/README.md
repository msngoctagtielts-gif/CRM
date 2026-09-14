# Nhập dữ liệu lịch sử

Thư mục này lưu các script **nhập dữ liệu** đã chạy trên cơ sở dữ liệu thật —
khác với `supabase/migrations/` là thay đổi **cấu trúc**.

Lưu lại để sau này còn truy được một buổi học trong hệ thống đến từ báo cáo nào,
và để chạy lại được nếu phải dựng lại cơ sở dữ liệu từ đầu.

## Ba việc phải làm đúng thứ tự

Không phải thứ tự tuỳ ý — làm sai thì hệ thống ghi nhận sai mà không báo lỗi:

1. Nhập buổi học với `status = 'scheduled'`.
   Trigger doanh thu `trg_lesson_consume_all` chỉ chạy khi trạng thái **đổi**
   sang `completed`. Nhập thẳng `completed` sẽ không sinh dòng doanh thu nào.
2. Sửa `is_billable = false` cho các buổi miễn phí — **sau khi** đã insert
   điểm danh. Trigger `tg_attendance_defaults` ghi đè cột này lúc INSERT theo
   trạng thái điểm danh, nên giá trị đặt sẵn trong câu INSERT sẽ bị mất.
3. Rồi mới `update lessons set status = 'completed'`.

## Không ghi giờ dạy thực tế

Các báo cáo PDF chỉ ghi NGÀY, không ghi giờ. `actual_start_at` và `actual_end_at`
để trống vì đó là sự thật.

Hệ quả có lợi: `fn_generate_payable_lesson` đòi có giờ thực tế mới sinh dòng trả
lương, nên các buổi nhập lịch sử **sinh doanh thu nhưng không sinh lương** —
đúng điều cần, vì lương tháng 5 đến tháng 8/2026 trung tâm đã trả ngoài hệ thống.

## Các file

| File | Nội dung | Nguồn |
|---|---|---|
| `2026-09-14_thao.sql` | Lớp chị Thảo — 44 buổi | Báo cáo "Chị Thảo" chốt 26/07/2026 + báo cáo kỳ 28/07–19/08/2026 |
| `2026-09-14_diep_phuc.sql` | Diệp 44 buổi, Phúc 28 buổi | 2 báo cáo gửi chị Hương (T6–T7 và T8/2026) |
| `2026-09-14_thienai_toan_hau.sql` | Thiên Ái 26, Toàn 26, Hậu 14 buổi | 4 báo cáo PDF gửi ngày 14/09/2026 |

Xem `DECISIONS.md` mục **D16** để biết các giả định còn phải xác nhận.
