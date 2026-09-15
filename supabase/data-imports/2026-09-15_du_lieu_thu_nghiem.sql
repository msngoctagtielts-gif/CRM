-- Bộ dữ liệu THỬ NGHIỆM — Founder muốn nhìn thấy hệ thống qua mắt giáo viên
-- trước khi mời ba cô thật vào (15/09/2026).
--
-- VÌ SAO CẦN DỮ LIỆU GIẢ: nếu chỉ tạo một tài khoản giáo viên rỗng, Founder
-- đăng nhập vào sẽ thấy màn hình trắng — không lớp, không buổi, ô chọn lớp
-- trong biểu mẫu ghi buổi học cũng rỗng nên không bấm gửi được. Như vậy không
-- hình dung được gì. Bộ này cho một lớp đủ dữ liệu để đi hết một vòng: xem
-- lớp, ghi một buổi, thấy buổi đó hiện ra.
--
-- MỌI BẢN GHI ĐỀU BẮT ĐẦU BẰNG "ZZ " để:
--   · luôn nằm cuối mọi danh sách, không lẫn vào lớp thật
--   · xoá sạch được bằng đúng một câu lệnh (xem cuối file)
--
-- KHÔNG dùng email thật của học viên hay phụ huynh nào.

-- 1) Giáo viên thử. Email KHÔNG có dấu chấm — Gmail coi là cùng hộp thư với
--    ms.ngoctagtielts@gmail.com, nhưng Supabase coi là tài khoản khác, nên
--    tài khoản thử tách hẳn khỏi hồ sơ giáo viên thật của Founder.
insert into teachers (full_name, display_name, email, status, bio)
values ('ZZ Giáo viên thử nghiệm', 'ZZ GV Thử', 'msngoctagtielts@gmail.com', 'active',
        'Tài khoản thử để Founder xem hệ thống qua mắt giáo viên. Xoá sau khi thử xong.')
on conflict do nothing;

-- 2) Đơn giá cho giáo viên thử, để buổi học sinh được dòng trả lương.
insert into teacher_rates (teacher_id, scope, duration_minutes, rate_amount, effective_from, notes)
select t.id, 'duration', 60, 120000, current_date - 365, 'Đơn giá giả, chỉ để thử'
from teachers t where t.full_name = 'ZZ Giáo viên thử nghiệm'
on conflict do nothing;

-- 3) Học viên thử.
insert into students (full_name, student_code, status, internal_notes)
values ('ZZ Học viên thử nghiệm', 'ZZ-TEST-01', 'active', 'Dữ liệu thử. Xoá sau khi thử xong.')
on conflict do nothing;

-- 4) Lớp thử, gán cho giáo viên thử.
insert into classes (name, class_code, class_type, max_students, default_duration_minutes,
                     status, teacher_id, notes)
select 'ZZ Lớp thử nghiệm', 'ZZ-TEST', 'one_to_one', 1, 60, 'active', t.id,
       'Dữ liệu thử. Xoá sau khi thử xong.'
from teachers t where t.full_name = 'ZZ Giáo viên thử nghiệm'
on conflict do nothing;

-- 5) Xếp học viên thử vào lớp thử.
insert into class_students (class_id, student_id, status, joined_at)
select c.id, s.id, 'active', current_date
from classes c, students s
where c.name = 'ZZ Lớp thử nghiệm' and s.full_name = 'ZZ Học viên thử nghiệm'
on conflict do nothing;

-- 6) Hợp đồng học phí, để buổi học sinh được doanh thu.
insert into student_enrollments (student_id, class_id, enrollment_code, billing_mode,
                                 price_per_lesson, lessons_purchased, net_amount,
                                 start_date, status, agreement_notes)
select s.id, c.id, 'ZZ-TEST-EN', 'prepaid_package', 200000, 10, 2000000,
       current_date, 'active', 'Dữ liệu thử. Xoá sau khi thử xong.'
from students s, classes c
where s.full_name = 'ZZ Học viên thử nghiệm' and c.name = 'ZZ Lớp thử nghiệm'
on conflict do nothing;

insert into tuition_rates (enrollment_id, price_per_lesson, effective_from, evidence_note)
select e.id, 200000, current_date - 365, 'Đơn giá giả, chỉ để thử'
from student_enrollments e
join students s on s.id = e.student_id
where s.full_name = 'ZZ Học viên thử nghiệm'
on conflict do nothing;

-- ===========================================================================
-- XOÁ SẠCH SAU KHI THỬ XONG — chạy nguyên khối dưới đây
-- ===========================================================================
--
-- delete from lessons      where class_id  in (select id from classes  where name like 'ZZ %');
-- delete from classes      where name like 'ZZ %';
-- delete from students     where full_name like 'ZZ %';
-- delete from teachers     where full_name like 'ZZ %';
-- Tài khoản đăng nhập của giáo viên thử phải xoá riêng trong
-- Supabase → Authentication → Users, vì bảng auth không xoá theo được.
