-- =============================================================================
-- 0009_notifications.sql
-- Operational alerts. The quality alert from section VI lives here.
-- =============================================================================

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,
  severity     notification_severity not null default 'warning',
  title        text not null,
  body         text,
  entity_type  text,
  entity_id    uuid,
  target_role  text references public.roles (code),
  target_user_id uuid references public.users (id) on delete cascade,
  payload      jsonb not null default '{}'::jsonb,
  status       notification_status not null default 'new',
  due_at       timestamptz,
  resolved_by  uuid references public.users (id),
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.notifications is
  'Cảnh báo vận hành. type = teaching_report_incomplete | tuition_due | no_active_enrollment | ...';

create index if not exists idx_notifications_open on public.notifications (created_at desc)
  where status in ('new','acknowledged');

-- One open alert per (type, entity) - re-running the scan must not spam.
create unique index if not exists uq_notification_open
  on public.notifications (type, entity_type, entity_id)
  where status in ('new','acknowledged');

create trigger trg_notifications_updated_at before update on public.notifications
  for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- fn_scan_overdue_reports
-- Marks reports INCOMPLETE past the deadline and raises one QUALITY ALERT each.
-- Call from n8n / Vercel Cron via POST /api/cron/scan-reports, or pg_cron.
-- -----------------------------------------------------------------------------
create or replace function public.fn_scan_overdue_reports()
returns table (lesson_id uuid, alert_created boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  rec         record;
  v_missing   text[];
  v_created   boolean;
  v_label     text;
begin
  for rec in
    select l.id            as lesson_id,
           l.lesson_date,
           l.report_due_at,
           c.name          as class_name,
           t.full_name     as teacher_name,
           tr.id           as report_id,
           tr.missing_fields,
           (select string_agg(s.full_name, ', ' order by s.full_name)
              from public.class_students cs
              join public.students s on s.id = cs.student_id
             where cs.class_id = l.class_id and cs.status = 'active') as student_names
    from public.lessons l
    join public.classes c on c.id = l.class_id
    left join public.teachers t on t.id = l.teacher_id
    left join public.teaching_reports tr on tr.lesson_id = l.id
    where l.status = 'completed'
      and l.report_due_at is not null
      and now() > l.report_due_at
  loop
    -- Refresh the report so missing_fields / status reflect the deadline.
    if rec.report_id is not null then
      perform public.fn_refresh_report_status(rec.report_id);
      select tr.missing_fields into v_missing
        from public.teaching_reports tr where tr.id = rec.report_id;
    else
      v_missing := array['report','homework','recording','teacher_comments'];
    end if;

    if array_length(v_missing, 1) is null then
      -- Complete after all: close any open alert.
      update public.notifications
         set status = 'resolved', resolved_at = now()
       where type = 'teaching_report_incomplete'
         and entity_type = 'lesson' and entity_id = rec.lesson_id
         and status in ('new','acknowledged');
      continue;
    end if;

    v_label := array_to_string(
      array(select public.fn_missing_field_label(m) from unnest(v_missing) m), E'\n- ');

    insert into public.notifications (
      type, severity, title, body, entity_type, entity_id,
      target_role, payload, due_at)
    values (
      'teaching_report_incomplete',
      'critical',
      'CẢNH BÁO CHẤT LƯỢNG',
      format(
        E'Học viên: %s\nGiáo viên: %s\nNgày học: %s\n\nCòn thiếu:\n- %s\n\nĐã quá hạn: %s giờ\n\nTrạng thái: Cần xem xét',
        coalesce(rec.student_names, rec.class_name),
        coalesce(rec.teacher_name, 'Chưa phân công'),
        to_char(rec.lesson_date, 'DD/MM/YYYY'),
        v_label,
        public.setting_int('report_deadline_hours', 10)),
      'lesson', rec.lesson_id,
      'founder',
      jsonb_build_object(
        'lesson_id', rec.lesson_id,
        'report_id', rec.report_id,
        'missing_fields', v_missing,
        'teacher_name', rec.teacher_name,
        'class_name', rec.class_name,
        'student_names', rec.student_names,
        'due_at', rec.report_due_at),
      rec.report_due_at)
    on conflict (type, entity_type, entity_id)
      where status in ('new','acknowledged')
      do update set body = excluded.body, payload = excluded.payload, updated_at = now()
    returning true into v_created;

    return query select rec.lesson_id, coalesce(v_created, false);
  end loop;
end;
$$;

create or replace function public.fn_missing_field_label(p_field text)
returns text
language sql
immutable
as $$
  select case p_field
    when 'homework'         then 'Bài tập về nhà'
    when 'recording'        then 'Link recording'
    when 'teacher_comments' then 'Nhận xét của giáo viên'
    when 'start_time'       then 'Giờ bắt đầu'
    when 'end_time'         then 'Giờ kết thúc'
    when 'report'           then 'Chưa nộp báo cáo'
    else p_field end;
$$;

grant execute on function public.fn_missing_field_label(text) to authenticated;
