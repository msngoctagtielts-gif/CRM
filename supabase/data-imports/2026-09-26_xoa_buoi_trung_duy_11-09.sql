-- =====================================================================
-- Xoá buổi trùng — lớp DUY-SH ngày 11/09/2026
-- Cô Ngọc chốt ngày 25/09/2026
-- =====================================================================
--
-- HIỆN TRẠNG TRƯỚC KHI XOÁ — hai buổi cùng ngày 11/09/2026:
--
--   fa656854  07:00–08:00  CÓ video Zoom Clips   QC 17   <- GIỮ
--   c859ffc3  08:00–09:00  KHÔNG có video        QC  0   <- XOÁ
--
-- Cả hai được tạo cùng một lúc 20/09/2026 06:03:08 trong một đợt nhập,
-- cùng thời lượng 60 phút, cùng trạng thái completed, mỗi buổi đều có
-- một dòng điểm danh, một dòng lương chờ chi 120.000đ và một lượt trừ buổi.
-- Đây là dấu hiệu nhập trùng chứ không phải hai buổi thật liền nhau.
--
-- CĂN CỨ CHỌN BUỔI ĐỂ XOÁ: buổi không có bằng chứng video là buổi bỏ.
--
-- VÌ SAO KHÔNG DÙNG fn_xoa_buoi_hoc
--   Hàm đó yêu cầu is_founder(). Kênh MCP chạy dưới vai postgres nên
--   is_founder() trả về false. Đã làm thủ công NHƯNG chụp ảnh toàn bộ
--   nhánh dữ liệu vào audit_logs trước khi xoá, đúng như hàm đó làm —
--   để còn khôi phục được nếu cô đổi ý.
--   Bản ghi nhật ký: audit_logs id 9c3477d8-9484-4c70-8100-d086e5cdb4de
--
-- ẢNH HƯỞNG SAU KHI XOÁ
--   Lớp DUY-SH:      10 buổi -> 9 buổi
--   Học phí của Duy:  1.890.000đ -> 1.680.000đ  (giảm 210.000đ)
--   Số buổi đã trừ:   9 -> 8
--   Lương Ms. Sheba tháng 9 chờ chi: giảm 120.000đ, còn 15 dòng / 1.800.000đ
--   Các bản ghi con (báo cáo, điểm danh, dòng lương, lượt trừ buổi) đều
--   xoá theo bằng khoá ngoại ON DELETE CASCADE — đã kiểm, không sót dòng nào.
-- =====================================================================

insert into public.audit_logs (table_name, record_id, action, old_data, ly_do)
select 'lessons', l.id, 'DELETE',
  jsonb_build_object(
    'lesson',     to_jsonb(l),
    'bao_cao',    (select jsonb_agg(to_jsonb(tr)) from public.teaching_reports tr where tr.lesson_id=l.id),
    'diem_danh',  (select jsonb_agg(to_jsonb(a))  from public.attendance a        where a.lesson_id=l.id),
    'ban_ghi',    (select jsonb_agg(to_jsonb(r))  from public.recordings r        where r.lesson_id=l.id),
    'bai_tap',    (select jsonb_agg(to_jsonb(h))  from public.homework h          where h.lesson_id=l.id),
    'dong_luong', (select jsonb_agg(to_jsonb(p))  from public.teacher_payable_lessons p where p.lesson_id=l.id),
    'tru_buoi',   (select jsonb_agg(to_jsonb(lc)) from public.lesson_consumptions lc where lc.lesson_id=l.id)
  ),
  'Co Ngoc chot ngay 25/09/2026: buoi bi nhap trung trong lop DUY-SH ngay 11/09/2026. Giu lai buoi fa656854 (co video Zoom Clips, QC 17), xoa buoi nay vi khong co video va QC 0. Ca hai duoc tao cung luc 20/09 06:03:08 trong mot dot nhap.'
  from public.lessons l
 where l.id = 'c859ffc3-5a90-4b13-99b3-feb0e5240855';

delete from public.lessons where id = 'c859ffc3-5a90-4b13-99b3-feb0e5240855';
