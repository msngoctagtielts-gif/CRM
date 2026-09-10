-- =============================================================================
-- 0003_academic.sql
-- Programs, levels, teachers (+ rates), parents, students
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Programs & levels (reference data, editable by Founder)
-- -----------------------------------------------------------------------------
create table if not exists public.programs (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  name_vi         text not null,
  name_en         text,
  description     text,
  target_audience text,
  sort_order      int not null default 0,
  status          record_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references public.users (id)
);

create table if not exists public.levels (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name_vi     text not null,
  name_en     text,
  cefr_code   text,
  program_id  uuid references public.programs (id) on delete set null,
  description text,
  sort_order  int not null default 0,
  status      record_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references public.users (id)
);

-- -----------------------------------------------------------------------------
-- Teachers
-- -----------------------------------------------------------------------------
create table if not exists public.teachers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique references public.users (id) on delete set null,
  teacher_code  text unique,
  full_name     text not null,
  display_name  text,
  email         citext,
  phone         text,
  nationality   text,
  bio           text,
  specialties   text[],
  hired_date    date,
  status        record_status not null default 'active',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references public.users (id)
);

comment on column public.teachers.user_id is
  'Liên kết tới tài khoản đăng nhập. NULL = giáo viên chưa có tài khoản (vẫn tính lương được).';

-- Per-teacher pay rates. Frozen onto payable lessons at generation time,
-- so changing a rate never silently rewrites historical payroll.
create table if not exists public.teacher_rates (
  id               uuid primary key default gen_random_uuid(),
  teacher_id       uuid not null references public.teachers (id) on delete cascade,
  scope            text not null check (scope in ('default','duration','class')),
  duration_minutes int check (duration_minutes in (30, 60, 90)),
  class_id         uuid,  -- FK added in 0004 once classes exists
  rate_amount      numeric(14,2) not null check (rate_amount >= 0),
  currency         text not null default 'VND',
  effective_from   date not null default current_date,
  effective_to     date,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.users (id),
  constraint chk_rate_scope_shape check (
    (scope = 'duration' and duration_minutes is not null and class_id is null) or
    (scope = 'class'    and class_id is not null) or
    (scope = 'default'  and duration_minutes is null and class_id is null)
  ),
  constraint chk_rate_period check (effective_to is null or effective_to >= effective_from)
);

create index if not exists idx_teacher_rates_lookup
  on public.teacher_rates (teacher_id, scope, effective_from desc);

-- -----------------------------------------------------------------------------
-- Parents (own table so the Phase 5 parent portal can attach to auth later)
-- -----------------------------------------------------------------------------
create table if not exists public.parents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique references public.users (id) on delete set null,
  full_name  text not null,
  phone      text,
  email      citext,
  zalo       text,
  facebook   text,
  address    text,
  occupation text,
  notes      text,
  status     record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users (id)
);

create index if not exists idx_parents_phone on public.parents (phone);

-- -----------------------------------------------------------------------------
-- Students
-- -----------------------------------------------------------------------------
create table if not exists public.students (
  id                uuid primary key default gen_random_uuid(),
  student_code      text unique,
  full_name         text not null,
  nickname          text,
  date_of_birth     date,
  gender            text check (gender in ('male','female','other')),
  phone             text,
  email             citext,
  address           text,
  program_id        uuid references public.programs (id) on delete set null,
  current_level_id  uuid references public.levels (id) on delete set null,
  status            student_status not null default 'lead',
  enrollment_date   date,
  source            text,
  learning_goal     text,
  learning_notes    text,
  internal_notes    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references public.users (id)
);

comment on column public.students.status is
  'lead → placement → trial → active → paused/completed/inactive';
comment on column public.students.internal_notes is
  'Ghi chú nội bộ. KHÔNG hiển thị cho cổng phụ huynh ở Giai đoạn 5.';

create index if not exists idx_students_status on public.students (status);
create index if not exists idx_students_name on public.students using gin (to_tsvector('simple', full_name));

-- Age is always derived, never stored (it would go stale).
create or replace function public.student_age(p_dob date)
returns int
language sql
immutable
as $$
  select case when p_dob is null then null
              else extract(year from age(current_date, p_dob))::int end;
$$;

-- Many-to-many: a student can have two guardians; a guardian several children.
create table if not exists public.student_parents (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students (id) on delete cascade,
  parent_id    uuid not null references public.parents (id) on delete cascade,
  relationship text not null default 'parent',
  is_primary   boolean not null default true,
  created_at   timestamptz not null default now(),
  created_by   uuid references public.users (id),
  unique (student_id, parent_id)
);

-- At most one primary guardian per student.
create unique index if not exists uq_student_primary_parent
  on public.student_parents (student_id) where is_primary;

-- -----------------------------------------------------------------------------
-- Human-readable codes (HV0001, GV0001, ...)
-- -----------------------------------------------------------------------------
create sequence if not exists public.seq_student_code start 1;
create sequence if not exists public.seq_teacher_code start 1;

create or replace function public.tg_assign_student_code()
returns trigger language plpgsql as $$
begin
  if new.student_code is null then
    new.student_code := 'HV' || lpad(nextval('public.seq_student_code')::text, 4, '0');
  end if;
  return new;
end; $$;

create or replace function public.tg_assign_teacher_code()
returns trigger language plpgsql as $$
begin
  if new.teacher_code is null then
    new.teacher_code := 'GV' || lpad(nextval('public.seq_teacher_code')::text, 3, '0');
  end if;
  return new;
end; $$;

create trigger trg_students_code before insert on public.students
  for each row execute function public.tg_assign_student_code();
create trigger trg_teachers_code before insert on public.teachers
  for each row execute function public.tg_assign_teacher_code();

-- updated_at + audit
create trigger trg_programs_updated_at before update on public.programs
  for each row execute function public.tg_set_updated_at();
create trigger trg_levels_updated_at before update on public.levels
  for each row execute function public.tg_set_updated_at();
create trigger trg_teachers_updated_at before update on public.teachers
  for each row execute function public.tg_set_updated_at();
create trigger trg_teacher_rates_updated_at before update on public.teacher_rates
  for each row execute function public.tg_set_updated_at();
create trigger trg_parents_updated_at before update on public.parents
  for each row execute function public.tg_set_updated_at();
create trigger trg_students_updated_at before update on public.students
  for each row execute function public.tg_set_updated_at();

create trigger trg_students_audit after insert or update or delete on public.students
  for each row execute function public.tg_audit();
create trigger trg_teachers_audit after insert or update or delete on public.teachers
  for each row execute function public.tg_audit();
create trigger trg_teacher_rates_audit after insert or update or delete on public.teacher_rates
  for each row execute function public.tg_audit();
