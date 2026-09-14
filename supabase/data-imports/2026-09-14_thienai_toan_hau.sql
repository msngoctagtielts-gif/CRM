-- Nhập lịch sử buổi học của Thiên Ái (26), Toàn (26) và Hậu (14).
-- Đã chạy trên cơ sở dữ liệu thật ngày 14/09/2026.
--
-- Nguồn:
--   Thiên Ái - "Báo cáo học phí & tình hình học tập - Thiên Ái", cập nhật 14/07/2026
--   Toàn     - "Thay đổi của Toàn" (10/06-03/07/2026)
--            + "Báo cáo học tập và số buổi Toàn sau 03-07-2026", lập 08/09/2026
--   Hậu      - "Hành Trình Thay Đổi - Hậu T6" (17/05-04/07/2026)
--
-- Xem DECISIONS.md mục D16 để biết các giả định còn phải xác nhận.

-- ===========================================================================
-- BƯỚC 0a. Ba giáo viên chỉ xuất hiện trong báo cáo Thiên Ái, chưa có trong
-- hệ thống. Đánh dấu needs_review vì mới chỉ có TÊN GỌI, chưa có họ tên đầy
-- đủ, liên hệ hay đơn giá.
-- ===========================================================================
insert into teachers (teacher_code, full_name, status, notes, needs_review, review_note)
values
 ('ANDY',   'Mr. Andy',   'archived', 'Ghi nhan tu bao cao Thien Ai (buoi placement 31/05/2025). Khong con day tai trung tam.', true, 'Chi co ten trong bao cao PDF - chua co ho ten day du, lien he, don gia.'),
 ('MARBIN', 'Mr. Marbin', 'archived', 'Ghi nhan tu bao cao Thien Ai (3 buoi 06-15/06/2025). Khong con day tai trung tam.', true, 'Chi co ten trong bao cao PDF - chua co ho ten day du, lien he, don gia.'),
 ('JAI',    'Ms. Jai',    'archived', 'Ghi nhan tu bao cao Thien Ai (2 buoi 27/06 va 30/06/2025, khong thu phi). Khong con day tai trung tam.', true, 'Chi co ten trong bao cao PDF - chua co ho ten day du, lien he, don gia.')
on conflict do nothing;

-- ===========================================================================
-- BƯỚC 0b. Lùi ngày hiệu lực đơn giá về ngày buổi học đầu tiên.
-- Đơn giá đang ghi hiệu lực từ 01/09/2026, trong khi lịch sử học bắt đầu từ
-- 31/05/2025. fn_resolve_tuition_rate sẽ không tìm thấy đơn giá và ghi nhận
-- doanh thu = 0. Lùi chính dòng hiện có thay vì thêm dòng mới, vì không có
-- bằng chứng nào cho thấy đơn giá đã từng đổi.
-- ===========================================================================
update tuition_rates tr
set effective_from = x.tu_ngay,
    evidence_note = coalesce(tr.evidence_note || ' | ', '') ||
      'Lui hieu luc ve ' || x.tu_ngay || ' ngay 14/09/2026 de nhap lich su buoi hoc.'
from (values
  ('Thiên Ái', DATE '2025-05-31'),
  ('Toàn',     DATE '2026-06-10'),
  ('Hậu',      DATE '2026-05-17')
) as x(ten, tu_ngay)
join student_enrollments e on true
join students s on s.id = e.student_id and s.full_name = x.ten
where tr.enrollment_id = e.id;

-- ===========================================================================
-- BƯỚC 0c. Mở lại ba hợp đồng đang 'paused'.
-- fn_pick_enrollment chỉ chọn hợp đồng 'active'; để 'paused' thì buổi nhập vào
-- KHÔNG sinh dòng doanh thu nào. Cả ba hợp đồng đều chưa chốt.
-- ===========================================================================
update student_enrollments e
set status = 'active'
from students s
where s.id = e.student_id
  and s.full_name in ('Thiên Ái','Toàn','Hậu')
  and e.status = 'paused';

-- ===========================================================================
-- BƯỚC 1. Nhập buổi học ở trạng thái 'scheduled' + điểm danh 'present'.
-- Giờ 19:00 chỉ để xếp thứ tự - báo cáo không ghi giờ dạy thực tế.
-- ===========================================================================

-- Thiên Ái (lớp THIENAI-KO). Giáo viên thay đổi theo từng buổi.
with v(ngay, gv) as (values
  (DATE '2025-05-31','Mr. Andy'),   (DATE '2025-06-06','Mr. Marbin'),
  (DATE '2025-06-08','Mr. Marbin'), (DATE '2025-06-15','Mr. Marbin'),
  (DATE '2025-06-27','Ms. Jai'),    (DATE '2025-06-30','Ms. Jai'),
  (DATE '2025-07-12','Mr. Kobe'),   (DATE '2025-07-27','Mr. Kobe'),
  (DATE '2025-08-03','Mr. Kobe'),   (DATE '2025-09-09','Mr. Kobe'),
  (DATE '2025-09-16','Mr. Kobe'),   (DATE '2025-09-23','Mr. Kobe'),
  (DATE '2025-10-01','Mr. Kobe'),   (DATE '2025-10-08','Mr. Kobe'),
  (DATE '2025-10-15','Mr. Kobe'),   (DATE '2025-10-29','Mr. Kobe'),
  (DATE '2025-11-05','Mr. Kobe'),   (DATE '2025-11-12','Mr. Kobe'),
  (DATE '2025-11-19','Mr. Kobe'),   (DATE '2026-01-14','Mr. Kobe'),
  (DATE '2026-01-21','Mr. Kobe'),   (DATE '2026-03-04','Mr. Kobe'),
  (DATE '2026-03-11','Mr. Kobe'),   (DATE '2026-03-18','Mr. Kobe'),
  (DATE '2026-05-13','Mr. Kobe'),   (DATE '2026-05-27','Mr. Kobe')
),
lop as (select c.id as class_id, cs.student_id from classes c
        join class_students cs on cs.class_id = c.id where c.class_code = 'THIENAI-KO'),
moi as (
  insert into lessons (class_id, teacher_id, lesson_date, scheduled_start_at, scheduled_end_at,
                       duration_minutes, status, notes)
  select lop.class_id, t.id, v.ngay,
         (v.ngay + TIME '19:00') at time zone 'Asia/Ho_Chi_Minh',
         (v.ngay + TIME '19:00') at time zone 'Asia/Ho_Chi_Minh' + interval '60 minutes',
         60, 'scheduled'::lesson_status,
         'Nhap tu bao cao PDF Thien Ai cap nhat 14/07/2026, nhap ngay 14/09/2026. Bao cao chi ghi NGAY va ten GV, khong ghi gio day va thoi luong.'
  from v cross join lop join teachers t on t.full_name = v.gv
  returning id
)
insert into attendance (lesson_id, student_id, status)
select moi.id, lop.student_id, 'present'::attendance_status from moi cross join lop;

-- Toàn (TOAN-NH) và Hậu (HAU-NH), cùng giáo viên Ms. Nhi.
with v(ngay, ma_lop, phut) as (values
  -- Toàn kỳ 1: 10/06 - 03/07/2026 (buổi đầu 30 phút là kiểm tra đầu vào)
  (DATE '2026-06-10','TOAN-NH',30), (DATE '2026-06-15','TOAN-NH',60),
  (DATE '2026-06-17','TOAN-NH',60), (DATE '2026-06-19','TOAN-NH',60),
  (DATE '2026-06-22','TOAN-NH',60), (DATE '2026-06-24','TOAN-NH',60),
  (DATE '2026-06-26','TOAN-NH',60), (DATE '2026-06-30','TOAN-NH',60),
  (DATE '2026-07-01','TOAN-NH',60), (DATE '2026-07-03','TOAN-NH',60),
  -- Toàn kỳ 2: 07/07 - 29/08/2026
  (DATE '2026-07-07','TOAN-NH',60), (DATE '2026-07-08','TOAN-NH',60),
  (DATE '2026-07-10','TOAN-NH',60), (DATE '2026-07-14','TOAN-NH',60),
  (DATE '2026-07-16','TOAN-NH',60), (DATE '2026-07-19','TOAN-NH',60),
  (DATE '2026-07-21','TOAN-NH',60), (DATE '2026-07-23','TOAN-NH',60),
  (DATE '2026-07-25','TOAN-NH',60), (DATE '2026-07-30','TOAN-NH',60),
  (DATE '2026-07-31','TOAN-NH',60), (DATE '2026-08-01','TOAN-NH',60),
  (DATE '2026-08-06','TOAN-NH',60), (DATE '2026-08-08','TOAN-NH',60),
  (DATE '2026-08-25','TOAN-NH',60), (DATE '2026-08-29','TOAN-NH',60),
  -- Hậu: 17/05 - 04/07/2026 (bốn buổi đầu không thu phí)
  (DATE '2026-05-17','HAU-NH',30),  (DATE '2026-05-20','HAU-NH',60),
  (DATE '2026-05-22','HAU-NH',60),  (DATE '2026-05-27','HAU-NH',60),
  (DATE '2026-05-29','HAU-NH',60),  (DATE '2026-06-03','HAU-NH',60),
  (DATE '2026-06-05','HAU-NH',60),  (DATE '2026-06-10','HAU-NH',60),
  (DATE '2026-06-12','HAU-NH',60),  (DATE '2026-06-17','HAU-NH',60),
  (DATE '2026-06-19','HAU-NH',60),  (DATE '2026-06-24','HAU-NH',60),
  (DATE '2026-06-26','HAU-NH',60),  (DATE '2026-07-04','HAU-NH',60)
),
lop as (select c.id as class_id, c.class_code, c.teacher_id, cs.student_id
        from classes c join class_students cs on cs.class_id = c.id
        where c.class_code in ('TOAN-NH','HAU-NH')),
moi as (
  insert into lessons (class_id, teacher_id, lesson_date, scheduled_start_at, scheduled_end_at,
                       duration_minutes, status, notes)
  select lop.class_id, lop.teacher_id, v.ngay,
         (v.ngay + TIME '19:00') at time zone 'Asia/Ho_Chi_Minh',
         (v.ngay + TIME '19:00') at time zone 'Asia/Ho_Chi_Minh' + (v.phut||' minutes')::interval,
         v.phut, 'scheduled'::lesson_status,
         'Nhap tu bao cao PDF cua Ms. Nhi, nhap ngay 14/09/2026. Bao cao ghi NGAY va THOI LUONG, khong ghi gio day thuc te.'
  from v join lop on lop.class_code = v.ma_lop
  returning id, class_id
)
insert into attendance (lesson_id, student_id, status)
select moi.id, lop.student_id, 'present'::attendance_status
from moi join lop on lop.class_id = moi.class_id;

-- ===========================================================================
-- BƯỚC 2. Đánh dấu buổi KHÔNG thu phí.
-- Phải làm SAU khi insert: trigger tg_attendance_defaults ghi đè is_billable
-- lúc INSERT theo trạng thái điểm danh.
--
-- Thiên Ái : kiểm tra đầu vào, demo học thử, 2 buổi cô Jai (mục 3 của báo cáo)
-- Toàn     : buổi kiểm tra đầu vào 30 phút - GIẢ ĐỊNH, xem D16 giả định số 1
-- Hậu      : 4 buổi trước mốc 29/05 (báo cáo ghi rõ "Không tính kinh phí")
-- ===========================================================================
update attendance a
set is_billable = false
from lessons l join classes c on c.id = l.class_id
where a.lesson_id = l.id
  and (
    (c.class_code = 'THIENAI-KO' and l.lesson_date in (DATE '2025-05-31', DATE '2025-06-06', DATE '2025-06-27', DATE '2025-06-30'))
 or (c.class_code = 'TOAN-NH'    and l.lesson_date =  DATE '2026-06-10')
 or (c.class_code = 'HAU-NH'     and l.lesson_date in (DATE '2026-05-17', DATE '2026-05-20', DATE '2026-05-22', DATE '2026-05-27'))
  );

-- ===========================================================================
-- BƯỚC 3. Chuyển sang hoàn thành. Doanh thu sinh ra ở đúng bước này.
-- ===========================================================================
update lessons l set status = 'completed'::lesson_status
from classes c
where c.id = l.class_id
  and c.class_code in ('THIENAI-KO','TOAN-NH','HAU-NH')
  and l.status = 'scheduled';

-- ===========================================================================
-- BƯỚC 4. Thanh toán.
-- Hậu KHÔNG có dòng nào - chưa có chứng từ. Không ghi nhận tiền chưa có bằng chứng.
-- ===========================================================================
with hv as (
  select s.full_name, s.id as student_id, e.id as enrollment_id
  from students s join student_enrollments e on e.student_id = s.id
  where s.full_name in ('Thiên Ái','Toàn')
),
v(ten, ma, ngay, so_tien, phuong_thuc, tham_chieu, ghi_chu, ly_do_xem_lai) as (values
  ('Thiên Ái','TT26090024', DATE '2025-06-09', 2800000, 'bank_transfer', 'THIENAI-DOT1-20250609',
   'Dot 1 - 2.800.000 d cho 10 buoi. Nguon: bao cao PDF Thien Ai muc 2: 09/06/2025 - 15:51.',
   'Chua co anh chuyen khoan hay ma giao dich ngan hang.'),
  ('Thiên Ái','TT26090025', DATE '2025-11-21', 2800000, 'bank_transfer', 'THIENAI-DOT2-20251121',
   'Dot 2 - 2.800.000 d cho 10 buoi. Nguon: bao cao PDF Thien Ai muc 2: 21/11/2025.',
   'Chua co anh chuyen khoan hay ma giao dich ngan hang.'),
  ('Thiên Ái','TT26090026', DATE '2026-07-14',  280000, 'other',         'THIENAI-CANTRU-DANG',
   'KHONG PHAI TIEN MAT - khoan CAN TRU 1 buoi cua hoc vien Dang cong sang cho Thien Ai (muc 3 bao cao PDF). Ghi thanh mot dong thu de so du ra dung 280.000 d con thieu.',
   'Bao cao khong ghi ngay can tru va khong ghi ro hoc vien Dang la ai.'),
  ('Toàn','TT26090027', DATE '2026-06-14', 2500000, 'bank_transfer', 'TOAN-DOT1-20260614',
   'Dot 1 - nguoi chuyen: Dang Thai Chung. Doi chieu: bao cao lap 08/09/2026 muc 5 ghi "Da ghi nhan 2 dot dong: 14/06/2026 va 11/07/2026".',
   '2.500.000 / 249.000 = 10,04 buoi - khong tron. Can xac nhan don gia that.'),
  ('Toàn','TT26090028', DATE '2026-07-11', 2500000, 'bank_transfer', 'TOAN-DOT2-20260711',
   'Dot 2 - nguoi chuyen: Dang Thai Chung. Doi chieu: bao cao lap 08/09/2026 muc 5.',
   '2.500.000 / 249.000 = 10,04 buoi - khong tron. Can xac nhan don gia that.')
)
insert into payments (payment_code, student_id, enrollment_id, amount, payment_date, method,
                      reference, notes, status, needs_review, review_note)
select v.ma, hv.student_id, hv.enrollment_id, v.so_tien, v.ngay, v.phuong_thuc::payment_method,
       v.tham_chieu, v.ghi_chu, 'confirmed'::payment_status, true, v.ly_do_xem_lai
from v join hv on hv.full_name = v.ten;

-- ===========================================================================
-- BƯỚC 5. Số buổi đã mua. net_amount là cột thường (không tự tính như
-- gross_amount) nên phải cập nhật tay, nếu không outstanding_amount sẽ sai.
-- ===========================================================================
update student_enrollments e
set lessons_purchased = x.so_buoi, start_date = x.ngay_bat_dau,
    needs_review = true, review_note = x.ly_do, payer_note = x.nguoi_dong
from (values
  ('Thiên Ái', 21::numeric, DATE '2025-05-31',
   'Nguyen Thi Ngoc Nhu (doi soat chuyen khoan 16/07/2026, 2.800.000 d)',
   '21 buoi = 20 buoi da tra tien + 1 buoi can tru cua hoc vien Dang.'),
  ('Toàn', 20::numeric, DATE '2026-06-10',
   'Dang Thai Chung (2 lan chuyen 14/06/2026 va 11/07/2026, moi lan 2.500.000 d)',
   'CAN CO XAC NHAN. 20 buoi la SUY RA tu 2 dot x 2.500.000 d, theo tien le trung tam ghi 2.500.000 d = 10 buoi (TT26090001).')
) as x(ten, so_buoi, ngay_bat_dau, nguoi_dong, ly_do)
join students s on s.full_name = x.ten
where e.student_id = s.id;

-- Hậu: chưa có chứng từ thanh toán nào. Chuyển sang 'undetermined' và xoá con
-- số "10 buổi đã mua" đang lưu - không có chứng từ thì không ghi nhận tiền.
update student_enrollments e
set billing_mode = 'undetermined'::billing_mode,
    lessons_purchased = null, net_amount = null, start_date = DATE '2026-05-17',
    needs_review = true,
    review_note = 'CHUA CO BANG CHUNG THANH TOAN. Bao cao Hau chi chot SO BUOI, ghi ro "chua bao gom don gia hoac tong tien thanh toan".',
    payer_note = 'Chua ro nguoi dong - chua co anh chuyen khoan nao'
from students s
where s.id = e.student_id and s.full_name = 'Hậu';

update student_enrollments e
set net_amount = e.gross_amount - coalesce(e.discount_amount, 0)
from students s
where s.id = e.student_id and s.full_name in ('Thiên Ái','Toàn');

-- ===========================================================================
-- ĐỐI CHIẾU sau khi chạy (kết quả thật ngày 14/09/2026)
--
--   Học viên   Tổng buổi  Tính phí  Học phí        Đã đóng      Số dư
--   Thiên Ái      26         22     6.160.000     5.880.000    -280.000
--   Toàn          26         25     6.225.000     5.000.000  -1.225.000
--   Hậu           14         10     2.490.000             0  -2.490.000
--
-- Thiên Ái -280.000 khớp đúng kết luận của báo cáo PDF ("còn thiếu 1 buổi,
-- tương ứng 280.000đ").
--
-- teacher_payable_lessons: 0 dòng cho cả ba lớp - không sinh lương, đúng ý đồ.
-- ===========================================================================

-- ===========================================================================
-- BƯỚC 6. Mở lại trạng thái học viên và lớp.
-- Cả ba đang 'paused' nên không hiện trên danh sách học viên đang học, trong
-- khi cả ba đều còn công nợ chưa chốt. Buổi học cuối: Toàn 29/08/2026,
-- Hậu 04/07/2026, Thiên Ái 27/05/2026.
-- Nếu có người thật sự đã nghỉ, cô Ngọc chuyển lại 'paused' trên giao diện.
-- ===========================================================================
update students set status = 'active'
where full_name in ('Thiên Ái','Toàn','Hậu') and status = 'paused';

update classes set status = 'active'
where class_code in ('THIENAI-KO','TOAN-NH','HAU-NH') and status = 'paused';
