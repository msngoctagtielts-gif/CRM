-- NHẬP 12 BUỔI THÁNG 9 CÒN THIẾU — nguồn: sổ Zoom tự động của trung tâm
--
-- NGUỒN
--   Google Sheet "Nhật ký lớp Zoom - YouTube"
--   1eIlKRPG2bukD3EwXna3bVPjbjEZ7YyUhypy22Jeb898, tab "Báo cáo lớp".
--   Sheet này nối thẳng với Zoom của trung tâm: tự tải bản ghi lên YouTube, tự
--   trích transcript, và tự đo số phút dạy thật, số phút giáo viên nói, số phút
--   học viên nói, số lượt học viên nói, cùng các khoảng im lặng.
--
-- VÌ SAO PHẢI NHẬP
--   Đối chiếu ngày 25/09/2026: sổ Zoom có 25 buổi tháng 9, CRM chỉ có 13.
--   Mười hai buổi đã dạy thật, giáo viên chưa được tính lương, học viên chưa bị
--   trừ buổi. Trong đó có buổi Y Khoa 22/09 — đúng câu hỏi Founder đặt ra hôm
--   24/09 ("lớp Y Khoa tháng 9 học chưa"): CÓ HỌC, chỉ là chưa ai nhập.
--
-- MỘT QUYẾT ĐỊNH VỀ TIỀN, GHI RÕ ĐỂ SAU NÀY CÒN TRA
--   duration_minutes = 60 cho CẢ MƯỜI HAI BUỔI, KHÔNG lấy cột "Chuẩn (phút)"
--   của sheet. Cột đó ghi 75 cho Diệp, Ngân, Nhi, Thảo ở vài dòng. Nhưng tab
--   "Lớp học" của sheet — nơi lẽ ra cấu hình thời lượng chuẩn từng lớp — ĐANG
--   TRỐNG, chỉ có dòng tiêu đề. Nghĩa là 75 là giá trị mặc định của script chứ
--   không phải điều khoản hợp đồng.
--
--   Mọi lớp trong CRM đều cấu hình 60 phút và học phí đang tính theo đó. Để một
--   cột chưa ai xác nhận đổi số tiền học viên phải trả là sai. Số phút DẠY THẬT
--   được ghi riêng vào teaching_reports.phut_thuc_te — Founder nhìn thấy độ
--   lệch mà quyết, hệ thống không tự đổi tiền.
--
-- THỨ TỰ SÁU BƯỚC LÀ BẮT BUỘC (xem supabase/data-imports/README.md)
--   1. Tạo buổi ở trạng thái scheduled
--   2. Điểm danh toàn bộ học viên đang hoạt động
--   3. Lớp nhóm: đánh dấu miễn phí cho người không cầm hợp đồng — TRƯỚC bước 4
--   4. Chuyển completed  → đến đây trigger mới sinh học phí và lương
--   5. Link video
--   6. Ghi số liệu đo được vào báo cáo
--
-- KHÔNG VIẾT NỘI DUNG BÀI HỌC. Chưa có căn cứ. Giáo viên tự viết, hoặc lấy từ
-- transcript ở bước sau. Để trống là trung thực; viết cho đủ là bịa.

-- ---------------------------------------------------------------------------
-- BƯỚC 1 — tạo buổi
-- ---------------------------------------------------------------------------
with nguon(ma_lop, ngay, gio_bat_dau, ten_gv, chu_de, phut_that, gv_noi, hv_noi, ty_le, luot_noi, canh_bao, youtube) as (
  values
  ('VY-SH',   date '2026-09-24', time '19:01', 'Ms. Sheba',  'Lesson 3 – personality, festival, going', 40, 12, 12, 51,  67, 'Vào dạy muộn 19:01–19:20 (19 phút)',          'https://youtu.be/0gjG_Ts7rKY'),
  ('NGAN-PH', date '2026-09-23', time '10:37', 'Ms. Phương', 'wearing, name, brother',                  50, 21,  6, 22, 156, 'Dạy thiếu 10 phút',                           'https://youtu.be/ti2sC9-epB8'),
  ('DUY-SH',  date '2026-09-23', time '18:58', 'Ms. Sheba',  'house, going, family',                    50, 16,  6, 28, 129, 'Dạy thiếu 10 phút; vào dạy muộn 18:58–19:10', 'https://youtu.be/k9F73N0xlpo'),
  ('DIEP-RO', date '2026-09-23', time '20:01', 'Ms. Rose',   'nghe, trong, xong',                       56, 14, 13, 48, 240, 'Dạy thiếu 19 phút',                           'https://youtu.be/cGAAxLfMEt0'),
  ('THAO-PH', date '2026-09-23', time '22:06', 'Ms. Phương', 'IELTS – xong, trong, nghe',               61, 25, 18, 41, 374, 'Bình thường',                                 'https://youtu.be/2Oj-OQxtSVQ'),
  ('KHOA-PH', date '2026-09-22', time '19:58', 'Ms. Phương', 'vacation, speaking, beautiful',           58, 26, 23, 47, 336, 'Bình thường',                                 'https://youtu.be/ifvA9hz4LGw'),
  ('THAO-PH', date '2026-09-21', time '21:58', 'Ms. Phương', 'Unit 1 – live, name, elevator',           55, 25, 13, 33, 236, 'Vào dạy muộn 21:58–22:05',                    'https://youtu.be/8DSzjl2gFuI'),
  ('DUY-SH',  date '2026-09-21', time '19:01', 'Ms. Sheba',  'Duy – September 21, 2026',                49, 17,  9, 33, 144, 'Cả lớp im lặng 19:49–19:57',                  'https://youtu.be/ggQhzjhn8wU'),
  ('NHI-PH',  date '2026-09-19', time '11:16', 'Ms. Phương', 'Uyên Nhi 19/9/26',                        56, 12,  3, 20,  67, 'Dạy thiếu 19 phút',                           'https://youtu.be/GkiuoRdrv7g'),
  ('NGAN-PH', date '2026-09-17', time '18:18', 'Ms. Phương', 'Ngân 17/9/26',                            59, 14,  9, 40, 245, 'Dạy thiếu 16 phút',                           'https://youtu.be/Xjg3e3QJs-g'),
  ('NGAN-PH', date '2026-09-16', time '19:02', 'Ms. Phương', 'Ngân 16/9/26',                            54, 15, 10, 39, 200, 'Dạy thiếu 21 phút',                           'https://youtu.be/G9vTTFfO4hg'),
  ('THAO-PH', date '2026-09-14', time '21:30', 'Ms. Phương', 'Ms Thảo 14/9/26',                         63, 31, 14, 31, 355, 'Dạy thiếu 12 phút',                           'https://youtu.be/8NUuKwgkDSU')
),
sau as (
  select n.*, c.id as class_id, t.id as teacher_id,
         ((n.ngay + n.gio_bat_dau) at time zone 'Asia/Ho_Chi_Minh') as bat_dau
    from nguon n
    join public.classes c  on c.class_code = n.ma_lop
    join public.teachers t on t.full_name  = n.ten_gv
)
insert into public.lessons
  (class_id, teacher_id, lesson_date, scheduled_start_at, scheduled_end_at,
   actual_start_at, actual_end_at, duration_minutes, status, topic, notes)
select class_id, teacher_id, ngay,
       bat_dau, bat_dau + interval '60 minutes',
       bat_dau, bat_dau + interval '60 minutes',
       60, 'scheduled', chu_de,
       'Nhap tu so Zoom 25/09/2026. Day that ' || phut_that || ' phut. ' || canh_bao ||
       case when ma_lop = 'DIEP-RO'
            then ' | So Zoom ghi giao vien "Rose / Phuong" — tro ly xep tam vao lop Ms. Rose, Founder xac nhan lai.'
            else '' end
  from sau;

-- ---------------------------------------------------------------------------
-- BƯỚC 2 — điểm danh. fn_generate_payable_lesson đòi số dòng điểm danh bằng
-- đúng sĩ số; thiếu một em là không sinh dòng lương.
-- ---------------------------------------------------------------------------
insert into public.attendance (lesson_id, student_id, status)
select l.id, cs.student_id, 'present'::attendance_status
  from public.lessons l
  join public.class_students cs on cs.class_id = l.class_id and cs.status = 'active'
 where l.status = 'scheduled'
   and l.notes like 'Nhap tu so Zoom 25/09/2026%';

-- ---------------------------------------------------------------------------
-- BƯỚC 3 — lớp nhóm Y Khoa: chỉ người cầm hợp đồng chịu phí.
-- Làm TRƯỚC bước 4 để không sinh dòng trừ học phí rồi lại xoá.
-- ---------------------------------------------------------------------------
update public.attendance a
   set is_billable = false,
       ly_do_mien_phi = 'Lop nhom Y Khoa: chi Ms. Min dung hop dong va chiu phi cho ca nhom (360.000d/buoi cho 3 nguoi). Da doi chieu 25/09/2026 voi so quyet toan — Mr. Max va Mr. John khong co hop dong rieng va khong dong rieng.'
  from public.lessons l
  join public.classes c on c.id = l.class_id
 where a.lesson_id = l.id
   and c.class_code = 'KHOA-PH'
   and l.notes like 'Nhap tu so Zoom 25/09/2026%'
   and not exists (select 1 from public.student_enrollments e
                    where e.student_id = a.student_id and e.status = 'active');

-- ---------------------------------------------------------------------------
-- BƯỚC 4 — chuyển completed. Đến đây học phí và lương mới được sinh.
-- ---------------------------------------------------------------------------
update public.lessons
   set status = 'completed'
 where status = 'scheduled'
   and notes like 'Nhap tu so Zoom 25/09/2026%';

-- ---------------------------------------------------------------------------
-- BƯỚC 5 — link video YouTube
-- ---------------------------------------------------------------------------
with nguon(ma_lop, ngay, youtube) as (
  values
  ('VY-SH',   date '2026-09-24', 'https://youtu.be/0gjG_Ts7rKY'),
  ('NGAN-PH', date '2026-09-23', 'https://youtu.be/ti2sC9-epB8'),
  ('DUY-SH',  date '2026-09-23', 'https://youtu.be/k9F73N0xlpo'),
  ('DIEP-RO', date '2026-09-23', 'https://youtu.be/cGAAxLfMEt0'),
  ('THAO-PH', date '2026-09-23', 'https://youtu.be/2Oj-OQxtSVQ'),
  ('KHOA-PH', date '2026-09-22', 'https://youtu.be/ifvA9hz4LGw'),
  ('THAO-PH', date '2026-09-21', 'https://youtu.be/8DSzjl2gFuI'),
  ('DUY-SH',  date '2026-09-21', 'https://youtu.be/ggQhzjhn8wU'),
  ('NHI-PH',  date '2026-09-19', 'https://youtu.be/GkiuoRdrv7g'),
  ('NGAN-PH', date '2026-09-17', 'https://youtu.be/Xjg3e3QJs-g'),
  ('NGAN-PH', date '2026-09-16', 'https://youtu.be/G9vTTFfO4hg'),
  ('THAO-PH', date '2026-09-14', 'https://youtu.be/8NUuKwgkDSU')
)
insert into public.recordings (lesson_id, url, status)
select l.id, n.youtube, 'active'
  from nguon n
  join public.classes c on c.class_code = n.ma_lop
  join public.lessons l on l.class_id = c.id and l.lesson_date = n.ngay
                       and l.notes like 'Nhap tu so Zoom 25/09/2026%';

-- ---------------------------------------------------------------------------
-- BƯỚC 6 — số liệu ĐO ĐƯỢC. nguon_xac_minh = 'zoom', không phải máy đoán.
-- ---------------------------------------------------------------------------
with nguon(ma_lop, ngay, phut_that, hv_noi, canh_bao) as (
  values
  ('VY-SH',   date '2026-09-24', 40, 12, 'Vào dạy muộn 19:01–19:20 (19 phút). Học viên nói 51% thời lượng, 67 lượt.'),
  ('NGAN-PH', date '2026-09-23', 50,  6, 'Dạy thiếu 10 phút. Học viên chỉ nói 22% thời lượng, 156 lượt.'),
  ('DUY-SH',  date '2026-09-23', 50,  6, 'Dạy thiếu 10 phút; vào dạy muộn 18:58–19:10. Học viên nói 28%, 129 lượt.'),
  ('DIEP-RO', date '2026-09-23', 56, 13, 'Dạy thiếu 19 phút so với chuẩn sổ Zoom. Học viên nói 48%, 240 lượt.'),
  ('THAO-PH', date '2026-09-23', 61, 18, 'Bình thường. Học viên nói 41%, 374 lượt.'),
  ('KHOA-PH', date '2026-09-22', 58, 23, 'Bình thường. Học viên nói 47%, 336 lượt.'),
  ('THAO-PH', date '2026-09-21', 55, 13, 'Vào dạy muộn 21:58–22:05. Học viên nói 33%, 236 lượt.'),
  ('DUY-SH',  date '2026-09-21', 49,  9, 'Cả lớp im lặng 19:49–19:57. Học viên nói 33%, 144 lượt.'),
  ('NHI-PH',  date '2026-09-19', 56,  3, 'Dạy thiếu 19 phút. Học viên chỉ nói 20% thời lượng, 67 lượt.'),
  ('NGAN-PH', date '2026-09-17', 59,  9, 'Dạy thiếu 16 phút. Học viên nói 40%, 245 lượt.'),
  ('NGAN-PH', date '2026-09-16', 54, 10, 'Dạy thiếu 21 phút. Học viên nói 39%, 200 lượt.'),
  ('THAO-PH', date '2026-09-14', 63, 14, 'Dạy thiếu 12 phút. Học viên nói 31%, 355 lượt.')
),
buoi as (
  select l.id as lesson_id, l.class_id, l.teacher_id, l.lesson_date,
         l.actual_start_at, l.actual_end_at, n.phut_that, n.hv_noi, n.canh_bao
    from nguon n
    join public.classes c on c.class_code = n.ma_lop
    join public.lessons l on l.class_id = c.id and l.lesson_date = n.ngay
                         and l.notes like 'Nhap tu so Zoom 25/09/2026%'
)
insert into public.teaching_reports
  (lesson_id, class_id, teacher_id, report_date, start_time, end_time,
   phut_thuc_te, thoi_gian_hv_noi, khong_khi_lop, nguon_xac_minh, xac_minh_luc, status)
select lesson_id, class_id, teacher_id, lesson_date, actual_start_at, actual_end_at,
       phut_that, hv_noi, canh_bao, 'zoom', now(), 'incomplete'
  from buoi
on conflict (lesson_id) do update
   set start_time       = excluded.start_time,
       end_time         = excluded.end_time,
       phut_thuc_te     = excluded.phut_thuc_te,
       thoi_gian_hv_noi = excluded.thoi_gian_hv_noi,
       khong_khi_lop    = coalesce(nullif(btrim(public.teaching_reports.khong_khi_lop),''), excluded.khong_khi_lop),
       nguon_xac_minh   = excluded.nguon_xac_minh,
       xac_minh_luc     = excluded.xac_minh_luc;

-- ---------------------------------------------------------------------------
-- KẾT QUẢ ĐÃ KIỂM SAU KHI CHẠY (25/09/2026)
--   12 buổi, 0 buổi thiếu dòng lương, 0 buổi thiếu dòng trừ học phí
--   Lương sinh thêm      1.480.000 đ
--   Học phí ghi nhận     2.820.000 đ
--   Công nợ toàn trung tâm  11.643.000 → 12.823.000 đ
--
-- CHƯA NHẬP, CẦN FOUNDER QUYẾT (7 dòng trong sổ Zoom)
--   · 4 buổi "Không có học viên vào lớp": 20/09 phòng Vy, 19/09 phòng Tân,
--     14/09 17:04, 14/09 10:02 phòng Phúc. Không phải buổi dạy.
--   · 14/09 10:30 "Ngân" nhưng giáo viên ghi Ms. Sheba — lớp Ngân là của
--     Ms. Phương. Chưa rõ ai dạy.
--   · 17/09 21:58 học viên ghi là "Học viên", không rõ ai. Thiết bị "iPhone"
--     trùng với các buổi của Thảo nhưng chưa đủ căn cứ.
--   · 19/09 20:32 "ngọcc" — học viên này chưa có trong CRM.
