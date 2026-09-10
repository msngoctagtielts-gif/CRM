-- =============================================================================
-- 0008_crm.sql
-- Lead pipeline, placement tests, trial classes (tables built now so Phase 3
-- needs no production schema change; UI arrives in Phase 3).
-- =============================================================================

create table if not exists public.leads (
  id                  uuid primary key default gen_random_uuid(),
  lead_code           text unique,
  full_name           text not null,
  date_of_birth       date,
  age                 int check (age between 1 and 120),
  phone               text,
  email               citext,
  parent_name         text,
  parent_phone        text,
  source              text,
  program_interest_id uuid references public.programs (id) on delete set null,
  current_level_id    uuid references public.levels (id) on delete set null,
  goal                text,
  assigned_to         uuid references public.users (id) on delete set null,
  status              lead_status not null default 'new',
  next_follow_up_at   timestamptz,
  notes               text,
  converted_student_id uuid references public.students (id) on delete set null,
  converted_at        timestamptz,
  lost_reason         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references public.users (id)
);

comment on column public.leads.age is
  'Tuổi khai báo khi chưa biết ngày sinh. Nếu có date_of_birth thì tuổi suy ra từ đó.';
comment on column public.leads.status is
  'new → contacted → consultation → placement_test → trial → follow_up → enrolled | lost';

create index if not exists idx_leads_status on public.leads (status);
create index if not exists idx_leads_followup on public.leads (next_follow_up_at)
  where status not in ('enrolled','lost');

create sequence if not exists public.seq_lead_code start 1;
create or replace function public.tg_assign_lead_code()
returns trigger language plpgsql as $$
begin
  if new.lead_code is null then
    new.lead_code := 'LD' || lpad(nextval('public.seq_lead_code')::text, 5, '0');
  end if;
  return new;
end; $$;
create trigger trg_leads_code before insert on public.leads
  for each row execute function public.tg_assign_lead_code();

create table if not exists public.lead_activities (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads (id) on delete cascade,
  activity_type text not null check (activity_type in
                  ('call','message','meeting','email','note','status_change')),
  content       text,
  occurred_at   timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  created_by    uuid references public.users (id)
);

create index if not exists idx_lead_activities_lead
  on public.lead_activities (lead_id, occurred_at desc);

-- -----------------------------------------------------------------------------
-- placement_tests
-- -----------------------------------------------------------------------------
create table if not exists public.placement_tests (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid references public.leads (id) on delete cascade,
  student_id       uuid references public.students (id) on delete cascade,
  scheduled_at     timestamptz,
  conducted_at     timestamptz,
  conducted_by     uuid references public.teachers (id) on delete set null,
  test_type        text,
  listening_score  numeric(5,2),
  speaking_score   numeric(5,2),
  reading_score    numeric(5,2),
  writing_score    numeric(5,2),
  overall_score    numeric(5,2),
  result_level_id  uuid references public.levels (id) on delete set null,
  recommendation   text,
  notes            text,
  status           text not null default 'scheduled'
                     check (status in ('scheduled','completed','cancelled','no_show')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.users (id),
  constraint chk_placement_subject check (lead_id is not null or student_id is not null)
);

-- -----------------------------------------------------------------------------
-- trial_classes
-- -----------------------------------------------------------------------------
create table if not exists public.trial_classes (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid references public.leads (id) on delete cascade,
  student_id       uuid references public.students (id) on delete cascade,
  class_id         uuid references public.classes (id) on delete set null,
  lesson_id        uuid references public.lessons (id) on delete set null,
  teacher_id       uuid references public.teachers (id) on delete set null,
  scheduled_at     timestamptz not null,
  duration_minutes int not null default 60 check (duration_minutes in (30, 60, 90)),
  status           text not null default 'scheduled'
                     check (status in ('scheduled','completed','cancelled','no_show')),
  outcome          text check (outcome in ('enrolled','follow_up','lost','undecided')),
  teacher_feedback text,
  parent_feedback  text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.users (id),
  constraint chk_trial_subject check (lead_id is not null or student_id is not null)
);

create index if not exists idx_trials_scheduled on public.trial_classes (scheduled_at desc);

create trigger trg_leads_updated_at before update on public.leads
  for each row execute function public.tg_set_updated_at();
create trigger trg_placement_updated_at before update on public.placement_tests
  for each row execute function public.tg_set_updated_at();
create trigger trg_trials_updated_at before update on public.trial_classes
  for each row execute function public.tg_set_updated_at();
create trigger trg_leads_audit after insert or update or delete on public.leads
  for each row execute function public.tg_audit();
