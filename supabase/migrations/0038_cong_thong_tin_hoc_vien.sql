-- =============================================================================
-- 0038 — Cổng thông tin học viên / phụ huynh (nền tảng)
-- =============================================================================
--
-- FOUNDER MUỐN: học viên và phụ huynh đăng nhập xem được tình hình học của
-- chính mình — từng buổi kèm video, điểm mạnh, điểm cần cải thiện, học phí và
-- đề xuất. Tuyệt đối không thấy lương giáo viên hay tài chính trung tâm.
--
-- HAI LOẠI NGƯỜI XEM, MỘT CƠ CHẾ
--   students.user_id  — học viên người lớn tự đăng nhập (Ms. Tuyết, Ms. Hằng…)
--   parents.user_id   — phụ huynh đăng nhập xem hồ sơ con
--   fn_hoc_vien_cua_tai_khoan() gộp cả hai đường về một danh sách id.
--
-- VÌ SAO DÙNG VIEW SECURITY DEFINER CHỨ KHÔNG MỞ RLS TRÊN MƯỜI BẢNG
--   Mở chính sách RLS cho vai trò phụ huynh trên students, lessons, attendance,
--   teaching_reports, recordings, enrollments, payments… là mở mười cánh cửa,
--   mỗi cánh một chỗ có thể viết sai. Ba view này là ba cánh cửa duy nhất:
--   chúng chỉ CHỌN đúng cột được phép thấy và lọc cứng theo auth.uid().
--   Cột lương giáo viên, giá vốn, điểm chấm chất lượng giáo viên không có mặt
--   trong view nên không có đường nào lộ ra.
--
--   Đổi lại, view chạy bằng quyền chủ sở hữu nên mệnh đề WHERE là hàng rào duy
--   nhất. Mỗi view đều lọc bằng đúng một biểu thức:
--       student_id in (select public.fn_hoc_vien_cua_tai_khoan())
--   Không view nào trong nhóm này được phép thiếu dòng đó.
--
-- VIDEO: chỉ trả về bản ghi hình có visible_to_parent = true.
--
-- XEM TIẾP 0039 và 0040 — hai lỗi phát hiện khi kiểm thử bằng phiên đăng nhập
-- thật của một tài khoản phụ huynh.
-- =============================================================================

alter table public.students add column if not exists user_id uuid
  references public.users(id) on delete set null;
alter table public.parents  add column if not exists user_id uuid
  references public.users(id) on delete set null;

comment on column public.students.user_id is
  'Tai khoan dang nhap cua chinh hoc vien (nguoi lon tu hoc). NULL neu chi phu huynh dang nhap.';
comment on column public.parents.user_id is
  'Tai khoan dang nhap cua phu huynh. Xem duoc ho so moi con lien ket qua student_parents.';

create unique index if not exists idx_students_user on public.students (user_id) where user_id is not null;
create unique index if not exists idx_parents_user  on public.parents  (user_id) where user_id is not null;

create or replace function public.fn_hoc_vien_cua_tai_khoan()
returns setof uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select s.id from public.students s
   where s.user_id = auth.uid() and auth.uid() is not null
  union
  select sp.student_id from public.student_parents sp
   join public.parents p on p.id = sp.parent_id
   where p.user_id = auth.uid() and auth.uid() is not null;
$$;

revoke execute on function public.fn_hoc_vien_cua_tai_khoan() from public;
revoke execute on function public.fn_hoc_vien_cua_tai_khoan() from anon;
grant  execute on function public.fn_hoc_vien_cua_tai_khoan() to authenticated;

-- Từng buổi học kèm nhận xét và video.
drop view if exists public.v_portal_buoi_hoc;
create view public.v_portal_buoi_hoc as
select
  a.student_id,
  l.id                as lesson_id,
  l.lesson_date,
  l.duration_minutes,
  c.name              as ten_lop,
  coalesce(t.display_name, t.full_name) as giao_vien,
  a.status::text      as diem_danh,
  r.lesson_content    as noi_dung,
  r.strengths         as diem_manh,
  r.improvements      as can_cai_thien,
  r.homework_summary  as bai_tap,
  r.next_lesson_recommendation as de_xuat,
  (select rec.url from public.recordings rec
    where rec.lesson_id = l.id and rec.visible_to_parent and rec.status = 'active'
    order by rec.created_at limit 1) as video
from public.attendance a
join public.lessons  l on l.id = a.lesson_id
join public.classes  c on c.id = l.class_id
left join public.teachers t on t.id = l.teacher_id
left join public.teaching_reports r on r.lesson_id = l.id
where l.status = 'completed'
  and a.student_id in (select public.fn_hoc_vien_cua_tai_khoan());

comment on view public.v_portal_buoi_hoc is
  'Cong hoc vien: tung buoi kem nhan xet va video cho phep phu huynh xem. Khong co diem cham chat luong giao vien.';

revoke all on public.v_portal_buoi_hoc from public, anon;
grant select on public.v_portal_buoi_hoc to authenticated;
