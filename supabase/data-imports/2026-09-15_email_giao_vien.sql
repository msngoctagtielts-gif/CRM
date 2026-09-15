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
