# TODO.md — việc tiếp theo, theo thứ tự ưu tiên

**Cập nhật:** 10/09/2026

---

## P0 — Chặn việc đưa vào sử dụng thật

Phải xong trước khi bất kỳ ai nhập dữ liệu thật vào hệ thống.

- [ ] **Quyết định về Supabase project.** `yevsupsuelpbodwawfyw` đang tạm dừng.
      Founder xác nhận: dùng project này (và có dữ liệu cũ không?) hay tạo project mới?
      *Không áp migration cho tới khi có câu trả lời.*
- [ ] **Áp migration** lên project đã chọn: `supabase link` → `supabase db push`
- [ ] **Tạo tài khoản Founder** trong Supabase Studio, rồi nâng quyền:
      ```sql
      update public.users set role_code = 'founder' where email = '<email>';
      ```
- [ ] **Cấu hình biến môi trường** trên môi trường chạy thật (Vercel hoặc tương đương):
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`
- [ ] **Kiểm thử end-to-end trên Supabase thật** — toàn bộ mục 5 "Chưa kiểm thử"
      trong `IMPLEMENTATION_STATUS.md`: đăng nhập, tạo học viên, tạo lớp, sinh buổi,
      nộp báo cáo, ghi nhận thanh toán, xem dashboard
- [ ] **Kiểm tra Advisors** trong Supabase Studio → Security, xử lý mọi cảnh báo
- [ ] **Lên lịch quét cảnh báo mỗi giờ** — pg_cron hoặc n8n gọi
      `POST /api/cron/scan-reports`. *Không có bước này thì cảnh báo 10 giờ
      không bao giờ tự phát sinh.*
- [ ] **Xác nhận giả định A1–A13** còn lại trong `PROJECT_PLAN.md` mục 6
      (A1–A12 về tiền tệ, múi giờ, lớp nhóm; A13 về việc gửi phụ huynh có cần người duyệt)
- [ ] **Điền dữ liệu còn thiếu** của 21 lớp — danh sách ở cuối `DECISIONS.md`:
      6 lớp chưa có lịch học, 3 lớp thiếu giờ kết thúc, 1 lớp không rõ sáng/chiều,
      hình thức đóng của Bảo Ngọc, tình trạng của Công Duy, ai đứng tên đóng lớp Y Khoa
- [ ] **Bật sao lưu** (gói Pro tự sao lưu hằng ngày; gói Free cần `supabase db dump` định kỳ)

## P1 — Đồng bộ giao diện với mô hình nghiệp vụ mới

*CSDL đã xong và đã kiểm thử; đây là phần giao diện còn thiếu. Xem `DECISIONS.md`.*

- [ ] **Form báo cáo giảng dạy theo 6 tiêu chí** (D3) — thêm ô: trích nguyên văn lời
      học viên, timestamp đối chiếu, điểm mạnh, phần cần cải thiện, mẫu câu cho
      homework. Hiện điểm QC và cho biết còn thiếu tiêu chí nào
- [ ] **Sửa chữ "10 giờ" thành "24 giờ"** trong trang báo cáo và trang cảnh báo (D2)
- [ ] **Ô chọn hình thức đóng** trong form hợp đồng (D1): gói trả trước / cuối tháng
- [ ] **Nhập nhiều mốc đơn giá** theo ngày hiệu lực (D11) — ca Bé Ngân
- [ ] **Ô người đại diện đóng** cho lớp nhóm (D13) — ca Y Khoa
- [ ] **Trang phiếu học phí tháng** (D1): lập phiếu → gửi → ghi nhận thu
- [ ] **Trang "Cần đối soát"** đọc từ `v_data_review` (D8)
- [ ] **Cảnh báo học vượt / sắp hết buổi** trên dashboard (D7)
- [ ] Gọi thêm `fn_alert_missing_lesson_time`, `fn_alert_lesson_balance`,
      `fn_alert_not_sent_to_parent` trong `/api/cron/scan-reports`
- [ ] **Nối AI viết feedback từ link video** (D6) — chọn model, và giữ bước người
      bấm gửi phụ huynh (giả định A13)

## P1b — Hoàn thiện Giai đoạn 1

- [ ] Trang **sửa hồ sơ học viên** (`/students/[id]/edit`) — server action `updateStudent` đã có, thiếu giao diện
- [ ] **Nút duyệt báo cáo** cho Founder trong trang báo cáo — action `approveReport` đã có, chưa gắn vào UI
- [ ] **Liên kết tài khoản giáo viên** từ giao diện (gán `teachers.user_id`), thay cho việc chạy SQL tay
- [ ] Trang **sửa / huỷ lớp học**, đánh dấu học viên rời lớp
- [ ] **Huỷ và dời buổi học** từ giao diện (CSDL đã hỗ trợ `cancelled`, `rescheduled`, `is_makeup`)
- [ ] **Sửa / hoàn tiền thanh toán** (CSDL đã có `refunded`, `cancelled`)
- [ ] Phân trang cho danh sách học viên và buổi học (hiện giới hạn 300/400 dòng)
- [ ] Kiểm tra hiển thị thật trên điện thoại và iPad, chụp màn hình đối chiếu
- [ ] Rà soát khả năng tiếp cận: thứ tự tiêu đề, nhãn cho trình đọc màn hình, tương phản màu

## P2 — Giai đoạn 2 (Lương & báo cáo tài chính)

*Logic CSDL đã xong và đã kiểm thử. Chỉ còn giao diện.*

- [ ] Trang **bảng lương giáo viên**: chọn kỳ → `fn_build_payroll()` → xem buổi đã dạy → duyệt → đánh dấu đã trả
- [ ] Thêm **điều chỉnh lương** (thưởng/trừ) từ giao diện
- [ ] Trang **lương của tôi** cho giáo viên (RLS đã cho đọc dòng của chính mình)
- [ ] **Tự sinh chi phí** `teacher_salary` khi kỳ lương chuyển `paid`, gắn `payroll_id` để không đếm hai lần
- [ ] Trang **quản lý hợp đồng học phí** đầy đủ: sửa, tạm dừng, gia hạn, hết hạn
- [ ] **Báo cáo tài chính**: P&L theo tháng, dòng tiền, đối chiếu doanh thu ghi nhận ↔ tiền mặt
- [ ] Cảnh báo **học viên gần hết buổi** (còn ≤ 2 buổi)
- [ ] Cảnh báo **hợp đồng chưa thanh toán** quá X ngày

## P3 — Giai đoạn 3 (Lead CRM)

- [ ] Bảng pipeline lead dạng kéo-thả theo 8 trạng thái
- [ ] Biểu mẫu lead + nhật ký liên hệ
- [ ] Nhập kết quả kiểm tra đầu vào, tự gợi ý cấp độ CEFR
- [ ] Lên lịch và ghi nhận kết quả học thử
- [ ] **Chuyển lead → học viên** một bước (tạo `students` + `student_parents` + `student_enrollments`)
- [ ] Báo cáo tỷ lệ chuyển đổi theo nguồn

## P4 — Giai đoạn 4 (Tự động hoá & di trú)

- [ ] Nhắc giáo viên nộp báo cáo qua Zalo/Telegram trước khi hết hạn 10 giờ
- [ ] Nhắc phụ huynh đóng học phí
- [ ] Gửi báo cáo tuần cho Founder
- [ ] **Script di trú Google Sheets** — cần một bản xuất mẫu từ Founder trước
- [ ] Đối chiếu sau di trú: số buổi còn lại và công nợ phải khớp bản tính tay

## P5 — Giai đoạn 5 (Cổng phụ huynh)

- [ ] Đăng nhập cho phụ huynh (cấp quyền `parent` trong RLS)
- [ ] Trang tiến độ học tập của con
- [ ] Xem recording (tôn trọng `recordings.visible_to_parent`)
- [ ] Báo cáo tiến bộ định kỳ
- [ ] Phân tích bằng AI trên dữ liệu báo cáo giảng dạy

---

## Nợ kỹ thuật đã biết

| # | Vấn đề | Ảnh hưởng | Ghi chú |
|---|---|---|---|
| 1 | `scripts/gen-types.py` là giải pháp tạm thay cho `supabase gen types` | Thấp | Khi có Docker thì dùng `npm run db:types`; cả hai cho kết quả tương đương |
| 2 | Múi giờ UTC+7 được gắn cố định trong `src/lib/time.ts` và `src/lib/period.ts` | Thấp | Đúng với Việt Nam (không có giờ mùa hè). Phải thay bằng thư viện múi giờ nếu mở rộng ra nước khác |
| 3 | Chưa có kiểm thử tự động cho tầng ứng dụng | Trung bình | Logic nghiệp vụ đã được phủ ở tầng SQL; nên thêm Playwright cho luồng báo cáo giảng dạy |
| 4 | Dashboard tính tổng trong JavaScript, không phải SQL | Thấp | Phù hợp quy mô trung tâm nhỏ. Khi dữ liệu lớn, chuyển sang view tổng hợp |
| 5 | Chưa có quốc tế hoá thật, chỉ có từ điển nhãn `src/lib/labels.ts` | Thấp | Mọi chuỗi hiển thị đã tập trung một chỗ, thêm tiếng Anh là thêm một từ điển song song |
| 6 | Không có giới hạn tần suất cho `/api/cron/*` | Thấp | Đã bảo vệ bằng secret; thêm rate limit nếu endpoint bị dò |
| 7 | `npm audit` còn báo lỗ hổng `postcss` (transitive trong Next) | Thấp | Chưa có bản vá từ thượng nguồn. Chỉ ảnh hưởng lúc build trên CSS của chính dự án, không xử lý dữ liệu người dùng. Theo dõi bản Next mới |

---

## Ghi chú bảo mật phụ thuộc

`next` đã được nâng lên **15.5.25** để vá **CVE-2025-66478** (bản 15.1.3 ban đầu
có lỗ hổng). Chạy `npm audit --omit=dev` định kỳ và nâng `next` khi có bản vá cho
cảnh báo `postcss` còn lại.
