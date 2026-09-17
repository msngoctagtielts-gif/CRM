-- =============================================================================
-- 0034 — Ba view phục vụ màn hình hồ sơ giáo viên
-- =============================================================================
--
--   v_ho_so_giao_vien        — một dòng mỗi giáo viên: vai trò, tải dạy, tổng
--                              buổi và tổng lương trọn đời.
--   v_hoc_vien_cua_giao_vien — mỗi cặp giáo viên × học viên một dòng, lấy buổi
--                              gần nhất kèm điểm mạnh và phần cần cải thiện
--                              nguyên văn từ báo cáo buổi dạy.
--   v_trung_lich_giao_vien   — hai lớp của cùng một giáo viên bị chồng giờ.
--
-- VÌ SAO CÓ VIEW TRÙNG LỊCH
--   Khi rà soát lịch hiện có, tìm thấy một trường hợp thật: Ms. Phương Chủ nhật
--   có lớp 10:00 (60 phút) và lớp 10:15 (60 phút) — đè nhau 45 phút. Không màn
--   hình nào phát hiện được, chỉ đến buổi học mới vỡ. Điều kiện chồng giờ định
--   nghĩa một lần ở đây để mọi màn hình dùng chung.
--
-- Cả ba đều security_invoker: RLS của bảng gốc quyết định ai thấy gì.
-- =============================================================================

drop view if exists public.v_ho_so_giao_vien;
create view public.v_ho_so_giao_vien
with (security_invoker = on) as
select
  t.id, t.teacher_code, t.full_name, t.display_name, t.email, t.phone,
  t.nationality, t.hired_date, t.ended_date, t.end_reason, t.bio,
  t.user_id, t.status::text as trang_thai, t.teaching_role as vai_tro,
  (select count(*) from public.classes c
     where c.teacher_id = t.id and c.status = 'active')            as lop_dang_day,
  (select count(*) from public.teacher_payable_lessons p
     where p.teacher_id = t.id)                                    as tong_buoi,
  (select sum(p.amount) from public.teacher_payable_lessons p
     where p.teacher_id = t.id)                                    as tong_luong,
  (select max(p.lesson_date) from public.teacher_payable_lessons p
     where p.teacher_id = t.id)                                    as buoi_gan_nhat,
  (select count(*) from public.class_schedules cs
     join public.classes c on c.id = cs.class_id
    where c.teacher_id = t.id and c.status = 'active')             as so_khung_lich,
  (select coalesce(sum(cs.duration_minutes), 0) from public.class_schedules cs
     join public.classes c on c.id = cs.class_id
    where c.teacher_id = t.id and c.status = 'active')             as phut_moi_tuan,
  (select count(*) from public.teacher_availability av
    where av.teacher_id = t.id and av.status = 'active')           as so_khung_ranh
from public.teachers t;

comment on view public.v_ho_so_giao_vien is
  'Mot dong moi giao vien: vai tro, trang thai, tai day, tong buoi va tong luong tron doi.';

drop view if exists public.v_hoc_vien_cua_giao_vien;
create view public.v_hoc_vien_cua_giao_vien
with (security_invoker = on) as
with buoi as (
  select l.teacher_id, a.student_id, l.id as lesson_id, l.lesson_date, l.class_id,
         row_number() over (
           partition by l.teacher_id, a.student_id
           order by l.lesson_date desc, l.created_at desc) as rn
  from public.lessons l
  join public.attendance a on a.lesson_id = l.id
  where l.status = 'completed' and l.teacher_id is not null
)
select
  b.teacher_id,
  b.student_id,
  s.full_name              as ten_hoc_vien,
  s.student_code,
  s.status::text           as trang_thai_hv,
  c.id                     as class_id,
  c.name                   as ten_lop,
  c.status::text           as trang_thai_lop,
  b.lesson_id,
  b.lesson_date            as buoi_gan_nhat,
  (current_date - b.lesson_date) as ngay_ke_tu_buoi_cuoi,
  r.lesson_content         as noi_dung_buoi,
  r.strengths              as diem_manh,
  r.improvements           as can_cai_thien,
  r.homework_summary       as bai_tap,
  r.qc_score,
  (select count(*) from public.lessons l2
     join public.attendance a2 on a2.lesson_id = l2.id
    where l2.teacher_id = b.teacher_id
      and a2.student_id = b.student_id
      and l2.status = 'completed')  as tong_buoi_voi_gv
from buoi b
join public.students s on s.id = b.student_id
join public.classes  c on c.id = b.class_id
left join public.teaching_reports r on r.lesson_id = b.lesson_id
where b.rn = 1;

comment on view public.v_hoc_vien_cua_giao_vien is
  'Moi cap giao vien x hoc vien mot dong, lay buoi hoc gan nhat cua cap do kem diem manh va phan can cai thien tu bao cao buoi day.';

drop view if exists public.v_trung_lich_giao_vien;
create view public.v_trung_lich_giao_vien
with (security_invoker = on) as
select
  c1.teacher_id,
  t.full_name          as ten_giao_vien,
  cs1.weekday,
  cs1.start_time       as gio_lop_1,
  cs1.duration_minutes as phut_lop_1,
  c1.name              as lop_1,
  cs2.start_time       as gio_lop_2,
  cs2.duration_minutes as phut_lop_2,
  c2.name              as lop_2
from public.class_schedules cs1
join public.classes c1 on c1.id = cs1.class_id and c1.status = 'active'
join public.class_schedules cs2 on cs2.weekday = cs1.weekday and cs2.id > cs1.id
join public.classes c2 on c2.id = cs2.class_id and c2.status = 'active'
join public.teachers t on t.id = c1.teacher_id
where c1.teacher_id is not null
  and c1.teacher_id = c2.teacher_id
  and cs1.start_time < (cs2.start_time + make_interval(mins => cs2.duration_minutes))
  and cs2.start_time < (cs1.start_time + make_interval(mins => cs1.duration_minutes));

comment on view public.v_trung_lich_giao_vien is
  'Hai khung lich cua cung mot giao vien bi chong gio trong cung mot thu. Dung de phat hien loi xep lich truoc khi den buoi hoc.';
