-- =============================================================================
-- 0041 — Cổng chỉ hiện "số buổi còn lại" khi hai sổ khớp nhau
-- =============================================================================
--
-- 0040 đã chặn trường hợp số dư âm. Nhưng kiểm thử tiếp bằng tài khoản thật của
-- Thảo cho thấy chặn thế vẫn chưa đủ: cổng hiện "còn lại 1 buổi", trong khi
-- thực tế Thảo đã học 44 buổi trên gói 41 buổi — tức đã vượt 3 buổi.
--
-- NGUYÊN NHÂN: hệ thống có HAI sổ đếm buổi, và chúng không khớp nhau.
--   attendance           — buổi thực tế đã điểm danh
--   lesson_consumptions  — buổi đã trừ vào gói học phí
-- Số dư gói tính theo sổ thứ hai. Buổi nào chưa được gắn vào gói thì không bị
-- trừ, nên số dư trông vẫn còn trong khi học viên đã học rồi.
--
-- PHẠM VI ĐO ĐƯỢC TRÊN DỮ LIỆU THẬT: 15 trong 22 học viên có hai sổ lệch nhau,
-- tổng khoảng 96 buổi đã dạy nhưng chưa trừ vào gói nào. Ba em lệch nặng nhất
-- chưa có buổi nào được trừ: Mr. John 17, Mr. Max 17, Ms. Huệ 12. Một em lệch
-- ngược chiều: Bảo Ngọc bị trừ nhiều hơn số buổi đã học 2,5 buổi.
--
-- CÁCH XỬ LÝ: chỉ đưa con số ra cho phụ huynh khi CẢ BA điều kiện cùng đúng —
-- là gói trả trước, số dư không âm, VÀ hai sổ khớp nhau. Còn lại hiện nhãn
-- dang_doi_chieu. Thà để trống và nói đang đối chiếu, còn hơn đưa cho phụ huynh
-- một con số mà chính trung tâm chưa chốt được.
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
),
doi_chieu as (
  select s.id as student_id,
    (select count(*) from public.attendance a
       join public.lessons l on l.id = a.lesson_id
      where a.student_id = s.id and l.status = 'completed')                        as da_hoc,
    (select coalesce(sum(c.lessons_deducted), 0) from public.lesson_consumptions c
      where c.student_id = s.id)                                                  as da_tru
  from public.students s
  where s.id in (select public.fn_hoc_vien_cua_tai_khoan())
)
select
  s.id                     as student_id,
  s.full_name              as ten_hoc_vien,
  s.student_code,
  s.status::text           as trang_thai,
  c.name                   as ten_lop,
  coalesce(t.display_name, t.full_name) as giao_vien,
  d.da_hoc                 as tong_buoi_da_hoc,
  (select max(l.lesson_date) from public.attendance a
     join public.lessons l on l.id = a.lesson_id
    where a.student_id = s.id and l.status = 'completed')  as buoi_gan_nhat,
  case when g.co_goi_tra_truoc and g.con_lai >= 0 and d.da_hoc = d.da_tru
       then g.con_lai end as buoi_con_lai,
  case
    when g.student_id is null                    then 'chua_co_hop_dong'
    when d.da_hoc <> d.da_tru                    then 'dang_doi_chieu'
    when g.co_goi_tra_truoc and g.con_lai >= 0   then 'goi_tra_truoc'
    when g.co_goi_tra_truoc and g.con_lai <  0   then 'dang_doi_chieu'
    when g.co_theo_thang                         then 'hoc_theo_thang'
    else 'dang_doi_chieu'
  end as kieu_hoc_phi
from public.students s
left join public.class_students cs on cs.student_id = s.id and cs.status = 'active'
left join public.classes  c on c.id = cs.class_id
left join public.teachers t on t.id = c.teacher_id
left join goi g       on g.student_id = s.id
join      doi_chieu d on d.student_id = s.id
where s.id in (select public.fn_hoc_vien_cua_tai_khoan());

comment on view public.v_portal_hoc_vien is
  'Cong hoc vien: ho so rut gon. buoi_con_lai chi co gia tri khi la goi tra truoc, so du khong am, VA so diem danh khop so tru goi.';

revoke all on public.v_portal_hoc_vien from public, anon;
grant select on public.v_portal_hoc_vien to authenticated;
