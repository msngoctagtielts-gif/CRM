-- =============================================================================
-- 0007_payroll.sql
-- Teacher payroll derived from COMPLETED lessons - never typed in by hand.
--
-- Flow (section X of the brief):
--   lesson completed -> valid teaching report -> attendance recorded
--     -> teacher_payable_lessons row generated (rate frozen)
--        -> aggregated into teacher_payroll -> Founder approves -> paid
-- =============================================================================

-- Resolve the rate to apply: a class-specific rate wins, then a rate for that
-- duration, then the teacher's default rate.
create or replace function public.fn_resolve_teacher_rate(
  p_teacher_id uuid,
  p_duration_minutes int,
  p_class_id uuid,
  p_on_date date default current_date
)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select r.rate_amount
  from public.teacher_rates r
  where r.teacher_id = p_teacher_id
    and r.effective_from <= p_on_date
    and (r.effective_to is null or r.effective_to >= p_on_date)
    and (
      (r.scope = 'class'    and r.class_id = p_class_id) or
      (r.scope = 'duration' and r.duration_minutes = p_duration_minutes) or
      (r.scope = 'default')
    )
  order by case r.scope when 'class' then 0 when 'duration' then 1 else 2 end,
           r.effective_from desc
  limit 1;
$$;

-- -----------------------------------------------------------------------------
-- teacher_payable_lessons - one row per lesson a teacher has earned
-- -----------------------------------------------------------------------------
create table if not exists public.teacher_payable_lessons (
  id               uuid primary key default gen_random_uuid(),
  teacher_id       uuid not null references public.teachers (id) on delete cascade,
  lesson_id        uuid not null unique references public.lessons (id) on delete cascade,
  class_id         uuid references public.classes (id) on delete set null,
  lesson_date      date not null,
  duration_minutes int not null,
  rate_amount      numeric(14,2) not null,
  amount           numeric(14,2) not null,
  currency         text not null default 'VND',
  status           payable_status not null default 'pending',
  payroll_id       uuid,  -- FK added below
  rate_source      text,  -- class | duration | default | missing
  notes            text,
  generated_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.teacher_payable_lessons is
  'Đơn giá được ĐÓNG BĂNG tại thời điểm sinh dòng (rủi ro R6) - đổi đơn giá không làm sai lương cũ.';

create index if not exists idx_payable_teacher_date
  on public.teacher_payable_lessons (teacher_id, lesson_date desc);
create index if not exists idx_payable_pending
  on public.teacher_payable_lessons (teacher_id) where status = 'pending';

-- -----------------------------------------------------------------------------
-- teacher_payroll - a pay period
-- -----------------------------------------------------------------------------
create table if not exists public.teacher_payroll (
  id                 uuid primary key default gen_random_uuid(),
  teacher_id         uuid not null references public.teachers (id) on delete restrict,
  period_start       date not null,
  period_end         date not null,
  period_label       text,
  lessons_count      int not null default 0,
  teaching_minutes   int not null default 0,
  gross_amount       numeric(14,2) not null default 0,
  adjustments_amount numeric(14,2) not null default 0,
  final_amount       numeric(14,2) not null default 0,
  currency           text not null default 'VND',
  status             payroll_status not null default 'draft',
  notes              text,
  approved_by        uuid references public.users (id),
  approved_at        timestamptz,
  paid_at            timestamptz,
  paid_method        payment_method,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references public.users (id),
  constraint chk_payroll_period check (period_end >= period_start),
  unique (teacher_id, period_start, period_end)
);

comment on column public.teacher_payroll.status is
  'draft → pending_review → approved → paid. Chỉ Founder được chuyển sang approved/paid.';

alter table public.teacher_payable_lessons
  drop constraint if exists fk_payable_payroll;
alter table public.teacher_payable_lessons
  add constraint fk_payable_payroll
  foreign key (payroll_id) references public.teacher_payroll (id) on delete set null;

alter table public.expenses drop constraint if exists fk_expenses_payroll;
alter table public.expenses
  add constraint fk_expenses_payroll
  foreign key (payroll_id) references public.teacher_payroll (id) on delete set null;

create table if not exists public.teacher_payroll_adjustments (
  id          uuid primary key default gen_random_uuid(),
  payroll_id  uuid not null references public.teacher_payroll (id) on delete cascade,
  kind        text not null check (kind in ('bonus','deduction','allowance','correction')),
  description text not null,
  amount      numeric(14,2) not null,
  created_at  timestamptz not null default now(),
  created_by  uuid references public.users (id)
);

comment on column public.teacher_payroll_adjustments.amount is
  'Số dương = cộng thêm, số âm = trừ đi. Tổng được dồn vào teacher_payroll.adjustments_amount.';

-- -----------------------------------------------------------------------------
-- Generating a payable lesson
-- A lesson is payable when: status = completed
--                        AND a teaching report exists with no missing fields
--                        AND attendance has been recorded for every student
-- (assumptions A6, A7, A10, A11)
-- -----------------------------------------------------------------------------
create or replace function public.fn_generate_payable_lesson(p_lesson_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l             public.lessons;
  v_report_ok   boolean;
  v_students    int;
  v_attendance  int;
  v_rate        numeric(14,2);
  v_source      text;
  v_duration    int;
begin
  select * into l from public.lessons where id = p_lesson_id;
  if not found or l.teacher_id is null then return; end if;

  -- Not completed any more: withdraw the payable row unless already paid.
  if l.status <> 'completed' then
    delete from public.teacher_payable_lessons
     where lesson_id = p_lesson_id and status in ('pending','excluded');
    return;
  end if;

  select exists (
    select 1 from public.teaching_reports tr
    where tr.lesson_id = p_lesson_id
      and tr.status in ('submitted','approved')
      and array_length(tr.missing_fields, 1) is null
  ) into v_report_ok;

  select count(*) into v_students
    from public.class_students cs
   where cs.class_id = l.class_id and cs.status = 'active';

  select count(*) into v_attendance
    from public.attendance a where a.lesson_id = p_lesson_id;

  if not v_report_ok or v_attendance = 0 or v_attendance < v_students then
    delete from public.teacher_payable_lessons
     where lesson_id = p_lesson_id and status = 'pending';
    return;
  end if;

  -- Already locked into an approved/paid payroll: leave it alone.
  if exists (select 1 from public.teacher_payable_lessons
              where lesson_id = p_lesson_id and status in ('included','paid')) then
    return;
  end if;

  v_duration := coalesce(l.duration_minutes, 60);
  v_rate := public.fn_resolve_teacher_rate(l.teacher_id, v_duration, l.class_id, l.lesson_date);

  select case when r.scope is null then 'missing' else r.scope end into v_source
  from (
    select scope from public.teacher_rates
     where teacher_id = l.teacher_id
       and effective_from <= l.lesson_date
       and (effective_to is null or effective_to >= l.lesson_date)
       and ((scope = 'class' and class_id = l.class_id)
            or (scope = 'duration' and duration_minutes = v_duration)
            or scope = 'default')
     order by case scope when 'class' then 0 when 'duration' then 1 else 2 end
     limit 1
  ) r;

  insert into public.teacher_payable_lessons (
    teacher_id, lesson_id, class_id, lesson_date, duration_minutes,
    rate_amount, amount, status, rate_source, notes)
  values (
    l.teacher_id, p_lesson_id, l.class_id, l.lesson_date, v_duration,
    coalesce(v_rate, 0), coalesce(v_rate, 0), 'pending', coalesce(v_source, 'missing'),
    case when v_rate is null
         then 'Chưa cấu hình đơn giá cho giáo viên này - cần Founder bổ sung' end)
  on conflict (lesson_id) do update
    set duration_minutes = excluded.duration_minutes,
        rate_amount      = excluded.rate_amount,
        amount           = excluded.amount,
        rate_source      = excluded.rate_source,
        notes            = excluded.notes,
        updated_at       = now()
  where public.teacher_payable_lessons.status = 'pending';
end;
$$;

create or replace function public.tg_payable_from_lesson()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.fn_generate_payable_lesson(new.id);
  return new;
end; $$;

create trigger trg_payable_from_lesson
  after update of status, actual_start_at, actual_end_at, teacher_id on public.lessons
  for each row execute function public.tg_payable_from_lesson();

create or replace function public.tg_payable_from_report()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.fn_generate_payable_lesson(coalesce(new.lesson_id, old.lesson_id));
  return coalesce(new, old);
end; $$;

create trigger trg_payable_from_report
  after insert or update of status, missing_fields on public.teaching_reports
  for each row execute function public.tg_payable_from_report();

create or replace function public.tg_payable_from_attendance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.fn_generate_payable_lesson(coalesce(new.lesson_id, old.lesson_id));
  return coalesce(new, old);
end; $$;

create trigger trg_payable_from_attendance
  after insert or update or delete on public.attendance
  for each row execute function public.tg_payable_from_attendance();

-- -----------------------------------------------------------------------------
-- Building / recalculating a payroll period
-- -----------------------------------------------------------------------------
create or replace function public.fn_build_payroll(
  p_teacher_id uuid,
  p_period_start date,
  p_period_end date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payroll_id uuid;
  v_status     payroll_status;
begin
  if not public.is_founder() then
    raise exception 'Chỉ Founder được tạo bảng lương';
  end if;

  insert into public.teacher_payroll (
    teacher_id, period_start, period_end, period_label, created_by)
  values (
    p_teacher_id, p_period_start, p_period_end,
    to_char(p_period_start, 'MM/YYYY'), auth.uid())
  on conflict (teacher_id, period_start, period_end)
    do update set updated_at = now()
  returning id, status into v_payroll_id, v_status;

  if v_status in ('approved','paid') then
    raise exception 'Kỳ lương đã được duyệt - không thể tính lại';
  end if;

  -- Release rows previously attached to this draft, then re-attach.
  update public.teacher_payable_lessons
     set payroll_id = null, status = 'pending'
   where payroll_id = v_payroll_id and status = 'included';

  update public.teacher_payable_lessons
     set payroll_id = v_payroll_id, status = 'included', updated_at = now()
   where teacher_id = p_teacher_id
     and status = 'pending'
     and lesson_date between p_period_start and p_period_end;

  perform public.fn_recalc_payroll(v_payroll_id);
  return v_payroll_id;
end;
$$;

create or replace function public.fn_recalc_payroll(p_payroll_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int; v_minutes int; v_gross numeric(14,2); v_adj numeric(14,2);
begin
  select count(*), coalesce(sum(duration_minutes), 0), coalesce(sum(amount), 0)
    into v_count, v_minutes, v_gross
  from public.teacher_payable_lessons
  where payroll_id = p_payroll_id and status in ('included','paid');

  select coalesce(sum(amount), 0) into v_adj
  from public.teacher_payroll_adjustments where payroll_id = p_payroll_id;

  update public.teacher_payroll
     set lessons_count      = v_count,
         teaching_minutes   = v_minutes,
         gross_amount       = v_gross,
         adjustments_amount = v_adj,
         final_amount       = v_gross + v_adj,
         updated_at         = now()
   where id = p_payroll_id;
end;
$$;

create or replace function public.tg_recalc_payroll_from_adjustment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.fn_recalc_payroll(coalesce(new.payroll_id, old.payroll_id));
  return coalesce(new, old);
end; $$;

create trigger trg_adjustments_recalc
  after insert or update or delete on public.teacher_payroll_adjustments
  for each row execute function public.tg_recalc_payroll_from_adjustment();

-- Founder approval gate: 'paid' is only reachable from 'approved'.
create or replace function public.tg_payroll_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('approved','paid') and not public.is_founder() then
      raise exception 'Chỉ Founder được duyệt hoặc đánh dấu đã trả lương';
    end if;
    if new.status = 'paid' and old.status <> 'approved' then
      raise exception 'Phải duyệt (approved) trước khi đánh dấu đã trả (paid)';
    end if;
    if new.status = 'approved' then
      new.approved_by := auth.uid();
      new.approved_at := now();
    end if;
    if new.status = 'paid' then
      new.paid_at := coalesce(new.paid_at, now());
      update public.teacher_payable_lessons
         set status = 'paid', updated_at = now()
       where payroll_id = new.id and status = 'included';
    end if;
  end if;
  return new;
end; $$;

create trigger trg_payroll_guard
  before update on public.teacher_payroll
  for each row execute function public.tg_payroll_guard();

create trigger trg_payroll_updated_at before update on public.teacher_payroll
  for each row execute function public.tg_set_updated_at();
create trigger trg_payable_updated_at before update on public.teacher_payable_lessons
  for each row execute function public.tg_set_updated_at();
create trigger trg_payroll_audit after insert or update or delete on public.teacher_payroll
  for each row execute function public.tg_audit();

grant execute on function public.fn_resolve_teacher_rate(uuid, int, uuid, date) to authenticated;
grant execute on function public.fn_build_payroll(uuid, date, date) to authenticated;
grant execute on function public.fn_recalc_payroll(uuid) to authenticated;
