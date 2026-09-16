-- Nap kho ho so trung tam.
--
-- NGUYEN TAC: chi dien link nao TOI DA TU KIEM CHUNG trong phien lam viec.
-- Nhung ho so co Ngoc liet ke ma toi khong co ban that thi de TRONG link, ghi
-- ro "CAN CO BO SUNG". Bia mot ban thoa thuan hoc vien hay mot bang hoc phi roi
-- de co gui cho phu huynh la rui ro thuong hieu, khong phai giup viec.

insert into public.documents (title, category, audiences, stage, url, notes, sort_order) values
('Website trung tâm & thương hiệu cá nhân', 'website', array['hoc_vien','phu_huynh'], 1,
 'https://msngoc-elite-english.pages.dev/',
 'Trang giới thiệu MNEE, gửi ở bước đầu khi khách hỏi về trung tâm.', 10),

('Hệ thống quản lý MNEE (nội bộ)', 'website', array['noi_bo'], null,
 'https://mnee-management.netlify.app',
 'Chỉ dùng nội bộ. KHÔNG gửi cho học viên hay phụ huynh — bên trong có học phí, lương giáo viên và dữ liệu tài chính.', 20),

('Thoả thuận học viên', 'thoa_thuan', array['hoc_vien','phu_huynh'], 5, null,
 'CẦN CÔ BỔ SUNG. Dán link Google Doc bản xem (không phải link chỉnh sửa).', 30),

('Thoả thuận giáo viên', 'thoa_thuan', array['giao_vien'], null, null,
 'CẦN CÔ BỔ SUNG. Nên ghi rõ ai sở hữu dữ liệu buổi học — điều khoản đó là thứ đã gây mất sheet lớp Thảo ngày 16/09.', 40),

('Bảng học phí', 'hoc_phi_lo_trinh', array['hoc_vien','phu_huynh'], 5, null,
 'CẦN CÔ BỔ SUNG bảng giá chính thức. Bốn gói trong bảng tuition_packages tự ghi là "giá mặc định gợi ý", KHÔNG dùng làm bảng giá gửi phụ huynh.', 50),

('Lộ trình học theo chương trình', 'hoc_phi_lo_trinh', array['hoc_vien','phu_huynh'], 2, null,
 'CẦN CÔ BỔ SUNG. Hệ thống đã có 5 chương trình và 7 level trong bảng programs và levels, có thể lấy làm khung.', 60),

('Quy trình kiểm tra đầu vào (Placement Test)', 'bieu_mau', array['hoc_vien','phu_huynh'], 3, null,
 'CẦN CÔ BỔ SUNG. Bảng placement_tests đã dựng sẵn nhưng chưa có dòng nào.', 70),

('Chính sách học tập', 'chinh_sach', array['hoc_vien','phu_huynh','giao_vien'], 6, null,
 'CẦN CÔ BỔ SUNG. Nghỉ học, báo nghỉ, học bù, đi trễ, đổi lịch, bài tập, bản ghi buổi học.', 80),

('Welcome Pack (bắt đầu học)', 'bieu_mau', array['hoc_vien','phu_huynh'], 7, null,
 'CẦN CÔ BỔ SUNG. Thông tin giáo viên, lịch học, link phòng học, tài liệu, kênh hỗ trợ.', 90);

-- Ket qua: 9 ho so, 2 da co link, 7 can bo sung.
