-- =============================================================================
-- 0004_classes_lessons.sql
-- Classes, enrolled students, recurring schedule, lessons, attendance
-- =============================================================================

create table if not exists public.classes (
  id                       uuid primary key default gen_random_uuid(),
  class_code               text unique,
  name                     text not null,
  program_id               uuid references public.programs (id) on delete set null,
  level_id                 uuid references public.levels (id) on delete set null,
  teacher_id               uuid references public.teachers (id) on delete set null,
  class_type               class_type not null default 'one_to_one',
  max_students             int not null default 1 check (max_students between 1 and 30),
  default_duration_minutes int not null default 60
                             check (default_duration_minutes in (30, 60, 90)),
  start_date               date,
  end_date                 date,
  status                   class_status not null default 'active',
  meeting_url              text,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  created_by               uuid references public.users (id),
  constraint chk_class_dates check (end_date is null or start_date is null or end_date >= start_date)
);

comment on column public.classes.default_duration_minutes is
  'Chuẩn 60 phút; hệ thống cho phép 30 / 60 / 90.';

create index if not exists idx_classes_teacher on public.classes (teacher_id) where status = 'active';
create index if not exists idx_classes_status on public.classes (status);

-- Deferred FK from 0003 (teacher_rates.class_id)
alter table public.teacher_rates
  drop constraint if exists fk_teacher_rates_class;
alter table public.teacher_rates
  add constraint fk_teacher_rates_class
  foreign key (class_id) references public.classes (id) on delete cascade;

create sequence if not exists public.seq_class_code start 1;
create or replace function public.tg_assign_class_code()
returns trigger language plpgsql as $$
begin
  if new.class_code is null then
    new.class_code := 'LH' || lpad(nextval('public.seq_class_code')::text, 4, '0');
  end if;
  return new;
end; $$;
create trigger trg_classes_code before insert on public.classes
  for each row execute function public.tg_assign_class_code();

-- -----------------------------------------------------------------------------
-- class_students
-- -----------------------------------------------------------------------------
create table if not exists public.class_students (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  joined_at  date not null default current_date,
  left_at    date,
  status     record_status not null default 'active',
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users (id),
  unique (class_id, student_id)
);

create index if not exists idx_class_students_student on public.class_students (student_id)
  where status = 'active';

-- -----------------------------------------------------------------------------
-- class_schedules - recurring weekly pattern
-- -----------------------------------------------------------------------------
create table if not exists public.class_schedules (
  id               uuid primary key default gen_random_uuid(),
  class_id         uuid not null references public.classes (id) on delete cascade,
  weekday          int not null check (weekday between 0 and 6), -- 0 = Chủ nhật
  start_time       time not null,
  duration_minutes int not null default 60 check (duration_minutes in (30, 60, 90)),
  timezone         text not null default 'Asia/Ho_Chi_Minh',
  effective_from   date not null default current_date,
  effective_to     date,
  status           record_status not null default 'active',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.users (id)
);

create index if not exists idx_class_schedules_class on public.class_schedules (class_id)
  where status = 'active';

-- -----------------------------------------------------------------------------
-- lessons - one concrete occurrence
-- -----------------------------------------------------------------------------
create table if not exists public.lessons (
  id                 uuid primary key default gen_random_uuid(),
  class_id           uuid not null references public.classes (id) on delete cascade,
  teacher_id         uuid references public.teachers (id) on delete set null,
  sequence_no        int,
  lesson_date        date not null,
  scheduled_start_at timestamptz not null,
  scheduled_end_at   timestamptz not null,
  actual_start_at    timestamptz,
  actual_end_at      timestamptz,
  duration_minutes   int,
  status             lesson_status not null default 'scheduled',
  is_makeup          boolean not null default false,
  topic              text,
  cancellation_reason text,
  report_due_at      timestamptz,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references public.users (id),
  constraint chk_lesson_schedule check (scheduled_end_at > scheduled_start_at),
  constraint chk_lesson_actual check (actual_end_at is null or actual_start_at is null
                                      or actual_end_at >= actual_start_at),
  unique (class_id, scheduled_start_at)
);

comment on column public.lessons.report_due_at is
  'Hạn nộp báo cáo = giờ kết thúc + settings.report_deadline_hours (mặc định 10h).';
comment on column public.lessons.duration_minutes is
  'Thời lượng thực tế; tính tự động từ actual_start/end, nếu thiếu thì lấy theo lịch.';

create index if not exists idx_lessons_class_date on public.lessons (class_id, lesson_date desc);
create index if not exists idx_lessons_teacher_date on public.lessons (teacher_id, lesson_date desc);
create index if not exists idx_lessons_status on public.lessons (status);
create index if not exists idx_lessons_report_due on public.lessons (report_due_at)
  where status = 'completed';

-- Derive duration + reporting deadline. A3: fall back to scheduled end time
-- when the teacher never pressed "kết thúc".
create or replace function public.tg_lessons_derive()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_end      timestamptz;
  v_deadline int := public.setting_int('report_deadline_hours', 10);
begin
  if new.actual_start_at is not null and new.actual_end_at is not null then
    new.duration_minutes := greatest(
      1, round(extract(epoch from (new.actual_end_at - new.actual_start_at)) / 60)::int);
  elsif new.duration_minutes is null then
    new.duration_minutes := round(
      extract(epoch from (new.scheduled_end_at - new.scheduled_start_at)) / 60)::int;
  end if;

  if new.status = 'completed' then
    v_end := coalesce(new.actual_end_at, new.scheduled_end_at);
    new.report_due_at := v_end + make_interval(hours => v_deadline);
  elsif new.status in ('cancelled','rescheduled') then
    new.report_due_at := null;
  end if;

  if new.teacher_id is null then
    select c.teacher_id into new.teacher_id from public.classes c where c.id = new.class_id;
  end if;

  return new;
end;
$$;

create trigger trg_lessons_derive
  before insert or update on public.lessons
  for each row execute function public.tg_lessons_derive();

create trigger trg_lessons_updated_at before update on public.lessons
  for each row execute function public.tg_set_updated_at();
create trigger trg_lessons_audit after insert or update or delete on public.lessons
  for each row execute function public.tg_audit();

-- -----------------------------------------------------------------------------
-- attendance
-- -----------------------------------------------------------------------------
create table if not exists public.attendance (
  id               uuid primary key default gen_random_uuid(),
  lesson_id        uuid not null references public.lessons (id) on delete cascade,
  student_id       uuid not null references public.students (id) on delete cascade,
  status           attendance_status not null default 'present',
  minutes_attended int,
  is_billable      boolean not null default true,
  notes            text,
  recorded_by      uuid references public.users (id),
  recorded_at      timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (lesson_id, student_id)
);

comment on column public.attendance.is_billable is
  'true = trừ buổi của học viên. Giả định A5: vắng có phép KHÔNG trừ, vắng không phép CÓ trừ.';

create index if not exists idx_attendance_student on public.attendance (student_id);

-- Default billability from attendance status (A5). Explicit overrides are kept:
-- only recompute when the status itself changes.
create or replace function public.tg_attendance_defaults()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    new.is_billable := new.status in ('present','late','absent_unexcused','no_show');
  end if;
  return new;
end; $$;

create trigger trg_attendance_defaults
  before insert or update on public.attendance
  for each row execute function public.tg_attendance_defaults();

create trigger trg_attendance_updated_at before update on public.attendance
  for each row execute function public.tg_set_updated_at();
create trigger trg_attendance_audit after insert or update or delete on public.attendance
  for each row execute function public.tg_audit();

-- -----------------------------------------------------------------------------
-- Helpers that depend on classes (used by RLS in 0011)
-- -----------------------------------------------------------------------------
create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.id from public.teachers t where t.user_id = auth.uid() and t.status = 'active';
$$;

create or replace function public.teaches_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id and c.teacher_id = public.current_teacher_id()
  ) or exists (
    select 1 from public.lessons l
    where l.class_id = p_class_id and l.teacher_id = public.current_teacher_id()
  );
$$;

create or replace function public.teaches_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = p_student_id
      and cs.status = 'active'
      and c.teacher_id = public.current_teacher_id()
  );
$$;

create or replace function public.teaches_lesson(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.lessons l
    where l.id = p_lesson_id
      and (l.teacher_id = public.current_teacher_id()
           or public.teaches_class(l.class_id))
  );
$$;

-- A student must actually belong to the lesson's class before a teacher may
-- record attendance for them — otherwise a teacher could consume an unrelated
-- student's lesson balance by attaching them to their own lesson.
create or replace function public.student_in_lesson_class(p_lesson_id uuid, p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lessons l
    join public.class_students cs on cs.class_id = l.class_id
    where l.id = p_lesson_id
      and cs.student_id = p_student_id
      and cs.status = 'active'
  );
$$;

grant execute on function public.student_in_lesson_class(uuid, uuid) to authenticated;
grant execute on function public.current_teacher_id() to authenticated;
grant execute on function public.teaches_class(uuid) to authenticated;
grant execute on function public.teaches_student(uuid) to authenticated;
grant execute on function public.teaches_lesson(uuid) to authenticated;
