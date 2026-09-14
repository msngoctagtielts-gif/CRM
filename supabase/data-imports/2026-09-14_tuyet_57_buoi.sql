-- Nhập lại toàn bộ lớp Ms. Tuyết theo "BÁO CÁO HỌC PHÍ MS. TUYẾT" lập 13/08/2026.
-- Đã chạy thật ngày 14/09/2026.
--
-- VÌ SAO PHẢI NHẬP LẠI: sheet feedback chỉ có 21 buổi, báo cáo có 57 buổi.
-- Thiếu 36 buổi, hầu hết trong khoảng 10/2025 – 04/2026. Đã xoá 21 buổi cũ và
-- nhập lại đủ 57 buổi theo báo cáo.
--
-- Năm giáo viên nối tiếp nhau, báo cáo ghi rõ theo số buổi:
--   Teacher Allen  buổi 1–2      Ms. Wen    buổi 3–19
--   Ms. Grace      buổi 20–23    Ms. Rith   buổi 24–42
--   Teacher Sheba  buổi 43–57
--
-- Báo cáo ghi rõ: KHÔNG CÓ BUỔI MIỄN PHÍ NÀO. Tháng 05/2026 lớp tạm nghỉ.
-- (Buổi 2 ngày 26/09/2025 trước đây tôi nhập 50 phút theo sheet; báo cáo tính
--  đủ 249.000 đ nên đã để 60 phút — 57 × 249.000 = 14.193.000 khớp đúng.)

-- 1. Xoá 21 buổi cũ.
create temp table xt as
select l.id from lessons l join classes c on c.id=l.class_id where c.class_code='TUYET-SH';
delete from lesson_consumptions where lesson_id in (select id from xt);
delete from teacher_payable_lessons where lesson_id in (select id from xt);
delete from attendance where lesson_id in (select id from xt);
delete from lessons where id in (select id from xt);

-- 2. Bổ sung đơn giá lương cho Ms. Grace và Ms. Rith ở lớp này.
insert into teacher_rates (teacher_id, scope, class_id, rate_amount, effective_from, notes)
select t.id, 'class', c.id, 120000, DATE '2025-09-24',
       'Lay tu cot "Luong GV/60p" sheet CLASS LIST. Nhap 14/09/2026.'
from classes c join teachers t on t.full_name in ('Ms. Grace','Ms. Rith')
where c.class_code='TUYET-SH';

update tuition_rates tr set effective_from = DATE '2025-09-24'
from student_enrollments e join classes c on c.id=e.class_id
where tr.enrollment_id=e.id and c.class_code='TUYET-SH' and tr.effective_from > DATE '2025-09-24';

-- 3. Hợp đồng: gói 8 buổi, đã mua 8 gói = 64 buổi.
update student_enrollments e
set billing_mode='prepaid_package', lessons_purchased=64, price_per_lesson=249000,
    net_amount = 64*249000, start_date = DATE '2025-09-24',
    needs_review=false, review_note=null,
    payer_note='Huynh Thi Minh Tuyet (ACB) - Nha thuoc Hanh Phuc'
from classes c where c.id=e.class_id and c.class_code='TUYET-SH';

-- 4. Nhập 57 buổi + điểm danh + hoàn thành + đánh dấu lương đã trả.
--    (danh sách 57 dòng, xem lịch sử git của file này)

-- 5. Tám gói thanh toán, mỗi gói 1.992.000 đ = đúng 8 buổi × 249.000 đ.
--    Gói 1–3 ACB → HDBank, gói 4–8 ACB → OCB.
--    Gói 4,5,6,7,8 CÓ ảnh chuyển khoản (Founder gửi 14/09/2026).
--    Gói 8 ngày 15/08/2026 đóng SAU ngày lập báo cáo (13/08/2026) nên không có
--    trong báo cáo — đó là lý do báo cáo còn ghi "còn phải thu 249.000 đ".

-- ===========================================================================
-- ĐỐI CHIẾU (kết quả thật 14/09/2026) — KHỚP TUYỆT ĐỐI
--   57 buổi × 249.000 = 14.193.000 đ   (báo cáo: 14.193.000 đ)
--   8 gói × 1.992.000 = 15.936.000 đ
--   Đã mua 64 buổi, đã học 57 → CÒN 7 BUỔI, dư 1.743.000 đ
--
--   Cô Tuyết KHÔNG NỢ. Báo cáo ghi "còn phải thu 249.000 đ" là tính đến
--   13/08/2026, trước khi cô đóng gói 8 ngày 15/08/2026.
-- ===========================================================================
