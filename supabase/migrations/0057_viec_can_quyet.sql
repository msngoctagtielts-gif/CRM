-- 0057 — VIỆC CẦN CÔ QUYẾT: gom mọi thứ đang chờ Founder vào MỘT chỗ.
--
-- VÌ SAO KHÔNG DỰNG "EXECUTIVE AI" NHƯ SƠ ĐỒ ĐỀ XUẤT
--   Sơ đồ cô đưa ngày 22/09 có một tầng "AI Executive Manager tổng hợp toàn
--   trung tâm và chỉ đưa cho cô những việc cần quyết định". Ý đúng. Nhưng dựng
--   nó thành một tầng AI là sai cách, vì ba lý do:
--
--     1. Mọi thứ cần gom ĐÃ nằm trong cơ sở dữ liệu dưới dạng con số chính xác.
--        Cho AI đọc rồi tóm tắt lại chỉ thêm một chỗ có thể sai, không thêm
--        thông tin nào.
--     2. Một câu văn do AI viết không bấm vào được. Founder cần ĐƯỜNG DẪN tới
--        đúng màn hình để xử lý, không cần một đoạn tóm tắt hay.
--     3. Trung tâm có 13 buổi/tháng. Một truy vấn SQL chạy 20ms làm đúng việc
--        đó, miễn phí, và không bao giờ bịa.
--
--   Nên tầng "điều hành" ở đây là MỘT VIEW. Nó liệt kê từng nhóm việc, kèm số
--   lượng, số tiền liên quan, và đường dẫn tới chỗ xử lý.
--
-- NGUYÊN TẮC XẾP THỨ TỰ
--   Xếp theo TIỀN và theo TÍNH KHÔNG THỂ ĐẢO NGƯỢC, không theo ngày.
--     1 = tiền đang chảy sai, hoặc đã trả ra mà không có đối ứng
--     2 = tiền chưa thu được
--     3 = uy tín với phụ huynh
--     4 = hồ sơ chưa đầy đủ
--   Việc mức 1 mà để lâu thì càng khó lần ngược; việc mức 4 để một tuần không
--   mất gì.

drop view if exists public.v_viec_can_quyet;

create view public.v_viec_can_quyet as

-- 1. Buổi đã trả lương nhưng chuỗi ghi nhận chưa khép.
select 1                                   as uu_tien,
       'tien'                              as nhom,
       'Buổi đã trả lương nhưng chưa khép sổ' as tieu_de,
       'Đã trả tiền giáo viên mà buổi chưa có báo cáo, hoặc chưa điểm danh ai, hoặc chưa trừ học phí mà cũng không phải buổi miễn phí.'
                                           as mo_ta,
       count(*)                            as so_luong,
       coalesce(sum(m.tien_tra_giao_vien), 0) as so_tien,
       '/mat-xich'                         as duong_dan,
       'Mở từng buổi, bổ sung báo cáo hoặc đánh dấu miễn phí kèm lý do.' as viec_can_lam
  from public.v_mat_xich_buoi_hoc m
 where m.muc_do = 'tien'
having count(*) > 0

union all

-- 2. Miễn phí mà không ai giải trình.
select 1, 'tien',
       'Miễn phí nhưng chưa ghi lý do',
       'Học viên không bị trừ buổi mà không ai nói vì sao. Cần xác nhận là miễn phí có chủ ý hay ghi sót.',
       count(*), 0,
       '/mat-xich',
       'Mở buổi, bấm "Đánh dấu miễn phí" kèm lý do, hoặc "Chuyển sang thu phí".'
  from public.v_mat_xich_buoi_hoc m
 where m.muc_do = 'can_quyet'
having count(*) > 0

union all

-- 3. Miễn phí theo GIẢ ĐỊNH của trợ lý, chưa ai chốt.
select 1, 'tien',
       'Miễn phí theo giả định, chưa ai chốt',
       'Trợ lý suy ra từ cách nhập liệu chứ không có văn bản nào chốt. Nếu thật ra có thu phí thì đây là doanh thu chưa ghi nhận.',
       count(*), 0,
       '/mat-xich',
       'Xác nhận đúng thì để nguyên; sai thì mở buổi và chuyển sang thu phí.'
  from public.v_mat_xich_buoi_hoc m
 where coalesce(m.ly_do_mien_phi, '') like '%CAN FOUNDER XAC NHAN%'
having count(*) > 0

union all

-- 4. Công nợ học phí.
select 2, 'tien',
       'Học phí chưa thu',
       'Học viên đã học nhưng gia đình chưa đóng đủ.',
       count(*), coalesce(sum(b.outstanding_amount), 0),
       '/payments',
       'Nhắn phụ huynh, và ghi phiếu thu ngay khi nhận được tiền.'
  from public.v_enrollment_balances b
 where b.status = 'active' and coalesce(b.outstanding_amount, 0) > 0
having count(*) > 0

union all

-- 5. Hợp đồng chưa chốt cách tính tiền.
select 2, 'tien',
       'Hợp đồng chưa chốt cách tính tiền',
       'Chưa quyết đóng trọn gói hay trả theo tháng, nên hệ thống không biết lúc nào coi là nợ.',
       count(*), 0,
       '/payments',
       'Mở hợp đồng, chọn trả trước theo gói hoặc thanh toán cuối tháng.'
  from public.student_enrollments e
 where e.status = 'active' and e.billing_mode = 'undetermined'
having count(*) > 0

union all

-- 6. Cảnh báo số dư đang mở.
select 2, 'tien',
       'Cảnh báo số dư đang mở',
       'Hệ thống tự phát hiện học viên sắp hết buổi hoặc đã học vượt số tiền đã đóng.',
       count(*), 0,
       '/alerts?show=open',
       'Xem từng cảnh báo, xử lý xong thì đánh dấu đã giải quyết.'
  from public.notifications n
 where n.status in ('new', 'acknowledged')
having count(*) > 0

union all

-- 7. Báo cáo chưa gửi phụ huynh.
select 3, 'phu_huynh',
       'Báo cáo đủ nội dung nhưng chưa gửi phụ huynh',
       'Giáo viên đã viết xong mà gia đình chưa nhận được. Đây là thứ phụ huynh cảm nhận rõ nhất về trung tâm.',
       count(*), 0,
       '/reports',
       'Mở báo cáo, kiểm nội dung rồi bấm "Đã gửi phụ huynh".'
  from public.v_mat_xich_buoi_hoc m
 where m.muc_do = 'phu_huynh'
having count(*) > 0

union all

-- 8. Báo cáo trống nội dung.
select 4, 'bang_chung',
       'Báo cáo trống nội dung',
       'Giáo viên chưa viết nội dung buổi học. Không có cái này thì không gửi được phụ huynh và không chấm được chất lượng.',
       count(*), coalesce(sum(m.tien_tra_giao_vien), 0),
       '/reports',
       'Nhắc giáo viên viết, hoặc dùng nút "Nhờ máy xem video" để có bản nháp.'
  from public.v_mat_xich_buoi_hoc m
 where m.muc_do = 'bang_chung'
having count(*) > 0

union all

-- 9. Buổi có video YouTube nhưng chưa ai đo.
select 4, 'xac_minh',
       'Có video nhưng chưa xác minh',
       'Có bản ghi trên YouTube mà chưa đối chiếu số phút khai với số phút thật.',
       count(*), 0,
       '/xac-minh',
       'Mở buổi, bấm "Nhờ máy xem video". Cần đặt GOOGLE_AI_API_KEY trước.'
  from public.v_mat_xich_buoi_hoc m
 where m.muc_do = 'xac_minh'
having count(*) > 0;

comment on view public.v_viec_can_quyet is
  'Gom moi viec dang cho Founder quyet vao mot cho, xep theo tien va tinh khong '
  'the dao nguoc. Thay cho y tuong "Executive AI" — day la mot truy van SQL, '
  'khong bao gio bia va co duong dan bam duoc. CHI FOUNDER (ke thua tu '
  'v_mat_xich_buoi_hoc va cac bang co RLS).';

revoke all on public.v_viec_can_quyet from authenticated, anon;
grant select on public.v_viec_can_quyet to authenticated;
