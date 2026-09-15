-- Email của giáo viên — Founder cung cấp ngày 15/09/2026
--
-- Dùng làm TÊN ĐĂNG NHẬP khi mời giáo viên vào hệ thống. Trước hôm nay bảng
-- teachers không có email của ai, nên không tạo được tài khoản nào — Supabase
-- Auth bắt buộc phải có email.
--
-- Founder chốt mời ba cô này trước; Ms. Rose để sau.

update teachers set email = 'vothibichphuong12c1@gmail.com'
 where display_name = 'Phương' and status = 'active';

update teachers set email = 'shebajimlano10@gmail.com'
 where display_name = 'Sheba' and status = 'active';

-- Founder ghi "minh hoa" — khớp hồ sơ Ms. Hòa (display_name = 'Hòa').
update teachers set email = 'nlminhhoa2912@gmail.com'
 where display_name = 'Hòa' and status = 'active';

-- Bổ sung 15/09/2026: Ms. Ngọc vừa là Founder vừa trực tiếp đứng lớp.
--
-- Hồ sơ giáo viên này gắn vào CHÍNH tài khoản Founder, không tạo tài khoản thứ
-- hai — cô chỉ có một lần đăng nhập. An toàn vì is_founder() đọc role_code
-- trong bảng users, không liên quan tới bảng teachers; còn current_teacher_id()
-- chỉ tra theo user_id và không kiểm vai trò. Đã kiểm chứng sau khi chèn:
-- quyền vẫn là founder, is_teacher() = false, đọc được đủ 21 lớp / 46 phiếu
-- thu / 426 dòng doanh thu / 2 chi phí / 7 bảng lương.

insert into teachers (full_name, display_name, email, status, user_id, created_by, bio)
select 'Ms. Ngọc', 'Ngọc', 'ms.ngoctagtielts@gmail.com', 'active', u.id, u.id,
       'Founder, đồng thời trực tiếp đứng lớp. Hồ sơ này gắn vào chính tài khoản Founder nên chỉ có một lần đăng nhập.'
from users u where u.role_code = 'founder'
on conflict do nothing;
