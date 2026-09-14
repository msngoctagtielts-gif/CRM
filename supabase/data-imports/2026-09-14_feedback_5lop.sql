-- Nhập 146 buổi học của 5 lớp từ SHEET FEEDBACK (không phải báo cáo PDF).
-- Đã chạy trên cơ sở dữ liệu thật ngày 14/09/2026.
--
-- Nguồn: cột "ID sheet feedback" trong file "CRM (10/9)" trỏ tới sheet riêng
-- của từng lớp. Cô Ngọc xác nhận đây là nguồn gốc, và lương của mọi buổi trong
-- đó ĐÃ TRẢ XONG.
--
-- KHÁC với 5 lớp nhập từ PDF trước đó: sheet feedback CÓ giờ dạy thật, nên
-- sinh ra dòng lương. Bước 5 đánh dấu tất cả là 'paid' ngay - nếu để 'pending'
-- hệ thống sẽ báo nợ lương không có thật.
--
-- Founder chốt 14/09/2026:
--   - Lớp Tân buổi 56, 57 (sheet ghi 08/01 và 08/02) là THÁNG 8: 01/08 và 02/08.
--   - Học phí bé Ngân là 179.000 đ (con số 1.790.009.190 đ trong sheet là lỗi gõ).
--   - Lớp Hoàng & Huệ là LỚP NHÓM hai học viên.
--   - Sáu giáo viên Benjamin, Ms. Grace, Ms. Rith, Teacher Allen, Ms. Wen,
--     Marie đều ĐÃ NGHỈ VIỆC.
--   - KHÔNG nhập ba học viên C Khang, Khôi, Uyên.

-- BƯỚC 1. Sáu giáo viên đã nghỉ việc.
insert into teachers (teacher_code, full_name, status, notes, needs_review, review_note)
values
 ('BENJAMIN','Benjamin',     'archived','Da nghi viec (Founder xac nhan 14/09/2026). Day lop Luan T10-T12/2025.', true,'Chi co ten trong sheet feedback.'),
 ('GRACE',   'Ms. Grace',    'archived','Da nghi viec (Founder xac nhan 14/09/2026). Day lop Luan T12/2025-T1/2026.', true,'Chi co ten trong sheet feedback.'),
 ('RITH',    'Ms. Rith',     'archived','Da nghi viec (Founder xac nhan 14/09/2026). Day lop Luan T1-T4/2026.', true,'Chi co ten trong sheet feedback.'),
 ('ALLEN',   'Teacher Allen','archived','Da nghi viec (Founder xac nhan 14/09/2026). Day lop Tuyet.', true,'Chi co ten trong sheet feedback.'),
 ('WEN',     'Ms. Wen',      'archived','Da nghi viec (Founder xac nhan 14/09/2026). Day lop Tuyet.', true,'Chi co ten trong sheet feedback.'),
 ('MARIE',   'Marie',        'archived','Da nghi viec (Founder xac nhan 14/09/2026).', true,'Chi co ten trong sheet - chua ro da day nhung buoi nao.')
on conflict do nothing;

-- BƯỚC 2. Đơn giá lương theo LỚP, đúng mô hình của chính sheet:
-- "Luong giao vien tu tinh theo so buoi giao vien bao cao va muc pay/60 phut
--  trong CLASS LIST" - đơn giá gắn với LỚP, không gắn với người.
insert into teacher_rates (teacher_id, scope, class_id, rate_amount, effective_from, notes)
select t.id, 'class', c.id, x.gia, x.tu_ngay,
       'Lay tu cot "Luong GV/60p" trong sheet CLASS LIST (file CRM 10/9). Nhap 14/09/2026.'
from (values
  ('LUAN-SH', 'Benjamin',      120000, DATE '2025-10-11'),
  ('LUAN-SH', 'Ms. Grace',     120000, DATE '2025-10-11'),
  ('LUAN-SH', 'Ms. Rith',      120000, DATE '2025-10-11'),
  ('LUAN-SH', 'Ms. Sheba',     120000, DATE '2025-10-11'),
  ('TAN-SH',  'Ms. Phương',    120000, DATE '2025-10-11'),
  ('TAN-SH',  'Ms. Sheba',     120000, DATE '2025-10-11'),
  ('TUYET-SH','Teacher Allen', 120000, DATE '2025-09-24'),
  ('TUYET-SH','Ms. Wen',       120000, DATE '2025-09-24'),
  ('TUYET-SH','Ms. Sheba',     120000, DATE '2025-09-24'),
  ('NGAN-PH', 'Ms. Phương',    120000, DATE '2026-06-03'),
  ('HOANG-PH','Ms. Phương',    140000, DATE '2026-05-05')
) as x(ma_lop, ten_gv, gia, tu_ngay)
join classes c on c.class_code = x.ma_lop
join teachers t on t.full_name = x.ten_gv;

-- BƯỚC 3. Lùi hiệu lực học phí về buổi đầu tiên của từng lớp, nếu không
-- fn_resolve_tuition_rate không tìm thấy giá và doanh thu sẽ bằng 0.
update tuition_rates tr
set effective_from = x.tu_ngay,
    evidence_note = coalesce(tr.evidence_note || ' | ', '') ||
      'Lui hieu luc ve ' || x.tu_ngay || ' ngay 14/09/2026 de nhap lich su tu sheet feedback.'
from (values
  ('LUAN-SH',  219000, DATE '2025-10-11'),
  ('TAN-SH',   219000, DATE '2025-10-11'),
  ('TUYET-SH', 249000, DATE '2025-09-24'),
  ('NGAN-PH',  179000, DATE '2026-06-03'),
  ('HOANG-PH', 260000, DATE '2026-05-05')
) as x(ma_lop, gia, tu_ngay)
join classes c on c.class_code = x.ma_lop
join student_enrollments e on e.class_id = c.id
where tr.enrollment_id = e.id and tr.price_per_lesson = x.gia;

-- BƯỚC 4. Nhập buổi học + điểm danh.
-- gio = null: sheet không ghi giờ dạy. Giờ 19:00 chỉ để xếp thứ tự, và
-- actual_start_at để trống nên buổi đó KHÔNG sinh dòng lương.
with v(ngay, ma_lop, ten_gv, gio, phut) as (values
  (DATE '2025-10-11', 'LUAN-SH', 'Benjamin', TIME '09:00', 60),
  (DATE '2025-10-12', 'LUAN-SH', 'Benjamin', TIME '05:00', 60),
  (DATE '2025-10-25', 'LUAN-SH', 'Benjamin', TIME '09:00', 60),
  (DATE '2025-10-26', 'LUAN-SH', 'Benjamin', TIME '05:00', 60),
  (DATE '2025-11-08', 'LUAN-SH', 'Benjamin', TIME '09:00', 60),
  (DATE '2025-11-09', 'LUAN-SH', 'Benjamin', TIME '05:00', 60),
  (DATE '2025-11-16', 'LUAN-SH', 'Benjamin', TIME '05:00', 60),
  (DATE '2025-11-29', 'LUAN-SH', 'Benjamin', TIME '09:00', 60),
  (DATE '2025-12-06', 'LUAN-SH', 'Benjamin', TIME '05:00', 60),
  (DATE '2025-12-20', 'LUAN-SH', 'Ms. Grace', TIME '20:00', 60),
  (DATE '2025-12-27', 'LUAN-SH', 'Ms. Grace', TIME '20:00', 60),
  (DATE '2025-12-28', 'LUAN-SH', 'Ms. Grace', null, 60),
  (DATE '2026-01-03', 'LUAN-SH', 'Ms. Grace', TIME '20:00', 60),
  (DATE '2026-01-04', 'LUAN-SH', 'Ms. Grace', null, 60),
  (DATE '2026-01-08', 'LUAN-SH', 'Ms. Sheba', TIME '08:00', 60),
  (DATE '2026-01-10', 'LUAN-SH', 'Ms. Grace', TIME '20:00', 60),
  (DATE '2026-01-11', 'LUAN-SH', 'Ms. Grace', null, 60),
  (DATE '2026-01-17', 'LUAN-SH', 'Ms. Rith', TIME '20:00', 60),
  (DATE '2026-01-24', 'LUAN-SH', 'Ms. Rith', TIME '20:00', 60),
  (DATE '2026-01-25', 'LUAN-SH', 'Ms. Rith', null, 60),
  (DATE '2026-02-01', 'LUAN-SH', 'Ms. Rith', null, 60),
  (DATE '2026-02-08', 'LUAN-SH', 'Ms. Rith', null, 60),
  (DATE '2026-02-08', 'LUAN-SH', 'Ms. Sheba', TIME '15:30', 60),
  (DATE '2026-04-04', 'LUAN-SH', 'Ms. Rith', null, 60),
  (DATE '2026-04-11', 'LUAN-SH', 'Ms. Rith', null, 60),
  (DATE '2026-04-12', 'LUAN-SH', 'Ms. Rith', null, 60),
  (DATE '2026-04-25', 'LUAN-SH', 'Ms. Rith', null, 60),
  (DATE '2026-05-23', 'LUAN-SH', 'Ms. Sheba', TIME '16:00', 60),
  (DATE '2026-05-24', 'LUAN-SH', 'Ms. Sheba', TIME '17:00', 60),
  (DATE '2026-05-30', 'LUAN-SH', 'Ms. Sheba', TIME '08:00', 60),
  (DATE '2026-05-31', 'LUAN-SH', 'Ms. Sheba', TIME '15:00', 60),
  (DATE '2026-06-06', 'LUAN-SH', 'Ms. Sheba', TIME '08:00', 60),
  (DATE '2026-06-07', 'LUAN-SH', 'Ms. Sheba', TIME '18:00', 60),
  (DATE '2026-06-09', 'LUAN-SH', 'Ms. Sheba', TIME '08:00', 60),
  (DATE '2026-06-13', 'LUAN-SH', 'Ms. Sheba', TIME '08:00', 60),
  (DATE '2026-06-16', 'LUAN-SH', 'Ms. Sheba', TIME '08:00', 60),
  (DATE '2026-06-20', 'LUAN-SH', 'Ms. Sheba', TIME '08:00', 60),
  (DATE '2026-06-23', 'LUAN-SH', 'Ms. Sheba', TIME '08:00', 60),
  (DATE '2026-06-30', 'LUAN-SH', 'Ms. Sheba', TIME '08:00', 60),
  (DATE '2026-07-04', 'LUAN-SH', 'Ms. Sheba', TIME '08:00', 60),
  (DATE '2026-09-08', 'LUAN-SH', 'Ms. Sheba', null, 60),
  (DATE '2025-10-11', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2025-10-12', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2025-10-19', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2025-10-26', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2025-11-01', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2025-11-02', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2025-11-08', 'TAN-SH', 'Ms. Phương', TIME '18:00', 60),
  (DATE '2025-11-09', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2025-11-15', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2025-11-16', 'TAN-SH', 'Ms. Phương', TIME '18:00', 60),
  (DATE '2025-11-22', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2025-11-23', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2025-11-29', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2025-11-30', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2025-12-06', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2025-12-13', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2025-12-14', 'TAN-SH', 'Ms. Phương', null, 60),
  (DATE '2025-12-20', 'TAN-SH', 'Ms. Phương', null, 60),
  (DATE '2025-12-27', 'TAN-SH', 'Ms. Phương', TIME '08:10', 60),
  (DATE '2026-01-03', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2026-01-04', 'TAN-SH', 'Ms. Phương', TIME '17:20', 60),
  (DATE '2026-01-11', 'TAN-SH', 'Ms. Phương', TIME '18:00', 60),
  (DATE '2026-01-17', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2026-01-18', 'TAN-SH', 'Ms. Phương', TIME '18:00', 60),
  (DATE '2026-01-24', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2026-01-25', 'TAN-SH', 'Ms. Phương', TIME '18:00', 60),
  (DATE '2026-02-07', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2026-02-08', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2026-02-25', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2026-03-01', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2026-03-07', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2026-03-08', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2026-03-21', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2026-03-22', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2026-04-04', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2026-04-12', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2026-04-25', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2026-05-09', 'TAN-SH', 'Ms. Phương', TIME '08:00', 60),
  (DATE '2026-05-10', 'TAN-SH', 'Ms. Phương', TIME '17:00', 60),
  (DATE '2026-05-24', 'TAN-SH', 'Ms. Sheba', TIME '16:00', 60),
  (DATE '2026-05-31', 'TAN-SH', 'Ms. Sheba', TIME '16:30', 60),
  (DATE '2026-06-06', 'TAN-SH', 'Ms. Sheba', TIME '09:30', 60),
  (DATE '2026-06-09', 'TAN-SH', 'Ms. Sheba', TIME '09:30', 60),
  (DATE '2026-06-13', 'TAN-SH', 'Ms. Sheba', TIME '15:00', 60),
  (DATE '2026-06-17', 'TAN-SH', 'Ms. Sheba', TIME '09:30', 60),
  (DATE '2026-06-20', 'TAN-SH', 'Ms. Sheba', TIME '09:30', 60),
  (DATE '2026-06-23', 'TAN-SH', 'Ms. Sheba', TIME '09:30', 60),
  (DATE '2026-06-30', 'TAN-SH', 'Ms. Sheba', TIME '09:30', 60),
  (DATE '2026-07-04', 'TAN-SH', 'Ms. Sheba', TIME '09:30', 60),
  (DATE '2026-07-17', 'TAN-SH', 'Ms. Sheba', TIME '20:00', 55),
  (DATE '2026-07-19', 'TAN-SH', 'Ms. Sheba', TIME '14:29', 56),
  (DATE '2026-07-21', 'TAN-SH', 'Ms. Sheba', TIME '09:30', 55),
  (DATE '2026-07-28', 'TAN-SH', 'Ms. Sheba', TIME '15:02', 53),
  (DATE '2026-08-01', 'TAN-SH', 'Ms. Sheba', null, 60),
  (DATE '2026-08-02', 'TAN-SH', 'Ms. Sheba', null, 60),
  (DATE '2025-09-24', 'TUYET-SH', 'Teacher Allen', null, 60),
  (DATE '2025-09-26', 'TUYET-SH', 'Teacher Allen', null, 50),
  (DATE '2025-10-07', 'TUYET-SH', 'Ms. Wen', null, 60),
  (DATE '2025-10-10', 'TUYET-SH', 'Ms. Wen', null, 60),
  (DATE '2025-11-11', 'TUYET-SH', 'Ms. Wen', null, 60),
  (DATE '2025-12-12', 'TUYET-SH', 'Ms. Wen', null, 60),
  (DATE '2026-06-11', 'TUYET-SH', 'Ms. Sheba', TIME '09:00', 60),
  (DATE '2026-06-12', 'TUYET-SH', 'Ms. Sheba', TIME '10:00', 60),
  (DATE '2026-06-18', 'TUYET-SH', 'Ms. Sheba', TIME '09:00', 60),
  (DATE '2026-06-19', 'TUYET-SH', 'Ms. Sheba', TIME '10:00', 60),
  (DATE '2026-06-25', 'TUYET-SH', 'Ms. Sheba', TIME '09:00', 60),
  (DATE '2026-06-26', 'TUYET-SH', 'Ms. Sheba', TIME '10:00', 60),
  (DATE '2026-07-02', 'TUYET-SH', 'Ms. Sheba', TIME '09:00', 60),
  (DATE '2026-07-03', 'TUYET-SH', 'Ms. Sheba', TIME '09:30', 60),
  (DATE '2026-07-09', 'TUYET-SH', 'Ms. Sheba', TIME '09:00', 60),
  (DATE '2026-07-10', 'TUYET-SH', 'Ms. Sheba', TIME '09:30', 60),
  (DATE '2026-07-16', 'TUYET-SH', 'Ms. Sheba', TIME '09:00', 60),
  (DATE '2026-07-17', 'TUYET-SH', 'Ms. Sheba', TIME '09:30', 60),
  (DATE '2026-07-26', 'TUYET-SH', 'Ms. Sheba', TIME '10:00', 60),
  (DATE '2026-07-27', 'TUYET-SH', 'Ms. Sheba', TIME '09:00', 60),
  (DATE '2026-07-30', 'TUYET-SH', 'Ms. Sheba', TIME '09:00', 60),
  (DATE '2026-06-03', 'NGAN-PH', 'Ms. Phương', TIME '19:55', 60),
  (DATE '2026-06-07', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-06-21', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-06-25', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-07-01', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-07-04', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-07-08', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-07-11', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-07-18', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-07-22', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-07-25', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-07-29', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-08-01', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-09-04', 'NGAN-PH', 'Ms. Phương', TIME '07:00', 60),
  (DATE '2026-05-05', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-05-07', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-05-17', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-05-21', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-05-24', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-05-31', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-06-07', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-06-21', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-06-25', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-07-02', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-07-16', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-07-17', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-07-23', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-07-24', 'HOANG-PH', 'Ms. Phương', null, 60),
  (DATE '2026-08-20', 'HOANG-PH', 'Ms. Phương', null, 60)
),
lop as (select c.id as class_id, c.class_code from classes c
        where c.class_code in ('LUAN-SH','TAN-SH','TUYET-SH','NGAN-PH','HOANG-PH')),
gv  as (select id, full_name from teachers),
moi as (
  insert into lessons (class_id, teacher_id, lesson_date, scheduled_start_at, scheduled_end_at,
                       actual_start_at, actual_end_at, duration_minutes, status, notes)
  select lop.class_id, gv.id, v.ngay,
         (v.ngay + coalesce(v.gio, TIME '19:00')) at time zone 'Asia/Ho_Chi_Minh',
         (v.ngay + coalesce(v.gio, TIME '19:00')) at time zone 'Asia/Ho_Chi_Minh' + (v.phut||' minutes')::interval,
         case when v.gio is null then null else (v.ngay + v.gio) at time zone 'Asia/Ho_Chi_Minh' end,
         case when v.gio is null then null else (v.ngay + v.gio) at time zone 'Asia/Ho_Chi_Minh' + (v.phut||' minutes')::interval end,
         v.phut, 'scheduled'::lesson_status,
         case when v.gio is null
              then 'Nhap tu sheet feedback cua lop ngay 14/09/2026. Sheet KHONG ghi gio day - gio 19:00 chi de xep thu tu.'
              else 'Nhap tu sheet feedback cua lop ngay 14/09/2026. Gio day lay dung tu sheet.' end
  from v join lop on lop.class_code = v.ma_lop join gv on gv.full_name = v.ten_gv
  returning id, class_id
)
insert into attendance (lesson_id, student_id, status)
select moi.id, cs.student_id, 'present'::attendance_status
from moi join class_students cs on cs.class_id = moi.class_id;

update lessons l set status = 'completed'::lesson_status
from classes c
where c.id = l.class_id
  and c.class_code in ('LUAN-SH','TAN-SH','TUYET-SH','NGAN-PH','HOANG-PH')
  and l.status = 'scheduled';

-- BƯỚC 5. Đánh dấu lương ĐÃ TRẢ.
update teacher_payable_lessons tp
set status = 'paid',
    notes = coalesce(tp.notes || ' | ', '') ||
      'Da tra ngoai he thong. Founder xac nhan 14/09/2026: luong tinh theo so buoi trong sheet feedback, da thanh toan xong truoc khi co he thong nay.'
from classes c
where c.id = tp.class_id
  and c.class_code in ('LUAN-SH','TAN-SH','TUYET-SH','NGAN-PH','HOANG-PH')
  and tp.status = 'pending';

-- BƯỚC 6. Tách lớp Hoàng & Huệ thành đúng hai học viên.
-- Theo mô hình nhóm Y Khoa: 260.000 đ là giá CẢ NHÓM, một người giữ hợp đồng
-- và chịu phí; người còn lại điểm danh với is_billable = false.
update students set full_name = 'Ms. Hoàng', nickname = 'Hoàng'
where full_name = 'Ms. Hoàng/Huê';

with hue as (
  insert into students (student_code, full_name, nickname, status, current_level_id,
                        learning_notes, needs_review, review_note)
  select 'HV0022', 'Ms. Huệ', 'Huệ', 'active', s.current_level_id,
         'Hoc chung lop nhom HOANG-PH voi Ms. Hoang. Tach ra tu ban ghi "Ms. Hoang/Hue" ngay 14/09/2026.',
         true,
         'Tach tu ban ghi gop. Theo sheet feedback, Hue bat dau tu buoi 21/05/2026 - ba buoi 05/05, 07/05 va 17/05 chi ghi "Ms Hoang".'
  from students s where s.full_name = 'Ms. Hoàng'
  returning id
),
gan as (
  insert into class_students (class_id, student_id, status)
  select c.id, hue.id, 'active' from classes c cross join hue where c.class_code = 'HOANG-PH'
  returning student_id, class_id
)
insert into attendance (lesson_id, student_id, status)
select l.id, gan.student_id, 'present'::attendance_status
from gan join lessons l on l.class_id = gan.class_id
where l.lesson_date >= DATE '2026-05-21';

update attendance a set is_billable = false
from students s where s.id = a.student_id and s.full_name = 'Ms. Huệ';

-- ĐỐI CHIẾU sau khi chạy (kết quả thật 14/09/2026)
--   Lớp        Buổi  Có giờ  Học phí phát sinh
--   TAN-SH      55     51     11.968.350
--   LUAN-SH     41     30      8.979.000
--   TUYET-SH    21     15      5.187.492
--   HOANG-PH    15      0      3.900.000   (Huệ 0 đ - không tính hai lần)
--   NGAN-PH     14     14      2.517.000
--
--   Lương: 110 dòng, 13.200.000 đ, tất cả 'paid'. Tất cả rate_source = 'class'
--   nên không có dòng nào thiếu đơn giá.
--
--   Học phí Tân/Tuyết lẻ vì có buổi 50/53/55/56 phút - quy đổi theo D15.
