-- =============================================================================
-- 0010_views.sql
-- Reporting views. Every view is security_invoker = on, so the caller's RLS
-- applies to the underlying tables (a teacher querying a finance view simply
-- sees no rows instead of leaking the centre's numbers).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enrollment balance: lessons and money, per tuition agreement
-- -----------------------------------------------------------------------------
create or replace view public.v_enrollment_balances
with (security_invoker = on) as
select
  e.id                                  as enrollment_id,
  e.enrollment_code,
  e.student_id,
  e.class_id,
  e.program_id,
  e.status,
  e.start_date,
  e.end_date,
  e.price_per_lesson,
  e.lessons_purchased,
  coalesce(c.lessons_used, 0)           as lessons_used,
  e.lessons_purchased - coalesce(c.lessons_used, 0) as lessons_remaining,
  e.gross_amount,
  e.discount_amount,
  e.net_amount,
  coalesce(p.total_paid, 0)             as total_paid,
  e.net_amount - coalesce(p.total_paid, 0) as outstanding_amount,
  coalesce(c.revenue_recognized, 0)     as revenue_recognized,
  coalesce(p.total_paid, 0) - coalesce(c.revenue_recognized, 0) as deferred_revenue
from public.student_enrollments e
left join (
  select enrollment_id,
         sum(lessons_deducted)  as lessons_used,
         sum(recognized_amount) as revenue_recognized
  from public.lesson_consumptions
  group by enrollment_id
) c on c.enrollment_id = e.id
left join (
  select enrollment_id, sum(amount) as total_paid
  from public.payments
  where status = 'confirmed'
  group by enrollment_id
) p on p.enrollment_id = e.id;

comment on view public.v_enrollment_balances is
  'deferred_revenue = tiền đã thu nhưng CHƯA dạy. Đây là nghĩa vụ, không phải lợi nhuận.';

-- -----------------------------------------------------------------------------
-- Per-student financial + lesson balance roll-up
-- -----------------------------------------------------------------------------
create or replace view public.v_student_finance
with (security_invoker = on) as
select
  s.id                                   as student_id,
  coalesce(sum(b.lessons_purchased), 0)  as lessons_purchased,
  coalesce(sum(b.lessons_used), 0)       as lessons_completed,
  coalesce(sum(b.lessons_remaining), 0)  as lessons_remaining,
  coalesce(sum(b.net_amount), 0)         as total_tuition,
  coalesce(sum(b.total_paid), 0)         as total_paid,
  coalesce(sum(b.outstanding_amount), 0) as outstanding_amount,
  coalesce(sum(b.revenue_recognized), 0) as revenue_recognized
from public.students s
left join public.v_enrollment_balances b
       on b.student_id = s.id and b.status in ('active','paused','completed')
group by s.id;

-- -----------------------------------------------------------------------------
-- Student overview for the CRM list & profile header
-- -----------------------------------------------------------------------------
create or replace view public.v_student_overview
with (security_invoker = on) as
select
  s.id,
  s.student_code,
  s.full_name,
  s.nickname,
  s.date_of_birth,
  public.student_age(s.date_of_birth) as age,
  s.gender,
  s.phone,
  s.email,
  s.status,
  s.enrollment_date,
  s.source,
  s.learning_goal,
  s.learning_notes,
  s.created_at,
  pr.id    as program_id,
  pr.name_vi as program_name,
  lv.id    as level_id,
  lv.code  as level_code,
  lv.name_vi as level_name,
  par.id   as parent_id,
  par.full_name as parent_name,
  par.phone     as parent_phone,
  par.email     as parent_email,
  cls.class_id,
  cls.class_name,
  cls.teacher_id,
  cls.teacher_name
from public.students s
left join public.programs pr on pr.id = s.program_id
left join public.levels lv   on lv.id = s.current_level_id
left join lateral (
  select p.id, p.full_name, p.phone, p.email
  from public.student_parents sp
  join public.parents p on p.id = sp.parent_id
  where sp.student_id = s.id
  order by sp.is_primary desc
  limit 1
) par on true
left join lateral (
  select c.id as class_id, c.name as class_name,
         t.id as teacher_id, t.full_name as teacher_name
  from public.class_students cs
  join public.classes c on c.id = cs.class_id
  left join public.teachers t on t.id = c.teacher_id
  where cs.student_id = s.id and cs.status = 'active' and c.status = 'active'
  order by cs.joined_at desc
  limit 1
) cls on true;

-- -----------------------------------------------------------------------------
-- Lesson + report completeness (drives the teacher's to-do list)
-- -----------------------------------------------------------------------------
create or replace view public.v_lesson_reports
with (security_invoker = on) as
select
  l.id                 as lesson_id,
  l.class_id,
  c.class_code,
  c.name               as class_name,
  c.class_type,
  l.teacher_id,
  t.full_name          as teacher_name,
  l.lesson_date,
  l.scheduled_start_at,
  l.scheduled_end_at,
  l.actual_start_at,
  l.actual_end_at,
  l.duration_minutes,
  l.status             as lesson_status,
  l.report_due_at,
  tr.id                as report_id,
  tr.status            as report_status,
  tr.missing_fields,
  tr.submitted_at,
  tr.completed_at,
  tr.is_late,
  (l.report_due_at is not null and now() > l.report_due_at
     and (tr.id is null or array_length(tr.missing_fields, 1) is not null)) as is_overdue,
  exists (select 1 from public.recordings r
           where r.lesson_id = l.id and r.status = 'active')  as has_recording,
  exists (select 1 from public.homework h
           where h.lesson_id = l.id and h.status = 'active')  as has_homework,
  (select count(*) from public.attendance a where a.lesson_id = l.id) as attendance_count,
  (select string_agg(s.full_name, ', ' order by s.full_name)
     from public.class_students cs
     join public.students s on s.id = cs.student_id
    where cs.class_id = l.class_id and cs.status = 'active')  as student_names
from public.lessons l
join public.classes c on c.id = l.class_id
left join public.teachers t on t.id = l.teacher_id
left join public.teaching_reports tr on tr.lesson_id = l.id;

-- -----------------------------------------------------------------------------
-- Daily money series (cash vs recognised revenue kept apart by design)
-- -----------------------------------------------------------------------------
create or replace view public.v_cash_received_daily
with (security_invoker = on) as
select payment_date as day, sum(amount) as cash_received, count(*) as payment_count
from public.payments
where status = 'confirmed'
group by payment_date;

create or replace view public.v_revenue_recognized_daily
with (security_invoker = on) as
select (recognized_at at time zone 'Asia/Ho_Chi_Minh')::date as day,
       sum(recognized_amount) as revenue_recognized,
       sum(lessons_deducted)  as lessons_taught
from public.lesson_consumptions
group by (recognized_at at time zone 'Asia/Ho_Chi_Minh')::date;

create or replace view public.v_expenses_daily
with (security_invoker = on) as
select expense_date as day, category, sum(amount) as total
from public.expenses
group by expense_date, category;

-- -----------------------------------------------------------------------------
-- Teacher payroll summary (a teacher sees only their own rows via RLS)
-- -----------------------------------------------------------------------------
create or replace view public.v_teacher_payroll_summary
with (security_invoker = on) as
select
  pr.id as payroll_id,
  pr.teacher_id,
  t.full_name as teacher_name,
  pr.period_start,
  pr.period_end,
  pr.period_label,
  pr.lessons_count,
  pr.teaching_minutes,
  round(pr.teaching_minutes / 60.0, 2) as teaching_hours,
  pr.gross_amount,
  pr.adjustments_amount,
  pr.final_amount,
  pr.status,
  pr.approved_at,
  pr.paid_at
from public.teacher_payroll pr
join public.teachers t on t.id = pr.teacher_id;

-- -----------------------------------------------------------------------------
-- Open quality alerts
-- -----------------------------------------------------------------------------
create or replace view public.v_quality_alerts
with (security_invoker = on) as
select
  n.id,
  n.type,
  n.severity,
  n.title,
  n.body,
  n.payload,
  n.status,
  n.due_at,
  n.created_at,
  n.entity_id as lesson_id,
  n.payload ->> 'teacher_name' as teacher_name,
  n.payload ->> 'class_name'   as class_name,
  n.payload ->> 'student_names' as student_names,
  n.payload -> 'missing_fields' as missing_fields
from public.notifications n
where n.type = 'teaching_report_incomplete'
  and n.status in ('new','acknowledged');
