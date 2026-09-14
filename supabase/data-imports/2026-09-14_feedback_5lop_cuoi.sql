-- Nhập 23 buổi của 5 lớp cuối từ SHEET FEEDBACK, và tạo mới học viên Công Duy.
-- Đã chạy trên cơ sở dữ liệu thật ngày 14/09/2026.
--
-- PHÁT HIỆN QUAN TRỌNG: sheet của Ms. Linh có ghi chú của chính trung tâm:
--   "Đã sửa tiêu đề Sheet từ 'Hằng' thành 'MS. LINH' để tránh nhầm học viên."
-- Bảng 22 buổi từ 18/3/2025 nằm trong sheet này (và trong cả sheet Kiên, Vy,
-- Nhi, Duy) là BẢNG CỦA MS. HẰNG bị sao chép lẫn sang. Đó là lý do trước đó
-- sheet Ms. Hằng trông như tự mâu thuẫn. Ms. Linh thật ra chỉ có 4 buổi.
-- Founder chốt: bỏ qua lớp Ms. Hằng.

-- BƯỚC 1. Công Duy - chưa có trong hệ thống.
-- Nguồn: dòng 21 sheet CLASS LIST + sheet feedback riêng "Duy ( Ms.Sheba)".
with hv as (
  insert into students (student_code, full_name, nickname, status, learning_notes, needs_review, review_note)
  values ('HV0023', 'Công Duy', 'Duy', 'active',
          'Level trong sheet: "A2+ ( Ielts 4.5+)". Lop 1 kem 2 theo sheet CLASS LIST.',
          true, 'Sheet ghi "Lop 1 kem 2" nhung chi co mot ten hoc vien. Neu co hoc vien thu hai, can bo sung.')
  returning id
),
lop as (
  insert into classes (class_code, name, teacher_id, class_type, max_students,
                       default_duration_minutes, status, needs_review, review_note)
  select 'DUY-SH', 'Công Duy - Ms. Sheba', t.id, 'one_to_one', 2, 60, 'active',
         true, 'Sheet ghi "Lop 1 kem 2" - can xac nhan hoc vien thu hai.'
  from teachers t where t.full_name = 'Ms. Sheba'
  returning id
),
gan as (
  insert into class_students (class_id, student_id, status)
  select lop.id, hv.id, 'active' from lop cross join hv
  returning class_id, student_id
),
hd as (
  insert into student_enrollments (enrollment_code, student_id, class_id, billing_mode,
                                   lessons_purchased, price_per_lesson, net_amount,
                                   start_date, status, needs_review, review_note)
  select 'HD260023', gan.student_id, gan.class_id, 'undetermined', null, 210000, null,
         DATE '2026-08-24', 'active', true,
         'CHUA CO BANG CHUNG THANH TOAN. Don gia 210.000 d lay tu sheet CLASS LIST. Sheet ghi "Goi 10 buoi" nhung chua co chung tu dong tien nao.'
  from gan
  returning id
)
insert into tuition_rates (enrollment_id, price_per_lesson, effective_from, evidence_note)
select hd.id, 210000, DATE '2026-08-24',
       'Cot "Hoc phi/60p" dong 21 sheet CLASS LIST (file CRM 10/9). Nhap 14/09/2026.'
from hd;

-- BƯỚC 2. Đơn giá lương theo LỚP (cột "Lương GV/60p" sheet CLASS LIST).
insert into teacher_rates (teacher_id, scope, class_id, rate_amount, effective_from, notes)
select t.id, 'class', c.id, 120000, x.tu_ngay,
       'Lay tu cot "Luong GV/60p" sheet CLASS LIST (file CRM 10/9). Nhap 14/09/2026.'
from (values
  ('LINH-PH','Ms. Phương', DATE '2026-07-28'),
  ('KIEN-SH','Ms. Sheba',  DATE '2026-08-03'),
  ('VY-SH',  'Ms. Sheba',  DATE '2026-08-04'),
  ('NHI-PH', 'Ms. Phương', DATE '2026-08-10'),
  ('DUY-SH', 'Ms. Sheba',  DATE '2026-08-24')
) as x(ma_lop, ten_gv, tu_ngay)
join classes c on c.class_code = x.ma_lop
join teachers t on t.full_name = x.ten_gv;

-- BƯỚC 3. Lùi hiệu lực học phí về buổi đầu tiên của từng lớp.
update tuition_rates tr
set effective_from = x.tu_ngay,
    evidence_note = coalesce(tr.evidence_note || ' | ', '') ||
      'Lui hieu luc ve ' || x.tu_ngay || ' ngay 14/09/2026 de nhap lich su tu sheet feedback.'
from (values
  ('LINH-PH', DATE '2026-07-28'),
  ('KIEN-SH', DATE '2026-08-03'),
  ('VY-SH',   DATE '2026-08-04'),
  ('NHI-PH',  DATE '2026-08-10')
) as x(ma_lop, tu_ngay)
join classes c on c.class_code = x.ma_lop
join student_enrollments e on e.class_id = c.id
where tr.enrollment_id = e.id and tr.effective_from > x.tu_ngay;

-- BƯỚC 4. Nhập buổi học + điểm danh. Cả 23 buổi đều có giờ dạy thật trong sheet.
with v(ngay, ma_lop, ten_gv, gio, phut) as (values
  (DATE '2026-07-28','LINH-PH','Ms. Phương', TIME '08:30', 60),
  (DATE '2026-08-03','LINH-PH','Ms. Phương', TIME '08:45', 60),
  (DATE '2026-08-11','LINH-PH','Ms. Phương', TIME '08:30', 60),
  (DATE '2026-08-20','LINH-PH','Ms. Phương', TIME '08:00', 60),
  (DATE '2026-08-03','KIEN-SH','Ms. Sheba', TIME '18:00', 60),
  (DATE '2026-08-17','KIEN-SH','Ms. Sheba', TIME '17:00', 60),
  (DATE '2026-08-04','VY-SH','Ms. Sheba', TIME '19:00', 60),
  (DATE '2026-08-11','VY-SH','Ms. Sheba', TIME '19:00', 60),
  (DATE '2026-08-13','VY-SH','Ms. Sheba', TIME '19:00', 60),
  (DATE '2026-08-16','VY-SH','Ms. Sheba', TIME '19:00', 60),
  (DATE '2026-08-18','VY-SH','Ms. Sheba', TIME '19:00', 60),
  (DATE '2026-08-23','VY-SH','Ms. Sheba', TIME '19:00', 60),
  (DATE '2026-08-25','VY-SH','Ms. Sheba', TIME '19:00', 60),
  (DATE '2026-08-27','VY-SH','Ms. Sheba', TIME '19:00', 60),
  (DATE '2026-08-10','NHI-PH','Ms. Phương', TIME '14:00', 60),
  (DATE '2026-08-12','NHI-PH','Ms. Phương', TIME '14:00', 60),
  (DATE '2026-08-14','NHI-PH','Ms. Phương', TIME '14:00', 60),
  (DATE '2026-08-17','NHI-PH','Ms. Phương', TIME '14:00', 60),
  (DATE '2026-08-19','NHI-PH','Ms. Phương', TIME '14:00', 60),
  (DATE '2026-08-21','NHI-PH','Ms. Phương', TIME '14:00', 60),
  (DATE '2026-08-24','DUY-SH','Ms. Sheba', TIME '07:00', 60),
  (DATE '2026-08-26','DUY-SH','Ms. Sheba', TIME '07:00', 60),
  (DATE '2026-08-28','DUY-SH','Ms. Sheba', TIME '07:00', 60)
),
lop as (select c.id as class_id, c.class_code from classes c
        where c.class_code in ('LINH-PH','KIEN-SH','VY-SH','NHI-PH','DUY-SH')),
gv as (select id, full_name from teachers),
moi as (
  insert into lessons (class_id, teacher_id, lesson_date, scheduled_start_at, scheduled_end_at,
                       actual_start_at, actual_end_at, duration_minutes, status, notes)
  select lop.class_id, gv.id, v.ngay,
         (v.ngay + v.gio) at time zone 'Asia/Ho_Chi_Minh',
         (v.ngay + v.gio) at time zone 'Asia/Ho_Chi_Minh' + (v.phut||' minutes')::interval,
         (v.ngay + v.gio) at time zone 'Asia/Ho_Chi_Minh',
         (v.ngay + v.gio) at time zone 'Asia/Ho_Chi_Minh' + (v.phut||' minutes')::interval,
         v.phut, 'scheduled'::lesson_status,
         'Nhap tu sheet feedback cua lop ngay 14/09/2026. Gio day lay dung tu sheet.'
  from v join lop on lop.class_code = v.ma_lop join gv on gv.full_name = v.ten_gv
  returning id, class_id
)
insert into attendance (lesson_id, student_id, status)
select moi.id, cs.student_id, 'present'::attendance_status
from moi join class_students cs on cs.class_id = moi.class_id;

-- BƯỚC 5. Buổi không thu phí.
-- GIẢ ĐỊNH, CẦN XÁC NHẬN: buổi 10/08/2026 của Nhi được sheet ghi rõ là
-- "Buổi làm quen", dùng tài liệu thiếu nhi không đúng trình độ, GV không giao
-- bài tập. Áp quy tắc Founder chốt cho lớp Toàn (test demo và buổi 1 không thu
-- phí). Nếu sai, chỉ cần đổi lại cờ này.
update attendance a set is_billable = false
from lessons l join classes c on c.id = l.class_id
where a.lesson_id = l.id and c.class_code = 'NHI-PH' and l.lesson_date = DATE '2026-08-10';

-- BƯỚC 6. Hoàn thành + đánh dấu lương đã trả.
update lessons l set status = 'completed'::lesson_status
from classes c
where c.id = l.class_id
  and c.class_code in ('LINH-PH','KIEN-SH','VY-SH','NHI-PH','DUY-SH')
  and l.status = 'scheduled';

update teacher_payable_lessons tp
set status = 'paid',
    notes = coalesce(tp.notes || ' | ', '') ||
      'Da tra ngoai he thong. Founder xac nhan 14/09/2026: luong tinh theo so buoi trong sheet feedback.'
from classes c
where c.id = tp.class_id
  and c.class_code in ('LINH-PH','KIEN-SH','VY-SH','NHI-PH','DUY-SH')
  and tp.status = 'pending';

-- ĐỐI CHIẾU sau khi chạy (kết quả thật 14/09/2026)
--   Lớp        Buổi  Tính phí  Học phí      Lương
--   VY-SH        8      8      2.240.000    960.000
--   NHI-PH       6      5      1.250.000    720.000
--   LINH-PH      4      4        876.000    480.000
--   DUY-SH       3      3        630.000    360.000
--   KIEN-SH      2      2        600.000    240.000
--
-- Toàn hệ thống: 390 buổi; 133 dòng lương, 15.960.000 đ, TẤT CẢ 'paid',
-- không dòng nào thiếu đơn giá.
--
-- KHÔNG NHẬP:
--   - Dòng 08/09/2026 của lớp Vy: không có giáo viên, không có giờ, chỉ có
--     link Zoom Clip. Chưa đủ căn cứ.
--   - Lớp Ms. Hằng: Founder chốt bỏ qua.
--   - Ba học viên C Khang, Khôi, Uyên: Founder chốt không nhập.
