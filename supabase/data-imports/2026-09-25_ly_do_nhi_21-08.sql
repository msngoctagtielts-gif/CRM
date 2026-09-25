-- ---------------------------------------------------------------------------
-- 2026-09-25 · Ghi nhận lý do buổi NHI-PH 21/08/2026 không có bản ghi
-- ---------------------------------------------------------------------------
-- Cô Ngọc xác nhận ngày 25/09/2026: buổi này cô Phương gặp sự cố máy nên không
-- lưu được bản ghi. Buổi học VẪN DIỄN RA; chỉ thiếu bản ghi để đối chiếu.
-- Không phải lỗi của học viên, cũng không phải trường hợp giáo viên không ghi
-- hình. Ghi vào lessons.notes để lần đối soát sau không phải hỏi lại.
--
-- ĐANG CHỜ CÔ QUYẾT: buổi này hiện vẫn is_billable = true, tức 250.000đ đang
-- tính vào học phí của Uyển Nhi. Trợ lý KHÔNG tự đổi, vì cô ra nguyên tắc
-- "căn cứ vào video hoặc link để tính phí" mà buổi này không có cả hai — nhưng
-- lý do là sự cố thiết bị của trung tâm, không phải học viên nghỉ. Hai cách
-- hiểu dẫn tới hai kết quả khác nhau về tiền, nên cần cô chốt.
-- ---------------------------------------------------------------------------
with buoi as (
  select l.id from public.lessons l join public.classes c on c.id=l.class_id
   where c.class_code='NHI-PH' and l.lesson_date='2026-08-21'
)
update public.lessons l
   set notes = coalesce(nullif(trim(l.notes),'') || E'\n', '') ||
               'KHONG CO BAN GHI — LY DO DA RO. Co Ngoc xac nhan ngay 25/09/2026: '
            || 'buoi nay co Phuong gap su co may nen khong luu duoc ban ghi. '
            || 'Buoi hoc VAN DIEN RA; chi thieu ban ghi de doi chieu. '
            || 'Khong phai loi cua hoc vien, cung khong phai truong hop giao vien khong ghi hinh.',
       updated_at = now()
  from buoi b where l.id = b.id;
-- Kèm một dòng audit_logs ghi lại ảnh trước/sau.

-- ---------------------------------------------------------------------------
-- BỔ SUNG CÙNG NGÀY — CÔ NGỌC ĐÃ CHỐT
-- ---------------------------------------------------------------------------
--   "Giữ nguyên buổi dạy không có video trên vẫn tính phí, tức là không có
--    video vì sự cố, HV và giáo viên trao đổi trực tiếp."
--
--   Vậy buổi NHI-PH 21/08/2026 GIỮ NGUYÊN 250.000đ. Tổng học phí của Uyển Nhi
--   không đổi: 1.250.000đ (5 buổi tính phí × 250.000đ, 2 buổi được tặng).
--
--   Quyết định này làm rõ nguyên tắc "căn cứ vào video hoặc link để tính phí":
--   SỰ CỐ THIẾT BỊ CỦA TRUNG TÂM KHÔNG LÀM MẤT QUYỀN TÍNH PHÍ CỦA MỘT BUỔI ĐÃ
--   DẠY. Điều cần chứng minh là buổi học có diễn ra, không phải là có tệp video.
--
--   Đã ghi vào attendance.notes và một dòng audit_logs.
--
-- ẢNH HƯỞNG TỚI BẢN IN GỬI PHỤ HUYNH
--   Buổi mất bản ghi vì sự cố kỹ thuật được trình bày KHÁC với buổi chưa có
--   bản ghi — khác cả màu chữ lẫn lời văn. In cùng một kiểu thì phụ huynh đọc
--   thành cùng một loại vấn đề, trong khi một bên là buổi đã dạy mà máy không
--   lưu được, còn một bên là chưa có gì để đối chiếu.
--
--   Ba chỗ trong bản in nói rõ điều này:
--     • Ô Bằng chứng ghi "Sự cố kỹ thuật", màu vàng đất chứ không phải đỏ.
--     • Ô Nội dung ghi "Buổi học trao đổi trực tiếp giữa giáo viên và học viên".
--     • Một ghi chú riêng dưới bảng, nêu đích danh ngày, khẳng định buổi học
--       vẫn diễn ra đầy đủ và trung tâm nhận trách nhiệm về sự cố thiết bị.
--
--   Cũng bỏ câu "Nhận xét chi tiết của buổi này trung tâm sẽ gửi bổ sung" cho
--   trường hợp này. Không có bản ghi thì không ai dựng lại được nhận xét có
--   dẫn chứng — hứa gửi bổ sung là hứa một việc không làm được.
