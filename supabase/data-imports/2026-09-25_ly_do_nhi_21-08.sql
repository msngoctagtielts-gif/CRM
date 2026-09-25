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
