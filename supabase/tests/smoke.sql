-- =============================================================================
-- smoke.sql — kiểm thử nghiệp vụ cốt lõi trên một cluster PostgreSQL sạch
--
-- Chạy sau 00_supabase_shim.sql + toàn bộ migrations.
-- Mọi bước đều RAISE EXCEPTION nếu kết quả sai ⇒ psql thoát với mã lỗi.
-- =============================================================================

\set ON_ERROR_STOP on

create or replace function public.t_assert(p_ok boolean, p_msg text)
returns void language plpgsql as $$
begin
  if p_ok is not true then
    raise exception 'ASSERT FAILED: %', p_msg;
  end if;
  raise notice '  ok  %', p_msg;
end; $$;

-- -----------------------------------------------------------------------------
-- 1. Accounts: profile auto-created from auth.users, role defaults to teacher
-- -----------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'founder@mnee.test',
   '{"full_name":"Ms.Ngọc"}'),
  ('22222222-2222-2222-2222-222222222222', 'sheba@mnee.test',
   '{"full_name":"Ms. Sheba"}'),
  ('33333333-3333-3333-3333-333333333333', 'other@mnee.test',
   '{"full_name":"Mr. Other"}');

do $$ begin
  perform public.t_assert(
    (select count(*) from public.users) = 3,
    '3 hồ sơ người dùng được tạo tự động từ auth.users');
  perform public.t_assert(
    (select role_code from public.users where email = 'sheba@mnee.test') = 'teacher',
    'vai trò mặc định là teacher (đặc quyền tối thiểu)');
end $$;

update public.users set role_code = 'founder' where email = 'founder@mnee.test';

-- -----------------------------------------------------------------------------
-- 2. Academic setup
-- -----------------------------------------------------------------------------
insert into public.teachers (id, user_id, full_name, status) values
  ('aaaaaaaa-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222', 'Ms. Sheba', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000002',
   '33333333-3333-3333-3333-333333333333', 'Mr. Other', 'active');

-- Sheba: 150k / 30 phút, 300k / 60 phút. Đơn giá riêng theo giáo viên.
insert into public.teacher_rates (teacher_id, scope, duration_minutes, rate_amount) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'duration', 30, 150000),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'duration', 60, 300000),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'duration', 60, 250000);

insert into public.parents (id, full_name, phone) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Phụ huynh của Tân', '0900000001');

-- Two students on DIFFERENT per-lesson prices (section VII of the brief).
insert into public.students (id, full_name, nickname, date_of_birth, status, program_id, current_level_id)
values
  ('cccccccc-0000-0000-0000-000000000001', 'Nguyễn Văn Tân', 'Tân', '2014-05-20', 'active',
   (select id from public.programs where code = 'KIDS'),
   (select id from public.levels   where code = 'A2')),
  ('cccccccc-0000-0000-0000-000000000002', 'Trần Thị Mai', 'Mai', '1996-02-10', 'active',
   (select id from public.programs where code = 'ADULT'),
   (select id from public.levels   where code = 'B1'));

insert into public.student_parents (student_id, parent_id, relationship, is_primary)
values ('cccccccc-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001', 'mother', true);

do $$ begin
  perform public.t_assert(
    (select student_code from public.students
      where id = 'cccccccc-0000-0000-0000-000000000001') like 'HV%',
    'mã học viên được sinh tự động (HV0001...)');
  perform public.t_assert(
    (select age from public.v_student_overview
      where id = 'cccccccc-0000-0000-0000-000000000001') =
    extract(year from age(current_date, date '2014-05-20'))::int,
    'tuổi được suy ra từ ngày sinh, không lưu cứng');
  perform public.t_assert(
    (select parent_phone from public.v_student_overview
      where id = 'cccccccc-0000-0000-0000-000000000001') = '0900000001',
    'điện thoại phụ huynh hiển thị trong hồ sơ học viên');
end $$;

-- Classes: one 1-1 for Sheba, one for the other teacher (RLS isolation later)
insert into public.classes (id, name, teacher_id, class_type, max_students,
                            default_duration_minutes, status, program_id)
values
  ('dddddddd-0000-0000-0000-000000000001', 'Tân - 1:1 Kids A2',
   'aaaaaaaa-0000-0000-0000-000000000001', 'one_to_one', 1, 60, 'active',
   (select id from public.programs where code = 'KIDS')),
  ('dddddddd-0000-0000-0000-000000000002', 'Mai - 1:1 Adult B1',
   'aaaaaaaa-0000-0000-0000-000000000002', 'one_to_one', 1, 60, 'active',
   (select id from public.programs where code = 'ADULT'));

insert into public.class_students (class_id, student_id) values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001'),
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000002');

-- -----------------------------------------------------------------------------
-- 3. Tuition: different price per student, no hard-coded centre price
-- -----------------------------------------------------------------------------
insert into public.student_enrollments
  (id, student_id, class_id, program_id, lessons_purchased, price_per_lesson,
   discount_amount, net_amount, status)
values
  ('eeeeeeee-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001',
   'dddddddd-0000-0000-0000-000000000001',
   (select id from public.programs where code = 'KIDS'),
   12, 250000, 0, 3000000, 'active'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000002',
   'dddddddd-0000-0000-0000-000000000002',
   (select id from public.programs where code = 'ADULT'),
   10, 280000, 900000, 1900000, 'active');

do $$ begin
  perform public.t_assert(
    (select gross_amount from public.student_enrollments
      where id = 'eeeeeeee-0000-0000-0000-000000000002') = 2800000,
    'gross_amount tự tính = số buổi × đơn giá (10 × 280.000)');
  perform public.t_assert(
    (select count(distinct price_per_lesson) from public.student_enrollments) = 2,
    'hai học viên có hai đơn giá khác nhau (250k và 280k)');
end $$;

-- Payment of 3.000.000 for 12 FUTURE lessons (section XII example)
insert into public.payments (student_id, enrollment_id, amount, payment_date, method)
values ('cccccccc-0000-0000-0000-000000000001',
        'eeeeeeee-0000-0000-0000-000000000001', 3000000, current_date, 'bank_transfer');

do $$
declare b record;
begin
  select * into b from public.v_enrollment_balances
   where enrollment_id = 'eeeeeeee-0000-0000-0000-000000000001';
  perform public.t_assert(b.total_paid = 3000000,      'tiền mặt đã thu = 3.000.000');
  perform public.t_assert(b.revenue_recognized = 0,    'doanh thu ghi nhận = 0 (chưa dạy buổi nào)');
  perform public.t_assert(b.outstanding_amount = 0,    'công nợ = 0');
  perform public.t_assert(b.deferred_revenue = 3000000,'học phí trả trước = 3.000.000 (nghĩa vụ, không phải lợi nhuận)');
  perform public.t_assert(b.lessons_remaining = 12,    'còn 12 buổi');
end $$;

do $$ begin
  perform public.t_assert(
    (select outstanding_amount from public.v_student_finance
      where student_id = 'cccccccc-0000-0000-0000-000000000002') = 1900000,
    'Mai chưa đóng tiền ⇒ công nợ 1.900.000 (đã trừ giảm giá 900.000)');
end $$;

-- -----------------------------------------------------------------------------
-- 4. A lesson that finished 12 hours ago ⇒ already past the 10-hour deadline
-- -----------------------------------------------------------------------------
insert into public.lessons (id, class_id, lesson_date, scheduled_start_at, scheduled_end_at,
                            actual_start_at, actual_end_at, status)
values ('ffffffff-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001',
        current_date, now() - interval '13 hours', now() - interval '12 hours',
        now() - interval '13 hours', now() - interval '12 hours', 'completed');

do $$
declare l public.lessons;
begin
  select * into l from public.lessons where id = 'ffffffff-0000-0000-0000-000000000001';
  perform public.t_assert(l.duration_minutes = 60, 'thời lượng tính từ giờ bắt đầu/kết thúc thực tế');
  perform public.t_assert(l.report_due_at = l.actual_end_at + interval '10 hours',
    'hạn nộp báo cáo = giờ kết thúc + 10 giờ');
  perform public.t_assert(l.report_due_at < now(), 'buổi học này đã quá hạn nộp');
  perform public.t_assert(l.teacher_id = 'aaaaaaaa-0000-0000-0000-000000000001',
    'giáo viên được lấy từ lớp học nếu không chỉ định');
end $$;

-- Attendance: present ⇒ billable ⇒ one lesson consumed ⇒ revenue recognised
insert into public.attendance (lesson_id, student_id, status)
values ('ffffffff-0000-0000-0000-000000000001',
        'cccccccc-0000-0000-0000-000000000001', 'present');

do $$
declare b record;
begin
  select * into b from public.v_enrollment_balances
   where enrollment_id = 'eeeeeeee-0000-0000-0000-000000000001';
  perform public.t_assert(b.lessons_used = 1,           'đã dạy 1 buổi ⇒ trừ 1 buổi');
  perform public.t_assert(b.lessons_remaining = 11,     'còn lại 11 buổi');
  perform public.t_assert(b.revenue_recognized = 250000,'doanh thu ghi nhận = 250.000 (đúng đơn giá hợp đồng)');
  perform public.t_assert(b.total_paid = 3000000,       'tiền mặt đã thu KHÔNG đổi khi dạy');
  perform public.t_assert(b.deferred_revenue = 2750000, 'học phí trả trước còn lại = 2.750.000');
end $$;

-- -----------------------------------------------------------------------------
-- 5. Incomplete report ⇒ QUALITY ALERT (section VI)
-- -----------------------------------------------------------------------------
insert into public.teaching_reports (id, lesson_id, start_time, end_time, lesson_content, submitted_at)
values ('99999999-0000-0000-0000-000000000001', 'ffffffff-0000-0000-0000-000000000001',
        now() - interval '13 hours', now() - interval '12 hours',
        'Unit 4: Daily routines', now() - interval '11 hours');

do $$
declare r public.teaching_reports;
begin
  select * into r from public.teaching_reports where id = '99999999-0000-0000-0000-000000000001';
  perform public.t_assert(r.status = 'incomplete',
    'thiếu trường bắt buộc + quá hạn ⇒ trạng thái INCOMPLETE');
  perform public.t_assert(r.missing_fields @> array['homework','recording','teacher_comments'],
    'đúng 3 trường còn thiếu: bài tập, recording, nhận xét');
  perform public.t_assert(r.class_id = 'dddddddd-0000-0000-0000-000000000001',
    'class_id được suy ra từ buổi học');
end $$;

do $$
declare n public.notifications;
begin
  perform public.fn_scan_overdue_reports();
  select * into n from public.notifications
   where type = 'teaching_report_incomplete'
     and entity_id = 'ffffffff-0000-0000-0000-000000000001';
  perform public.t_assert(n.id is not null,         'cảnh báo chất lượng được tạo');
  perform public.t_assert(n.title = 'CẢNH BÁO CHẤT LƯỢNG', 'tiêu đề cảnh báo đúng');
  perform public.t_assert(n.severity = 'critical',  'mức độ: critical');
  perform public.t_assert(n.body like '%Tân%',      'cảnh báo nêu tên học viên');
  perform public.t_assert(n.body like '%Ms. Sheba%','cảnh báo nêu tên giáo viên');
  perform public.t_assert(n.body like '%Link recording%', 'cảnh báo liệt kê: Link recording');
  perform public.t_assert(n.body like '%Bài tập về nhà%', 'cảnh báo liệt kê: Bài tập về nhà');
  perform public.t_assert(n.body like '%10 giờ%',   'cảnh báo nêu mốc quá hạn 10 giờ');
  perform public.t_assert(n.body like '%Cần xem xét%', 'trạng thái: Cần xem xét');

  -- Running the scan twice must not create a second alert.
  perform public.fn_scan_overdue_reports();
  perform public.t_assert(
    (select count(*) from public.notifications
      where type = 'teaching_report_incomplete'
        and entity_id = 'ffffffff-0000-0000-0000-000000000001') = 1,
    'quét lại không sinh cảnh báo trùng');
end $$;

-- No payable lesson yet: the report is not valid
do $$ begin
  perform public.t_assert(
    (select count(*) from public.teacher_payable_lessons
      where lesson_id = 'ffffffff-0000-0000-0000-000000000001') = 0,
    'báo cáo chưa hợp lệ ⇒ CHƯA sinh buổi tính lương');
end $$;

-- -----------------------------------------------------------------------------
-- 6. Teacher completes the report ⇒ payable lesson appears with frozen rate
-- -----------------------------------------------------------------------------
insert into public.homework (lesson_id, class_id, title, description, due_date)
values ('ffffffff-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001',
        'Workbook p.32-33', 'Viết 5 câu về thói quen buổi sáng', current_date + 2);

insert into public.recordings (lesson_id, url, provider)
values ('ffffffff-0000-0000-0000-000000000001',
        'https://drive.google.com/file/d/abc123/view', 'google_drive');

update public.teaching_reports
   set teacher_comments = 'Tân phát âm tốt, cần luyện thêm thì hiện tại đơn.'
 where id = '99999999-0000-0000-0000-000000000001';

do $$
declare r public.teaching_reports; p public.teacher_payable_lessons;
begin
  select * into r from public.teaching_reports where id = '99999999-0000-0000-0000-000000000001';
  perform public.t_assert(array_length(r.missing_fields, 1) is null, 'không còn trường thiếu');
  perform public.t_assert(r.status = 'submitted', 'báo cáo đủ ⇒ trạng thái submitted');
  perform public.t_assert(r.is_late is true, 'vẫn ghi nhận là nộp trễ so với hạn 10 giờ');

  select * into p from public.teacher_payable_lessons
   where lesson_id = 'ffffffff-0000-0000-0000-000000000001';
  perform public.t_assert(p.id is not null, 'buổi tính lương được sinh tự động');
  perform public.t_assert(p.amount = 300000, 'đơn giá 60 phút của Ms. Sheba = 300.000');
  perform public.t_assert(p.rate_source = 'duration', 'nguồn đơn giá: theo thời lượng');
  perform public.t_assert(p.status = 'pending', 'trạng thái: chờ đưa vào kỳ lương');
end $$;

-- Changing the rate later must NOT rewrite the frozen amount
insert into public.teacher_rates (teacher_id, scope, duration_minutes, rate_amount, effective_from)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'duration', 60, 350000, current_date + 30);

do $$ begin
  perform public.t_assert(
    (select amount from public.teacher_payable_lessons
      where lesson_id = 'ffffffff-0000-0000-0000-000000000001') = 300000,
    'tăng đơn giá về sau KHÔNG làm sai lương buổi đã dạy (rủi ro R6)');
end $$;

-- -----------------------------------------------------------------------------
-- 7. Payroll: build → approve → paid, Founder gate enforced
-- -----------------------------------------------------------------------------
set session "test.user_id" = '11111111-1111-1111-1111-111111111111';  -- Founder

do $$
declare v_payroll uuid; pr public.teacher_payroll;
begin
  v_payroll := public.fn_build_payroll(
    'aaaaaaaa-0000-0000-0000-000000000001', date_trunc('month', current_date)::date,
    (date_trunc('month', current_date) + interval '1 month - 1 day')::date);

  select * into pr from public.teacher_payroll where id = v_payroll;
  perform public.t_assert(pr.lessons_count = 1,      'kỳ lương gồm 1 buổi');
  perform public.t_assert(pr.teaching_minutes = 60,  'tổng 60 phút dạy');
  perform public.t_assert(pr.gross_amount = 300000,  'lương gộp = 300.000');
  perform public.t_assert(pr.final_amount = 300000,  'lương cuối = 300.000');
  perform public.t_assert(pr.status = 'draft',       'trạng thái khởi tạo: draft');

  insert into public.teacher_payroll_adjustments (payroll_id, kind, description, amount)
  values (v_payroll, 'deduction', 'Trừ do nộp báo cáo trễ', -50000);

  select * into pr from public.teacher_payroll where id = v_payroll;
  perform public.t_assert(pr.adjustments_amount = -50000, 'điều chỉnh -50.000 được dồn vào');
  perform public.t_assert(pr.final_amount = 250000,       'lương cuối sau điều chỉnh = 250.000');

  -- paid must not be reachable directly from draft
  begin
    update public.teacher_payroll set status = 'paid' where id = v_payroll;
    perform public.t_assert(false, 'lẽ ra phải chặn draft → paid');
  exception when others then
    perform public.t_assert(sqlerrm like '%Phải duyệt%', 'chặn draft → paid, buộc duyệt trước');
  end;

  update public.teacher_payroll set status = 'approved' where id = v_payroll;
  select * into pr from public.teacher_payroll where id = v_payroll;
  perform public.t_assert(pr.approved_by = '11111111-1111-1111-1111-111111111111',
    'người duyệt được ghi lại tự động');

  update public.teacher_payroll set status = 'paid' where id = v_payroll;
  perform public.t_assert(
    (select status from public.teacher_payable_lessons
      where lesson_id = 'ffffffff-0000-0000-0000-000000000001') = 'paid',
    'đánh dấu đã trả ⇒ buổi tính lương chuyển sang paid');
end $$;

reset "test.user_id";

-- -----------------------------------------------------------------------------
-- 8. Excused absence must NOT consume a lesson (assumption A5)
-- -----------------------------------------------------------------------------
insert into public.lessons (id, class_id, lesson_date, scheduled_start_at, scheduled_end_at,
                            actual_start_at, actual_end_at, status)
values ('ffffffff-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000001',
        current_date, now() - interval '3 hours', now() - interval '2 hours',
        now() - interval '3 hours', now() - interval '2 hours', 'completed');

insert into public.attendance (lesson_id, student_id, status)
values ('ffffffff-0000-0000-0000-000000000002',
        'cccccccc-0000-0000-0000-000000000001', 'absent_excused');

do $$ begin
  perform public.t_assert(
    (select is_billable from public.attendance
      where lesson_id = 'ffffffff-0000-0000-0000-000000000002') is false,
    'vắng CÓ PHÉP ⇒ không tính phí');
  perform public.t_assert(
    (select lessons_remaining from public.v_enrollment_balances
      where enrollment_id = 'eeeeeeee-0000-0000-0000-000000000001') = 11,
    'số buổi còn lại vẫn là 11 (không bị trừ oan)');
end $$;

-- Switch it to unexcused: now it does consume a lesson
update public.attendance set status = 'absent_unexcused'
 where lesson_id = 'ffffffff-0000-0000-0000-000000000002';

do $$ begin
  perform public.t_assert(
    (select lessons_remaining from public.v_enrollment_balances
      where enrollment_id = 'eeeeeeee-0000-0000-0000-000000000001') = 10,
    'vắng KHÔNG PHÉP ⇒ trừ buổi, còn 10');
end $$;

-- A cancelled lesson must release the deduction
update public.lessons set status = 'cancelled', cancellation_reason = 'Giáo viên bị mất điện'
 where id = 'ffffffff-0000-0000-0000-000000000002';

do $$ begin
  perform public.t_assert(
    (select lessons_remaining from public.v_enrollment_balances
      where enrollment_id = 'eeeeeeee-0000-0000-0000-000000000001') = 11,
    'huỷ buổi ⇒ hoàn lại buổi đã trừ (rủi ro R7)');
end $$;

-- -----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY — the part that protects the Founder's numbers
-- -----------------------------------------------------------------------------
\echo '--- RLS: giáo viên Ms. Sheba ---'
begin;
  set local role authenticated;
  set local "test.user_id" = '22222222-2222-2222-2222-222222222222';

  do $$ begin
    perform public.t_assert(public.is_teacher(),      'được nhận diện là giáo viên');
    perform public.t_assert(not public.is_founder(),  'KHÔNG phải founder');

    -- Money is invisible
    perform public.t_assert((select count(*) from public.payments) = 0,
      'giáo viên KHÔNG đọc được thanh toán nào');
    perform public.t_assert((select count(*) from public.expenses) = 0,
      'giáo viên KHÔNG đọc được chi phí');
    perform public.t_assert((select count(*) from public.student_enrollments) = 0,
      'giáo viên KHÔNG đọc được hợp đồng học phí');
    perform public.t_assert((select count(*) from public.lesson_consumptions) = 0,
      'giáo viên KHÔNG đọc được doanh thu ghi nhận');
    perform public.t_assert(
      (select coalesce(sum(total_paid), 0) from public.v_enrollment_balances) = 0,
      'view tài chính trả về 0 dòng cho giáo viên (security_invoker)');

    -- Own data is visible
    perform public.t_assert((select count(*) from public.classes) = 1,
      'chỉ thấy đúng 1 lớp mình dạy');
    perform public.t_assert(
      (select full_name from public.students) = 'Nguyễn Văn Tân',
      'chỉ thấy học viên của lớp mình');
    perform public.t_assert((select count(*) from public.teaching_reports) = 1,
      'chỉ thấy báo cáo của lớp mình');

    -- Own payroll only
    perform public.t_assert((select count(*) from public.teacher_payroll) = 1,
      'thấy kỳ lương CỦA CHÍNH MÌNH');
    perform public.t_assert(
      (select count(*) from public.teacher_rates) = 3,
      'thấy đơn giá của chính mình, không thấy của giáo viên khác');
    perform public.t_assert(
      (select count(*) from public.teacher_rates
        where teacher_id = 'aaaaaaaa-0000-0000-0000-000000000002') = 0,
      'KHÔNG thấy đơn giá của giáo viên khác');
  end $$;

  -- Teacher may record attendance on their own lesson
  do $$ begin
    begin
      insert into public.attendance (lesson_id, student_id, status)
      values ('ffffffff-0000-0000-0000-000000000001',
              'cccccccc-0000-0000-0000-000000000002', 'present');
      perform public.t_assert(false, 'lẽ ra phải chặn điểm danh học viên không thuộc lớp');
    exception when insufficient_privilege or check_violation then
      perform public.t_assert(true, 'RLS chặn ghi dữ liệu ngoài phạm vi');
    when others then
      perform public.t_assert(sqlerrm like '%row-level security%' or sqlerrm like '%violates%',
        'RLS chặn ghi dữ liệu ngoài phạm vi: ' || sqlerrm);
    end;
  end $$;

  -- A teacher must not be able to promote themselves to founder
  do $$
  declare v_role text;
  begin
    update public.users set role_code = 'founder' where id = auth.uid();
    select role_code into v_role from public.users where id = auth.uid();
    perform public.t_assert(v_role = 'teacher', 'giáo viên KHÔNG thể tự nâng mình thành founder');
  exception when others then
    perform public.t_assert(true, 'giáo viên không thể tự đổi vai trò: ' || sqlerrm);
  end $$;
rollback;

\echo '--- RLS: giáo viên khác (Mr. Other) ---'
begin;
  set local role authenticated;
  set local "test.user_id" = '33333333-3333-3333-3333-333333333333';
  do $$ begin
    perform public.t_assert((select count(*) from public.students) = 1,
      'chỉ thấy học viên của mình (Mai), không thấy Tân');
    perform public.t_assert((select full_name from public.students) = 'Trần Thị Mai',
      'đúng học viên của lớp mình');
    perform public.t_assert((select count(*) from public.teacher_payroll) = 0,
      'KHÔNG thấy kỳ lương của Ms. Sheba');
    perform public.t_assert((select count(*) from public.teaching_reports) = 0,
      'KHÔNG thấy báo cáo của lớp người khác');
  end $$;
rollback;

\echo '--- RLS: Founder ---'
begin;
  set local role authenticated;
  set local "test.user_id" = '11111111-1111-1111-1111-111111111111';
  do $$ begin
    perform public.t_assert(public.is_founder(), 'được nhận diện là Founder');
    perform public.t_assert((select count(*) from public.students) = 2,   'thấy toàn bộ học viên');
    perform public.t_assert((select count(*) from public.payments) = 1,   'thấy thanh toán');
    perform public.t_assert((select count(*) from public.teacher_payroll) = 1, 'thấy bảng lương');
    perform public.t_assert(
      (select sum(revenue_recognized) from public.v_enrollment_balances) = 250000,
      'tổng doanh thu ghi nhận = 250.000 (1 buổi đã dạy)');
    perform public.t_assert(
      (select sum(total_paid) from public.v_enrollment_balances) = 3000000,
      'tổng tiền mặt đã thu = 3.000.000 — vẫn tách biệt với doanh thu');
    perform public.t_assert((select count(*) from public.v_quality_alerts) >= 0,
      'đọc được danh sách cảnh báo chất lượng');
  end $$;
rollback;

-- -----------------------------------------------------------------------------
-- 10. Audit trail
-- -----------------------------------------------------------------------------
do $$ begin
  perform public.t_assert(
    (select count(*) from public.audit_logs where table_name = 'students') >= 2,
    'thay đổi trên students được ghi vào audit_logs');
  perform public.t_assert(
    (select count(*) from public.audit_logs where table_name = 'teacher_payroll') >= 1,
    'thay đổi bảng lương được ghi vào audit_logs');
end $$;

\echo ''
\echo '======================================================'
\echo '  TOÀN BỘ KIỂM THỬ NGHIỆP VỤ: ĐẠT'
\echo '======================================================'
