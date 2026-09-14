-- Đối soát lớp Luân và Tân theo báo cáo "Báo cáo lịch sử buổi học và quá trình
-- Luân và Tân", chốt dữ liệu 17/07/2026. Đã chạy thật ngày 14/09/2026.
--
-- Báo cáo này giải được toàn bộ chỗ lệch. Trước đó tôi báo "thiếu chứng từ
-- 4.792.000 đ" — SAI. Nguyên nhân: tôi chưa biết hai điều.
--
--   1. MƯỜI BỐN BUỔI MIỄN PHÍ (7 mỗi bé) — mục 2 của báo cáo ghi rõ.
--   2. BỐN ĐỢT THANH TOÁN 2.200.000 đ — mục 2 của báo cáo ghi rõ.
--
-- Bảng đối soát của báo cáo:
--   Luân  39 buổi ghi nhận − 20 đã trả − 7 miễn phí = 12 cần đối soát → 2.640.000
--   Tân   49 buổi ghi nhận − 20 đã trả − 7 miễn phí = 22 cần đối soát → 4.840.000
--   TỔNG                                                             → 7.480.000
-- 7.480.000 đ đúng bằng số tiền anh Bùi Luyện chuyển ngày 18/07/2026.

-- 1. Mười bốn buổi miễn phí.
update attendance a set is_billable = false
from lessons l join classes c on c.id = l.class_id
where a.lesson_id = l.id
  and ( (c.class_code='LUAN-SH' and l.lesson_date in
          (DATE '2025-10-11', DATE '2025-12-28', DATE '2026-01-03', DATE '2026-01-04',
           DATE '2026-01-10', DATE '2026-01-11', DATE '2026-05-23'))
     or (c.class_code='TAN-SH' and l.lesson_date in
          (DATE '2025-10-11', DATE '2025-12-20', DATE '2025-12-27', DATE '2026-01-03',
           DATE '2026-01-04', DATE '2026-01-11', DATE '2026-05-24')) );

-- 2. Hai mức đơn giá theo thời kỳ — không phải mâu thuẫn.
--    220.000 đ đến 13/07/2026 (báo cáo chốt 17/07/2026 ghi rõ "Đơn giá:
--    220.000đ / buổi 60 phút", và phép đối soát khớp tuyệt đối).
--    219.000 đ từ 14/07/2026 (báo cáo gia đình kỳ 14/07-30/08/2026).
update tuition_rates tr set effective_to = DATE '2026-07-13', price_per_lesson = 220000,
    evidence_note = coalesce(tr.evidence_note || ' | ','') ||
      'Muc 220.000 ap den 13/07/2026 theo bao cao chot 17/07/2026.'
from student_enrollments e join classes c on c.id=e.class_id
where tr.enrollment_id=e.id and c.class_code in ('LUAN-SH','TAN-SH');

insert into tuition_rates (enrollment_id, price_per_lesson, effective_from, evidence_note)
select e.id, 219000, DATE '2026-07-14',
       'Bao cao gia dinh ky 14/07-30/08/2026 ghi 219.000 d/buoi.'
from student_enrollments e join classes c on c.id=e.class_id
where c.class_code in ('LUAN-SH','TAN-SH');

-- 3. Thay hai dòng thanh toán tôi tự suy đoán (chia đôi 7.000.000) bằng bốn đợt
--    có ghi trong báo cáo.
delete from payments where payment_code in ('TT26090029','TT26090030');
-- (bốn dòng TT26090034..37, mỗi dòng 2.200.000 đ — xem DECISIONS.md D25)

-- 4. Tính lại.
update lessons l set status='scheduled'::lesson_status
from classes c where c.id=l.class_id and c.class_code in ('LUAN-SH','TAN-SH');
update lessons l set status='completed'::lesson_status
from classes c where c.id=l.class_id and c.class_code in ('LUAN-SH','TAN-SH');
update teacher_payable_lessons tp set status='paid'
from classes c where c.id=tp.class_id and c.class_code in ('LUAN-SH','TAN-SH') and tp.status='pending';

-- ===========================================================================
-- KẾT QUẢ — KHỚP TUYỆT ĐỐI
--
--   Luân  53 buổi, 7 miễn phí, 46 tính phí
--         đến 13/07: 7.040.000 đ   đã đóng 7.040.000 đ   → số dư 0
--         kỳ 14/07-30/08: 3.066.000 đ (chưa đóng)
--
--   Tân   64 buổi, 7 miễn phí, 57 tính phí
--         đến 13/07: 9.240.000 đ   đã đóng 9.240.000 đ   → số dư 0
--         kỳ 14/07-30/08: 3.285.000 đ (chưa đóng)
--
-- KHÔNG còn khoản "thiếu chứng từ" nào. Toàn bộ phần trước 14/07/2026 đã
-- thanh toán đủ đến từng đồng.
--
-- CÒN MỘT CÂU HỎI: ảnh chuyển khoản 7.000.000 đ ngày 07/10/2025 ("BUI VAN
-- LUYEN chuyen tien") KHÔNG khớp với bất kỳ đợt nào trong báo cáo. Đợt 1 của
-- Luân là 22/10/2025 và của Tân là "tháng 10/2025", mỗi đợt 2.200.000 đ.
-- Khoản 7.000.000 đ này chưa được ghi vào sổ thu vì chưa rõ nó là gì.
-- ===========================================================================
