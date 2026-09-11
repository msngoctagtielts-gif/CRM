-- =============================================================================
-- Nhập 21 dòng lớp từ sheet "CRM ( 10/9)" của Ms.Ngọc Elite English.
--
-- Nguồn: scripts/migration/danh_sach_lop_2026-09-10.tsv
-- Căn cứ nghiệp vụ: DECISIONS.md (D1, D8, D10–D14)
--
-- Nguyên tắc D8: NHẬP NGUYÊN TRẠNG, không tự đoán. Dòng nào có dữ liệu nghi vấn
-- thì bật cờ needs_review kèm review_note ghi nguyên văn giá trị gốc, để Founder
-- mở trang /review đối soát. Hệ thống KHÔNG tự bịa lịch học, giờ kết thúc hay
-- đơn giá.
--
-- Chạy một lần. Có chốt chặn ở đầu để lần hai không nhập trùng.
-- =============================================================================

begin;

-- Chốt chặn: đã có học viên thì dừng, tránh nhập trùng khi chạy lại.
do $$ begin
  if (select count(*) from public.students) > 0 then
    raise exception 'Đã có % học viên trong hệ thống — script này chỉ chạy một lần trên CSDL trống.',
      (select count(*) from public.students);
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Giáo viên
-- Đơn giá mặc định theo buổi 60 phút. Ms. Phương có hai lớp đơn giá khác
-- (HOANG-PH 140.000, KHOA-PH 160.000) nên phần đó gắn theo LỚP ở mục 5.
-- -----------------------------------------------------------------------------
insert into public.teachers (full_name, display_name, status) values
  ('Ms. Rose',   'Rose',   'active'),
  ('Ms. Phương', 'Phương', 'active'),
  ('Ms. Sheba',  'Sheba',  'active'),
  ('Mr. Kobe',   'Kobe',   'active'),
  ('Ms. Hòa',    'Hòa',    'active'),
  ('Ms. Nhi',    'Nhi',    'active');

insert into public.teacher_rates (teacher_id, scope, duration_minutes, rate_amount, notes)
select t.id, 'duration', 60, v.rate,
       'Nhập từ cột luong_gv_60p của sheet CRM (10/9)'
  from (values
    ('Ms. Rose',   120000), ('Ms. Phương', 120000), ('Ms. Sheba', 120000),
    ('Mr. Kobe',   150000), ('Ms. Hòa',    120000), ('Ms. Nhi',   120000)
  ) as v(name, rate)
  join public.teachers t on t.full_name = v.name;

-- -----------------------------------------------------------------------------
-- 2. Học viên
-- Lớp nhóm Y Khoa tách thành 3 học viên riêng (D13). Level trong sheet mịn hơn
-- bậc CEFR của hệ thống (Pre A2, A1+, A2+, B1+) nên giữ nguyên văn trong
-- learning_notes thay vì làm tròn rồi mất thông tin.
-- -----------------------------------------------------------------------------
insert into public.students (full_name, nickname, current_level_id, status, learning_notes, needs_review, review_note)
select v.full_name, v.nickname,
       (select id from public.levels where code = v.level_code),
       v.status::student_status, v.notes, v.review, v.review_note
  from (values
    ('Vũ Hoàng Ngọc Diệp', 'Diệp',  'A1',     'active', 'Level trong sheet: "Pre A2"', false, null),
    ('Vũ Hoàng Phúc',      'Phúc',  'A1',     'active', 'Level trong sheet: "Pre A2"', false, null),
    ('Bùi Thành Luân',     'Luân',  'A1',     'active', 'Level trong sheet: "A1+"',    false, null),
    ('Bùi Thiên Tân',      'Tân',   'A1',     'active', 'Level trong sheet: "A1"',     false, null),
    ('Bé Ngân',            'Ngân',  'PRE_A1', 'active', 'Level trong sheet: "pre A1"', false, null),
    ('Ms. Tuyết',          'Tuyết', 'A1',     'active', 'Level trong sheet: "A1+"',    false, null),
    ('Ms. Hoàng/Huê',      'Hoàng', 'PRE_A1', 'active', 'Level trong sheet: "preA1"',  true,
      'Ô học viên trong sheet ghi "Ms. Hoàng/Huê" — là một người hay hai người? Cần Founder xác nhận tên đúng.'),
    ('Ms. Min',            'Min',   'A1',     'active', 'Level trong sheet: "A1+". Thuộc lớp nhóm Y Khoa.', false, null),
    ('Mr. Max',            'Max',   'A1',     'active', 'Level trong sheet: "A1+". Thuộc lớp nhóm Y Khoa.', false, null),
    ('Mr. John',           'John',  'A1',     'active', 'Level trong sheet: "A1+". Thuộc lớp nhóm Y Khoa.', false, null),
    ('Thiên Ái',           'Ái',    'C2',     'paused', 'Level trong sheet: "C2/ IELTS 7.0-7.5". Mục tiêu IELTS 7.0–7.5', false, null),
    ('Bảo Ngọc',           'Ngọc',  'B1',     'active', 'Level trong sheet: "B1+"',    false, null),
    ('Thảo',               'Thảo',  'PRE_A1', 'active', 'Level trong sheet: "A0"',     false, null),
    ('Hậu',                'Hậu',   'A1',     'paused', 'Level trong sheet: "A1+"',    false, null),
    ('Toàn',               'Toàn',  'A1',     'paused', 'Level trong sheet: "A1+"',    false, null),
    ('Ms. Hằng',           'Hằng',  'PRE_A1', 'active', 'Level trong sheet: "A0"',     false, null),
    ('Ms. Linh',           'Linh',  'PRE_A1', 'active', 'Level trong sheet: "a0"',     false, null),
    ('Kiên',               'Kiên',  'A2',     'active', 'Level trong sheet: "a2+ ( Ielts 4.5+)". Mục tiêu IELTS 4.5+', false, null),
    ('Vy',                 'Vy',    'A1',     'active', 'Level trong sheet: "PreA2"',  false, null),
    ('Nhi',                'Nhi',   'PRE_A1', 'active', 'Level trong sheet: "PreA1"',  false, null)
  ) as v(full_name, nickname, level_code, status, notes, review, review_note);

-- Người đóng học phí lớp Y Khoa — KHÔNG phải học viên của lớp (D14).
insert into public.parents (full_name, notes)
values ('Hoàng Uyên', 'Vợ anh Max. Người đứng tên đóng học phí lớp nhóm Y Khoa (D14).');

insert into public.student_parents (student_id, parent_id, relationship, is_primary)
select s.id, p.id, 'spouse', true
  from public.students s, public.parents p
 where s.full_name = 'Mr. Max' and p.full_name = 'Hoàng Uyên';

-- -----------------------------------------------------------------------------
-- 3. Lớp học
-- class_code giữ đúng mã trong sheet để đối chiếu được với sheet feedback.
-- THIENAI-KO xuất hiện hai dòng (11 và 21) trong sheet ⇒ một lớp, trạng thái
-- tạm ngưng theo D12.
-- -----------------------------------------------------------------------------
insert into public.classes
  (class_code, name, teacher_id, program_id, level_id, class_type, max_students,
   default_duration_minutes, status, notes, needs_review, review_note)
select v.code, v.name,
       (select id from public.teachers where full_name = v.teacher),
       (select id from public.programs where code = v.program),
       (select id from public.levels   where code = v.level),
       v.ctype::class_type, v.max_st, 60, v.status::class_status,
       v.notes, v.review, v.review_note
  from (values
    ('DIEP-RO','Diệp - Ms. Rose','Ms. Rose',null,'A1','one_to_one',1,'active',
     'Sheet feedback: 1D_viWN8ejQscWqqKhBKsSQ5WVh6iwjQnLVrIOHMHqvs',false,null),
    ('DIEP-PH','Diệp - Ms. Phương','Ms. Phương',null,'A1','one_to_one',1,'active',
     'Sheet feedback: 16IrMAEBzxpm0BF6rH6bC8eaoneQppxkvDvnBWboCqL4',false,null),
    ('PHUC-PH','Phúc - Ms. Phương','Ms. Phương',null,'A1','one_to_one',1,'active',
     'Sheet feedback: 1cstXjTYOyzC7PEGrM0JkzcNm141npKPZf1ISAOunu_4',true,
     'Lịch trong sheet là "CN 10h15" — thiếu giờ kết thúc. Đã tạm ghi 60 phút theo thời lượng chuẩn; cần Founder xác nhận.'),
    ('PHUC-SH','Phúc - Ms. Sheba','Ms. Sheba',null,'A1','one_to_one',1,'active',
     'Sheet feedback: 1jOwjvGaoshcFZSjc_qei3NxPX4_xRHvtb6h9HKyfW3U',false,null),
    ('LUAN-SH','Luân - Ms. Sheba','Ms. Sheba',null,'A1','one_to_one',1,'active',
     'Sheet feedback: 1fTN9ollo09fFZH-1PxQDIUWiHSdxRILRU-53edZaEfg',false,null),
    ('TAN-SH','Tân - Ms. Sheba','Ms. Sheba',null,'A1','one_to_one',1,'active',
     'Sheet feedback: 1Z-z-tFvwB7Utsygy2-VPueEli0E8wO44HOV10kOJrPw',true,
     'Lịch Chủ nhật trong sheet là "4:30-5:30" — không rõ sáng hay chiều. Đã tạm ghi 16:30 vì 4:30 sáng là vô lý; cần Founder xác nhận.'),
    ('NGAN-PH','Bé Ngân - Ms. Phương','Ms. Phương',null,'PRE_A1','one_to_one',1,'active',
     'Sheet feedback: 1vnDK1zEjEOSzOkvivEqfDIOlyLDy9aORWdzKS4JI6SA',false,null),
    ('TUYET-SH','Ms. Tuyết - Ms. Sheba','Ms. Sheba',null,'A1','one_to_one',1,'active',
     'Sheet feedback: 1wWrg0RZ_5ePMrGv75rGMsq22uTn6ZUuQwHaR0PlNalM',false,null),
    ('HOANG-PH','Ms. Hoàng/Huê - Ms. Phương','Ms. Phương',null,'PRE_A1','one_to_one',1,'active',
     'Sheet feedback: 1831L9EfYYnkurQjnVtrQs2coE1C4G3Ug70XuVPacp7s',false,null),
    ('KHOA-PH','Y Khoa - nhóm 3 người','Ms. Phương',null,'A1','small_group',3,'active',
     'Sheet feedback: 1TPRVM876uxpyP2oaXjfL-1XD4oi404bJa2DG50rIJPY. Công thức học phí trong sheet: 360000*buổi-150000',false,null),
    ('THIENAI-KO','Thiên Ái - Mr. Kobe','Mr. Kobe','IELTS','C2','one_to_one',1,'paused',
     'Sheet feedback: 14WpbvNf33AkpOEWPGZiPucXEvqDcWsxg6vIkqleCVi8. Xuất hiện 2 dòng trong sheet (11 và 21).',true,
     'Ô lịch học trong sheet là "—" (trống). Cần Founder điền lịch khi lớp học lại. Trạng thái tạm ngưng theo D12.'),
    ('NGOC-HO','Bảo Ngọc - Ms. Hòa','Ms. Hòa',null,'B1','one_to_one',1,'active',
     'Sheet feedback: 1-H564mEiqGFdYYanNCNyQBP5BAegOi1jf3hpAK04vdM',true,
     'Hai việc cần xác nhận: (1) lịch "T3, T5, T7 6pm" thiếu giờ kết thúc, đã tạm ghi 60 phút; (2) hình thức đóng trong sheet là "Chưa xác định".'),
    ('THAO-PH','Thảo - Ms. Phương','Ms. Phương',null,'PRE_A1','one_to_one',1,'active',
     'Sheet feedback: 1LFQ2FdsxQlWrCwnrf54gbOyvqbs2F5xY74Qf7hOkf6I',true,
     'Đơn giá lệch: sheet CRM ghi 249.000 ₫ nhưng bảng giá Founder chốt 250.000 ₫ (D10). Đã nhập 250.000 ₫ theo bảng giá.'),
    ('HAU-NH','Hậu - Ms. Nhi','Ms. Nhi',null,'A1','one_to_one',1,'paused',
     'Sheet feedback: 11WjysJFdz-h3JH3bifJxbXxE_93Hc9cAAXFSAwyygws',false,null),
    ('TOAN-NH','Toàn - Ms. Nhi','Ms. Nhi',null,'A1','one_to_one',1,'paused',
     'Sheet feedback: 1xAXxz3ET55LE1YZSc0QyMUncpXuOFSZG4-f2PeykPCU',false,null),
    ('HANG-PH','Ms. Hằng - Ms. Phương','Ms. Phương',null,'PRE_A1','one_to_one',1,'active',
     'Sheet feedback: 1KCp-KC_K_EAvDy3mZRO7su17CQMoP0CHD8b0UnCR9Rc',true,
     'Lịch "T3, T5, T6 2pm" thiếu giờ kết thúc. Đã tạm ghi 60 phút; cần Founder xác nhận.'),
    ('LINH-PH','Ms. Linh - Ms. Phương','Ms. Phương',null,'PRE_A1','one_to_one',1,'active',
     'Sheet feedback: 1XFgIYnBkf-zhnn89Xa3z7j77Oht5bXRBRPjqAajfVNQ',true,
     'Ô lịch học trong sheet TRỐNG. Cần Founder điền lịch — chưa có lịch thì hệ thống không sinh được buổi học.'),
    ('KIEN-SH','Kiên - Ms. Sheba','Ms. Sheba','IELTS','A2','one_to_one',1,'active',
     'Sheet feedback: 1C1pKREpHpWAIdUG96y3l77rwz386FHkAZoDMd58BltU',true,
     'Ô lịch học trong sheet TRỐNG. Cần Founder điền lịch.'),
    ('VY-SH','Vy - Ms. Sheba','Ms. Sheba',null,'A1','one_to_one',1,'active',
     'Sheet feedback: 1WjhA4jU4bRobmjvRgJpKj7FPrlMF6HJfT1mKurs09ks',true,
     'Ô lịch học trong sheet TRỐNG. Cần Founder điền lịch.'),
    ('NHI-PH','Nhi - Ms. Phương','Ms. Phương',null,'PRE_A1','one_to_one',1,'active',
     'Sheet feedback: 1SI2tzjAXqJ_QYO2dXNJEdNiT_zVqjW1WTvpW-hqw7OQ',true,
     'Ô lịch học trong sheet TRỐNG. Cần Founder điền lịch.')
  ) as v(code, name, teacher, program, level, ctype, max_st, status, notes, review, review_note);

-- -----------------------------------------------------------------------------
-- 4. Gắn học viên vào lớp
-- -----------------------------------------------------------------------------
insert into public.class_students (class_id, student_id, status)
select c.id, s.id, 'active'
  from (values
    ('DIEP-RO','Vũ Hoàng Ngọc Diệp'), ('DIEP-PH','Vũ Hoàng Ngọc Diệp'),
    ('PHUC-PH','Vũ Hoàng Phúc'),      ('PHUC-SH','Vũ Hoàng Phúc'),
    ('LUAN-SH','Bùi Thành Luân'),     ('TAN-SH','Bùi Thiên Tân'),
    ('NGAN-PH','Bé Ngân'),            ('TUYET-SH','Ms. Tuyết'),
    ('HOANG-PH','Ms. Hoàng/Huê'),
    ('KHOA-PH','Ms. Min'), ('KHOA-PH','Mr. Max'), ('KHOA-PH','Mr. John'),
    ('THIENAI-KO','Thiên Ái'),        ('NGOC-HO','Bảo Ngọc'),
    ('THAO-PH','Thảo'),               ('HAU-NH','Hậu'),
    ('TOAN-NH','Toàn'),               ('HANG-PH','Ms. Hằng'),
    ('LINH-PH','Ms. Linh'),           ('KIEN-SH','Kiên'),
    ('VY-SH','Vy'),                   ('NHI-PH','Nhi')
  ) as v(code, student)
  join public.classes  c on c.class_code = v.code
  join public.students s on s.full_name  = v.student;

-- -----------------------------------------------------------------------------
-- 5. Đơn giá lương gắn theo lớp — hai lớp Ms. Phương có đơn giá riêng
-- -----------------------------------------------------------------------------
insert into public.teacher_rates (teacher_id, scope, class_id, rate_amount, notes)
select c.teacher_id, 'class', c.id, v.rate,
       'Đơn giá riêng của lớp này theo cột luong_gv_60p trong sheet CRM (10/9)'
  from (values ('HOANG-PH', 140000), ('KHOA-PH', 160000)) as v(code, rate)
  join public.classes c on c.class_code = v.code;

-- -----------------------------------------------------------------------------
-- 6. Lịch học định kỳ
-- weekday theo quy ước PostgreSQL: 0 = Chủ nhật … 6 = Thứ Bảy.
-- Chỉ ghi 15/20 lớp — 5 lớp còn lại ô lịch trong sheet trống, KHÔNG tự bịa.
-- -----------------------------------------------------------------------------
insert into public.class_schedules (class_id, weekday, start_time, duration_minutes)
select c.id, v.weekday, v.start_time::time, 60
  from (values
    ('DIEP-RO',  4, '18:00'), ('DIEP-RO',  5, '19:30'),
    ('DIEP-PH',  2, '15:00'), ('DIEP-PH',  3, '15:00'),
    ('PHUC-PH',  0, '10:15'),
    ('PHUC-SH',  1, '10:00'), ('PHUC-SH',  4, '10:00'),
    ('LUAN-SH',  6, '08:00'), ('LUAN-SH',  0, '15:00'),
    ('TAN-SH',   6, '09:30'), ('TAN-SH',   0, '16:30'),
    ('NGAN-PH',  2, '20:00'), ('NGAN-PH',  3, '19:00'),
    ('TUYET-SH', 4, '09:00'), ('TUYET-SH', 5, '10:00'),
    ('HOANG-PH', 4, '21:00'), ('HOANG-PH', 0, '10:00'),
    ('KHOA-PH',  1, '19:00'), ('KHOA-PH',  4, '19:00'), ('KHOA-PH', 6, '19:00'),
    ('NGOC-HO',  2, '18:00'), ('NGOC-HO',  4, '18:00'), ('NGOC-HO', 6, '18:00'),
    ('THAO-PH',  1, '22:00'), ('THAO-PH',  2, '22:00'), ('THAO-PH', 3, '22:00'),
    ('THAO-PH',  4, '22:00'), ('THAO-PH',  5, '22:00'),
    ('HAU-NH',   3, '11:00'), ('HAU-NH',   6, '11:00'),
    ('TOAN-NH',  1, '08:00'), ('TOAN-NH',  3, '08:00'), ('TOAN-NH', 5, '08:00'),
    ('HANG-PH',  2, '14:00'), ('HANG-PH',  4, '14:00'), ('HANG-PH', 5, '14:00')
  ) as v(code, weekday, start_time)
  join public.classes c on c.class_code = v.code;

-- -----------------------------------------------------------------------------
-- 7. Hợp đồng học phí
-- "Gói 10 buổi" ⇒ prepaid_package (10 buổi). "Cuối tháng" ⇒ monthly_postpaid
-- (số buổi và tổng tiền để trống vì chỉ chốt khi hết tháng). "Chưa xác định" ⇒
-- undetermined.
-- Lớp nhóm Y Khoa: MỘT hợp đồng cho cả nhóm, Hoàng Uyên đứng tên đóng (D13, D14).
-- -----------------------------------------------------------------------------
insert into public.student_enrollments
  (student_id, class_id, billing_mode, lessons_purchased, price_per_lesson,
   net_amount, headcount, monthly_discount_amount, start_date, status,
   agreement_notes, needs_review, review_note)
select s.id, c.id, v.mode::billing_mode,
       case when v.mode = 'prepaid_package' then 10 else null end,
       v.price,
       case when v.mode = 'prepaid_package' then 10 * v.price else null end,
       v.headcount, v.monthly_discount, date '2026-09-01',
       case when c.status = 'paused' then 'paused' else 'active' end::enrollment_status,
       v.notes, v.review, v.review_note
  from (values
    ('DIEP-RO','Vũ Hoàng Ngọc Diệp','monthly_postpaid',190000,1,0,null,false,null),
    ('DIEP-PH','Vũ Hoàng Ngọc Diệp','monthly_postpaid',190000,1,0,null,false,null),
    ('PHUC-PH','Vũ Hoàng Phúc',     'monthly_postpaid',190000,1,0,null,false,null),
    ('PHUC-SH','Vũ Hoàng Phúc',     'monthly_postpaid',190000,1,0,null,false,null),
    ('LUAN-SH','Bùi Thành Luân',    'prepaid_package', 219000,1,0,null,false,null),
    ('TAN-SH', 'Bùi Thiên Tân',     'prepaid_package', 219000,1,0,null,false,null),
    ('NGAN-PH','Bé Ngân',           'monthly_postpaid',190000,1,0,
      'Đơn giá có hai mốc hiệu lực theo D11: 179.000 ₫ đến 31/08/2026, 190.000 ₫ từ 01/09/2026.',true,
      'Ô đơn giá trong sheet gốc là 1.790.009.190 ₫ — lỗi gõ. Đã thay bằng hai mốc giá Founder xác nhận (D11): 179.000 ₫ rồi 190.000 ₫.'),
    ('TUYET-SH','Ms. Tuyết',        'monthly_postpaid',249000,1,0,null,false,null),
    ('HOANG-PH','Ms. Hoàng/Huê',    'monthly_postpaid',260000,1,0,null,false,null),
    ('KHOA-PH','Ms. Min',           'monthly_postpaid',360000,3,150000,
      'Công thức Founder: 120.000 × 3 người × số buổi − 150.000/tháng. Chứng từ thật: 7 buổi tháng 7/2026 = 2.370.000 ₫.',false,null),
    ('THIENAI-KO','Thiên Ái',       'prepaid_package', 280000,1,0,null,false,null),
    ('NGOC-HO','Bảo Ngọc',          'undetermined',    249000,1,0,null,true,
      'Hình thức đóng trong sheet là "Chưa xác định". Cần Founder chốt gói trả trước hay đóng cuối tháng.'),
    ('THAO-PH','Thảo',              'prepaid_package', 250000,1,0,
      'Đơn giá 250.000 ₫ theo bảng giá Founder chốt (D10), không phải 249.000 ₫ như sheet CRM.',true,
      'Sheet CRM ghi 249.000 ₫, bảng giá ghi 250.000 ₫. Đã nhập 250.000 ₫ theo D10.'),
    ('HAU-NH','Hậu',                'prepaid_package', 249000,1,0,null,false,null),
    ('TOAN-NH','Toàn',              'prepaid_package', 249000,1,0,null,false,null),
    ('HANG-PH','Ms. Hằng',          'prepaid_package', 249000,1,0,null,false,null),
    ('LINH-PH','Ms. Linh',          'prepaid_package', 219000,1,0,null,false,null),
    ('KIEN-SH','Kiên',              'prepaid_package', 300000,1,0,null,false,null),
    ('VY-SH','Vy',                  'prepaid_package', 280000,1,0,null,false,null),
    ('NHI-PH','Nhi',                'prepaid_package', 250000,1,0,null,false,null)
  ) as v(code, student, mode, price, headcount, monthly_discount, notes, review, review_note)
  join public.classes  c on c.class_code = v.code
  join public.students s on s.full_name  = v.student;

-- Hoàng Uyên đứng tên đóng cho hợp đồng lớp nhóm Y Khoa (D14).
update public.student_enrollments e
   set payer_parent_id = (select id from public.parents where full_name = 'Hoàng Uyên'),
       payer_note      = 'vợ anh Max'
 where e.class_id = (select id from public.classes where class_code = 'KHOA-PH');

-- -----------------------------------------------------------------------------
-- 8. Lịch sử đơn giá học phí
-- Mỗi hợp đồng có một mốc giá từ ngày bắt đầu. Bé Ngân có HAI mốc (D11) để buổi
-- đã dạy tháng 8 vẫn ghi nhận đúng 179.000 ₫.
-- -----------------------------------------------------------------------------
insert into public.tuition_rates (enrollment_id, price_per_lesson, effective_from, effective_to, evidence_note)
select e.id, 179000, date '2026-07-01', date '2026-08-31',
       'Founder xác nhận (D11). Chứng từ: 716.000 = 4 buổi (09/07), 1.432.000 = 8 buổi (09/08)'
  from public.student_enrollments e
  join public.classes c on c.id = e.class_id
 where c.class_code = 'NGAN-PH';

insert into public.tuition_rates (enrollment_id, price_per_lesson, effective_from, evidence_note)
select e.id, e.price_per_lesson,
       case when c.class_code = 'NGAN-PH' then date '2026-09-01' else e.start_date end,
       case when c.class_code = 'NGAN-PH'
            then 'Founder xác nhận: từ tháng 9/2026 áp dụng 190.000 ₫ (D11)'
            else 'Đơn giá lúc nhập từ sheet CRM (10/9)' end
  from public.student_enrollments e
  join public.classes c on c.id = e.class_id;

commit;
