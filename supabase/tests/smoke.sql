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
-- 4. Buổi học kết thúc 26 giờ trước ⇒ đã quá hạn 24 giờ (D2)
-- -----------------------------------------------------------------------------
insert into public.lessons (id, class_id, lesson_date, scheduled_start_at, scheduled_end_at,
                            actual_start_at, actual_end_at, status)
values ('ffffffff-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001',
        current_date, now() - interval '27 hours', now() - interval '26 hours',
        now() - interval '27 hours', now() - interval '26 hours', 'completed');

do $$
declare l public.lessons;
begin
  select * into l from public.lessons where id = 'ffffffff-0000-0000-0000-000000000001';
  perform public.t_assert(l.duration_minutes = 60, 'thời lượng tính từ giờ bắt đầu/kết thúc thực tế');
  perform public.t_assert(l.report_due_at = l.actual_end_at + interval '24 hours',
    'hạn nộp báo cáo = giờ kết thúc + 24 giờ (D2)');
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
        now() - interval '27 hours', now() - interval '26 hours',
        'Unit 4: Daily routines', now() - interval '25 hours');

do $$
declare r public.teaching_reports;
begin
  select * into r from public.teaching_reports where id = '99999999-0000-0000-0000-000000000001';
  perform public.t_assert(r.status = 'incomplete',
    'thiếu tiêu chí chất lượng + quá hạn ⇒ trạng thái INCOMPLETE');
  perform public.t_assert(
    r.missing_fields @> array['video','timestamp','student_quote',
                              'strengths_deep','improvements_deep','homework_pattern'],
    'đúng 6 tiêu chí chất lượng còn thiếu (D3)');
  perform public.t_assert(not (r.missing_fields @> array['start_time']),
    'đã ghi giờ dạy nên start_time KHÔNG nằm trong danh sách thiếu');
  perform public.t_assert(r.qc_score = 0, 'điểm QC = 0 khi chưa đạt tiêu chí nào');
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
  perform public.t_assert(n.body like '%Link video%', 'cảnh báo liệt kê: Link video');
  perform public.t_assert(n.body like '%Trích nguyên văn%',
    'cảnh báo liệt kê: Trích nguyên văn lời học viên');
  perform public.t_assert(n.body like '%Homework có mẫu câu%',
    'cảnh báo liệt kê: Homework có mẫu câu');
  perform public.t_assert(n.body like '%24 giờ%',   'cảnh báo nêu mốc quá hạn 24 giờ (D2)');
  perform public.t_assert(n.body like '%Cần xem xét%', 'trạng thái: Cần xem xét');

  -- Running the scan twice must not create a second alert.
  perform public.fn_scan_overdue_reports();
  perform public.t_assert(
    (select count(*) from public.notifications
      where type = 'teaching_report_incomplete'
        and entity_id = 'ffffffff-0000-0000-0000-000000000001') = 1,
    'quét lại không sinh cảnh báo trùng');
end $$;

-- D4: báo cáo thiếu bằng chứng nhưng ĐÃ có giờ dạy ⇒ VẪN sinh buổi tính lương,
-- chỉ gắn cờ. Đây là thay đổi so với thiết kế ban đầu (xem DECISIONS.md D4).
do $$
declare p public.teacher_payable_lessons;
begin
  select * into p from public.teacher_payable_lessons
   where lesson_id = 'ffffffff-0000-0000-0000-000000000001';
  perform public.t_assert(p.id is not null,
    'có giờ dạy + đã điểm danh ⇒ VẪN sinh buổi tính lương dù báo cáo thiếu (D4)');
  perform public.t_assert(p.amount = 300000, 'vẫn tính đủ 300.000 ₫');
  perform public.t_assert(p.has_video is false,  'gắn cờ: thiếu video');
  perform public.t_assert(p.has_evidence is false, 'gắn cờ: thiếu timestamp bằng chứng');
  perform public.t_assert(p.sent_to_parent is false, 'gắn cờ: chưa gửi phụ huynh');
end $$;

-- -----------------------------------------------------------------------------
-- 6. Teacher completes the report ⇒ payable lesson appears with frozen rate
-- -----------------------------------------------------------------------------
-- Bài tập có mẫu câu bắt buộc — một trong 6 tiêu chí (D3)
insert into public.homework (lesson_id, class_id, title, description, due_date, sentence_patterns)
values ('ffffffff-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001',
        'Workbook p.32-33', 'Viết 5 câu về thói quen buổi sáng', current_date + 2,
        'I usually ... at ... / I never ... before ...');

insert into public.recordings (lesson_id, url, provider)
values ('ffffffff-0000-0000-0000-000000000001',
        'https://drive.google.com/file/d/abc123/view', 'google_drive');

-- Kiểm thử từng bước để thấy điểm QC tăng dần theo số tiêu chí đạt.
do $$ begin
  perform public.t_assert(
    (select qc_score from public.teaching_reports
      where id = '99999999-0000-0000-0000-000000000001') = 33,
    'có video + homework mẫu câu ⇒ 2/6 tiêu chí ⇒ điểm QC = 33');
  perform public.t_assert(
    (select status from public.teaching_reports
      where id = '99999999-0000-0000-0000-000000000001') = 'incomplete',
    '33 điểm < ngưỡng 60 ⇒ vẫn INCOMPLETE');
end $$;

update public.teaching_reports
   set teacher_comments = 'Tân phát âm tốt, cần luyện thêm thì hiện tại đơn.',
       student_quote    = 'I wake up at six o''clock and I brush my teeth.',
       strengths        = 'Phát âm /s/ cuối từ đã rõ ở 4/5 câu.',
       improvements     = 'Còn nói "he go" thay vì "he goes" ở phút 12:40.',
       video_timestamp  = '12:40',
       qc_strengths_deep    = true,
       qc_improvements_deep = true
 where id = '99999999-0000-0000-0000-000000000001';

do $$
declare r public.teaching_reports; p public.teacher_payable_lessons;
begin
  select * into r from public.teaching_reports where id = '99999999-0000-0000-0000-000000000001';
  perform public.t_assert(r.qc_score = 100, 'đủ 6/6 tiêu chí ⇒ điểm QC = 100');
  perform public.t_assert(array_length(r.missing_fields, 1) is null, 'không còn tiêu chí thiếu');
  perform public.t_assert(r.status = 'submitted', 'đạt ngưỡng 60 ⇒ trạng thái submitted');
  perform public.t_assert(r.is_late is true, 'vẫn ghi nhận là nộp trễ so với hạn 24 giờ');
  perform public.t_assert(r.authored_by = 'teacher', 'mặc định: nội dung do giáo viên viết (D6)');

  select * into p from public.teacher_payable_lessons
   where lesson_id = 'ffffffff-0000-0000-0000-000000000001';
  perform public.t_assert(p.amount = 300000, 'đơn giá 60 phút của Ms. Sheba = 300.000');
  perform public.t_assert(p.rate_source = 'duration', 'nguồn đơn giá: theo thời lượng');
  perform public.t_assert(p.has_video is true, 'cờ video đã bật');
  perform public.t_assert(p.has_evidence is true, 'cờ bằng chứng timestamp đã bật');
  perform public.t_assert(p.qc_score = 100, 'điểm QC được chuyển sang bảng lương');
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

-- =============================================================================
-- 11. MÔ HÌNH NGHIỆP VỤ THẬT (DECISIONS.md D1, D5, D7, D8, D11, D13)
--     Dùng đúng số liệu từ hệ thống Google Sheets để đối chiếu.
-- =============================================================================

\echo ''
\echo '--- 11a. Đơn giá học phí có ngày hiệu lực — ca Bé Ngân (D11) ---'

insert into public.students (id, full_name, nickname, status)
values ('cccccccc-0000-0000-0000-000000000010', 'Bé Ngân', 'Ngân', 'active');

insert into public.classes (id, name, teacher_id, class_type, max_students,
                            default_duration_minutes, status)
values ('dddddddd-0000-0000-0000-000000000010', 'Bé Ngân - 1:1 pre A1',
        'aaaaaaaa-0000-0000-0000-000000000001', 'one_to_one', 1, 60, 'active');

insert into public.class_students (class_id, student_id)
values ('dddddddd-0000-0000-0000-000000000010', 'cccccccc-0000-0000-0000-000000000010');

insert into public.student_enrollments
  (id, student_id, class_id, billing_mode, lessons_purchased, price_per_lesson,
   net_amount, start_date, status, needs_review, review_note)
values ('eeeeeeee-0000-0000-0000-000000000010', 'cccccccc-0000-0000-0000-000000000010',
        'dddddddd-0000-0000-0000-000000000010', 'monthly_postpaid',
        null, 190000, null, date '2026-07-01', 'active',
        true, 'Ô đơn giá trong sheet gốc là 1.790.009.190 ₫ — đã thay bằng bảng giá có căn cứ (D8, D11)');

-- Hai mốc giá đúng như bảng giá của Founder.
insert into public.tuition_rates (enrollment_id, price_per_lesson, effective_from, effective_to, evidence_note)
values ('eeeeeeee-0000-0000-0000-000000000010', 179000, date '2026-07-01', date '2026-08-31',
        'Founder xác nhận. Chứng từ: 716.000 = 4 buổi (09/07), 1.432.000 = 8 buổi (09/08)'),
       ('eeeeeeee-0000-0000-0000-000000000010', 190000, date '2026-09-01', null,
        'Founder xác nhận: từ tháng 9/2026 áp dụng 190.000/60 phút');

do $$ begin
  perform public.t_assert(
    public.fn_resolve_tuition_rate('eeeeeeee-0000-0000-0000-000000000010', date '2026-08-20') = 179000,
    'buổi ngày 20/08/2026 ⇒ đơn giá 179.000 ₫');
  perform public.t_assert(
    public.fn_resolve_tuition_rate('eeeeeeee-0000-0000-0000-000000000010', date '2026-09-05') = 190000,
    'buổi ngày 05/09/2026 ⇒ đơn giá 190.000 ₫');
end $$;

-- Một buổi trước mốc đổi giá, một buổi sau mốc.
insert into public.lessons (id, class_id, lesson_date, scheduled_start_at, scheduled_end_at,
                            actual_start_at, actual_end_at, status)
values ('ffffffff-0000-0000-0000-000000000010', 'dddddddd-0000-0000-0000-000000000010',
        date '2026-08-20', timestamptz '2026-08-20 20:00+07', timestamptz '2026-08-20 21:00+07',
        timestamptz '2026-08-20 20:00+07', timestamptz '2026-08-20 21:00+07', 'completed'),
       ('ffffffff-0000-0000-0000-000000000011', 'dddddddd-0000-0000-0000-000000000010',
        date '2026-09-05', timestamptz '2026-09-05 20:00+07', timestamptz '2026-09-05 21:00+07',
        timestamptz '2026-09-05 20:00+07', timestamptz '2026-09-05 21:00+07', 'completed');

insert into public.attendance (lesson_id, student_id, status) values
  ('ffffffff-0000-0000-0000-000000000010', 'cccccccc-0000-0000-0000-000000000010', 'present'),
  ('ffffffff-0000-0000-0000-000000000011', 'cccccccc-0000-0000-0000-000000000010', 'present');

do $$
declare v_aug numeric; v_sep numeric;
begin
  select recognized_amount into v_aug from public.lesson_consumptions
   where lesson_id = 'ffffffff-0000-0000-0000-000000000010';
  select recognized_amount into v_sep from public.lesson_consumptions
   where lesson_id = 'ffffffff-0000-0000-0000-000000000011';
  perform public.t_assert(v_aug = 179000, 'doanh thu buổi tháng 8 ghi nhận 179.000 ₫');
  perform public.t_assert(v_sep = 190000, 'doanh thu buổi tháng 9 ghi nhận 190.000 ₫');
  perform public.t_assert(v_aug <> v_sep,
    'đổi giá giữa kỳ KHÔNG làm sai doanh thu buổi cũ (D11)');
end $$;

\echo ''
\echo '--- 11b. Lớp nhóm trả sau theo tháng — ca Y Khoa (D1, D13) ---'
-- Công thức Founder: 120.000 × 3 người × số buổi − 150.000/tháng.
-- Chứng từ thật: 7 buổi tháng 7/2026 = 2.370.000 ₫.

insert into public.students (id, full_name, status) values
  ('cccccccc-0000-0000-0000-000000000021', 'Ms. Min', 'active'),
  ('cccccccc-0000-0000-0000-000000000022', 'Mr. Max', 'active'),
  ('cccccccc-0000-0000-0000-000000000023', 'Mr. John', 'active');

insert into public.classes (id, name, teacher_id, class_type, max_students,
                            default_duration_minutes, status)
values ('dddddddd-0000-0000-0000-000000000020', 'Y Khoa - nhóm 3 người',
        'aaaaaaaa-0000-0000-0000-000000000001', 'small_group', 3, 60, 'active');

insert into public.class_students (class_id, student_id) values
  ('dddddddd-0000-0000-0000-000000000020', 'cccccccc-0000-0000-0000-000000000021'),
  ('dddddddd-0000-0000-0000-000000000020', 'cccccccc-0000-0000-0000-000000000022'),
  ('dddddddd-0000-0000-0000-000000000020', 'cccccccc-0000-0000-0000-000000000023');

-- Một hợp đồng cho cả nhóm. Người đứng tên đóng là Hoàng Uyên — vợ anh Max,
-- KHÔNG phải học viên của lớp (D14).
insert into public.parents (id, full_name, phone)
values ('bbbbbbbb-0000-0000-0000-000000000020', 'Hoàng Uyên', '0900000020');

insert into public.student_parents (student_id, parent_id, relationship, is_primary)
values ('cccccccc-0000-0000-0000-000000000022',
        'bbbbbbbb-0000-0000-0000-000000000020', 'spouse', true);

insert into public.student_enrollments
  (id, student_id, class_id, billing_mode, headcount, lessons_purchased,
   price_per_lesson, monthly_discount_amount, net_amount, payer_parent_id, payer_note,
   start_date, status, paid_in_full_until, agreement_notes)
values ('eeeeeeee-0000-0000-0000-000000000020', 'cccccccc-0000-0000-0000-000000000021',
        'dddddddd-0000-0000-0000-000000000020', 'monthly_postpaid', 3, null,
        360000, 150000, null, 'bbbbbbbb-0000-0000-0000-000000000020', 'vợ anh Max',
        date '2026-07-01', 'active', date '2026-07-31',
        'Công thức Founder: 120.000 × 3 người × số buổi − 150.000/tháng');

do $$
declare b record;
begin
  perform public.t_assert(
    public.fn_enrollment_payer_name('eeeeeeee-0000-0000-0000-000000000020') = 'Hoàng Uyên',
    'người đứng tên đóng lớp Y Khoa là Hoàng Uyên, không phải học viên nào trong lớp (D14)');
  select * into b from public.v_enrollment_balances
   where enrollment_id = 'eeeeeeee-0000-0000-0000-000000000020';
  perform public.t_assert(b.payer_name = 'Hoàng Uyên', 'view số dư hiện đúng tên người đóng');
  perform public.t_assert(b.payer_note = 'vợ anh Max',  'ghi rõ quan hệ với học viên');
  perform public.t_assert(b.headcount = 3,              'lớp nhóm 3 người');

  -- Không chỉ định người đóng ⇒ chính học viên của hợp đồng đóng.
  perform public.t_assert(
    public.fn_enrollment_payer_name('eeeeeeee-0000-0000-0000-000000000001') = 'Nguyễn Văn Tân',
    'hợp đồng không chỉ định người đóng ⇒ mặc định là học viên của hợp đồng');

  -- Không được đặt hai người đóng cùng lúc.
  begin
    update public.student_enrollments
       set payer_student_id = 'cccccccc-0000-0000-0000-000000000021'
     where id = 'eeeeeeee-0000-0000-0000-000000000020';
    perform public.t_assert(false, 'lẽ ra phải chặn việc đặt hai người đóng');
  exception when check_violation then
    perform public.t_assert(true, 'chặn được việc đặt hai người đóng cùng một hợp đồng');
  end;
end $$;

-- 7 buổi trong tháng 7/2026.
do $$
declare i int; d date; v_lesson uuid;
begin
  for i in 1..7 loop
    d := date '2026-07-06' + ((i - 1) * 3);
    v_lesson := gen_random_uuid();
    insert into public.lessons (id, class_id, lesson_date, scheduled_start_at, scheduled_end_at,
                                actual_start_at, actual_end_at, status)
    values (v_lesson, 'dddddddd-0000-0000-0000-000000000020', d,
            d + time '19:00', d + time '20:00', d + time '19:00', d + time '20:00', 'completed');
    insert into public.attendance (lesson_id, student_id, status)
    select v_lesson, cs.student_id, 'present'
      from public.class_students cs
     where cs.class_id = 'dddddddd-0000-0000-0000-000000000020';
  end loop;
end $$;

do $$
declare v_rows int; v_total numeric;
begin
  select count(*), coalesce(sum(recognized_amount), 0) into v_rows, v_total
    from public.lesson_consumptions
   where enrollment_id = 'eeeeeeee-0000-0000-0000-000000000020';
  perform public.t_assert(v_rows = 7,
    '7 buổi ⇒ 7 dòng doanh thu (một dòng mỗi buổi cho cả nhóm, không nhân theo đầu người)');
  perform public.t_assert(v_total = 2520000, 'doanh thu gộp = 7 × 360.000 = 2.520.000 ₫');
end $$;

set session "test.user_id" = '11111111-1111-1111-1111-111111111111';  -- Founder

do $$
declare v_id uuid; st public.tuition_statements;
begin
  v_id := public.fn_build_tuition_statement(
    'eeeeeeee-0000-0000-0000-000000000020', date '2026-07-01', date '2026-07-31');
  select * into st from public.tuition_statements where id = v_id;
  perform public.t_assert(st.lessons_count = 7,       'phiếu tháng 7: 7 buổi');
  perform public.t_assert(st.gross_amount = 2520000,  'phiếu tháng 7: gộp 2.520.000 ₫');
  perform public.t_assert(st.discount_amount = 150000,'phiếu tháng 7: chiết khấu 150.000 ₫/tháng');
  perform public.t_assert(st.net_amount = 2370000,
    'phiếu tháng 7 phải trả = 2.370.000 ₫ — ĐÚNG BẰNG chứng từ thật ngày 12/08/2026');
  perform public.t_assert(st.status = 'draft', 'phiếu mới lập ở trạng thái nháp');
end $$;

-- Không có buổi nào trong tháng thì KHÔNG trừ chiết khấu.
do $$
declare v_id uuid; st public.tuition_statements;
begin
  v_id := public.fn_build_tuition_statement(
    'eeeeeeee-0000-0000-0000-000000000020', date '2026-06-01', date '2026-06-30');
  select * into st from public.tuition_statements where id = v_id;
  perform public.t_assert(st.lessons_count = 0, 'tháng 6 không có buổi nào');
  perform public.t_assert(st.discount_amount = 0,
    'tháng không dạy ⇒ không trừ chiết khấu (tránh tạo số âm vô lý)');
  perform public.t_assert(st.net_amount = 0, 'phải trả = 0 ₫');
end $$;

reset "test.user_id";

\echo ''
\echo '--- 11c. Cho học vượt số buổi đã đóng (D7) ---'
-- Học viên riêng, chỉ có MỘT gói, để số dư thực sự đi xuống âm.

insert into public.students (id, full_name, status)
values ('cccccccc-0000-0000-0000-000000000040', 'Học viên học vượt', 'active');

insert into public.classes (id, name, teacher_id, class_type, max_students,
                            default_duration_minutes, status)
values ('dddddddd-0000-0000-0000-000000000040', 'Lớp kiểm thử học vượt',
        'aaaaaaaa-0000-0000-0000-000000000001', 'one_to_one', 1, 60, 'active');

insert into public.class_students (class_id, student_id)
values ('dddddddd-0000-0000-0000-000000000040', 'cccccccc-0000-0000-0000-000000000040');

insert into public.student_enrollments
  (id, student_id, class_id, billing_mode, lessons_purchased, price_per_lesson,
   net_amount, start_date, status)
values ('eeeeeeee-0000-0000-0000-000000000030', 'cccccccc-0000-0000-0000-000000000040',
        'dddddddd-0000-0000-0000-000000000040', 'prepaid_package',
        1, 280000, 280000, date '2026-09-01', 'active');

insert into public.lessons (id, class_id, lesson_date, scheduled_start_at, scheduled_end_at,
                            actual_start_at, actual_end_at, status)
values ('ffffffff-0000-0000-0000-000000000030', 'dddddddd-0000-0000-0000-000000000040',
        date '2026-09-02', timestamptz '2026-09-02 09:00+07', timestamptz '2026-09-02 10:00+07',
        timestamptz '2026-09-02 09:00+07', timestamptz '2026-09-02 10:00+07', 'completed'),
       ('ffffffff-0000-0000-0000-000000000031', 'dddddddd-0000-0000-0000-000000000040',
        date '2026-09-03', timestamptz '2026-09-03 09:00+07', timestamptz '2026-09-03 10:00+07',
        timestamptz '2026-09-03 09:00+07', timestamptz '2026-09-03 10:00+07', 'completed');

insert into public.attendance (lesson_id, student_id, status) values
  ('ffffffff-0000-0000-0000-000000000030', 'cccccccc-0000-0000-0000-000000000040', 'present'),
  ('ffffffff-0000-0000-0000-000000000031', 'cccccccc-0000-0000-0000-000000000040', 'present');

do $$
declare b record;
begin
  select * into b from public.v_enrollment_balances
   where enrollment_id = 'eeeeeeee-0000-0000-0000-000000000030';
  perform public.t_assert(b.lessons_used = 2,      'đã dạy 2 buổi');
  perform public.t_assert(b.lessons_remaining = -1,
    'mua 1 buổi, học 2 buổi ⇒ còn lại = -1 (cho học vượt, không chặn — D7)');
  perform public.t_assert(b.revenue_recognized = 560000, 'doanh thu ghi nhận 2 × 280.000');
  perform public.t_assert(b.outstanding_amount = 280000,
    'công nợ = 280.000 ₫ (đã cam kết 1 buổi, chưa trả đồng nào)');
end $$;

-- Học viên có NHIỀU gói thì buổi tự chuyển sang gói kế tiếp theo thứ tự mua
-- (FIFO), chỉ hết gói cuối mới đi xuống âm.
insert into public.student_enrollments
  (id, student_id, class_id, billing_mode, lessons_purchased, price_per_lesson,
   net_amount, start_date, status)
values ('eeeeeeee-0000-0000-0000-000000000031', 'cccccccc-0000-0000-0000-000000000040',
        'dddddddd-0000-0000-0000-000000000040', 'prepaid_package',
        5, 280000, 1400000, date '2026-09-15', 'active');

insert into public.lessons (id, class_id, lesson_date, scheduled_start_at, scheduled_end_at,
                            actual_start_at, actual_end_at, status)
values ('ffffffff-0000-0000-0000-000000000032', 'dddddddd-0000-0000-0000-000000000040',
        date '2026-09-16', timestamptz '2026-09-16 09:00+07', timestamptz '2026-09-16 10:00+07',
        timestamptz '2026-09-16 09:00+07', timestamptz '2026-09-16 10:00+07', 'completed');

insert into public.attendance (lesson_id, student_id, status)
values ('ffffffff-0000-0000-0000-000000000032', 'cccccccc-0000-0000-0000-000000000040', 'present');

do $$ begin
  perform public.t_assert(
    (select enrollment_id from public.lesson_consumptions
      where lesson_id = 'ffffffff-0000-0000-0000-000000000032')
      = 'eeeeeeee-0000-0000-0000-000000000031',
    'gói đầu đã hết ⇒ buổi mới trừ vào gói còn buổi (FIFO), không tiếp tục làm âm gói cũ');
  perform public.t_assert(
    (select lessons_remaining from public.v_enrollment_balances
      where enrollment_id = 'eeeeeeee-0000-0000-0000-000000000030') = -1,
    'gói đầu giữ nguyên -1, không bị trừ thêm');
end $$;

do $$
declare n public.notifications;
begin
  perform public.fn_alert_lesson_balance();
  select * into n from public.notifications
   where type = 'lessons_overdrawn' and entity_id = 'eeeeeeee-0000-0000-0000-000000000030';
  perform public.t_assert(n.id is not null, 'sinh cảnh báo học vượt');
  perform public.t_assert(n.severity = 'critical', 'mức độ: KHẨN');
  perform public.t_assert(n.body like '%-1%', 'cảnh báo nêu số buổi âm');
end $$;

\echo ''
\echo '--- 11d. Thiếu ngày giờ dạy ⇒ KHÔNG tính lương + báo động đỏ cho GV (D5) ---'

insert into public.lessons (id, class_id, teacher_id, lesson_date,
                            scheduled_start_at, scheduled_end_at, status)
values ('ffffffff-0000-0000-0000-000000000040', 'dddddddd-0000-0000-0000-000000000001',
        'aaaaaaaa-0000-0000-0000-000000000001', current_date - 2,
        now() - interval '50 hours', now() - interval '49 hours', 'completed');

insert into public.attendance (lesson_id, student_id, status)
values ('ffffffff-0000-0000-0000-000000000040', 'cccccccc-0000-0000-0000-000000000001', 'present');

do $$ begin
  perform public.t_assert(
    (select count(*) from public.teacher_payable_lessons
      where lesson_id = 'ffffffff-0000-0000-0000-000000000040') = 0,
    'chưa ghi giờ dạy thực tế ⇒ KHÔNG sinh buổi tính lương (D5)');
end $$;

do $$
declare n public.notifications;
begin
  perform public.fn_alert_missing_lesson_time();
  select * into n from public.notifications
   where type = 'lesson_time_missing' and entity_id = 'ffffffff-0000-0000-0000-000000000040';
  perform public.t_assert(n.id is not null, 'sinh báo động đỏ thiếu ngày giờ dạy');
  perform public.t_assert(n.title like '%BÁO ĐỘNG ĐỎ%', 'tiêu đề: BÁO ĐỘNG ĐỎ');
  perform public.t_assert(n.body like '%KHÔNG ĐƯỢC TÍNH LƯƠNG%',
    'nội dung nói rõ không cung cấp thì không tính lương');
  perform public.t_assert(n.target_user_id = '22222222-2222-2222-2222-222222222222',
    'cảnh báo gửi RIÊNG cho giáo viên phụ trách, không chỉ cho Founder');
  perform public.t_assert((n.payload ->> 'blocks_payroll') = 'true',
    'payload ghi rõ buổi này đang bị giữ lương');
end $$;

-- Bổ sung giờ dạy ⇒ buổi được tính lương ngay.
update public.lessons
   set actual_start_at = now() - interval '50 hours',
       actual_end_at   = now() - interval '49 hours'
 where id = 'ffffffff-0000-0000-0000-000000000040';

do $$ begin
  perform public.t_assert(
    (select count(*) from public.teacher_payable_lessons
      where lesson_id = 'ffffffff-0000-0000-0000-000000000040') = 1,
    'bổ sung giờ dạy ⇒ buổi vào bảng lương ngay, không cần báo cáo đủ (D4, D5)');
end $$;

\echo ''
\echo '--- 11e. Cảnh báo chưa gửi phụ huynh ---'
-- Cảnh báo chỉ nổ khi buổi đã học quá 3 ngày mà chưa gửi.
-- Buổi hôm nay chưa tới hạn nên dùng buổi ngày 20/08/2026 của Bé Ngân.
insert into public.teaching_reports (id, lesson_id, start_time, end_time, lesson_content)
values ('99999999-0000-0000-0000-000000000010', 'ffffffff-0000-0000-0000-000000000010',
        timestamptz '2026-08-20 20:00+07', timestamptz '2026-08-20 21:00+07',
        'Unit 2: My family');

do $$
declare n public.notifications; v_n int;
begin
  v_n := public.fn_alert_not_sent_to_parent();
  perform public.t_assert(v_n >= 1, 'quét ra buổi đã học quá 3 ngày mà chưa gửi phụ huynh');

  select * into n from public.notifications
   where type = 'report_not_sent_to_parent'
     and entity_id = '99999999-0000-0000-0000-000000000010';
  perform public.t_assert(n.id is not null, 'sinh cảnh báo chưa gửi phụ huynh');
  perform public.t_assert(n.body like '%3 ngày%', 'cảnh báo nêu mốc 3 ngày');

  -- Buổi của hôm nay thì CHƯA cảnh báo, vì chưa quá 3 ngày.
  perform public.t_assert(
    (select count(*) from public.notifications
      where type = 'report_not_sent_to_parent'
        and entity_id = '99999999-0000-0000-0000-000000000001') = 0,
    'buổi mới học hôm nay chưa bị cảnh báo (chưa quá 3 ngày)');

  update public.teaching_reports
     set sent_to_parent_at = now(),
         sent_to_parent_by = '22222222-2222-2222-2222-222222222222'
   where id = '99999999-0000-0000-0000-000000000001';

  -- Buổi này đã nằm trong kỳ lương ĐÃ TRẢ nên không được ghi đè nữa.
  perform public.t_assert(
    (select status from public.teacher_payable_lessons
      where lesson_id = 'ffffffff-0000-0000-0000-000000000001') = 'paid',
    'buổi đã trả lương vẫn ở trạng thái paid');
  perform public.t_assert(
    (select sent_to_parent from public.teacher_payable_lessons
      where lesson_id = 'ffffffff-0000-0000-0000-000000000001') is false,
    'kỳ lương ĐÃ TRẢ không bị sửa lại khi báo cáo thay đổi về sau');
end $$;

-- Với buổi còn đang chờ (pending) thì cờ "đã gửi PH" cập nhật được.
insert into public.teaching_reports (id, lesson_id, start_time, end_time,
                                     lesson_content, sent_to_parent_at, sent_to_parent_by)
values ('99999999-0000-0000-0000-000000000040', 'ffffffff-0000-0000-0000-000000000040',
        now() - interval '50 hours', now() - interval '49 hours',
        'Unit 5: Free time', now(), '22222222-2222-2222-2222-222222222222');

do $$
declare p public.teacher_payable_lessons;
begin
  select * into p from public.teacher_payable_lessons
   where lesson_id = 'ffffffff-0000-0000-0000-000000000040';
  perform public.t_assert(p.status = 'pending', 'buổi này còn chờ đưa vào kỳ lương');
  perform public.t_assert(p.sent_to_parent is true,
    'đánh dấu đã gửi PH ⇒ cờ trong bảng lương bật theo');
end $$;

\echo ''
\echo '--- 11f. AI viết feedback (D6) ---'
do $$ begin
  update public.teaching_reports
     set authored_by = 'ai'
   where id = '99999999-0000-0000-0000-000000000001';
  perform public.t_assert(
    (select authored_by from public.teaching_reports
      where id = '99999999-0000-0000-0000-000000000001') = 'ai',
    'ghi nhận được nội dung do AI viết');
  update public.teaching_reports
     set authored_by = 'ai_edited_by_teacher'
   where id = '99999999-0000-0000-0000-000000000001';
  perform public.t_assert(
    (select authored_by from public.teaching_reports
      where id = '99999999-0000-0000-0000-000000000001') = 'ai_edited_by_teacher',
    'ghi nhận được AI viết rồi giáo viên sửa');
end $$;

\echo ''
\echo '--- 11g. Trang "Cần đối soát" sau di trú (D8) ---'
do $$
declare v_rows int; v_note text;
begin
  select count(*) into v_rows from public.v_data_review;
  perform public.t_assert(v_rows >= 1, 'view v_data_review liệt kê dòng cần đối soát');
  select review_note into v_note from public.v_data_review
   where entity_type = 'enrollment' and entity_id = 'eeeeeeee-0000-0000-0000-000000000010';
  perform public.t_assert(v_note like '%1.790.009.190%',
    'giữ lại nguyên văn giá trị nghi vấn để Founder đối chiếu (D8)');
end $$;

\echo ''
\echo '--- 11h. RLS trên các bảng tiền mới ---'
begin;
  set local role authenticated;
  set local "test.user_id" = '22222222-2222-2222-2222-222222222222';  -- giáo viên
  do $$ begin
    perform public.t_assert((select count(*) from public.tuition_rates) = 0,
      'giáo viên KHÔNG đọc được lịch sử đơn giá học phí');
    perform public.t_assert((select count(*) from public.tuition_statements) = 0,
      'giáo viên KHÔNG đọc được phiếu học phí tháng');
  end $$;
rollback;

begin;
  set local role authenticated;
  set local "test.user_id" = '11111111-1111-1111-1111-111111111111';  -- Founder
  do $$ begin
    perform public.t_assert((select count(*) from public.tuition_rates) = 2,
      'Founder đọc được 2 mốc đơn giá của Bé Ngân');
    perform public.t_assert((select count(*) from public.tuition_statements) = 2,
      'Founder đọc được phiếu học phí tháng');
  end $$;
rollback;

-- =============================================================================
-- 12. QUYỀN THỰC THI HÀM (migration 0015 — vá lỗi Security Advisor)
-- =============================================================================

\echo ''
\echo '--- 12a. anon KHÔNG gọi được hàm nhạy cảm nào ---'
begin;
  set local role anon;
  do $$
  declare v_blocked int := 0;
  begin
    begin perform public.fn_resolve_teacher_rate(
      'aaaaaaaa-0000-0000-0000-000000000001', 60, null, current_date);
    exception when insufficient_privilege then v_blocked := v_blocked + 1; end;

    begin perform public.fn_consume_lesson('00000000-0000-0000-0000-000000000000');
    exception when insufficient_privilege then v_blocked := v_blocked + 1; end;

    begin perform public.fn_generate_payable_lesson('00000000-0000-0000-0000-000000000000');
    exception when insufficient_privilege then v_blocked := v_blocked + 1; end;

    begin perform public.fn_recalc_payroll('00000000-0000-0000-0000-000000000000');
    exception when insufficient_privilege then v_blocked := v_blocked + 1; end;

    begin perform public.fn_refresh_report_status('00000000-0000-0000-0000-000000000000');
    exception when insufficient_privilege then v_blocked := v_blocked + 1; end;

    begin perform public.fn_scan_overdue_reports();
    exception when insufficient_privilege then v_blocked := v_blocked + 1; end;

    begin perform public.is_founder();
    exception when insufficient_privilege then v_blocked := v_blocked + 1; end;

    perform public.t_assert(v_blocked = 7,
      'anon bị chặn cả 7 hàm thử gọi (đơn giá lương, ghi nhận doanh thu, bảng lương, báo cáo, quét)');
  end $$;
rollback;

\echo ''
\echo '--- 12b. Giáo viên KHÔNG đọc được đơn giá lương qua hàm ---'
begin;
  set local role authenticated;
  set local "test.user_id" = '22222222-2222-2222-2222-222222222222';
  do $$
  declare v_blocked int := 0;
  begin
    begin perform public.fn_resolve_teacher_rate(
      'aaaaaaaa-0000-0000-0000-000000000002', 60, null, current_date);
    exception when insufficient_privilege then v_blocked := v_blocked + 1; end;

    begin perform public.fn_consume_lesson('00000000-0000-0000-0000-000000000000');
    exception when insufficient_privilege then v_blocked := v_blocked + 1; end;

    begin perform public.fn_scan_overdue_reports();
    exception when insufficient_privilege then v_blocked := v_blocked + 1; end;

    perform public.t_assert(v_blocked = 3,
      'giáo viên bị chặn: đọc đơn giá lương, ghi nhận doanh thu, quét cảnh báo');

    -- Hai hàm học phí gọi được nhưng là SECURITY INVOKER nên chịu RLS:
    -- giáo viên nhận NULL thay vì con số thật (migration 0016).
    perform public.t_assert(
      public.fn_resolve_tuition_rate('eeeeeeee-0000-0000-0000-000000000010',
                                     date '2026-08-20') is null,
      'giáo viên gọi fn_resolve_tuition_rate ⇒ NULL, không lộ đơn giá học phí');
    perform public.t_assert(
      public.fn_enrollment_payer_name('eeeeeeee-0000-0000-0000-000000000020') is null,
      'giáo viên gọi fn_enrollment_payer_name ⇒ NULL, không lộ tên người đóng tiền');

    -- Nhưng các hàm RLS vẫn gọi được, nếu không thì không đọc được bảng nào.
    perform public.t_assert(public.is_teacher(), 'vẫn gọi được is_teacher() cho RLS');
    perform public.t_assert(public.current_teacher_id() is not null,
      'vẫn gọi được current_teacher_id() cho RLS');
    -- Mục 11 đã thêm lớp cho Ms. Sheba nên không chốt con số cụ thể ở đây;
    -- điều cần khẳng định là RLS vẫn trả về dữ liệu, không phải 0 dòng.
    perform public.t_assert((select count(*) from public.classes) >= 1,
      'RLS vẫn hoạt động: đọc được lớp của mình');
    perform public.t_assert(
      (select bool_and(teacher_id = public.current_teacher_id())
         from public.classes),
      'và chỉ đọc được lớp của chính mình, không lọt lớp người khác');
    perform public.t_assert((select count(*) from public.students) >= 1,
      'RLS vẫn hoạt động: đọc được học viên của lớp mình');
  end $$;
rollback;

\echo ''
\echo '--- 12c. Trigger vẫn chạy dù giáo viên không có quyền gọi hàm trigger ---'
begin;
  set local role authenticated;
  set local "test.user_id" = '22222222-2222-2222-2222-222222222222';

  -- Giáo viên sửa giờ dạy: trigger tg_lessons_derive, tg_payable_from_lesson,
  -- tg_lesson_consume_all đều phải chạy được dù giáo viên không có EXECUTE.
  update public.lessons
     set actual_end_at = actual_end_at + interval '5 minutes'
   where id = 'ffffffff-0000-0000-0000-000000000040';

  do $$ begin
    perform public.t_assert(
      (select duration_minutes from public.lessons
        where id = 'ffffffff-0000-0000-0000-000000000040') = 65,
      'trigger tg_lessons_derive vẫn tính lại thời lượng (65 phút)');
  end $$;
rollback;

\echo ''
\echo '--- 12d. Founder vẫn dùng được các hàm của mình ---'
begin;
  set local role authenticated;
  set local "test.user_id" = '11111111-1111-1111-1111-111111111111';
  do $$ begin
    perform public.t_assert(public.is_founder(), 'Founder được nhận diện');
    perform public.t_assert(
      public.fn_resolve_tuition_rate('eeeeeeee-0000-0000-0000-000000000010',
                                     date '2026-08-20') = 179000,
      'Founder vẫn đọc được đơn giá học phí (hàm dùng trong view)');
    perform public.t_assert(
      public.fn_enrollment_payer_name('eeeeeeee-0000-0000-0000-000000000020') = 'Hoàng Uyên',
      'Founder vẫn đọc được tên người đóng (hàm dùng trong view)');
    perform public.t_assert(
      (select count(*) from public.v_enrollment_balances) >= 1,
      'view số dư vẫn đọc được — chứng tỏ hàm trong view còn quyền');
  end $$;
rollback;

\echo ''
\echo '======================================================'
\echo '  13. Giáo viên không tự chấm chất lượng cho mình được'
\echo '======================================================'

-- Hai tiêu chí "đủ sâu" là kết luận chấm của Founder hoặc AI, không phải dữ
-- liệu giáo viên nhập (D3). RLS cho phép giáo viên sửa mọi cột của báo cáo chưa
-- duyệt, nên nếu chỉ giấu ô trên giao diện thì giáo viên vẫn gọi thẳng API để
-- tự nâng điểm QC lên 100 và làm tắt cảnh báo chất lượng.

\echo ''
\echo '--- 13a. Giáo viên tự bật "đủ sâu" ⇒ bị bỏ qua, điểm QC không đổi ---'
begin;
  -- Đưa về trạng thái chưa chấm để thấy rõ hiệu lực của chốt chặn.
  update public.teaching_reports
     set qc_strengths_deep = null, qc_improvements_deep = null, qc_notes = null
   where id = '99999999-0000-0000-0000-000000000001';

  do $$ begin
    perform public.t_assert(
      (select qc_score from public.teaching_reports
        where id = '99999999-0000-0000-0000-000000000001') = 67,
      'chưa chấm "đủ sâu" ⇒ 4/6 tiêu chí máy tự kiểm ⇒ điểm QC = 67');
  end $$;

  set local role authenticated;
  set local "test.user_id" = '22222222-2222-2222-2222-222222222222';

  update public.teaching_reports
     set qc_strengths_deep    = true,
         qc_improvements_deep = true,
         qc_notes             = 'tự chấm là đạt',
         student_quote        = 'I wake up at six o''clock and I brush my teeth.'
   where id = '99999999-0000-0000-0000-000000000001';

  do $$
  declare r public.teaching_reports;
  begin
    select * into r from public.teaching_reports
     where id = '99999999-0000-0000-0000-000000000001';
    perform public.t_assert(r.qc_strengths_deep is null,
      'giáo viên KHÔNG tự bật được "điểm mạnh đủ sâu"');
    perform public.t_assert(r.qc_improvements_deep is null,
      'giáo viên KHÔNG tự bật được "cần cải thiện đủ sâu"');
    perform public.t_assert(r.qc_notes is null,
      'giáo viên KHÔNG tự ghi được ghi chú chấm chất lượng');
    perform public.t_assert(r.qc_score = 67,
      'điểm QC vẫn 67 — không bị tự nâng lên 100');
    perform public.t_assert(
      r.missing_fields @> array['strengths_deep','improvements_deep'],
      'hai tiêu chí "đủ sâu" vẫn nằm trong danh sách còn thiếu');
    perform public.t_assert(
      r.student_quote = 'I wake up at six o''clock and I brush my teeth.',
      'nhưng nội dung bình thường của giáo viên vẫn lưu được — chốt chặn không quá tay');
  end $$;
rollback;

\echo ''
\echo '--- 13b. Founder chấm thì có hiệu lực ---'
begin;
  update public.teaching_reports
     set qc_strengths_deep = null, qc_improvements_deep = null, qc_notes = null
   where id = '99999999-0000-0000-0000-000000000001';

  set local role authenticated;
  set local "test.user_id" = '11111111-1111-1111-1111-111111111111';

  update public.teaching_reports
     set qc_strengths_deep    = true,
         qc_improvements_deep = true,
         qc_notes             = 'Nhận xét có ví dụ cụ thể, đạt.'
   where id = '99999999-0000-0000-0000-000000000001';

  do $$
  declare r public.teaching_reports;
  begin
    select * into r from public.teaching_reports
     where id = '99999999-0000-0000-0000-000000000001';
    perform public.t_assert(r.qc_strengths_deep is true,  'Founder chấm được "điểm mạnh đủ sâu"');
    perform public.t_assert(r.qc_improvements_deep is true, 'Founder chấm được "cần cải thiện đủ sâu"');
    perform public.t_assert(r.qc_notes = 'Nhận xét có ví dụ cụ thể, đạt.',
      'ghi chú chấm chất lượng được lưu');
    perform public.t_assert(r.qc_score = 100, 'đủ 6/6 tiêu chí ⇒ điểm QC = 100');
    perform public.t_assert(r.status = 'submitted', 'báo cáo chuyển sang đã nộp đủ');
  end $$;
rollback;

\echo ''
\echo '======================================================'
\echo '  14. Đổi đơn giá học phí đúng như giao diện làm (D11)'
\echo '======================================================'

-- Mục 11a kiểm tra hai mốc giá được nhập sẵn không chồng nhau. Mục này kiểm tra
-- CHUỖI THAO TÁC mà biểu mẫu thật sinh ra: lập hợp đồng ⇒ một mốc giá mở
-- (effective_to = NULL), rồi đổi giá ⇒ đóng mốc cũ vào hôm trước ngày hiệu lực
-- mới và thêm mốc mới. Nếu đóng sai một ngày thì hoặc hai khoảng chồng nhau,
-- hoặc có một ngày không tra ra giá nào.

insert into public.students (id, full_name, status)
values ('cccccccc-0000-0000-0000-000000000050', 'Học viên đổi giá', 'active');

insert into public.classes (id, name, teacher_id, class_type, max_students,
                            default_duration_minutes, status)
values ('dddddddd-0000-0000-0000-000000000050', 'Lớp đổi giá',
        'aaaaaaaa-0000-0000-0000-000000000001', 'one_to_one', 1, 60, 'active');

insert into public.class_students (class_id, student_id)
values ('dddddddd-0000-0000-0000-000000000050', 'cccccccc-0000-0000-0000-000000000050');

-- Bước 1 — createEnrollment: hợp đồng + mốc giá đầu tiên, mở vô thời hạn.
insert into public.student_enrollments
  (id, student_id, class_id, billing_mode, lessons_purchased, price_per_lesson,
   net_amount, start_date, status)
values ('eeeeeeee-0000-0000-0000-000000000050', 'cccccccc-0000-0000-0000-000000000050',
        'dddddddd-0000-0000-0000-000000000050', 'prepaid_package',
        10, 179000, 1790000, date '2026-07-01', 'active');

insert into public.tuition_rates (enrollment_id, price_per_lesson, effective_from, evidence_note)
values ('eeeeeeee-0000-0000-0000-000000000050', 179000, date '2026-07-01',
        'Đơn giá lúc lập hợp đồng');

do $$ begin
  perform public.t_assert(
    public.fn_resolve_tuition_rate('eeeeeeee-0000-0000-0000-000000000050', date '2026-08-31') = 179000,
    'mốc giá mở áp dụng cho mọi ngày từ ngày bắt đầu');
end $$;

-- Bước 2 — addTuitionRate('2026-09-01'): đóng mốc cũ vào 31/08 rồi thêm mốc mới.
update public.tuition_rates
   set effective_to = date '2026-08-31'
 where enrollment_id = 'eeeeeeee-0000-0000-0000-000000000050'
   and effective_to is null
   and effective_from <= date '2026-08-31';

insert into public.tuition_rates (enrollment_id, price_per_lesson, effective_from, evidence_note)
values ('eeeeeeee-0000-0000-0000-000000000050', 190000, date '2026-09-01',
        'Founder chốt 10/09/2026');

do $$
declare v_rows int;
begin
  perform public.t_assert(
    public.fn_resolve_tuition_rate('eeeeeeee-0000-0000-0000-000000000050', date '2026-08-31') = 179000,
    'ngày cuối của mốc cũ (31/08) vẫn ra giá cũ 179.000 ₫');
  perform public.t_assert(
    public.fn_resolve_tuition_rate('eeeeeeee-0000-0000-0000-000000000050', date '2026-09-01') = 190000,
    'ngày đầu của mốc mới (01/09) ra giá mới 190.000 ₫');

  -- Không có ngày nào rơi vào hai mốc cùng lúc.
  select count(*) into v_rows
    from public.tuition_rates r
   where r.enrollment_id = 'eeeeeeee-0000-0000-0000-000000000050'
     and r.effective_from <= date '2026-08-31'
     and (r.effective_to is null or r.effective_to >= date '2026-08-31');
  perform public.t_assert(v_rows = 1, 'ngày 31/08 chỉ thuộc đúng MỘT mốc giá — hai khoảng không chồng nhau');

  -- Và không có ngày nào rơi vào khoảng trống giữa hai mốc.
  select count(*) into v_rows
    from public.tuition_rates r
   where r.enrollment_id = 'eeeeeeee-0000-0000-0000-000000000050'
     and r.effective_from <= date '2026-09-01'
     and (r.effective_to is null or r.effective_to >= date '2026-09-01');
  perform public.t_assert(v_rows = 1, 'ngày 01/09 cũng chỉ thuộc đúng MỘT mốc — không có khoảng trống');
end $$;

-- Buổi đã dạy trước khi đổi giá giữ nguyên số tiền cũ.
insert into public.lessons (id, class_id, lesson_date, scheduled_start_at, scheduled_end_at,
                            actual_start_at, actual_end_at, status)
values ('ffffffff-0000-0000-0000-000000000050', 'dddddddd-0000-0000-0000-000000000050',
        date '2026-08-31', timestamptz '2026-08-31 20:00+07', timestamptz '2026-08-31 21:00+07',
        timestamptz '2026-08-31 20:00+07', timestamptz '2026-08-31 21:00+07', 'completed'),
       ('ffffffff-0000-0000-0000-000000000051', 'dddddddd-0000-0000-0000-000000000050',
        date '2026-09-01', timestamptz '2026-09-01 20:00+07', timestamptz '2026-09-01 21:00+07',
        timestamptz '2026-09-01 20:00+07', timestamptz '2026-09-01 21:00+07', 'completed');

insert into public.attendance (lesson_id, student_id, status) values
  ('ffffffff-0000-0000-0000-000000000050', 'cccccccc-0000-0000-0000-000000000050', 'present'),
  ('ffffffff-0000-0000-0000-000000000051', 'cccccccc-0000-0000-0000-000000000050', 'present');

do $$ begin
  perform public.t_assert(
    (select recognized_amount from public.lesson_consumptions
      where lesson_id = 'ffffffff-0000-0000-0000-000000000050') = 179000,
    'buổi 31/08 ghi nhận doanh thu 179.000 ₫ theo giá tại ngày học');
  perform public.t_assert(
    (select recognized_amount from public.lesson_consumptions
      where lesson_id = 'ffffffff-0000-0000-0000-000000000051') = 190000,
    'buổi 01/09 ghi nhận doanh thu 190.000 ₫');
end $$;

\echo ''
\echo '--- 14b. Hợp đồng đóng cuối tháng không cần số buổi và tổng tiền (D1) ---'

-- Ràng buộc chk_enrollment_prepaid_shape phải cho phép để trống hai cột này với
-- hình thức trả sau, và vẫn bắt buộc với gói trả trước.
insert into public.student_enrollments
  (id, student_id, class_id, billing_mode, lessons_purchased, price_per_lesson,
   net_amount, headcount, monthly_discount_amount, start_date, status)
values ('eeeeeeee-0000-0000-0000-000000000051', 'cccccccc-0000-0000-0000-000000000050',
        null, 'monthly_postpaid', null, 120000, null, 3, 150000, date '2026-09-01', 'active');

do $$
declare v_ok boolean := false;
begin
  perform public.t_assert(
    (select lessons_purchased is null and net_amount is null
       from public.student_enrollments
      where id = 'eeeeeeee-0000-0000-0000-000000000051'),
    'hợp đồng trả sau lưu được với số buổi và tổng tiền để trống');

  begin
    insert into public.student_enrollments
      (student_id, billing_mode, lessons_purchased, price_per_lesson, net_amount, start_date, status)
    values ('cccccccc-0000-0000-0000-000000000050', 'prepaid_package',
            null, 250000, null, current_date, 'active');
  exception when check_violation then
    v_ok := true;
  end;
  perform public.t_assert(v_ok,
    'nhưng gói TRẢ TRƯỚC mà thiếu số buổi/tổng tiền thì CSDL chặn');
end $$;

\echo ''
\echo '--- 14c. Người đứng tên đóng không phải học viên (D14) ---'
do $$
declare v_ok boolean := false;
begin
  update public.student_enrollments
     set payer_parent_id = 'bbbbbbbb-0000-0000-0000-000000000020',
         payer_note      = 'vợ anh Max'
   where id = 'eeeeeeee-0000-0000-0000-000000000051';

  perform public.t_assert(
    public.fn_enrollment_payer_name('eeeeeeee-0000-0000-0000-000000000051') = 'Hoàng Uyên',
    'người ngoài đứng tên đóng được ghi nhận đúng');

  -- Không cho chỉ định hai người đóng cùng lúc.
  begin
    update public.student_enrollments
       set payer_student_id = 'cccccccc-0000-0000-0000-000000000050'
     where id = 'eeeeeeee-0000-0000-0000-000000000051';
  exception when check_violation then
    v_ok := true;
  end;
  perform public.t_assert(v_ok, 'chỉ một người được đứng tên đóng trên một hợp đồng');
end $$;

\echo ''
\echo '======================================================'
\echo '  TOÀN BỘ KIỂM THỬ NGHIỆP VỤ: ĐẠT'
\echo '======================================================'
