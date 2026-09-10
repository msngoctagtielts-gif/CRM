-- =============================================================================
-- 0011_rls.sql
-- Row Level Security. This is the real security boundary: even a bug in the
-- frontend must not let a teacher read centre profit or another teacher's pay.
--
-- Shape of every table: RLS enabled, no permissive default, Founder gets ALL,
-- Teacher gets exactly the rows they teach.
-- =============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'settings','audit_logs','roles','users',
    'programs','levels','teachers','teacher_rates','parents','students','student_parents',
    'classes','class_students','class_schedules','lessons','attendance',
    'teaching_reports','teaching_report_students','homework','recordings',
    'tuition_packages','student_enrollments','lesson_consumptions','payments','expenses',
    'teacher_payable_lessons','teacher_payroll','teacher_payroll_adjustments',
    'leads','lead_activities','placement_tests','trial_classes','notifications'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    -- Deliberately NOT "force row level security": the table owner must keep
    -- bypassing RLS so the SECURITY DEFINER triggers (audit log, report
    -- refresh, payable-lesson generation) and the permission helper functions
    -- that read public.users can run without recursing into their own policies.
  end loop;
end $$;

-- Revoke blanket grants; policies are the only way in.
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- -----------------------------------------------------------------------------
-- Reference data: everyone signed in may read; only Founder may write.
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['roles','programs','levels','tuition_packages','settings'] loop
    execute format($f$
      create policy %1$s_read on public.%1$I
        for select to authenticated using (true);
      create policy %1$s_write on public.%1$I
        for all to authenticated using (public.is_founder()) with check (public.is_founder());
    $f$, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- users: read own row always; Founder reads & writes everyone.
-- Teachers may read the names of colleagues (needed for class lists) but not
-- edit them.
-- -----------------------------------------------------------------------------
create policy users_read_self on public.users
  for select to authenticated using (id = auth.uid() or public.is_founder());
create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role_code = public.current_role_code());
create policy users_founder_all on public.users
  for all to authenticated using (public.is_founder()) with check (public.is_founder());

comment on policy users_update_self on public.users is
  'Người dùng tự sửa hồ sơ nhưng KHÔNG tự đổi vai trò (role_code phải giữ nguyên).';

-- -----------------------------------------------------------------------------
-- audit_logs: Founder read-only. Writes happen through SECURITY DEFINER trigger.
-- -----------------------------------------------------------------------------
create policy audit_founder_read on public.audit_logs
  for select to authenticated using (public.is_founder());

-- -----------------------------------------------------------------------------
-- Teachers & rates
-- -----------------------------------------------------------------------------
create policy teachers_founder_all on public.teachers
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy teachers_read_roster on public.teachers
  for select to authenticated using (public.is_teacher() or public.is_staff());
create policy teachers_update_self on public.teachers
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Pay rates are money: a teacher sees only their own, nobody else's.
create policy rates_founder_all on public.teacher_rates
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy rates_read_own on public.teacher_rates
  for select to authenticated using (teacher_id = public.current_teacher_id());

-- -----------------------------------------------------------------------------
-- Students, parents
-- -----------------------------------------------------------------------------
create policy students_founder_all on public.students
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy students_teacher_read on public.students
  for select to authenticated
  using (public.is_teacher() and public.teaches_student(id));

create policy parents_founder_all on public.parents
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy parents_teacher_read on public.parents
  for select to authenticated
  using (public.is_teacher() and exists (
    select 1 from public.student_parents sp
    where sp.parent_id = parents.id and public.teaches_student(sp.student_id)));

create policy student_parents_founder_all on public.student_parents
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy student_parents_teacher_read on public.student_parents
  for select to authenticated
  using (public.is_teacher() and public.teaches_student(student_id));

-- -----------------------------------------------------------------------------
-- Classes, rosters, schedules
-- -----------------------------------------------------------------------------
create policy classes_founder_all on public.classes
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy classes_teacher_read on public.classes
  for select to authenticated
  using (public.is_teacher() and teacher_id = public.current_teacher_id());

create policy class_students_founder_all on public.class_students
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy class_students_teacher_read on public.class_students
  for select to authenticated
  using (public.is_teacher() and public.teaches_class(class_id));

create policy class_schedules_founder_all on public.class_schedules
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy class_schedules_teacher_read on public.class_schedules
  for select to authenticated
  using (public.is_teacher() and public.teaches_class(class_id));

-- -----------------------------------------------------------------------------
-- Lessons: a teacher may record start/end time and mark their own lesson done,
-- but may not create or delete lessons (that is scheduling, Founder's job).
-- -----------------------------------------------------------------------------
create policy lessons_founder_all on public.lessons
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy lessons_teacher_read on public.lessons
  for select to authenticated
  using (public.is_teacher() and (teacher_id = public.current_teacher_id()
                                  or public.teaches_class(class_id)));
create policy lessons_teacher_update on public.lessons
  for update to authenticated
  using (public.is_teacher() and teacher_id = public.current_teacher_id())
  with check (public.is_teacher() and teacher_id = public.current_teacher_id());

-- -----------------------------------------------------------------------------
-- Attendance: teachers record it for their own lessons.
-- -----------------------------------------------------------------------------
create policy attendance_founder_all on public.attendance
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy attendance_teacher_read on public.attendance
  for select to authenticated using (public.is_teacher() and public.teaches_lesson(lesson_id));
create policy attendance_teacher_write on public.attendance
  for insert to authenticated
  with check (public.is_teacher()
              and public.teaches_lesson(lesson_id)
              and public.student_in_lesson_class(lesson_id, student_id));
create policy attendance_teacher_update on public.attendance
  for update to authenticated
  using (public.is_teacher() and public.teaches_lesson(lesson_id))
  with check (public.is_teacher()
              and public.teaches_lesson(lesson_id)
              and public.student_in_lesson_class(lesson_id, student_id));

comment on policy attendance_teacher_write on public.attendance is
  'Giáo viên chỉ điểm danh học viên CÓ TRONG lớp của buổi học đó. Nếu thiếu điều kiện này, giáo viên có thể trừ oan buổi học của học viên lớp khác.';

-- -----------------------------------------------------------------------------
-- Teaching reports, homework, recordings: the teacher's working area.
-- A report already approved by the Founder becomes read-only for the teacher.
-- -----------------------------------------------------------------------------
create policy reports_founder_all on public.teaching_reports
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy reports_teacher_read on public.teaching_reports
  for select to authenticated using (public.is_teacher() and public.teaches_lesson(lesson_id));
create policy reports_teacher_insert on public.teaching_reports
  for insert to authenticated with check (public.is_teacher() and public.teaches_lesson(lesson_id));
create policy reports_teacher_update on public.teaching_reports
  for update to authenticated
  using (public.is_teacher() and public.teaches_lesson(lesson_id) and status <> 'approved')
  with check (public.is_teacher() and public.teaches_lesson(lesson_id));

create policy report_students_founder_all on public.teaching_report_students
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy report_students_teacher_rw on public.teaching_report_students
  for all to authenticated
  using (public.is_teacher() and exists (
    select 1 from public.teaching_reports tr
    where tr.id = report_id and public.teaches_lesson(tr.lesson_id)))
  with check (public.is_teacher() and exists (
    select 1 from public.teaching_reports tr
    where tr.id = report_id and public.teaches_lesson(tr.lesson_id)));

create policy homework_founder_all on public.homework
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy homework_teacher_rw on public.homework
  for all to authenticated
  using (public.is_teacher() and (
    (lesson_id is not null and public.teaches_lesson(lesson_id)) or
    (class_id  is not null and public.teaches_class(class_id))))
  with check (public.is_teacher() and (
    (lesson_id is not null and public.teaches_lesson(lesson_id)) or
    (class_id  is not null and public.teaches_class(class_id))));

create policy recordings_founder_all on public.recordings
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy recordings_teacher_rw on public.recordings
  for all to authenticated
  using (public.is_teacher() and (
    (lesson_id is not null and public.teaches_lesson(lesson_id)) or
    (class_id  is not null and public.teaches_class(class_id))))
  with check (public.is_teacher() and (
    (lesson_id is not null and public.teaches_lesson(lesson_id)) or
    (class_id  is not null and public.teaches_class(class_id))));

-- -----------------------------------------------------------------------------
-- MONEY. Founder only. No teacher policy exists at all, which is the point:
-- enrollments, consumptions, payments, expenses are invisible to teachers.
-- -----------------------------------------------------------------------------
create policy enrollments_founder_all on public.student_enrollments
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy consumptions_founder_all on public.lesson_consumptions
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy payments_founder_all on public.payments
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy expenses_founder_all on public.expenses
  for all to authenticated using (public.is_founder()) with check (public.is_founder());

-- -----------------------------------------------------------------------------
-- Payroll: Founder everything. A teacher reads ONLY their own rows.
-- -----------------------------------------------------------------------------
create policy payable_founder_all on public.teacher_payable_lessons
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy payable_read_own on public.teacher_payable_lessons
  for select to authenticated using (teacher_id = public.current_teacher_id());

create policy payroll_founder_all on public.teacher_payroll
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy payroll_read_own on public.teacher_payroll
  for select to authenticated using (teacher_id = public.current_teacher_id());

create policy payroll_adj_founder_all on public.teacher_payroll_adjustments
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy payroll_adj_read_own on public.teacher_payroll_adjustments
  for select to authenticated using (exists (
    select 1 from public.teacher_payroll pr
    where pr.id = payroll_id and pr.teacher_id = public.current_teacher_id()));

-- -----------------------------------------------------------------------------
-- Lead CRM: Founder (and Staff later). Teachers have no access.
-- -----------------------------------------------------------------------------
create policy leads_founder_all on public.leads
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy lead_activities_founder_all on public.lead_activities
  for all to authenticated using (public.is_founder()) with check (public.is_founder());

create policy placement_founder_all on public.placement_tests
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy placement_teacher_rw on public.placement_tests
  for all to authenticated
  using (public.is_teacher() and conducted_by = public.current_teacher_id())
  with check (public.is_teacher() and conducted_by = public.current_teacher_id());

create policy trials_founder_all on public.trial_classes
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy trials_teacher_rw on public.trial_classes
  for all to authenticated
  using (public.is_teacher() and teacher_id = public.current_teacher_id())
  with check (public.is_teacher() and teacher_id = public.current_teacher_id());

-- -----------------------------------------------------------------------------
-- Notifications: see what is addressed to your role or to you personally.
-- -----------------------------------------------------------------------------
create policy notifications_founder_all on public.notifications
  for all to authenticated using (public.is_founder()) with check (public.is_founder());
create policy notifications_read_targeted on public.notifications
  for select to authenticated
  using (target_user_id = auth.uid() or target_role = public.current_role_code());
create policy notifications_ack_targeted on public.notifications
  for update to authenticated
  using (target_user_id = auth.uid())
  with check (target_user_id = auth.uid());
