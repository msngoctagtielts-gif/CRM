-- 0054 — Đính chính một câu SAI trong chú thích của migration 0052.
--
-- 0052 viết: "audit_logs đã có sẵn từ migration 0001 nhưng chưa từng được ghi".
-- Câu đó SAI. Kiểm lại ngày 22/09/2026:
--   · 14 trigger (trg_lessons_audit, trg_payments_audit, trg_students_audit …)
--     đã tự ghi vào bảng này từ 11/09/2026
--   · tại thời điểm kiểm có 6.160 dòng
--
-- Vì sao vẫn cần fn_ghi_nhat_ky bên cạnh các trigger đó — hai thứ ghi hai thứ
-- khác nhau:
--   · trigger ghi được BẢN CŨ và BẢN MỚI của đúng một dòng, không biết LÝ DO
--   · khi xoá một buổi học, trigger chỉ chụp dòng lessons; báo cáo giáo viên,
--     các dòng trừ học phí, dòng lương và link video bị CASCADE cuốn đi mà
--     không dòng nhật ký nào giữ lại. fn_xoa_buoi_hoc chụp cả cây đó.
--
-- Không sửa được chữ đã chạy trong 0052, nên đính chính đặt vào chú thích của
-- chính cái bảng — chỗ người sau sẽ nhìn.

comment on table public.audit_logs is
  'Nhat ky thay doi du lieu. HAI NGUON GHI: (1) 14 trigger tg_audit tu dong tu '
  '11/09/2026, ghi ban cu/ban moi cua mot dong, khong co ly do; (2) cac ham '
  'fn_sua_* / fn_xoa_* tu 22/09/2026, BAT BUOC ly do va chup ca du lieu con se '
  'bi CASCADE cuon di. Loc ly_do is not null de chi xem viec do nguoi lam.';
