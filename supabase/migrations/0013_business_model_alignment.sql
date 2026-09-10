-- =============================================================================
-- 0013_business_model_alignment.sql
--
-- Chỉnh cấu trúc theo mô hình nghiệp vụ THẬT, sau khi đối soát hệ thống Google
-- Sheets đang chạy và được Founder xác nhận ngày 10/09/2026.
-- Xem DECISIONS.md để biết căn cứ của từng thay đổi (D1–D13).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- D2, D3: tham số vận hành theo đúng hệ thống đang chạy
-- -----------------------------------------------------------------------------
update public.settings
   set value = '24'::jsonb,
       description = 'Số giờ kể từ khi kết thúc buổi học mà giáo viên phải nộp đủ báo cáo'
 where key = 'report_deadline_hours';

insert into public.settings (key, value, description) values
  ('qc_min_score', '60'::jsonb,
   'Điểm chất lượng feedback tối thiểu (0-100) để báo cáo được coi là đạt'),
  ('kpi_lessons_per_month', '20'::jsonb,
   'KPI số buổi dạy mỗi tháng của một giáo viên'),
  ('alert_lessons_remaining', '2'::jsonb,
   'Còn bao nhiêu buổi thì nhắc đóng học phí'),
  ('alert_days_not_sent_parent', '3'::jsonb,
   'Buổi đã học bao nhiêu ngày mà chưa gửi phụ huynh thì cảnh báo'),
  ('alert_month_end_day', '25'::jsonb,
   'Từ ngày mấy trong tháng thì nhắc học viên đóng theo tháng'),
  ('feedback_language', '"Song ngữ Việt - Anh"'::jsonb,
   'Ngôn ngữ nhận xét gửi phụ huynh')
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- D8: cờ đánh dấu dòng cần đối soát sau khi di trú
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['students','classes','student_enrollments','teachers','payments'] loop
    execute format('alter table public.%I add column if not exists needs_review boolean not null default false', t);
    execute format('alter table public.%I add column if not exists review_note text', t);
    execute format('comment on column public.%I.needs_review is %L', t,
      'true = dòng di trú từ Google Sheets có dữ liệu nghi vấn, chờ Founder đối soát (D8).');
  end loop;
end $$;

create index if not exists idx_students_needs_review on public.students (id) where needs_review;
create index if not exists idx_enrollments_needs_review on public.student_enrollments (id) where needs_review;

-- -----------------------------------------------------------------------------
-- D1: hai hình thức đóng học phí
-- -----------------------------------------------------------------------------
do $$ begin
  create type billing_mode as enum ('prepaid_package','monthly_postpaid','undetermined');
exception when duplicate_object then null; end $$;

alter table public.student_enrollments
  add column if not exists billing_mode billing_mode not null default 'prepaid_package',
  add column if not exists headcount int not null default 1 check (headcount between 1 and 30),
  add column if not exists monthly_discount_amount numeric(14,2) not null default 0
    check (monthly_discount_amount >= 0),
  add column if not exists payer_student_id uuid references public.students (id) on delete set null,
  add column if not exists paid_in_full_until date;

comment on column public.student_enrollments.billing_mode is
  'prepaid_package = mua gói trước (Gói 10 buổi) · monthly_postpaid = học trước, đối soát cuối tháng (Cuối tháng) · undetermined = chưa chốt (D1).';
comment on column public.student_enrollments.headcount is
  'Số người trong lớp nhóm. Y Khoa: 3 người, đơn giá 360.000 = 120.000 × 3 (D13).';
comment on column public.student_enrollments.monthly_discount_amount is
  'Chiết khấu cố định MỖI THÁNG, trừ khi lên phiếu đối soát tháng. Y Khoa: 150.000 ₫/tháng (D13).';
comment on column public.student_enrollments.payer_student_id is
  'Lớp nhóm: ai là người đại diện đóng học phí. NULL = chính học viên của hợp đồng (D13).';
comment on column public.student_enrollments.paid_in_full_until is
  'Mốc "đã đóng đủ đến ngày" lấy từ bảng giá cũ — dùng làm điểm bắt đầu đối soát sau di trú.';

-- Trả sau theo tháng thì chưa biết trước số buổi và tổng tiền.
alter table public.student_enrollments
  alter column lessons_purchased drop not null,
  alter column net_amount drop not null;

alter table public.student_enrollments
  drop constraint if exists chk_enrollment_prepaid_shape;
alter table public.student_enrollments
  add constraint chk_enrollment_prepaid_shape check (
    billing_mode <> 'prepaid_package'
    or (lessons_purchased is not null and net_amount is not null)
  );

comment on constraint chk_enrollment_prepaid_shape on public.student_enrollments is
  'Gói trả trước buộc phải có số buổi và tổng tiền. Trả sau theo tháng thì hai cột này để trống vì chỉ biết khi chốt tháng.';

-- -----------------------------------------------------------------------------
-- D11: đơn giá học phí có NGÀY HIỆU LỰC
-- Bé Ngân: 179.000 đến 31/08/2026, rồi 190.000 từ 01/09/2026.
-- Cùng nguyên tắc với teacher_rates: số tiền của buổi đã dạy không bị sửa
-- ngược khi đổi giá.
-- -----------------------------------------------------------------------------
create table if not exists public.tuition_rates (
  id               uuid primary key default gen_random_uuid(),
  enrollment_id    uuid not null references public.student_enrollments (id) on delete cascade,
  price_per_lesson numeric(14,2) not null check (price_per_lesson >= 0),
  currency         text not null default 'VND',
  effective_from   date not null default current_date,
  effective_to     date,
  evidence_note    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.users (id),
  constraint chk_tuition_rate_period check (effective_to is null or effective_to >= effective_from)
);

comment on table public.tuition_rates is
  'Lịch sử đơn giá học phí theo hợp đồng. Để trống bảng này thì hệ thống dùng student_enrollments.price_per_lesson.';
comment on column public.tuition_rates.evidence_note is
  'Căn cứ của đơn giá — ví dụ "Founder chốt 13/08/2026, chứng từ 2.500.000 = 10 buổi".';

create index if not exists idx_tuition_rates_lookup
  on public.tuition_rates (enrollment_id, effective_from desc);

create trigger trg_tuition_rates_updated_at before update on public.tuition_rates
  for each row execute function public.tg_set_updated_at();
create trigger trg_tuition_rates_audit after insert or update or delete on public.tuition_rates
  for each row execute function public.tg_audit();

create or replace function public.fn_resolve_tuition_rate(
  p_enrollment_id uuid,
  p_on_date date default current_date
)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select r.price_per_lesson
       from public.tuition_rates r
      where r.enrollment_id = p_enrollment_id
        and r.effective_from <= p_on_date
        and (r.effective_to is null or r.effective_to >= p_on_date)
      order by r.effective_from desc
      limit 1),
    (select e.price_per_lesson
       from public.student_enrollments e
      where e.id = p_enrollment_id)
  );
$$;

grant execute on function public.fn_resolve_tuition_rate(uuid, date) to authenticated;

-- -----------------------------------------------------------------------------
-- D7: cho học vượt. Chọn hợp đồng KHÔNG còn điều kiện "còn buổi".
-- -----------------------------------------------------------------------------
create or replace function public.fn_pick_enrollment(p_student_id uuid, p_class_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  with bal as (
    select e.id, e.class_id, e.program_id, e.start_date, e.billing_mode,
           coalesce(e.lessons_purchased, 0) - coalesce(
             (select sum(lc.lessons_deducted) from public.lesson_consumptions lc
               where lc.enrollment_id = e.id), 0) as remaining
    from public.student_enrollments e
    where e.student_id = p_student_id and e.status = 'active'
  )
  select b.id
  from bal b
  left join public.classes c on c.id = p_class_id
  order by
    -- Đúng lớp trước, rồi cùng chương trình, rồi còn lại.
    case when b.class_id = p_class_id then 0
         when b.program_id is not distinct from c.program_id then 1
         else 2 end,
    -- Trả trước mà còn buổi thì dùng trước; hết buổi vẫn được chọn (D7: cho
    -- học vượt, ghi công nợ và cảnh báo thay vì chặn buổi đã dạy).
    case when b.billing_mode = 'prepaid_package' and b.remaining > 0 then 0 else 1 end,
    b.start_date asc
  limit 1;
$$;

grant execute on function public.fn_pick_enrollment(uuid, uuid) to authenticated;

-- Đơn giá ghi nhận doanh thu lấy theo ngày học, không lấy cứng từ hợp đồng.
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

  if l.status <> 'completed' or not a.is_billable then
    delete from public.lesson_consumptions
     where lesson_id = a.lesson_id and student_id = a.student_id;
    return;
  end if;

  if exists (select 1 from public.lesson_consumptions
              where lesson_id = a.lesson_id and student_id = a.student_id) then
    return;
  end if;

  v_enroll_id := public.fn_pick_enrollment(a.student_id, l.class_id);
  if v_enroll_id is null then
    return;
  end if;

  -- D11: đơn giá theo ngày buổi học diễn ra.
  v_price := public.fn_resolve_tuition_rate(v_enroll_id, l.lesson_date);

  insert into public.lesson_consumptions (
    enrollment_id, lesson_id, student_id, attendance_id,
    lessons_deducted, price_per_lesson, recognized_amount, recognized_at)
  values (
    v_enroll_id, a.lesson_id, a.student_id, a.id,
    1, coalesce(v_price, 0), coalesce(v_price, 0),
    coalesce(l.actual_end_at, l.scheduled_end_at))
  on conflict (enrollment_id, lesson_id, student_id) do nothing;
end;
$$;

-- -----------------------------------------------------------------------------
-- D1: phiếu đối soát học phí theo tháng (cho hình thức "Cuối tháng")
-- -----------------------------------------------------------------------------
create table if not exists public.tuition_statements (
  id              uuid primary key default gen_random_uuid(),
  enrollment_id   uuid not null references public.student_enrollments (id) on delete cascade,
  student_id      uuid not null references public.students (id) on delete cascade,
  period_start    date not null,
  period_end      date not null,
  period_label    text,
  lessons_count   numeric(8,2) not null default 0,
  gross_amount    numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  net_amount      numeric(14,2) not null default 0,
  paid_amount     numeric(14,2) not null default 0,
  status          text not null default 'draft'
                    check (status in ('draft','issued','partial','paid','cancelled')),
  issued_at       timestamptz,
  due_date        date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references public.users (id),
  constraint chk_statement_period check (period_end >= period_start),
  unique (enrollment_id, period_start, period_end)
);

comment on table public.tuition_statements is
  'Phiếu học phí một tháng cho hợp đồng trả sau: số buổi đã dạy × đơn giá − chiết khấu tháng (D1).';

create index if not exists idx_statements_student on public.tuition_statements (student_id);
create index if not exists idx_statements_unpaid on public.tuition_statements (due_date)
  where status in ('issued','partial');

create trigger trg_statements_updated_at before update on public.tuition_statements
  for each row execute function public.tg_set_updated_at();
create trigger trg_statements_audit after insert or update or delete on public.tuition_statements
  for each row execute function public.tg_audit();

alter table public.payments
  add column if not exists statement_id uuid references public.tuition_statements (id) on delete set null;

comment on column public.payments.statement_id is
  'Thanh toán cho một phiếu đối soát tháng cụ thể (hình thức Cuối tháng).';

-- Dựng / tính lại phiếu tháng từ các buổi đã dạy trong kỳ.
create or replace function public.fn_build_tuition_statement(
  p_enrollment_id uuid,
  p_period_start date,
  p_period_end date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  e            public.student_enrollments;
  v_id         uuid;
  v_status     text;
  v_lessons    numeric(8,2);
  v_gross      numeric(14,2);
  v_discount   numeric(14,2);
  v_paid       numeric(14,2);
begin
  if not public.is_founder() then
    raise exception 'Chỉ Founder được lập phiếu học phí';
  end if;

  select * into e from public.student_enrollments where id = p_enrollment_id;
  if not found then raise exception 'Không tìm thấy hợp đồng học phí'; end if;

  select coalesce(sum(lc.lessons_deducted), 0), coalesce(sum(lc.recognized_amount), 0)
    into v_lessons, v_gross
  from public.lesson_consumptions lc
  join public.lessons l on l.id = lc.lesson_id
  where lc.enrollment_id = p_enrollment_id
    and l.lesson_date between p_period_start and p_period_end;

  -- Chiết khấu tháng chỉ áp khi kỳ đó thực sự có buổi học.
  v_discount := case when v_lessons > 0 then e.monthly_discount_amount else 0 end;

  insert into public.tuition_statements (
    enrollment_id, student_id, period_start, period_end, period_label,
    lessons_count, gross_amount, discount_amount, net_amount, created_by)
  values (
    p_enrollment_id, e.student_id, p_period_start, p_period_end,
    to_char(p_period_start, 'MM/YYYY'),
    v_lessons, v_gross, v_discount, greatest(0, v_gross - v_discount), auth.uid())
  on conflict (enrollment_id, period_start, period_end) do update
    set lessons_count   = excluded.lessons_count,
        gross_amount    = excluded.gross_amount,
        discount_amount = excluded.discount_amount,
        net_amount      = excluded.net_amount,
        updated_at      = now()
  returning id, status into v_id, v_status;

  if v_status = 'paid' then
    raise exception 'Phiếu tháng này đã thanh toán xong — không tính lại';
  end if;

  select coalesce(sum(amount), 0) into v_paid
    from public.payments where statement_id = v_id and status = 'confirmed';

  update public.tuition_statements
     set paid_amount = v_paid,
         status = case
           when v_paid <= 0 then status
           when v_paid >= net_amount then 'paid'
           else 'partial' end
   where id = v_id;

  return v_id;
end;
$$;

grant execute on function public.fn_build_tuition_statement(uuid, date, date) to authenticated;

-- =============================================================================
-- D3, D6: chấm chất lượng feedback theo 6 tiêu chí + điểm QC 0–100
-- =============================================================================

do $$ begin
  create type report_author as enum ('teacher','ai','ai_edited_by_teacher');
exception when duplicate_object then null; end $$;

alter table public.teaching_reports
  -- Nội dung có cấu trúc thay cho một ô nhận xét chung, để chấm được chất lượng.
  add column if not exists student_quote text,
  add column if not exists strengths text,
  add column if not exists improvements text,
  add column if not exists video_timestamp text,
  -- Bốn tiêu chí máy tự kiểm được.
  add column if not exists qc_has_video boolean not null default false,
  add column if not exists qc_has_timestamp boolean not null default false,
  add column if not exists qc_has_student_quote boolean not null default false,
  add column if not exists qc_homework_has_pattern boolean not null default false,
  -- Hai tiêu chí cần người hoặc AI đánh giá "đủ sâu hay chưa".
  add column if not exists qc_strengths_deep boolean,
  add column if not exists qc_improvements_deep boolean,
  add column if not exists qc_score int check (qc_score between 0 and 100),
  add column if not exists qc_notes text,
  add column if not exists qc_scored_at timestamptz,
  -- Gửi phụ huynh là một bước riêng, có mốc thời gian riêng.
  add column if not exists sent_to_parent_at timestamptz,
  add column if not exists sent_to_parent_by uuid references public.users (id),
  add column if not exists authored_by report_author not null default 'teacher';

comment on column public.teaching_reports.student_quote is
  'Trích NGUYÊN VĂN một câu học viên đã nói — một trong 6 tiêu chí chấm chất lượng (D3).';
comment on column public.teaching_reports.video_timestamp is
  'Mốc thời gian trong video để đối chiếu nhận xét, ví dụ "12:40".';
comment on column public.teaching_reports.qc_strengths_deep is
  'NULL = chưa chấm. Do AI hoặc Founder đánh giá, máy không tự kết luận được "đủ sâu".';
comment on column public.teaching_reports.authored_by is
  'teacher = giáo viên tự viết · ai = AI viết từ link video · ai_edited_by_teacher = AI viết rồi giáo viên sửa (D6).';
comment on column public.teaching_reports.sent_to_parent_at is
  'Gửi cho phụ huynh là bước riêng do người bấm, không tự động (giả định A13).';

alter table public.homework
  add column if not exists sentence_patterns text;

comment on column public.homework.sentence_patterns is
  'Mẫu câu bắt buộc học viên phải dùng khi làm bài — một trong 6 tiêu chí chấm chất lượng (D3).';

-- Nhãn tiếng Việt cho 6 tiêu chí, dùng chung giữa cảnh báo và giao diện.
create or replace function public.fn_qc_criterion_label(p_key text)
returns text
language sql
immutable
as $$
  select case p_key
    when 'video'            then 'Link video'
    when 'timestamp'        then 'Timestamp đối chiếu'
    when 'student_quote'    then 'Trích nguyên văn lời học viên'
    when 'strengths_deep'   then 'Điểm mạnh đủ sâu'
    when 'improvements_deep' then 'Phần cần cải thiện đủ sâu'
    when 'homework_pattern' then 'Homework có mẫu câu'
    else p_key end;
$$;

grant execute on function public.fn_qc_criterion_label(text) to authenticated;

-- Chấm điểm QC: 6 tiêu chí, mỗi tiêu chí nặng bằng nhau.
-- Hai tiêu chí "đủ sâu" chưa chấm (NULL) thì tính là chưa đạt, nên báo cáo mới
-- nhập chưa bao giờ tự nhiên đạt 100 điểm.
create or replace function public.fn_score_report_qc(p_report_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r         public.teaching_reports;
  v_video   boolean;
  v_pattern boolean;
  v_passed  int;
  v_score   int;
begin
  select * into r from public.teaching_reports where id = p_report_id;
  if not found then return null; end if;

  v_video := exists (
    select 1 from public.recordings rec
    where rec.lesson_id = r.lesson_id and rec.status = 'active');

  v_pattern := exists (
    select 1 from public.homework h
    where h.lesson_id = r.lesson_id and h.status = 'active'
      and coalesce(trim(h.sentence_patterns), '') <> '');

  v_passed :=
      (v_video)::int
    + (coalesce(trim(r.video_timestamp), '') <> '')::int
    + (coalesce(trim(r.student_quote), '') <> '')::int
    + (coalesce(r.qc_strengths_deep, false))::int
    + (coalesce(r.qc_improvements_deep, false))::int
    + (v_pattern)::int;

  v_score := round(v_passed * 100.0 / 6)::int;

  update public.teaching_reports
     set qc_has_video            = v_video,
         qc_has_timestamp        = coalesce(trim(video_timestamp), '') <> '',
         qc_has_student_quote    = coalesce(trim(student_quote), '') <> '',
         qc_homework_has_pattern = v_pattern,
         qc_score                = v_score,
         qc_scored_at            = now()
   where id = p_report_id;

  return v_score;
end;
$$;

grant execute on function public.fn_score_report_qc(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- D3, D5: định nghĩa lại "còn thiếu gì"
--   · start_time / end_time  → điều kiện CỨNG để tính lương (D5)
--   · 6 tiêu chí QC          → điều kiện để báo cáo được coi là ĐẠT (D3)
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

  -- Bắt buộc tuyệt đối: thiếu là không tính lương (D5).
  if r.start_time is null then missing := missing || 'start_time'::text; end if;
  if r.end_time   is null then missing := missing || 'end_time'::text;   end if;

  -- Sáu tiêu chí chất lượng (D3).
  if not exists (select 1 from public.recordings rec
                  where rec.lesson_id = r.lesson_id and rec.status = 'active') then
    missing := missing || 'video'::text;
  end if;

  if coalesce(trim(r.video_timestamp), '') = '' then
    missing := missing || 'timestamp'::text;
  end if;

  if coalesce(trim(r.student_quote), '') = '' then
    missing := missing || 'student_quote'::text;
  end if;

  if not coalesce(r.qc_strengths_deep, false) then
    missing := missing || 'strengths_deep'::text;
  end if;

  if not coalesce(r.qc_improvements_deep, false) then
    missing := missing || 'improvements_deep'::text;
  end if;

  if not exists (select 1 from public.homework h
                  where h.lesson_id = r.lesson_id and h.status = 'active'
                    and coalesce(trim(h.sentence_patterns), '') <> '') then
    missing := missing || 'homework_pattern'::text;
  end if;

  return missing;
end;
$$;

-- Trạng thái báo cáo giờ dựa vào điểm QC so với ngưỡng, không chỉ đếm trường.
create or replace function public.fn_refresh_report_status(p_report_id uuid)
returns public.teaching_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  r              public.teaching_reports;
  v_missing      text[];
  v_due          timestamptz;
  v_status       report_status;
  v_score        int;
  v_min          int := public.setting_int('qc_min_score', 60);
  v_passed       boolean;
  v_completed_at timestamptz;
begin
  select * into r from public.teaching_reports where id = p_report_id;
  if not found then return null; end if;

  v_score   := public.fn_score_report_qc(p_report_id);
  v_missing := public.fn_report_missing_fields(p_report_id);
  select l.report_due_at into v_due from public.lessons l where l.id = r.lesson_id;

  -- ĐẠT = đủ giờ dạy (bắt buộc) và điểm QC từ ngưỡng trở lên.
  v_passed := r.start_time is not null
          and r.end_time is not null
          and coalesce(v_score, 0) >= v_min;

  if v_passed then
    v_completed_at := coalesce(r.completed_at, now());
  else
    v_completed_at := null;
  end if;

  if r.status = 'approved' then
    v_status := 'approved';
  elsif v_passed then
    v_status := 'submitted';
  elsif v_due is not null and now() > v_due then
    v_status := 'incomplete';
  else
    v_status := 'draft';
  end if;

  update public.teaching_reports
     set missing_fields = v_missing,
         status         = v_status,
         completed_at   = v_completed_at,
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

-- Chấm lại khi nội dung báo cáo hoặc đánh giá "đủ sâu" thay đổi.
drop trigger if exists trg_report_refresh on public.teaching_reports;
create trigger trg_report_refresh
  after insert or update of homework_summary, teacher_comments, start_time, end_time,
                            lesson_content, submitted_at, student_quote, strengths,
                            improvements, video_timestamp, qc_strengths_deep,
                            qc_improvements_deep
  on public.teaching_reports
  for each row execute function public.tg_refresh_report_from_report();

-- =============================================================================
-- D4, D5: lương vẫn tính dù thiếu bằng chứng; chỉ GIỜ DẠY là điều kiện cứng
-- =============================================================================

alter table public.teacher_payable_lessons
  add column if not exists has_evidence boolean not null default false,
  add column if not exists has_video boolean not null default false,
  add column if not exists qc_score int,
  add column if not exists sent_to_parent boolean not null default false;

comment on column public.teacher_payable_lessons.has_evidence is
  'false = buổi này thiếu bằng chứng timestamp. VẪN tính lương, chỉ gắn cờ cho Founder thấy (D4).';

create or replace function public.fn_generate_payable_lesson(p_lesson_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l            public.lessons;
  r            public.teaching_reports;
  v_students   int;
  v_attendance int;
  v_rate       numeric(14,2);
  v_source     text;
  v_duration   int;
  v_has_time   boolean;
begin
  select * into l from public.lessons where id = p_lesson_id;
  if not found or l.teacher_id is null then return; end if;

  if l.status <> 'completed' then
    delete from public.teacher_payable_lessons
     where lesson_id = p_lesson_id and status in ('pending','excluded');
    return;
  end if;

  select * into r from public.teaching_reports where lesson_id = p_lesson_id;

  -- ĐIỀU KIỆN CỨNG (D5): phải có ngày và giờ dạy. Lấy từ báo cáo, nếu chưa có
  -- báo cáo thì lấy giờ thực tế giáo viên đã bấm trên buổi học.
  v_has_time := (r.id is not null and r.start_time is not null and r.end_time is not null)
             or (l.actual_start_at is not null and l.actual_end_at is not null);

  select count(*) into v_students
    from public.class_students cs
   where cs.class_id = l.class_id and cs.status = 'active';

  select count(*) into v_attendance
    from public.attendance a where a.lesson_id = p_lesson_id;

  -- Chưa ghi giờ dạy, hoặc chưa điểm danh xong ⇒ chưa sinh buổi tính lương.
  -- Cảnh báo gửi riêng cho giáo viên được tạo ở fn_alert_missing_lesson_time().
  if not v_has_time or v_attendance = 0 or v_attendance < v_students then
    delete from public.teacher_payable_lessons
     where lesson_id = p_lesson_id and status = 'pending';
    return;
  end if;

  if exists (select 1 from public.teacher_payable_lessons
              where lesson_id = p_lesson_id and status in ('included','paid')) then
    return;
  end if;

  v_duration := coalesce(l.duration_minutes, 60);
  v_rate := public.fn_resolve_teacher_rate(l.teacher_id, v_duration, l.class_id, l.lesson_date);

  select coalesce(r2.scope, 'missing') into v_source
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
  ) r2;

  insert into public.teacher_payable_lessons (
    teacher_id, lesson_id, class_id, lesson_date, duration_minutes,
    rate_amount, amount, status, rate_source,
    has_evidence, has_video, qc_score, sent_to_parent, notes)
  values (
    l.teacher_id, p_lesson_id, l.class_id, l.lesson_date, v_duration,
    coalesce(v_rate, 0), coalesce(v_rate, 0), 'pending', coalesce(v_source, 'missing'),
    coalesce(r.qc_has_timestamp, false),
    coalesce(r.qc_has_video, false),
    r.qc_score,
    r.sent_to_parent_at is not null,
    case when v_rate is null
         then 'Chưa cấu hình đơn giá cho giáo viên này - cần Founder bổ sung' end)
  on conflict (lesson_id) do update
    set duration_minutes = excluded.duration_minutes,
        rate_amount      = excluded.rate_amount,
        amount           = excluded.amount,
        rate_source      = excluded.rate_source,
        has_evidence     = excluded.has_evidence,
        has_video        = excluded.has_video,
        qc_score         = excluded.qc_score,
        sent_to_parent   = excluded.sent_to_parent,
        notes            = excluded.notes,
        updated_at       = now()
  where public.teacher_payable_lessons.status = 'pending';
end;
$$;

-- Đồng bộ cờ bằng chứng khi báo cáo được cập nhật hoặc gửi phụ huynh.
drop trigger if exists trg_payable_from_report on public.teaching_reports;
create trigger trg_payable_from_report
  after insert or update of status, missing_fields, qc_score, sent_to_parent_at,
                            start_time, end_time
  on public.teaching_reports
  for each row execute function public.tg_payable_from_report();

-- Gộp thêm số liệu chất lượng vào kỳ lương, giống bảng LUONG GIAO VIEN cũ.
alter table public.teacher_payroll
  add column if not exists lessons_missing_evidence int not null default 0,
  add column if not exists lessons_missing_video int not null default 0,
  add column if not exists avg_qc_score numeric(5,2),
  add column if not exists kpi_target int,
  add column if not exists kpi_met boolean;

create or replace function public.fn_recalc_payroll(p_payroll_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int; v_minutes int; v_gross numeric(14,2); v_adj numeric(14,2);
  v_no_evidence int; v_no_video int; v_avg_qc numeric(5,2);
  v_kpi int := public.setting_int('kpi_lessons_per_month', 20);
begin
  select count(*), coalesce(sum(duration_minutes), 0), coalesce(sum(amount), 0),
         count(*) filter (where not has_evidence),
         count(*) filter (where not has_video),
         round(avg(qc_score), 2)
    into v_count, v_minutes, v_gross, v_no_evidence, v_no_video, v_avg_qc
  from public.teacher_payable_lessons
  where payroll_id = p_payroll_id and status in ('included','paid');

  select coalesce(sum(amount), 0) into v_adj
  from public.teacher_payroll_adjustments where payroll_id = p_payroll_id;

  update public.teacher_payroll
     set lessons_count            = v_count,
         teaching_minutes         = v_minutes,
         gross_amount             = v_gross,
         adjustments_amount       = v_adj,
         final_amount             = v_gross + v_adj,
         lessons_missing_evidence = v_no_evidence,
         lessons_missing_video    = v_no_video,
         avg_qc_score             = v_avg_qc,
         kpi_target               = v_kpi,
         kpi_met                  = (v_count >= v_kpi),
         updated_at               = now()
   where id = p_payroll_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- D5: báo động đỏ gửi RIÊNG giáo viên khi chưa ghi ngày/giờ dạy
-- -----------------------------------------------------------------------------
create or replace function public.fn_alert_missing_lesson_time()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  rec   record;
  v_n   int := 0;
begin
  for rec in
    select l.id as lesson_id, l.lesson_date, l.report_due_at,
           c.name as class_name, t.full_name as teacher_name, t.user_id
    from public.lessons l
    join public.classes c on c.id = l.class_id
    left join public.teachers t on t.id = l.teacher_id
    left join public.teaching_reports tr on tr.lesson_id = l.id
    where l.status = 'completed'
      and l.report_due_at is not null
      and now() > l.report_due_at
      and (l.actual_start_at is null or l.actual_end_at is null)
      and (tr.id is null or tr.start_time is null or tr.end_time is null)
  loop
    insert into public.notifications (
      type, severity, title, body, entity_type, entity_id,
      target_role, target_user_id, payload, due_at)
    values (
      'lesson_time_missing',
      'critical',
      'BÁO ĐỘNG ĐỎ — CHƯA GHI NGÀY GIỜ DẠY',
      format(
        E'Lớp: %s\nGiáo viên: %s\nNgày học: %s\n\nChưa ghi giờ bắt đầu và giờ kết thúc.\n\nBuổi này SẼ KHÔNG ĐƯỢC TÍNH LƯƠNG cho tới khi bổ sung đầy đủ ngày, giờ dạy và tên giáo viên.',
        rec.class_name,
        coalesce(rec.teacher_name, 'Chưa phân công'),
        to_char(rec.lesson_date, 'DD/MM/YYYY')),
      'lesson', rec.lesson_id,
      'founder', rec.user_id,
      jsonb_build_object(
        'lesson_id', rec.lesson_id,
        'teacher_name', rec.teacher_name,
        'class_name', rec.class_name,
        'blocks_payroll', true),
      rec.report_due_at)
    on conflict (type, entity_type, entity_id)
      where status in ('new','acknowledged')
      do update set body = excluded.body, payload = excluded.payload, updated_at = now();
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

grant execute on function public.fn_alert_missing_lesson_time() to authenticated;

-- -----------------------------------------------------------------------------
-- D7: cảnh báo sắp hết buổi / đã học vượt
-- -----------------------------------------------------------------------------
create or replace function public.fn_alert_lesson_balance()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  rec       record;
  v_n       int := 0;
  v_thresh  int := public.setting_int('alert_lessons_remaining', 2);
begin
  for rec in
    select b.enrollment_id, b.student_id, b.lessons_remaining, b.outstanding_amount,
           s.full_name
    from public.v_enrollment_balances b
    join public.students s on s.id = b.student_id
    join public.student_enrollments e on e.id = b.enrollment_id
    where b.status = 'active'
      and e.billing_mode = 'prepaid_package'
      and b.lessons_remaining is not null
      and b.lessons_remaining <= v_thresh
  loop
    insert into public.notifications (
      type, severity, title, body, entity_type, entity_id, target_role, payload)
    values (
      case when rec.lessons_remaining < 0 then 'lessons_overdrawn' else 'lessons_running_low' end,
      (case when rec.lessons_remaining < 0 then 'critical' else 'warning' end)::notification_severity,
      case when rec.lessons_remaining < 0
           then 'KHẨN — ĐÃ HỌC VƯỢT SỐ BUỔI ĐÃ ĐÓNG'
           else 'SẮP HẾT BUỔI — CẦN NHẮC ĐÓNG HỌC PHÍ' end,
      format(
        E'Học viên: %s\nSố buổi còn lại: %s\nCông nợ hiện tại: %s ₫',
        rec.full_name,
        trim(to_char(rec.lessons_remaining, 'FM999990.99')),
        trim(to_char(coalesce(rec.outstanding_amount, 0), 'FM999,999,999,999'))),
      'enrollment', rec.enrollment_id,
      'founder',
      jsonb_build_object(
        'student_id', rec.student_id,
        'student_name', rec.full_name,
        'lessons_remaining', rec.lessons_remaining,
        'outstanding_amount', rec.outstanding_amount))
    on conflict (type, entity_type, entity_id)
      where status in ('new','acknowledged')
      do update set body = excluded.body, payload = excluded.payload, updated_at = now();
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

grant execute on function public.fn_alert_lesson_balance() to authenticated;

-- -----------------------------------------------------------------------------
-- Cảnh báo buổi đã học nhưng chưa gửi phụ huynh sau N ngày
-- -----------------------------------------------------------------------------
create or replace function public.fn_alert_not_sent_to_parent()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  rec  record;
  v_n  int := 0;
  v_days int := public.setting_int('alert_days_not_sent_parent', 3);
begin
  for rec in
    select tr.id as report_id, l.id as lesson_id, l.lesson_date,
           c.name as class_name, t.full_name as teacher_name
    from public.teaching_reports tr
    join public.lessons l on l.id = tr.lesson_id
    join public.classes c on c.id = l.class_id
    left join public.teachers t on t.id = tr.teacher_id
    where l.status = 'completed'
      and tr.sent_to_parent_at is null
      and l.lesson_date < current_date - v_days
  loop
    insert into public.notifications (
      type, severity, title, body, entity_type, entity_id, target_role, payload)
    values (
      'report_not_sent_to_parent', 'warning',
      'CHƯA GỬI BÁO CÁO CHO PHỤ HUYNH',
      format(E'Lớp: %s\nGiáo viên: %s\nNgày học: %s\n\nĐã qua %s ngày mà chưa gửi phụ huynh.',
             rec.class_name, coalesce(rec.teacher_name, 'Chưa phân công'),
             to_char(rec.lesson_date, 'DD/MM/YYYY'), v_days),
      'report', rec.report_id, 'founder',
      jsonb_build_object('lesson_id', rec.lesson_id, 'report_id', rec.report_id,
                         'teacher_name', rec.teacher_name, 'class_name', rec.class_name))
    on conflict (type, entity_type, entity_id)
      where status in ('new','acknowledged')
      do update set body = excluded.body, updated_at = now();
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

grant execute on function public.fn_alert_not_sent_to_parent() to authenticated;

-- =============================================================================
-- View: cập nhật theo mô hình mới + trang "Cần đối soát" (D8)
-- =============================================================================

-- Đổi thứ tự cột nên phải drop rồi tạo lại; v_student_finance phụ thuộc vào
-- view này nên cũng được dựng lại ngay bên dưới.
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
  -- Trả sau theo tháng thì không có khái niệm "số buổi còn lại".
  case when e.billing_mode = 'prepaid_package'
       then e.lessons_purchased - coalesce(c.lessons_used, 0) end as lessons_remaining,
  e.gross_amount,
  e.discount_amount,
  e.net_amount,
  coalesce(p.total_paid, 0)             as total_paid,
  -- Gói trả trước: nợ = tổng cam kết − đã trả.
  -- Trả sau theo tháng: nợ = doanh thu đã phát sinh − đã trả (có thể âm nếu trả dư).
  case when e.billing_mode = 'prepaid_package'
       then coalesce(e.net_amount, 0) - coalesce(p.total_paid, 0)
       else coalesce(c.revenue_recognized, 0) - coalesce(p.total_paid, 0)
  end                                    as outstanding_amount,
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
  'lessons_remaining chỉ có nghĩa với gói trả trước; trả sau theo tháng thì NULL. Số buổi còn lại ÂM là bình thường — học viên được học vượt (D7).';

-- Tổng hợp theo học viên: trả sau theo tháng không có "số buổi còn lại" nên
-- chỉ cộng phần gói trả trước.
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

-- Bổ sung thông tin chất lượng vào view buổi học.
drop view if exists public.v_lesson_reports;
create view public.v_lesson_reports
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
  tr.qc_score,
  tr.authored_by,
  tr.sent_to_parent_at,
  -- Thiếu giờ dạy là lý do DUY NHẤT làm buổi không được tính lương (D5).
  ((tr.id is null or tr.start_time is null or tr.end_time is null)
     and (l.actual_start_at is null or l.actual_end_at is null)) as blocks_payroll,
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

-- Trang "Cần đối soát": mọi dòng di trú có dữ liệu nghi vấn (D8).
create or replace view public.v_data_review
with (security_invoker = on) as
select 'student'::text as entity_type, s.id as entity_id,
       s.student_code as code, s.full_name as label, s.review_note, s.created_at
from public.students s where s.needs_review
union all
select 'class', c.id, c.class_code, c.name, c.review_note, c.created_at
from public.classes c where c.needs_review
union all
select 'enrollment', e.id, e.enrollment_code,
       (select full_name from public.students s where s.id = e.student_id),
       e.review_note, e.created_at
from public.student_enrollments e where e.needs_review
union all
select 'teacher', t.id, t.teacher_code, t.full_name, t.review_note, t.created_at
from public.teachers t where t.needs_review
union all
select 'payment', p.id, p.payment_code,
       (select full_name from public.students s where s.id = p.student_id),
       p.review_note, p.created_at
from public.payments p where p.needs_review;

comment on view public.v_data_review is
  'Danh sách dòng cần Founder đối soát sau khi di trú từ Google Sheets (D8).';

-- =============================================================================
-- RLS cho các bảng mới
-- =============================================================================
alter table public.tuition_rates enable row level security;
alter table public.tuition_statements enable row level security;

-- Học phí là tiền: chỉ Founder. Không có policy nào cho giáo viên.
create policy tuition_rates_founder_all on public.tuition_rates
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy statements_founder_all on public.tuition_statements
  for all to authenticated using (public.is_founder()) with check (public.is_founder());

grant select, insert, update, delete on public.tuition_rates to authenticated;
grant select, insert, update, delete on public.tuition_statements to authenticated;

-- Giáo viên được ghi nhận đã gửi phụ huynh cho lớp mình dạy: cột này nằm trong
-- teaching_reports nên đã thuộc policy reports_teacher_update sẵn có.

-- -----------------------------------------------------------------------------
-- Nhãn tiếng Việt cho các trường còn thiếu — cập nhật theo 6 tiêu chí mới (D3)
-- -----------------------------------------------------------------------------
create or replace function public.fn_missing_field_label(p_field text)
returns text
language sql
immutable
as $$
  select case p_field
    when 'start_time'         then 'Giờ bắt đầu'
    when 'end_time'           then 'Giờ kết thúc'
    when 'video'              then 'Link video'
    when 'recording'          then 'Link video'
    when 'timestamp'          then 'Timestamp đối chiếu'
    when 'student_quote'      then 'Trích nguyên văn lời học viên'
    when 'strengths_deep'     then 'Điểm mạnh đủ sâu'
    when 'improvements_deep'  then 'Phần cần cải thiện đủ sâu'
    when 'homework_pattern'   then 'Homework có mẫu câu'
    when 'homework'           then 'Bài tập về nhà'
    when 'teacher_comments'   then 'Nhận xét của giáo viên'
    when 'report'             then 'Chưa nộp báo cáo'
    else p_field end;
$$;

-- View bị drop rồi tạo lại nên mất quyền đã cấp ở 0011 — cấp lại.
-- security_invoker = on nên RLS của người gọi vẫn có hiệu lực trên bảng gốc.
grant select on public.v_enrollment_balances to authenticated;
grant select on public.v_student_finance    to authenticated;
grant select on public.v_lesson_reports     to authenticated;
grant select on public.v_data_review        to authenticated;
