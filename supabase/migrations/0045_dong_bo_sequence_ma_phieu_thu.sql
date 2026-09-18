-- 0045 — Sequence sinh mã phiếu thu bị tụt lại phía sau dữ liệu thật.
--
--   Mã phiếu lớn nhất đang có : TT26090053  (hậu tố 53)
--   seq_payment_code đang ở   : 25
--
-- NGUYÊN NHÂN
--   46 phiếu lịch sử được nhập hàng loạt kèm mã phiếu ghi sẵn, nên trigger
--   tg_assign_payment_code không chạy và sequence không nhích theo.
--
-- HẬU QUẢ NẾU KHÔNG SỬA
--   MỌI phiếu thu ghi từ giao diện đều hỏng với lỗi trùng khoá
--   "duplicate key value violates unique constraint payments_payment_code_key".
--   Lỗi này chưa lộ ra vì từ lúc nhập dữ liệu tới nay chưa ai ghi phiếu thu mới
--   qua app — nó lộ ra đúng lúc ghi bốn khoản thu thật ngày 18/09/2026.
--
-- Đặt sequence lên mức lớn nhất hiện có; lần nextval kế tiếp ra 54.
select setval('public.seq_payment_code',
              (select max(substring(payment_code from 7)::int)
                 from public.payments
                where payment_code ~ '^TT[0-9]{8}$'),
              true);
