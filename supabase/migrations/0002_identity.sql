-- =============================================================================
-- 0002_identity.sql
-- Roles, application users (mirror of auth.users), permission helpers
-- =============================================================================

create table if not exists public.roles (
  code        text primary key,
  name_vi     text not null,
  name_en     text not null,
  description text,
  sort_order  int not null default 0
);

insert into public.roles (code, name_vi, name_en, description, sort_order) values
  ('founder', 'Founder / Quản trị', 'Founder / Admin',
   'Toàn quyền: tài chính, lương, học viên, duyệt điều chỉnh', 1),
  ('teacher', 'Giáo viên', 'Teacher',
   'Chỉ lớp và học viên được phân công; nộp báo cáo giảng dạy', 2),
  ('staff', 'Nhân viên', 'Staff',
   'Giai đoạn 3: vận hành & tuyển sinh, không xem lợi nhuận', 3),
  ('parent', 'Phụ huynh / Học viên', 'Parent / Student',
   'Giai đoạn 5: cổng thông tin, chỉ xem dữ liệu của con mình', 4)
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- public.users - application profile, 1:1 with auth.users
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       citext not null unique,
  full_name   text not null,
  phone       text,
  role_code   text not null references public.roles (code) default 'teacher',
  avatar_url  text,
  locale      text not null default 'vi' check (locale in ('vi','en')),
  is_active   boolean not null default true,
  last_seen_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references public.users (id)
);

comment on table public.users is
  'Hồ sơ người dùng ứng dụng. id trùng auth.users.id. Vai trò lưu ở role_code.';

create index if not exists idx_users_role on public.users (role_code) where is_active;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.tg_set_updated_at();

create trigger trg_users_audit
  after insert or update or delete on public.users
  for each row execute function public.tg_audit();

-- Auto-create a profile row when a Supabase Auth user is created.
-- Role defaults to 'teacher' (least privilege); Founder promotes manually.
create or replace function public.tg_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role_code)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'role_code', ''), 'teacher')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- Permission helpers.
-- SECURITY DEFINER so they can read public.users without tripping its own RLS.
-- -----------------------------------------------------------------------------
create or replace function public.current_role_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.role_code
  from public.users u
  where u.id = auth.uid() and u.is_active;
$$;

create or replace function public.is_founder()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_code() = 'founder', false);
$$;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_code() = 'teacher', false);
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role_code() = 'staff', false);
$$;

grant execute on function public.current_role_code() to authenticated;
grant execute on function public.is_founder() to authenticated;
grant execute on function public.is_teacher() to authenticated;
grant execute on function public.is_staff() to authenticated;
