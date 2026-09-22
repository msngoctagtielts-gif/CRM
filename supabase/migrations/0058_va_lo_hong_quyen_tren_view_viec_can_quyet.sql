-- 0058 — VÁ LỖ HỔNG QUYỀN trong view vừa tạo ở 0057.
--
-- LỖI CỦA TRỢ LÝ, PHÁT HIỆN NGAY SAU KHI CHẠY 0057.
--   Postgres mặc định tạo view ở chế độ "definer" — câu truy vấn bên trong chạy
--   với quyền của người TẠO view, không phải người ĐANG XEM. Nghĩa là mọi hàng
--   rào RLS trên bảng gốc bị đi vòng.
--
--   Sáu nhánh của 0057 đọc qua v_mat_xich_buoi_hoc nên vẫn an toàn — view đó có
--   sẵn `and public.is_founder()` chặn cứng. Nhưng BA NHÁNH đọc thẳng bảng gốc
--   thì KHÔNG có hàng rào nào:
--     · nhánh công nợ            -> v_enrollment_balances
--     · nhánh hợp đồng chưa chốt -> student_enrollments
--     · nhánh cảnh báo số dư     -> notifications
--
--   Hậu quả nếu để nguyên: một giáo viên đăng nhập sẽ đọc được số học viên đang
--   nợ và TỔNG SỐ TIỀN còn nợ của trung tâm. Cô Ngọc đã đặt ra giới hạn ngay từ
--   đầu: "Teachers MUST NOT see center profit, total revenue, sensitive Founder
--   financial data." Đây đúng là thứ đó.
--
--   Cách vá: chặn cứng `public.is_founder()` ở TỪNG nhánh, kể cả các nhánh đã
--   an toàn nhờ view bên dưới. Dựa vào hàng rào của view khác là dựa vào một
--   thứ có thể đổi mà không ai nhớ tới file này.

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
 where m.muc_do = 'tien' and public.is_founder()
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
 where m.muc_do = 'can_quyet' and public.is_founder()
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
   and public.is_founder()
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
   and public.is_founder()
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
   and public.is_founder()
having count(*) > 0

union all

-- 6. Cảnh báo số dư đang mở.
select 2, 'tien',
       'Cảnh báo số dư đang mở',
       'Hệ thống tự phát hiện học viên sắp hết buổi hoặc đã học vượt số tiền đã đóng.',
       count(*), 0,
       '/alerts'            ,
       'Xem từng cảnh báo, xử lý xong thì đánh dấu đã giải quyết.'
  from public.notifications n
 where n.status in ('new', 'acknowledged') and public.is_founder()
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
 where m.muc_do = 'phu_huynh' and public.is_founder()
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
 where m.muc_do = 'bang_chung' and public.is_founder()
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
 where m.muc_do = 'xac_minh' and public.is_founder()
having count(*) > 0;

comment on view public.v_viec_can_quyet is
  'Gom moi viec dang cho Founder quyet vao mot cho, xep theo tien va tinh khong '
  'the dao nguoc. Moi nhanh deu chan cung is_founder() — KHONG dua vao hang rao '
  'cua view khac. Thay cho y tuong "Executive AI": day la mot truy van SQL, '
  'khong bao gio bia va co duong dan bam duoc.';

revoke all on public.v_viec_can_quyet from authenticated, anon;
grant select on public.v_viec_can_quyet to authenticated;
