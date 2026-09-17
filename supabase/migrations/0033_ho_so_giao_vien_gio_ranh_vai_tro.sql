-- =============================================================================
-- 0033 — Hồ sơ giáo viên: mốc siết tháng 10, vai trò, giờ có thể nhận lớp
-- =============================================================================
--
-- FOUNDER CHỐT
--   "Tôi sẽ nhắc họ khắc phục trong tháng 9. Chúng ta sẽ làm nghiêm ngặt trong
--   tháng 10."  → dời mốc siết từ 01/09 sang 01/10/2026.
--   "Giáo viên đang còn dạy chính của tôi tên là cô Phương, cô Hoà, cô Sheba."
--
-- BA THỨ FOUNDER CẦN NHÌN, VÀ HIỆN TRẠNG TỪNG THỨ
--   1. Giờ giáo viên có thể nhận lớp → CHƯA CÓ CHỖ LƯU. Tạo bảng mới.
--   2. Ai dạy chính, ai dự phòng     → CHƯA CÓ CHỖ LƯU. Thêm cột.
--   3. Học viên gần nhất học ra sao,
--      cần cải thiện gì              → ĐÃ CÓ dữ liệu thật: 449 báo cáo, 448 có
--                                      điểm mạnh, 374 có phần cần cải thiện,
--                                      viết cụ thể. Chỉ cần dựng view (0034).
--
-- MỘT GIẢ ĐỊNH ĐƯỢC GHI RÕ THAY VÌ TỰ SUY
--   Founder nêu tên ba người dạy chính. KHÔNG suy ra những người còn lại là dự
--   phòng — cô Nhi vẫn giữ 5 khung lịch cố định và dạy đến 29/08. Ba người được
--   nêu tên đặt 'chinh'; những người đang hoạt động còn lại để NULL và hiển thị
--   là "chưa phân loại" để Founder tự xếp. Ô trống là trung thực; xếp bừa là
--   bịa ra một quyết định nhân sự.
--
-- VÌ SAO teacher_availability TÁCH KHỎI class_schedules
--   class_schedules là lịch ĐÃ XẾP THẬT, mỗi dòng gắn một lớp có học viên.
--   teacher_availability là KHẢ NĂNG NHẬN LỚP, không gắn lớp nào. Gộp hai thứ
--   vào một bảng sẽ không phân biệt được "cô rảnh 19h" với "19h cô đang dạy".
--   Đúng chỗ trống giữa hai bảng mới là chỗ xếp thêm học viên được.
-- =============================================================================

update public.settings
   set value = '"2026-10-01"'::jsonb,
       description = 'Tu ngay nay tro di, buoi day phai co gio vao/gio ra VA diem danh du si so thi moi sinh dong tinh luong. Founder chot: thang 9/2026 la thang nhac nho, siet that tu 01/10/2026. Doi ngay o day la doi duoc luat, khong can sua ma nguon.'
 where key = 'require_evidence_from';

alter table public.teachers add column if not exists teaching_role text;

alter table public.teachers drop constraint if exists chk_teachers_teaching_role;
alter table public.teachers add  constraint chk_teachers_teaching_role
  check (teaching_role is null or teaching_role in ('chinh', 'du_phong'));

comment on column public.teachers.teaching_role is
  'chinh = giao vien day chinh, du_phong = nhan lop khi can. NULL = chua phan loai, co y de trong chu khong doan.';

update public.teachers
   set teaching_role = 'chinh'
 where status = 'active'
   and full_name in ('Ms. Phương', 'Ms. Hòa', 'Ms. Sheba');

create table if not exists public.teacher_availability (
  id               uuid primary key default gen_random_uuid(),
  teacher_id       uuid not null references public.teachers(id) on delete cascade,
  weekday          smallint not null check (weekday between 0 and 6),
  start_time       time not null,
  end_time         time not null,
  note             text,
  status           public.record_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.users(id),
  constraint chk_availability_khung_gio check (end_time > start_time)
);

comment on table public.teacher_availability is
  'Khung gio giao vien co the nhan lop. weekday theo quy uoc Postgres dow: 0 = Chu nhat. Day la kha nang nhan lop, khac voi class_schedules la lich da xep that.';

create index if not exists idx_availability_teacher
  on public.teacher_availability (teacher_id, weekday, start_time);

alter table public.teacher_availability enable row level security;

drop policy if exists availability_founder_all  on public.teacher_availability;
drop policy if exists availability_teacher_read on public.teacher_availability;

create policy availability_founder_all on public.teacher_availability
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

-- Giáo viên đọc được khung giờ của chính mình, không thấy của đồng nghiệp.
create policy availability_teacher_read on public.teacher_availability
  for select to authenticated
  using (exists (select 1 from public.teachers t
                  where t.id = teacher_availability.teacher_id
                    and t.user_id = auth.uid()));

drop trigger if exists trg_availability_updated on public.teacher_availability;
create trigger trg_availability_updated
  before update on public.teacher_availability
  for each row execute function public.tg_set_updated_at();
