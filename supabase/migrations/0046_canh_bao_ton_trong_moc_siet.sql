-- 0046 — Cảnh báo phải tôn trọng mốc siết 01/10/2026.
--
-- Hệ cảnh báo xây xong từ lâu nhưng CHƯA TỪNG CHẠY (bảng notifications rỗng tới
-- 18/09/2026), vì nó phụ thuộc /api/cron/scan-reports mà endpoint đó cần
-- CRON_SECRET và SUPABASE_SERVICE_ROLE_KEY chưa cấu hình trên Netlify.
--
-- Chạy thử có rollback trước khi bật cho thấy nó sẽ đẻ ra 915 cảnh báo:
--
--   fn_scan_overdue_reports       460   ← thiếu mốc chặn
--   fn_alert_missing_lesson_time    0   ← đã vá ở 0032, đúng
--   fn_alert_lesson_balance         6
--   fn_alert_not_sent_to_parent   449   ← thiếu mốc chặn
--
-- 909 trong số đó là về buổi cũ cô Ngọc ĐÃ chấp nhận và ĐÃ trả lương. Bật như
-- vậy là giết hệ cảnh báo ngay ngày đầu: không ai đọc nổi 915 dòng.
--
-- Migration 0032 đã vá đúng một hàm. Hai hàm còn lại chưa. Đây là phần còn lại:
-- thêm đúng một điều kiện `l.lesson_date >= v_moc` vào mỗi hàm, phần thân khác
-- giữ nguyên.
--
-- Founder chốt: "Tôi sẽ nhắc họ khắc phục trong tháng 9. Chúng ta sẽ làm nghiêm
-- ngặt trong tháng 10." Nên mốc đọc từ settings.require_evidence_from.

create or replace function public.setting_date(p_key text, p_default date)
returns date language sql stable security definer set search_path to 'public'
as $function$
  select coalesce((select (value #>> '{}')::date from public.settings where key = p_key), p_default);
$function$;

create or replace function public.fn_scan_overdue_reports()
returns table(lesson_id uuid, alert_created boolean)
language plpgsql security definer set search_path to 'public'
as $function$
declare
  rec       record;
  v_missing text[];
  v_created boolean;
  v_label   text;
  v_moc     date := public.setting_date('require_evidence_from', date '2026-10-01');
begin
  for rec in
    select l.id as lesson_id, l.lesson_date, l.report_due_at,
           c.name as class_name, t.full_name as teacher_name,
           tr.id as report_id, tr.missing_fields,
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
      and l.lesson_date >= v_moc          -- ← mốc siết, phần thêm của 0046
  loop
    if rec.report_id is not null then
      perform public.fn_refresh_report_status(rec.report_id);
      select tr.missing_fields into v_missing
        from public.teaching_reports tr where tr.id = rec.report_id;
    else
      v_missing := array['report','homework','recording','teacher_comments'];
    end if;

    if array_length(v_missing, 1) is null then
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
      type, severity, title, body, entity_type, entity_id, target_role, payload, due_at)
    values (
      'teaching_report_incomplete', 'critical', 'CẢNH BÁO CHẤT LƯỢNG',
      format(
        E'Học viên: %s\nGiáo viên: %s\nNgày học: %s\n\nCòn thiếu:\n- %s\n\nĐã quá hạn: %s giờ\n\nTrạng thái: Cần xem xét',
        coalesce(rec.student_names, rec.class_name),
        coalesce(rec.teacher_name, 'Chưa phân công'),
        to_char(rec.lesson_date, 'DD/MM/YYYY'),
        v_label,
        public.setting_int('report_deadline_hours', 10)),
      'lesson', rec.lesson_id, 'founder',
      jsonb_build_object(
        'lesson_id', rec.lesson_id, 'report_id', rec.report_id,
        'missing_fields', v_missing, 'teacher_name', rec.teacher_name,
        'class_name', rec.class_name, 'student_names', rec.student_names,
        'due_at', rec.report_due_at),
      rec.report_due_at)
    on conflict (type, entity_type, entity_id)
      where status in ('new','acknowledged')
      do update set body = excluded.body, payload = excluded.payload, updated_at = now()
    returning true into v_created;

    return query select rec.lesson_id, coalesce(v_created, false);
  end loop;
end;
$function$;

create or replace function public.fn_alert_not_sent_to_parent()
returns integer
language plpgsql security definer set search_path to 'public'
as $function$
declare
  rec    record;
  v_n    int := 0;
  v_days int  := public.setting_int('alert_days_not_sent_parent', 3);
  v_moc  date := public.setting_date('require_evidence_from', date '2026-10-01');
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
      and l.lesson_date >= v_moc          -- ← mốc siết, phần thêm của 0046
  loop
    insert into public.notifications (
      type, severity, title, body, entity_type, entity_id, target_role, payload)
    values (
      'report_not_sent_to_parent', 'warning', 'CHƯA GỬI BÁO CÁO CHO PHỤ HUYNH',
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
$function$;
