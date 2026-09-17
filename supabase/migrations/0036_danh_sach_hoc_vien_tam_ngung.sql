-- =============================================================================
-- 0036 + 0037 — Danh sách học viên tạm ngưng
-- =============================================================================
--
-- FOUNDER CHỐT: Thiên Ái, Toàn, Hậu, Hằng ngưng học. Đưa vào danh sách để sau
-- này liên hệ, KHÔNG để lẫn trong lịch của học viên đang học.
--
-- ĐÃ LÀM TRÊN DỮ LIỆU (không nằm trong file này vì là thay đổi dữ liệu, không
-- phải cấu trúc; neo bằng id đọc từ bước tra cứu, không dùng tên):
--   students.status   -> 'paused'   cho 4 em
--   classes.status    -> 'paused'   cho 4 lớp 1-1 THIENAI-KO, TOAN-NH, HAU-NH, HANG-PH
--   class_students    -> 'archived' + left_at = ngày chuyển
-- Kết quả: thời khoá biểu tuần giảm từ 36 xuống 28 khung. Lịch sử buổi học,
-- điểm danh, báo cáo, video và lương giữ nguyên — chỉ đổi trạng thái.
--
-- VIEW NÀY PHẢI TRẢ LỜI ĐƯỢC HAI CÂU
--   1. Liên hệ với em này bằng cách nào?
--   2. Còn vướng tiền nong gì không?
--
-- VÌ SAO PHẢI CÓ CỘT tien_buoi_vuot
--   v_enrollment_balances.outstanding_amount = net_amount trừ total_paid, tức
--   so tiền hợp đồng với tiền đã đóng. Nó KHÔNG bắt được trường hợp học viên
--   đã đóng đủ tiền hợp đồng nhưng học vượt số buổi đã mua.
--
--   Đúng ba trong bốn em vừa ngưng rơi vào đó: Toàn vượt 4 buổi (1.000.000₫),
--   Hậu vượt 1 buổi (250.000₫), Thiên Ái vượt 1 buổi (280.000₫).
--   outstanding_amount của cả ba đều bằng 0 nên nhìn vào tưởng đã xong.
--   Cộng cả Ms. Hằng (hợp đồng 2.490.000₫ chưa đóng, chưa học buổi nào) thì
--   tổng còn phải xử lý là 4.020.000₫.
-- =============================================================================

drop view if exists public.v_hoc_vien_tam_ngung;
create view public.v_hoc_vien_tam_ngung
with (security_invoker = on) as
select
  s.id                as student_id,
  s.student_code,
  s.full_name         as ten_hoc_vien,
  s.status::text      as trang_thai,
  s.phone,
  s.email,
  s.internal_notes    as ghi_chu,

  -- Liên hệ: gộp học viên và phụ huynh, nhìn một ô là biết gọi được hay chưa.
  nullif(concat_ws(' · ',
    nullif(s.phone, ''),
    nullif(s.email::text, ''),
    (select string_agg(p.full_name || coalesce(' (' || p.phone || ')', ''), ' · ')
       from public.student_parents sp
       join public.parents p on p.id = sp.parent_id
      where sp.student_id = s.id)), '') as lien_he,

  (select c.name from public.class_students cs
     join public.classes c on c.id = cs.class_id
    where cs.student_id = s.id
    order by cs.left_at desc nulls first, cs.joined_at desc limit 1) as lop_cuoi,
  (select t.full_name from public.class_students cs
     join public.classes c on c.id = cs.class_id
     left join public.teachers t on t.id = c.teacher_id
    where cs.student_id = s.id
    order by cs.left_at desc nulls first, cs.joined_at desc limit 1) as giao_vien_cuoi,

  (select max(l.lesson_date) from public.attendance a
     join public.lessons l on l.id = a.lesson_id
    where a.student_id = s.id and l.status = 'completed')            as buoi_cuoi,
  (select count(*) from public.attendance a
     join public.lessons l on l.id = a.lesson_id
    where a.student_id = s.id and l.status = 'completed')            as tong_buoi_da_hoc,

  (select coalesce(sum(b.lessons_remaining), 0) from public.v_enrollment_balances b
    where b.student_id = s.id)                                       as buoi_con_lai,
  (select coalesce(sum(b.outstanding_amount), 0) from public.v_enrollment_balances b
    where b.student_id = s.id)                                       as con_no_hop_dong,

  -- Tiền của những buổi đã dạy vượt quá số buổi đã mua. Khoản này CHƯA HỀ được
  -- xuất phiếu nên không nằm trong outstanding_amount.
  (select coalesce(sum((-b.lessons_remaining) * b.price_per_lesson), 0)
     from public.v_enrollment_balances b
    where b.student_id = s.id and b.lessons_remaining < 0)           as tien_buoi_vuot,

  (select coalesce(sum(b.total_paid), 0) from public.v_enrollment_balances b
    where b.student_id = s.id)                                       as da_dong
from public.students s
where s.status = 'paused';

comment on view public.v_hoc_vien_tam_ngung is
  'Hoc vien da ngung hoc: lien he, lop va giao vien cuoi, buoi cuoi, so buoi con lai, tien con no theo hop dong VA tien cua nhung buoi da day vuot goi. Khong xoa ai, chi doi trang thai.';
