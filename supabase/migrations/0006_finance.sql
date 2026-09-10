-- =============================================================================
-- 0006_finance.sql
-- Tuition packages, enrollments (per-student pricing), lesson consumption
-- (= revenue recognition), payments, expenses.
--
-- FINANCIAL PRINCIPLE (section XII of the brief): cash received, revenue
-- recognised and outstanding tuition are three different things and are
-- never stored in the same column.
--   cash received  -> payments.amount            (by payment_date)
--   revenue earned -> lesson_consumptions        (by recognized_at)
--   outstanding    -> enrollment net_amount - paid
-- =============================================================================

-- -----------------------------------------------------------------------------
-- tuition_packages - catalogue only. The contract price lives on the enrollment.
-- -----------------------------------------------------------------------------
create table if not exists public.tuition_packages (
  id                       uuid primary key default gen_random_uuid(),
  code                     text not null unique,
  name                     text not null,
  program_id               uuid references public.programs (id) on delete set null,
  class_type               class_type,
  duration_minutes         int check (duration_minutes in (30, 60, 90)),
  lesson_count             int not null check (lesson_count > 0),
  default_price_per_lesson numeric(14,2) not null check (default_price_per_lesson >= 0),
  validity_days            int,
  description              text,
  status                   record_status not null default 'active',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  created_by               uuid references public.users (id)
);

comment on column public.tuition_packages.default_price_per_lesson is
  'CHỈ là giá đề xuất. Giá thực tế luôn lấy từ student_enrollments.price_per_lesson.';

-- -----------------------------------------------------------------------------
-- student_enrollments - the tuition agreement. One student may hold several.
-- -----------------------------------------------------------------------------
create table if not exists public.student_enrollments (
  id                 uuid primary key default gen_random_uuid(),
  enrollment_code    text unique,
  student_id         uuid not null references public.students (id) on delete cascade,
  class_id           uuid references public.classes (id) on delete set null,
  program_id         uuid references public.programs (id) on delete set null,
  tuition_package_id uuid references public.tuition_packages (id) on delete set null,
  lessons_purchased  numeric(8,2) not null check (lessons_purchased > 0),
  price_per_lesson   numeric(14,2) not null check (price_per_lesson >= 0),
  discount_amount    numeric(14,2) not null default 0 check (discount_amount >= 0),
  discount_percent   numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  gross_amount       numeric(14,2) generated always as
                       (lessons_purchased * price_per_lesson) stored,
  net_amount         numeric(14,2) not null check (net_amount >= 0),
  currency           text not null default 'VND',
  start_date         date not null default current_date,
  end_date           date,
  expires_at         date,
  status             enrollment_status not null default 'draft',
  agreement_notes    text,
  is_migrated_balance boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references public.users (id)
);

comment on table public.student_enrollments is
  'Hợp đồng học phí. Đơn giá theo TỪNG học viên - không có giá cố định toàn hệ thống.';
comment on column public.student_enrollments.net_amount is
  'Số tiền phải trả sau giảm giá. Công nợ = net_amount - tổng đã thanh toán.';
comment on column public.student_enrollments.is_migrated_balance is
  'true = dòng số dư mở đầu khi di trú từ Google Sheets (rủi ro R4).';

create index if not exists idx_enrollments_student on public.student_enrollments (student_id);
create index if not exists idx_enrollments_active on public.student_enrollments (student_id, status)
  where status = 'active';

create sequence if not exists public.seq_enrollment_code start 1;
create or replace function public.tg_assign_enrollment_code()
returns trigger language plpgsql as $$
begin
  if new.enrollment_code is null then
    new.enrollment_code := 'HD' || to_char(now(), 'YY')
      || lpad(nextval('public.seq_enrollment_code')::text, 4, '0');
  end if;
  return new;
end; $$;
create trigger trg_enrollments_code before insert on public.student_enrollments
  for each row execute function public.tg_assign_enrollment_code();

-- -----------------------------------------------------------------------------
-- lesson_consumptions - the bridge between teaching and money.
-- One row per (enrollment, lesson, student). Created only when a lesson is
-- completed and the student's attendance is billable.
-- -----------------------------------------------------------------------------
create table if not exists public.lesson_consumptions (
  id                uuid primary key default gen_random_uuid(),
  enrollment_id     uuid not null references public.student_enrollments (id) on delete cascade,
  lesson_id         uuid not null references public.lessons (id) on delete cascade,
  student_id        uuid not null references public.students (id) on delete cascade,
  attendance_id     uuid references public.attendance (id) on delete set null,
  lessons_deducted  numeric(8,2) not null default 1 check (lessons_deducted > 0),
  price_per_lesson  numeric(14,2) not null,
  recognized_amount numeric(14,2) not null,
  recognized_at     timestamptz not null default now(),
  notes             text,
  created_at        timestamptz not null default now(),
  unique (enrollment_id, lesson_id, student_id)
);

comment on table public.lesson_consumptions is
  'Ghi nhận DOANH THU theo buổi đã dạy. Không liên quan tới thời điểm thu tiền.';

create index if not exists idx_consumptions_recognized on public.lesson_consumptions (recognized_at);
create index if not exists idx_consumptions_student on public.lesson_consumptions (student_id);

-- Pick the enrollment a lesson should be deducted from:
-- prefer one bound to that exact class, then the class's programme,
-- then any active enrollment. Oldest start_date first (FIFO).
create or replace function public.fn_pick_enrollment(p_student_id uuid, p_class_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  with bal as (
    select e.id, e.class_id, e.program_id, e.start_date,
           e.lessons_purchased - coalesce(
             (select sum(lc.lessons_deducted) from public.lesson_consumptions lc
               where lc.enrollment_id = e.id), 0) as remaining
    from public.student_enrollments e
    where e.student_id = p_student_id and e.status = 'active'
  )
  select b.id
  from bal b
  left join public.classes c on c.id = p_class_id
  where b.remaining > 0
  order by
    case when b.class_id = p_class_id then 0
         when b.program_id is not distinct from c.program_id then 1
         else 2 end,
    b.start_date asc
  limit 1;
$$;

-- Create / refresh the consumption row for one attendance record.
create or replace function public.fn_consume_lesson(p_attendance_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a           public.attendance;
  l           public.lessons;
  v_enroll_id uuid;
  v_price     numeric(14,2);
begin
  select * into a from public.attendance where id = p_attendance_id;
  if not found then return; end if;

  select * into l from public.lessons where id = a.lesson_id;
  if not found then return; end if;

  -- Not billable (or lesson not finished): remove any previous deduction.
  if l.status <> 'completed' or not a.is_billable then
    delete from public.lesson_consumptions
     where lesson_id = a.lesson_id and student_id = a.student_id;
    return;
  end if;

  if exists (select 1 from public.lesson_consumptions
              where lesson_id = a.lesson_id and student_id = a.student_id) then
    return;  -- already recognised; never double-count
  end if;

  v_enroll_id := public.fn_pick_enrollment(a.student_id, l.class_id);
  if v_enroll_id is null then
    return;  -- no active enrollment: surfaced as an alert, not silently charged
  end if;

  select price_per_lesson into v_price
    from public.student_enrollments where id = v_enroll_id;

  insert into public.lesson_consumptions (
    enrollment_id, lesson_id, student_id, attendance_id,
    lessons_deducted, price_per_lesson, recognized_amount, recognized_at)
  values (
    v_enroll_id, a.lesson_id, a.student_id, a.id,
    1, v_price, v_price,
    coalesce(l.actual_end_at, l.scheduled_end_at))
  on conflict (enrollment_id, lesson_id, student_id) do nothing;
end;
$$;

create or replace function public.tg_attendance_consume()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.fn_consume_lesson(new.id);
  return new;
end; $$;

create trigger trg_attendance_consume
  after insert or update of status, is_billable on public.attendance
  for each row execute function public.tg_attendance_consume();

-- When a lesson flips to completed (or back), re-evaluate every attendee.
create or replace function public.tg_lesson_consume_all()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.status is distinct from old.status then
    for r in select id from public.attendance where lesson_id = new.id loop
      perform public.fn_consume_lesson(r.id);
    end loop;
  end if;
  return new;
end; $$;

create trigger trg_lesson_consume_all
  after update of status on public.lessons
  for each row execute function public.tg_lesson_consume_all();

-- -----------------------------------------------------------------------------
-- payments - CASH IN. Never touches revenue recognition.
-- -----------------------------------------------------------------------------
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  payment_code  text unique,
  student_id    uuid not null references public.students (id) on delete restrict,
  enrollment_id uuid references public.student_enrollments (id) on delete set null,
  amount        numeric(14,2) not null check (amount > 0),
  currency      text not null default 'VND',
  payment_date  date not null default current_date,
  method        payment_method not null default 'bank_transfer',
  reference     text,
  notes         text,
  status        payment_status not null default 'confirmed',
  recorded_by   uuid references public.users (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references public.users (id)
);

comment on table public.payments is
  'TIỀN MẶT ĐÃ THU. Khác với doanh thu ghi nhận (xem lesson_consumptions).';

create index if not exists idx_payments_date on public.payments (payment_date desc);
create index if not exists idx_payments_student on public.payments (student_id);
create index if not exists idx_payments_enrollment on public.payments (enrollment_id);

create sequence if not exists public.seq_payment_code start 1;
create or replace function public.tg_assign_payment_code()
returns trigger language plpgsql as $$
begin
  if new.payment_code is null then
    new.payment_code := 'TT' || to_char(now(), 'YYMM')
      || lpad(nextval('public.seq_payment_code')::text, 4, '0');
  end if;
  return new;
end; $$;
create trigger trg_payments_code before insert on public.payments
  for each row execute function public.tg_assign_payment_code();

-- -----------------------------------------------------------------------------
-- expenses
-- -----------------------------------------------------------------------------
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category     expense_category not null default 'other',
  description  text not null,
  amount       numeric(14,2) not null check (amount > 0),
  currency     text not null default 'VND',
  method       payment_method not null default 'bank_transfer',
  vendor       text,
  receipt_url  text,
  notes        text,
  payroll_id   uuid,  -- FK added in 0007
  recorded_by  uuid references public.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references public.users (id)
);

comment on column public.expenses.payroll_id is
  'Nếu chi phí này sinh ra từ một kỳ lương đã duyệt, trỏ về teacher_payroll để không đếm 2 lần.';

create index if not exists idx_expenses_date on public.expenses (expense_date desc);
create index if not exists idx_expenses_category on public.expenses (category);

create trigger trg_tuition_packages_updated_at before update on public.tuition_packages
  for each row execute function public.tg_set_updated_at();
create trigger trg_enrollments_updated_at before update on public.student_enrollments
  for each row execute function public.tg_set_updated_at();
create trigger trg_payments_updated_at before update on public.payments
  for each row execute function public.tg_set_updated_at();
create trigger trg_expenses_updated_at before update on public.expenses
  for each row execute function public.tg_set_updated_at();

create trigger trg_enrollments_audit after insert or update or delete on public.student_enrollments
  for each row execute function public.tg_audit();
create trigger trg_payments_audit after insert or update or delete on public.payments
  for each row execute function public.tg_audit();
create trigger trg_expenses_audit after insert or update or delete on public.expenses
  for each row execute function public.tg_audit();

grant execute on function public.fn_pick_enrollment(uuid, uuid) to authenticated;
