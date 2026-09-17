-- =============================================================================
-- 0040 — Cổng KHÔNG hiện "số buổi còn lại" khi con số đó chưa đáng tin
-- =============================================================================
--
-- PHÁT HIỆN KHI THỬ BẰNG TÀI KHOẢN PHỤ HUYNH THẬT
--   Bùi Thiên Tân: hợp đồng ghi mua 10 buổi, thực tế đã học 64 buổi, đã đóng
--   9.240.000₫ trong khi hợp đồng chỉ ghi 2.190.000₫. Gói học được gia hạn
--   nhiều lần nhưng chỉ nhập vào hệ thống một lần.
--   Cổng sẽ hiện "còn lại -47 buổi" cho phụ huynh — vừa sai vừa gây hoang mang,
--   và làm mất tin vào cả hệ thống.
--
--   Sáu học viên ở diện gói trả trước bị âm: Tân (-54), Luân (-43), Toàn (-6),
--   Hậu (-5), Thiên Ái (-5), Thảo (-3).
--
--   Mười học viên khác học theo tháng nên không có số buổi mua — với họ "số
--   buổi còn lại" vốn dĩ không có nghĩa, đó không phải lỗi.
--
-- CÁCH XỬ LÝ
--   Chỉ hiện số buổi còn lại khi là gói trả trước VÀ số dư không âm. Các trường
--   hợp khác trả NULL kèm nhãn kieu_hoc_phi để giao diện hiện "học theo tháng"
--   hoặc "đang đối chiếu". Thà để trống và nói đang đối chiếu, còn hơn đưa cho
--   phụ huynh một con số bịa.
-- =============================================================================

drop view if exists public.v_portal_hoc_vien;
create view public.v_portal_hoc_vien as
with goi as (
  select
    e.student_id,
    bool_or(e.billing_mode = 'prepaid_package')  as co_goi_tra_truoc,
    bool_or(e.billing_mode = 'monthly_postpaid') as co_theo_thang,
    sum(coalesce(e.lessons_purchased, 0))
      - sum(coalesce((select sum(c.lessons_deducted) from public.lesson_consumptions c
                       where c.enrollment_id = e.id), 0))           as con_lai
  from public.student_enrollments e
  where e.student_id in (select public.fn_hoc_vien_cua_tai_khoan())
  group by e.student_id
)
select
  s.id                     as student_id,
  s.full_name              as ten_hoc_vien,
  s.student_code,
  s.status::text           as trang_thai,
  c.name                   as ten_lop,
  coalesce(t.display_name, t.full_name) as giao_vien,
  (select count(*) from public.attendance a
     join public.lessons l on l.id = a.lesson_id
    where a.student_id = s.id and l.status = 'completed')  as tong_buoi_da_hoc,
  (select max(l.lesson_date) from public.attendance a
     join public.lessons l on l.id = a.lesson_id
    where a.student_id = s.id and l.status = 'completed')  as buoi_gan_nhat,
  case when g.co_goi_tra_truoc and g.con_lai >= 0 then g.con_lai end as buoi_con_lai,
  case
    when g.student_id is null                  then 'chua_co_hop_dong'
    when g.co_goi_tra_truoc and g.con_lai >= 0 then 'goi_tra_truoc'
    when g.co_goi_tra_truoc and g.con_lai <  0 then 'dang_doi_chieu'
    when g.co_theo_thang                       then 'hoc_theo_thang'
    else 'dang_doi_chieu'
  end as kieu_hoc_phi
from public.students s
left join public.class_students cs on cs.student_id = s.id and cs.status = 'active'
left join public.classes  c on c.id = cs.class_id
left join public.teachers t on t.id = c.teacher_id
left join goi g on g.student_id = s.id
where s.id in (select public.fn_hoc_vien_cua_tai_khoan());

comment on view public.v_portal_hoc_vien is
  'Cong hoc vien: ho so rut gon. buoi_con_lai chi co gia tri khi la goi tra truoc va so du khong am; cac truong hop khac tra NULL kem nhan kieu_hoc_phi de giao dien noi ro thay vi hien so sai.';

revoke all on public.v_portal_hoc_vien from public, anon;
grant select on public.v_portal_hoc_vien to authenticated;
