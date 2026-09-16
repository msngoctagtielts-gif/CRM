# Cấu trúc hệ thống MNEE — đối chiếu đề xuất của Founder

Ngày 16/09/2026.

Cô Ngọc đưa một sơ đồ menu 24 mục và hỏi có nên áp dụng không. Tài liệu này
đối chiếu từng mục với **trạng thái thật** của hệ thống, rồi đề xuất thứ tự làm.

Ba mức trạng thái:

- **Đã có** — có màn hình, dùng được ngay.
- **Có dữ liệu, thiếu màn hình** — bảng đã thiết kế xong, có khi đã có dữ liệu,
  chỉ thiếu giao diện. Đây là phần rẻ nhất để làm.
- **Chưa có gì** — chưa có bảng. Tốn nhất.

## Đối chiếu 24 mục

| # | Mục Founder đề xuất | Trạng thái | Bảng dữ liệu | Số dòng |
|---|---|---|---|---:|
| 1 | Dashboard | Đã có | — | — |
| 2 | Việc cần xử lý | Đã có | — | — |
| 3 | Khách hàng tiềm năng | Thiếu màn hình | `leads`, `lead_activities` | 0 |
| 4 | Học viên | Đã có | `students` | 23 |
| 5 | Placement & đăng ký | Thiếu màn hình | `placement_tests`, `trial_classes` | 0 |
| 6 | Tiến độ học tập | Thiếu màn hình | `attendance`, `teaching_report_students` | 505 / 361 |
| 7 | Lớp học | Đã có | `classes` | 22 |
| 8 | Buổi học | Đã có | `lessons` | 461 |
| 9 | Lịch học | Thiếu màn hình | `class_schedules` | 36 |
| 10 | Chất lượng giảng dạy | Đã có | `teaching_reports` | 450 |
| 11 | Hồ sơ giáo viên | Đã có | `teachers` | 18 |
| 12 | Lịch & giờ dạy | Thiếu màn hình | `class_schedules`, `lessons` | 36 / 461 |
| 13 | Hiệu suất giảng dạy | Một phần | `teaching_reports` | 450 |
| 14 | Học phí & công nợ | Đã có | `payments`, `student_enrollments` | 46 / 22 |
| 15 | Lương giáo viên | Đã có | `teacher_payroll` | 7 |
| 16 | Chi phí | Đã có | `expenses` | 24 |
| 17 | Báo cáo tài chính | Một phần | — | — |
| 18 | Chương trình học | Thiếu màn hình | `programs`, `levels` | 5 / 7 |
| 19 | Teaching Library | Chưa có gì | — | — |
| 20 | Assessment | Chưa có gì | — | — |
| 21 | Tài liệu trung tâm | Chưa có gì | — | — |
| 22 | Danh mục | Thiếu màn hình | `settings` | 11 |
| 23 | Người dùng & phân quyền | Thiếu màn hình | `users`, `roles` | 1 / 4 |
| 24 | Cài đặt | Thiếu màn hình | `settings` | 11 |

Tổng kết: **11 mục đã có**, **9 mục chỉ thiếu màn hình**, **4 mục chưa có gì**.

Kết luận quan trọng nhất: cấu trúc cô vẽ **không cần thiết kế lại**. Cơ sở dữ
liệu đã dựng sẵn gần hết những gì cô muốn. Phần thiếu là giao diện, không phải
kiến trúc.

## Bốn chỗ nên chỉnh trong sơ đồ của Founder

### 1. Ba mục dễ chồng nhau

"Tiến độ học tập" (6), "Chất lượng giảng dạy" (10) và "Hiệu suất giảng dạy"
(13) đều đọc cùng một nguồn là `teaching_reports`. Khác nhau ở **chủ thể**, nên
đặt tên theo chủ thể để không ai phải đoán:

- Học viên tiến bộ đến đâu → **Tiến độ học viên**
- Buổi dạy có đạt chuẩn không → **Kiểm định buổi dạy**
- Cô nào dạy tốt → **Hiệu suất giáo viên**

### 2. Thiếu hẳn mục Phụ huynh

Bảng `parents` và `student_parents` đã có. Với lớp Kids và Teens, phụ huynh mới
là người trả tiền và nhận báo cáo, nhưng sơ đồ không có chỗ nào cho họ.

### 3. Thiếu hẳn mục Điểm danh

`attendance` đang có **505 dòng** — bảng nhiều dữ liệu thứ hai của hệ thống,
sau nhật ký kiểm toán. Nó là thứ trừ buổi học phí qua `lesson_consumptions`.
Không nhìn thấy nó thì không đối chiếu được khi phụ huynh thắc mắc số buổi.

### 4. Menu dài hơn KHÔNG giải được vấn đề Founder nêu

Cô nói: *"tôi có thể lấy ra không phải tìm kiếm mất nhiều thời gian"*. Thêm 13
mục menu làm điều đó **chậm đi**, không nhanh lên — mỗi lần cần một thông tin
lại phải đoán nó nằm ở nhóm nào.

Hai thứ giải đúng vấn đề đó:

- **Tìm kiếm toàn cục.** Gõ tên học viên, giáo viên hay lớp ở bất kỳ màn hình
  nào cũng ra. Hiện chưa có.
- **Trang hồ sơ 360°.** Mở một học viên là thấy hết trong một trang: lớp đang
  học, toàn bộ buổi, feedback, video, điểm danh, học phí đã đóng, công nợ,
  phụ huynh. Không phải nhảy qua sáu màn hình.

Hai việc này cắt được nhiều thời gian hơn mười ba màn hình mới cộng lại.

## Bảy giai đoạn tư vấn của Founder — ánh xạ vào hệ thống

| Giai đoạn | Nơi xử lý | Bảng |
|---|---|---|
| 1. Tìm hiểu trung tâm | Website | — |
| 2. Tìm hiểu chương trình | Website | `programs`, `levels` |
| 3. Kiểm tra đầu vào | Hệ thống | `placement_tests`, `trial_classes` |
| 4. Tư vấn khóa học | Hệ thống | `leads`, `lead_activities` |
| 5. Học phí | Hệ thống | `tuition_packages`, `student_enrollments` |
| 6. Chính sách học tập | Website + Hệ thống | `settings` |
| 7. Bắt đầu học | Hệ thống | `class_students`, `class_schedules` |

Giai đoạn 1–2 thuộc về website. Giai đoạn 3–7 thuộc về hệ thống. **Cầu nối duy
nhất giữa hai bên là một biểu mẫu trên website ghi thẳng vào bảng `leads`.**
Không có cầu nối đó thì mỗi khách hàng tiềm năng phải nhập tay hai lần.

## Thứ tự đề xuất

**P0 — Người dùng & phân quyền.**
17 trên 18 giáo viên chưa có tài khoản đăng nhập. Chừng nào chưa xong, mọi màn
hình khác chỉ một mình cô Ngọc dùng được. Đây cũng là cách chặn tận gốc việc
giáo viên giữ dữ liệu trung tâm trên Drive cá nhân của họ.

**P1 — Tìm kiếm toàn cục + hồ sơ 360°.**
Giải đúng vấn đề cô nêu. Không cần bảng mới.

**P2 — Lịch học.**
`class_schedules` đã có 36 dòng nằm im. Chỉ thiếu màn hình.

**P3 — Khách hàng tiềm năng + biểu mẫu từ website.**
Mở đầu phễu tuyển sinh, nối website với hệ thống.

**P4 — Chương trình học & Danh mục.**
`programs` và `levels` đã có dữ liệu.

**P5 — Teaching Library, Tài liệu trung tâm, Assessment.**
Ba mục chưa có bảng nào, tốn nhất, và không chặn việc vận hành hằng ngày.

## Nguyên tắc giữ nguyên

Trong `src/components/Nav.tsx` đã ghi: *"Nhóm nào chưa có màn hình thì KHÔNG
đưa vào đây. Một mục bấm vào ra trang trống còn tệ hơn là không có mục đó."*

Giữ nguyên nguyên tắc này khi mở rộng menu theo sơ đồ mới.

## Điều tài liệu này KHÔNG trả lời được

Website `msngoc-elite-english.pages.dev` bị chặn ở môi trường chạy nên chưa xem
được. Mọi nhận xét về website ở trên chỉ giới hạn ở phần ghép nối dữ liệu
(biểu mẫu ghi vào `leads`). Muốn góp ý nội dung và bố cục website thì cần xem
được trang, hoặc cô dán nội dung sang.
