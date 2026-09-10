-- =============================================================================
-- 0005_teaching_reports.sql
-- Daily teaching report, per-student feedback, homework, recordings,
-- completeness evaluation and the 10-hour quality alert.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- homework (structured assignment; source of truth for "có bài tập chưa?")
-- -----------------------------------------------------------------------------
create table if not exists public.homework (
  id             uuid primary key default gen_random_uuid(),
  lesson_id      uuid references public.lessons (id) on delete cascade,
  class_id       uuid references public.classes (id) on delete cascade,
  student_id     uuid references public.students (id) on delete cascade,
  title          text not null,
  description    text,
  due_date       date,
  attachment_url text,
  assigned_by    uuid references public.users (id),
  status         record_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references public.users (id),
  constraint chk_homework_scope check (lesson_id is not null or class_id is not null)
);

comment on column public.homework.student_id is
  'NULL = bài tập cho cả lớp. Có giá trị = bài tập riêng cho một học viên.';

create index if not exists idx_homework_lesson on public.homework (lesson_id)
  where status = 'active';

-- -----------------------------------------------------------------------------
-- recordings
-- -----------------------------------------------------------------------------
create table if not exists public.recordings (
  id                uuid primary key default gen_random_uuid(),
  lesson_id         uuid references public.lessons (id) on delete cascade,
  class_id          uuid references public.classes (id) on delete cascade,
  url               text not null,
  provider          text,            -- google_drive | youtube | zoom | other
  title             text,
  duration_seconds  int,
  visible_to_parent boolean not null default true,
  uploaded_by       uuid references public.users (id),
  status            record_status not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint chk_recording_scope check (lesson_id is not null or class_id is not null),
  constraint chk_recording_url check (url ~* '^https?://')
);

create index if not exists idx_recordings_lesson on public.recordings (lesson_id)
  where status = 'active';

-- -----------------------------------------------------------------------------
-- teaching_reports - one per lesson (class level)
-- -----------------------------------------------------------------------------
create table if not exists public.teaching_reports (
  id                        uuid primary key default gen_random_uuid(),
  lesson_id                 uuid not null unique references public.lessons (id) on delete cascade,
  class_id                  uuid not null references public.classes (id) on delete cascade,
  teacher_id                uuid references public.teachers (id) on delete set null,
  report_date               date not null default current_date,
  start_time                timestamptz,
  end_time                  timestamptz,
  duration_minutes          int,
  lesson_content            text,
  homework_summary          text,
  teacher_comments          text,
  next_lesson_recommendation text,
  status                    report_status not null default 'draft',
  missing_fields            text[] not null default '{}',
  submitted_at              timestamptz,
  completed_at              timestamptz,
  is_late                   boolean not null default false,
  reviewed_by               uuid references public.users (id),
  reviewed_at               timestamptz,
  review_notes              text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  created_by                uuid references public.users (id)
);

comment on table public.teaching_reports is
  'Báo cáo giảng dạy cấp buổi học. Nhận xét riêng từng học viên nằm ở teaching_report_students.';
comment on column public.teaching_reports.submitted_at is
  'Thời điểm giáo viên bấm nộp lần đầu (có thể còn thiếu trường).';
comment on column public.teaching_reports.completed_at is
  'Thời điểm báo cáo ĐỦ toàn bộ trường bắt buộc. So với lessons.report_due_at để biết trễ.';
comment on column public.teaching_reports.is_late is
  'true = báo cáo chưa đủ trường khi hết hạn 10 giờ. Đây mới là "nộp trễ" theo nghĩa vận hành.';
comment on column public.teaching_reports.missing_fields is
  'Các trường bắt buộc còn thiếu: homework | recording | teacher_comments | start_time | end_time.';

create index if not exists idx_reports_status on public.teaching_reports (status);
create index if not exists idx_reports_teacher on public.teaching_reports (teacher_id, report_date desc);

-- Per-student feedback (1 row for a 1-1 class, N rows for a group class)
create table if not exists public.teaching_report_students (
  id                  uuid primary key default gen_random_uuid(),
  report_id           uuid not null references public.teaching_reports (id) on delete cascade,
  student_id          uuid not null references public.students (id) on delete cascade,
  attitude            text check (attitude in
                        ('excellent','good','average','needs_improvement','concerning')),
  performance         text check (performance in
                        ('excellent','good','average','needs_improvement','concerning')),
  comments            text,
  recommendation      text,
  homework_completion text check (homework_completion in
                        ('completed','partial','not_done','not_assigned')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (report_id, student_id)
);

-- -----------------------------------------------------------------------------
-- Completeness evaluation
-- Required operational fields (assumption A4): homework, recording,
-- teacher comments — plus start/end time which drive duration & payroll.
-- -----------------------------------------------------------------------------
create or replace function public.fn_report_missing_fields(p_report_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r       public.teaching_reports;
  missing text[] := '{}';
begin
  select * into r from public.teaching_reports where id = p_report_id;
  if not found then return array['report']; end if;

  -- Homework: a structured row for the lesson, or a written summary.
  if not exists (
    select 1 from public.homework h
    where h.lesson_id = r.lesson_id and h.status = 'active'
  ) and coalesce(trim(r.homework_summary), '') = '' then
    missing := missing || 'homework'::text;
  end if;

  -- Recording / video link
  if not exists (
    select 1 from public.recordings rec
    where rec.lesson_id = r.lesson_id and rec.status = 'active'
  ) then
    missing := missing || 'recording'::text;
  end if;

  if coalesce(trim(r.teacher_comments), '') = '' then
    missing := missing || 'teacher_comments'::text;
  end if;

  if r.start_time is null then missing := missing || 'start_time'::text; end if;
  if r.end_time   is null then missing := missing || 'end_time'::text;   end if;

  return missing;
end;
$$;

-- Recompute status + missing_fields for one report.
-- Never downgrades a report the Founder already approved.
create or replace function public.fn_refresh_report_status(p_report_id uuid)
returns public.teaching_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  r            public.teaching_reports;
  v_missing    text[];
  v_due        timestamptz;
  v_status     report_status;
  v_complete   boolean;
  v_completed_at timestamptz;
begin
  select * into r from public.teaching_reports where id = p_report_id;
  if not found then return null; end if;

  v_missing  := public.fn_report_missing_fields(p_report_id);
  v_complete := array_length(v_missing, 1) is null;
  select l.report_due_at into v_due from public.lessons l where l.id = r.lesson_id;

  -- completed_at records the first moment the report had every required field.
  -- If a field is later removed the report is no longer complete, so it clears.
  if v_complete then
    v_completed_at := coalesce(r.completed_at, now());
  else
    v_completed_at := null;
  end if;

  if r.status = 'approved' then
    v_status := 'approved';
  elsif v_complete then
    v_status := 'submitted';
  elsif v_due is not null and now() > v_due then
    v_status := 'incomplete';
  else
    -- Still inside the deadline window but missing required fields:
    -- stays actionable as a draft until the teacher completes it.
    v_status := 'draft';
  end if;

  update public.teaching_reports
     set missing_fields = v_missing,
         status         = v_status,
         completed_at   = v_completed_at,
         -- Late = not complete by the deadline. An incomplete report that is
         -- already past due counts as late right now (coalesce to now()).
         is_late        = (v_due is not null and coalesce(v_completed_at, now()) > v_due),
         duration_minutes = case
           when start_time is not null and end_time is not null
             then greatest(1, round(extract(epoch from (end_time - start_time)) / 60)::int)
           else duration_minutes end,
         updated_at     = now()
   where id = p_report_id
  returning * into r;

  return r;
end;
$$;

-- Keep report status fresh whenever the report, its homework or its
-- recordings change.
create or replace function public.tg_refresh_report_from_report()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.fn_refresh_report_status(new.id);
  return new;
end; $$;

create trigger trg_report_refresh
  after insert or update of homework_summary, teacher_comments, start_time, end_time,
                            lesson_content, submitted_at
  on public.teaching_reports
  for each row execute function public.tg_refresh_report_from_report();

create or replace function public.tg_refresh_report_from_child()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_lesson uuid := coalesce(new.lesson_id, old.lesson_id);
  v_report uuid;
begin
  if v_lesson is null then return coalesce(new, old); end if;
  select id into v_report from public.teaching_reports where lesson_id = v_lesson;
  if v_report is not null then
    perform public.fn_refresh_report_status(v_report);
  end if;
  return coalesce(new, old);
end; $$;

create trigger trg_homework_refresh_report
  after insert or update or delete on public.homework
  for each row execute function public.tg_refresh_report_from_child();

create trigger trg_recordings_refresh_report
  after insert or update or delete on public.recordings
  for each row execute function public.tg_refresh_report_from_child();

-- Denormalise class_id / teacher_id from the lesson so RLS stays cheap.
create or replace function public.tg_report_fill_from_lesson()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select l.class_id, coalesce(new.teacher_id, l.teacher_id), l.lesson_date
    into new.class_id, new.teacher_id, new.report_date
  from public.lessons l where l.id = new.lesson_id;
  return new;
end; $$;

create trigger trg_report_fill_from_lesson
  before insert on public.teaching_reports
  for each row execute function public.tg_report_fill_from_lesson();

create trigger trg_reports_updated_at before update on public.teaching_reports
  for each row execute function public.tg_set_updated_at();
create trigger trg_reports_audit after insert or update or delete on public.teaching_reports
  for each row execute function public.tg_audit();
create trigger trg_report_students_updated_at before update on public.teaching_report_students
  for each row execute function public.tg_set_updated_at();
create trigger trg_homework_updated_at before update on public.homework
  for each row execute function public.tg_set_updated_at();
create trigger trg_recordings_updated_at before update on public.recordings
  for each row execute function public.tg_set_updated_at();

grant execute on function public.fn_report_missing_fields(uuid) to authenticated;
grant execute on function public.fn_refresh_report_status(uuid) to authenticated;
