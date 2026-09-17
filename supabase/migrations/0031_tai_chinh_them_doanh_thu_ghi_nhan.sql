-- =============================================================================
-- 0031 — Thêm doanh thu ghi nhận vào v_tai_chinh_thang
-- =============================================================================
--
-- VÌ SAO SỬA NGAY SAU 0030
--
-- Bản 0030 lấy tiền mặt thu được trừ lương và chi phí ra "còn lại". Sai lệch:
-- học phí thu theo gói 10 buổi, nên tiền vào tháng nào không phải tháng dạy.
-- Tháng 06/2026 theo cách tính đó nhìn như lỗ 2,3 triệu, trong khi doanh thu
-- ghi nhận của chính tháng đó là 21,5 triệu.
--
-- Bảng lesson_consumptions đã ghi nhận doanh thu đúng từng buổi khi học viên
-- điểm danh (cột recognized_amount, 427 dòng). Đó mới là con số đo hiệu suất.
--
-- Giữ CẢ HAI cột, không thay thế:
--   doanh_thu    — ghi nhận theo buổi đã dạy, dùng để đo hiệu suất
--   thu_tien_mat — tiền thật vào tài khoản, dùng để xem dòng tiền
--
-- THÊM MỘT CỜ CHẤT LƯỢNG DỮ LIỆU
--   buoi_chua_gan_hoc_phi — buổi đã dạy nhưng không có dòng lesson_consumptions
--   nào. Doanh thu tháng đó đang thiếu đúng bằng số buổi này. Hiện toàn hệ
--   thống có 461 buổi dạy nhưng chỉ 427 dòng ghi nhận.
-- =============================================================================

drop view if exists public.v_tai_chinh_thang;
create view public.v_tai_chinh_thang
with (security_invoker = on) as
with cac_thang as (
  select distinct date_trunc('month', payment_date)::date as thang
    from public.payments where status = 'confirmed'
  union
  select distinct date_trunc('month', lesson_date)::date
    from public.teacher_payable_lessons
  union
  select distinct date_trunc('month', expense_date)::date
    from public.expenses
  union
  select distinct date_trunc('month', lesson_date)::date
    from public.lessons
)
select
  m.thang,
  to_char(m.thang, 'YYYY') as nam,

  -- Doanh thu ghi nhận theo buổi đã dạy. Con số dùng để đo hiệu suất.
  coalesce((select sum(c.recognized_amount)
              from public.lesson_consumptions c
              join public.lessons l on l.id = c.lesson_id
             where date_trunc('month', l.lesson_date) = m.thang), 0) as doanh_thu,

  -- Tiền mặt thực nhận trong tháng. Lệch với doanh thu vì thu theo gói 10 buổi.
  coalesce((select sum(p.amount) from public.payments p
             where p.status = 'confirmed' and p.currency = 'VND'
               and date_trunc('month', p.payment_date) = m.thang), 0) as thu_tien_mat,

  coalesce((select sum(pl.amount) from public.teacher_payable_lessons pl
             where pl.currency = 'VND'
               and date_trunc('month', pl.lesson_date) = m.thang), 0) as luong_gv,
  coalesce((select sum(e.amount) from public.expenses e
             where e.currency = 'VND'
               and date_trunc('month', e.expense_date) = m.thang), 0) as chi_khac,
  (select count(*) from public.payments p
     where p.status = 'confirmed' and p.currency <> 'VND'
       and date_trunc('month', p.payment_date) = m.thang)
  + (select count(*) from public.expenses e
     where e.currency <> 'VND'
       and date_trunc('month', e.expense_date) = m.thang) as dong_ngoai_te,

  (select count(*) from public.lessons l
     where l.status = 'completed'
       and date_trunc('month', l.lesson_date) = m.thang) as buoi_day,
  (select count(*) from public.lessons l
     where l.status = 'cancelled'
       and date_trunc('month', l.lesson_date) = m.thang) as buoi_huy,

  (select count(*) from public.lessons l
     where l.status = 'completed'
       and date_trunc('month', l.lesson_date) = m.thang
       and not exists (select 1 from public.lesson_consumptions c
                        where c.lesson_id = l.id)) as buoi_chua_gan_hoc_phi,

  (select count(distinct l.class_id) from public.lessons l
     where l.status = 'completed'
       and date_trunc('month', l.lesson_date) = m.thang) as so_lop,
  (select count(distinct l.teacher_id) from public.lessons l
     where l.status = 'completed'
       and date_trunc('month', l.lesson_date) = m.thang) as so_giao_vien,
  (select count(distinct a.student_id) from public.attendance a
     join public.lessons l on l.id = a.lesson_id
     where l.status = 'completed'
       and date_trunc('month', l.lesson_date) = m.thang) as so_hoc_vien,

  (select count(*) from public.teacher_payable_lessons pl
     where pl.has_video and date_trunc('month', pl.lesson_date) = m.thang) as buoi_co_video,
  (select count(*) from public.teacher_payable_lessons pl
     where date_trunc('month', pl.lesson_date) = m.thang) as buoi_tinh_luong,
  (select round(avg(pl.qc_score), 1) from public.teacher_payable_lessons pl
     where pl.qc_score is not null
       and date_trunc('month', pl.lesson_date) = m.thang) as diem_qc
from cac_thang m
where public.is_founder();

comment on view public.v_tai_chinh_thang is
  'Tai chinh tung thang. doanh_thu = ghi nhan theo buoi da day (lesson_consumptions), dung de do hieu suat. thu_tien_mat = tien thuc nhan, lech vi thu theo goi 10 buoi. Chan cung bang is_founder().';
