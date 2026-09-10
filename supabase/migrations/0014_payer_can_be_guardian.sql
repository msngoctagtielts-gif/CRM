-- =============================================================================
-- 0014_payer_can_be_guardian.sql
--
-- D14 (Founder xác nhận 10/09/2026): người đóng học phí không nhất thiết là học
-- viên. Lớp nhóm Y Khoa do **Hoàng Uyên — vợ anh Max** đứng tên đóng, và chị
-- không phải học viên của lớp.
--
-- 0013 chỉ có payer_student_id (trỏ tới students) nên không diễn tả được ca này.
-- =============================================================================

alter table public.student_enrollments
  add column if not exists payer_parent_id uuid references public.parents (id) on delete set null,
  add column if not exists payer_note text;

comment on column public.student_enrollments.payer_parent_id is
  'Người đóng học phí KHÔNG phải học viên — phụ huynh, vợ/chồng, hoặc người bảo hộ (D14).';
comment on column public.student_enrollments.payer_note is
  'Quan hệ của người đóng với học viên, ví dụ "vợ anh Max".';

-- Tối đa một người đóng được chỉ định. Không chỉ định ai = chính học viên đóng.
alter table public.student_enrollments
  drop constraint if exists chk_enrollment_single_payer;
alter table public.student_enrollments
  add constraint chk_enrollment_single_payer check (
    payer_student_id is null or payer_parent_id is null
  );

comment on constraint chk_enrollment_single_payer on public.student_enrollments is
  'Chỉ một người đứng tên đóng. Cả hai cột trống nghĩa là học viên của hợp đồng tự đóng.';

create index if not exists idx_enrollments_payer_parent
  on public.student_enrollments (payer_parent_id) where payer_parent_id is not null;

-- Ai thực sự đứng tên đóng tiền cho một hợp đồng.
create or replace function public.fn_enrollment_payer_name(p_enrollment_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.full_name from public.parents p
      join public.student_enrollments e on e.payer_parent_id = p.id
     where e.id = p_enrollment_id),
    (select s.full_name from public.students s
      join public.student_enrollments e on e.payer_student_id = s.id
     where e.id = p_enrollment_id),
    (select s.full_name from public.students s
      join public.student_enrollments e on e.student_id = s.id
     where e.id = p_enrollment_id)
  );
$$;

grant execute on function public.fn_enrollment_payer_name(uuid) to authenticated;

-- Hiện tên người đóng trong view số dư để trang thu học phí gọi đúng người.
drop view if exists public.v_student_finance;
drop view if exists public.v_enrollment_balances;

create view public.v_enrollment_balances
with (security_invoker = on) as
select
  e.id                                  as enrollment_id,
  e.enrollment_code,
  e.student_id,
  e.class_id,
  e.program_id,
  e.status,
  e.billing_mode,
  e.headcount,
  e.monthly_discount_amount,
  e.needs_review,
  e.start_date,
  e.end_date,
  e.paid_in_full_until,
  public.fn_resolve_tuition_rate(e.id, current_date) as price_per_lesson,
  e.lessons_purchased,
  coalesce(c.lessons_used, 0)           as lessons_used,
  case when e.billing_mode = 'prepaid_package'
       then e.lessons_purchased - coalesce(c.lessons_used, 0) end as lessons_remaining,
  e.gross_amount,
  e.discount_amount,
  e.net_amount,
  coalesce(p.total_paid, 0)             as total_paid,
  case when e.billing_mode = 'prepaid_package'
       then coalesce(e.net_amount, 0) - coalesce(p.total_paid, 0)
       else coalesce(c.revenue_recognized, 0) - coalesce(p.total_paid, 0)
  end                                    as outstanding_amount,
  coalesce(c.revenue_recognized, 0)     as revenue_recognized,
  coalesce(p.total_paid, 0) - coalesce(c.revenue_recognized, 0) as deferred_revenue,
  public.fn_enrollment_payer_name(e.id) as payer_name,
  e.payer_note
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
  'lessons_remaining chỉ có nghĩa với gói trả trước; trả sau theo tháng thì NULL. Số buổi còn lại ÂM là bình thường — học viên được học vượt (D7). payer_name là người đứng tên đóng (D14).';

create view public.v_student_finance
with (security_invoker = on) as
select
  s.id                                   as student_id,
  coalesce(sum(b.lessons_purchased), 0)  as lessons_purchased,
  coalesce(sum(b.lessons_used), 0)       as lessons_completed,
  coalesce(sum(b.lessons_remaining), 0)  as lessons_remaining,
  coalesce(sum(b.net_amount), 0)         as total_tuition,
  coalesce(sum(b.total_paid), 0)         as total_paid,
  coalesce(sum(b.outstanding_amount), 0) as outstanding_amount,
  coalesce(sum(b.revenue_recognized), 0) as revenue_recognized,
  bool_or(b.needs_review)                as needs_review
from public.students s
left join public.v_enrollment_balances b
       on b.student_id = s.id and b.status in ('active','paused','completed')
group by s.id;

grant select on public.v_enrollment_balances to authenticated;
grant select on public.v_student_finance    to authenticated;
