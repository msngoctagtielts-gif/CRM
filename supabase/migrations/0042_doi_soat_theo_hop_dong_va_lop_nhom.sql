-- =============================================================================
-- 0042 — Đối soát học phí theo HỢP ĐỒNG, và xử lý lớp nhóm
-- =============================================================================
--
-- FOUNDER CHỐT: "lớp học nhóm thì xuất hiện chung 1 nhóm", và giao tự quyết
-- cách trình bày sao cho dễ quản lý và học viên dễ xem.
--
-- TÔI ĐÃ BÁO SAI Ở LƯỢT TRƯỚC, SỬA LẠI Ở ĐÂY
--   Tôi đo độ lệch trên TỪNG HỌC VIÊN và kết luận 15/22 em lệch, khoảng 96
--   buổi chưa trừ, nặng nhất Mr. John 17, Mr. Max 17, Ms. Huệ 12.
--
--   Sai đơn vị đo. Tiền đi theo HỢP ĐỒNG, không theo đầu người. Lớp nhóm chỉ
--   có MỘT hợp đồng đứng tên một người, headcount ghi số người:
--     Y Khoa 3 người — hợp đồng đứng tên Ms. Min, headcount 3, 360.000₫/buổi
--     Ms. Hoàng/Huệ  — hợp đồng đứng tên Ms. Hoàng, 260.000₫/buổi
--   Mr. John, Mr. Max, Ms. Huệ KHÔNG thiếu dữ liệu — họ nằm trong hợp đồng
--   nhóm. Đo lại theo hợp đồng thì cả hai lớp nhóm lệch ĐÚNG BẰNG 0.
--
--   Con số đúng: 34,5 buổi chưa trừ trên 10 hợp đồng, cộng một hợp đồng bị
--   trừ dư 2,5 buổi (Bảo Ngọc). Không phải 96 buổi trên 15 học viên.
--
-- QUYẾT ĐỊNH VỀ CÁCH TRÌNH BÀY
--   Đơn vị quản lý học phí = một hợp đồng gắn với một lớp. Lớp nhóm hiện MỘT
--   dòng, liệt kê đủ tên thành viên. Không tách thành nhiều dòng rồi để các
--   dòng kia trống tiền — đó chính là thứ làm đọc sai lần trước.
--
--   Ở cổng học viên: mỗi em vẫn xem buổi học, video và nhận xét CỦA RIÊNG
--   MÌNH. Phần học phí chỉ hiện cho người đứng tên hợp đồng; thành viên khác
--   thấy dòng "học phí thuộc hợp đồng nhóm do <tên> đứng tên" mà không thấy số
--   tiền — cho một người xem số tiền người khác đóng là rò rỉ thông tin, dù
--   họ học cùng lớp.
--
-- SỬA MỘT SAI LỆCH DỮ LIỆU
--   Lớp HOANG-PH ghi class_type = one_to_one, max_students = 1 nhưng có 2 học
--   viên, và hợp đồng ghi headcount = 1. Sửa cho khớp thực tế: lớp đôi, 2 chỗ,
--   headcount 2. Không đụng tới giá đã thoả thuận (260.000₫/buổi).
-- =============================================================================

update public.classes
   set class_type = 'small_group', max_students = 2, updated_at = now()
 where class_code = 'HOANG-PH';

update public.student_enrollments e
   set headcount = 2, updated_at = now()
  from public.classes c
 where c.id = e.class_id and c.class_code = 'HOANG-PH' and e.headcount <> 2;

drop view if exists public.v_doi_soat_hoc_phi;
create view public.v_doi_soat_hoc_phi
with (security_invoker = on) as
select
  e.id                  as enrollment_id,
  e.enrollment_code,
  c.id                  as class_id,
  c.class_code,
  c.name                as ten_lop,
  c.status::text        as trang_thai_lop,
  coalesce(t.display_name, t.full_name) as giao_vien,
  s.id                  as nguoi_dung_ten_id,
  s.full_name           as nguoi_dung_ten,
  e.headcount           as si_so_hop_dong,
  (select count(*) from public.class_students cs
    where cs.class_id = c.id and cs.status = 'active')          as si_so_thuc_te,
  (select string_agg(st.full_name, ', ' order by st.full_name)
     from public.class_students cs join public.students st on st.id = cs.student_id
    where cs.class_id = c.id and cs.status = 'active')          as thanh_vien,
  e.billing_mode::text  as hinh_thuc,
  e.status::text        as trang_thai_hop_dong,
  e.price_per_lesson,
  e.lessons_purchased   as buoi_da_mua,
  (select count(*) from public.lessons l
    where l.class_id = c.id and l.status = 'completed')         as buoi_lop_da_day,
  (select coalesce(sum(lc.lessons_deducted), 0) from public.lesson_consumptions lc
    where lc.enrollment_id = e.id)                              as buoi_da_tru,
  (select count(*) from public.lessons l
    where l.class_id = c.id and l.status = 'completed')
  - (select coalesce(sum(lc.lessons_deducted), 0) from public.lesson_consumptions lc
      where lc.enrollment_id = e.id)                            as lech_buoi,
  (select coalesce(sum(p.amount), 0) from public.payments p
    where p.enrollment_id = e.id and p.status = 'confirmed')    as da_dong,
  e.net_amount          as tien_hop_dong
from public.student_enrollments e
join public.classes  c on c.id = e.class_id
join public.students s on s.id = e.student_id
left join public.teachers t on t.id = c.teacher_id;

comment on view public.v_doi_soat_hoc_phi is
  'Doi soat hoc phi theo HOP DONG, khong theo dau nguoi. Lop nhom mot dong, liet ke du thanh vien.';

drop view if exists public.v_portal_hop_dong_nhom;
create view public.v_portal_hop_dong_nhom as
select
  cs.student_id,
  c.name        as ten_lop,
  nd.full_name  as nguoi_dung_ten,
  e.headcount   as si_so
from public.class_students cs
join public.classes c on c.id = cs.class_id
join public.student_enrollments e on e.class_id = c.id
join public.students nd on nd.id = e.student_id
where cs.status = 'active'
  and e.student_id <> cs.student_id
  and cs.student_id in (select public.fn_hoc_vien_cua_tai_khoan());

comment on view public.v_portal_hop_dong_nhom is
  'Cong hoc vien: bao cho thanh vien nhom biet hoc phi thuoc hop dong do ai dung ten. CO Y khong tra ve so tien.';

revoke all on public.v_portal_hop_dong_nhom from public, anon;
grant select on public.v_portal_hop_dong_nhom to authenticated;
