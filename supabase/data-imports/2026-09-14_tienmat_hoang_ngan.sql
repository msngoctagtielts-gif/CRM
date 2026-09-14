-- Ghi nhận học phí thu BẰNG TIỀN MẶT cho lớp Hoàng & Huệ và lớp bé Ngân.
-- Founder xác nhận 14/09/2026. Riêng bé Ngân CHƯA ĐÓNG THÁNG 8.
-- Đã chạy thật ngày 14/09/2026.
--
-- Cả hai lớp đều đóng theo tháng (monthly_postpaid) nên ghi một dòng thu cho
-- mỗi tháng, số tiền đúng bằng học phí phát sinh tháng đó.
-- NGÀY THU lấy ngày cuối tháng dạy — Founder chưa cho ngày thu chính xác.
-- Thu tiền mặt nên không có chứng từ ngân hàng; đã đánh needs_review để sau
-- này bổ sung phiếu thu.
with hv as (
  select s.full_name, s.id as student_id, e.id as enrollment_id
  from students s join student_enrollments e on e.student_id = s.id
  where s.full_name in ('Ms. Hoàng','Bé Ngân')
),
v(ten, ma, ngay, so_tien, thang, so_buoi) as (values
  ('Ms. Hoàng','TT26090046', DATE '2026-05-31', 1560000, '05/2026', 6),
  ('Ms. Hoàng','TT26090047', DATE '2026-06-30',  780000, '06/2026', 3),
  ('Ms. Hoàng','TT26090048', DATE '2026-07-31', 1300000, '07/2026', 5),
  ('Ms. Hoàng','TT26090049', DATE '2026-08-31',  260000, '08/2026', 1),
  ('Bé Ngân', 'TT26090050', DATE '2026-06-30',  716000, '06/2026', 4),
  ('Bé Ngân', 'TT26090051', DATE '2026-07-31', 1432000, '07/2026', 8)
  -- KHÔNG có dòng tháng 8 và tháng 9 của bé Ngân: Founder xác nhận chưa đóng.
)
insert into payments (payment_code, student_id, enrollment_id, amount, payment_date, method,
                      reference, notes, status, needs_review, review_note)
select v.ma, hv.student_id, hv.enrollment_id, v.so_tien, v.ngay, 'cash'::payment_method,
       'TIENMAT-' || replace(v.thang,'/','-'),
       'Hoc phi thang ' || v.thang || ' - ' || v.so_buoi || ' buoi. Thu BANG TIEN MAT. Founder xac nhan 14/09/2026.',
       'confirmed'::payment_status, true,
       'Chua co ngay thu chinh xac - da lay ngay cuoi thang day. Thu tien mat nen khong co chung tu ngan hang; can phieu thu hoac xac nhan cua Founder.'
from v join hv on hv.full_name = v.ten;

-- ===========================================================================
-- KẾT QUẢ (14/09/2026)
--
--   Ms. Hoàng (lớp nhóm với Ms. Huệ)
--     15 buổi × 260.000 = 3.900.000 đ   đã đóng 3.900.000 đ   → SỐ DƯ 0
--     Ms. Huệ 12 lượt điểm danh, 0 đ — giá 260.000 là giá cả nhóm (D18)
--
--   Bé Ngân
--     14 buổi = 2.517.000 đ   đã đóng 2.148.000 đ   → còn 369.000 đ
--       T6  4 buổi ×179.000 =   716.000  đã đóng
--       T7  8 buổi ×179.000 = 1.432.000  đã đóng
--       T8  1 buổi ×179.000 =   179.000  CHƯA ĐÓNG
--       T9  1 buổi ×190.000 =   190.000  chưa đến kỳ (đóng cuối tháng 9)
--
--     Nợ quá hạn thật sự chỉ là 179.000 đ của tháng 8.
-- ===========================================================================
