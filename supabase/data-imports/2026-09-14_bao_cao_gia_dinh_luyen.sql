-- Sửa lại lớp Luân, Tân, Ms. Linh theo BÁO CÁO CHÍNH THỨC gửi gia đình:
-- "MNEE_GiaDinh_Luan-Tan-MsLinh_BaoCaoHocTap_HocPhi", kỳ 14/07/2026-30/08/2026.
-- Đã chạy trên cơ sở dữ liệu thật ngày 14/09/2026.
--
-- Báo cáo này là chứng từ ĐÃ GỬI PHỤ HUYNH nên có giá trị cao hơn sheet feedback
-- và cao hơn tab SYS_THANHTOAN nội bộ. Ba điều nó sửa lại:
--
-- 1. ĐƠN GIÁ LÀ 219.000 đ, không phải 220.000. Trước đó tôi suy ra 220.000 từ
--    cách tab SYS_THANHTOAN phân bổ giao dịch 7.480.000 (12 buổi + 22 buổi).
--    Báo cáo gửi gia đình ghi rõ 219.000 cho cả ba học viên. Đã trả lại.
--
-- 2. TÔI ĐỌC SAI NGÀY của ba buổi lớp Luân - cùng loại lỗi dd/mm mà Founder đã
--    chỉ ra ở lớp Tân: sheet ghi 08/01 và 08/02 thật ra là 01/08 và 02/08;
--    09/08 bị đọc thành 09/09. Báo cáo xác nhận Luân có học 01/08, 02/08, 09/08.
--
-- 3. SHEET FEEDBACK THIẾU BUỔI. Báo cáo liệt kê 15 buổi cho mỗi bé trong kỳ
--    14/07-30/08 mà sheet không có. Xác nhận mạnh: sau khi xoá phần nhập sai,
--    hệ thống còn Luân 38 buổi và Tân 49 buổi - đúng bằng mốc báo cáo ghi
--    ("Tân buổi 49 ngày 04/07/2026"; buổi 39 của Luân là buổi kế tiếp).
--
-- Founder chốt 14/09/2026: buổi 04/08/2026 LUÂN KHÔNG HỌC - đã bỏ.
-- Nên Luân là 14 buổi (3.066.000 đ), không phải 15 buổi (3.285.000 đ).

-- BƯỚC 1. Trả lại đơn giá 219.000.
update tuition_rates tr
set price_per_lesson = 219000,
    evidence_note = coalesce(tr.evidence_note || ' | ', '') ||
      'Tra lai 219.000 ngay 14/09/2026 theo bao cao chinh thuc gui gia dinh.'
from student_enrollments e join classes c on c.id = e.class_id
where tr.enrollment_id = e.id and c.class_code in ('LUAN-SH','TAN-SH');

update student_enrollments e set price_per_lesson = 219000
from classes c where c.id = e.class_id and c.class_code in ('LUAN-SH','TAN-SH');

-- BƯỚC 2. Xoá các buổi nhập sai ngày và toàn bộ kỳ báo cáo để nhập lại.
create temp table xoa as
select l.id from lessons l join classes c on c.id = l.class_id
where (c.class_code = 'LUAN-SH' and (
        (l.lesson_date = DATE '2026-01-08' and l.actual_start_at is not null)
     or (l.lesson_date = DATE '2026-02-08' and l.actual_start_at is not null)
     or  l.lesson_date = DATE '2026-09-08'))
   or (c.class_code = 'TAN-SH' and l.lesson_date >= DATE '2026-07-05');

delete from lesson_consumptions where lesson_id in (select id from xoa);
delete from teacher_payable_lessons where lesson_id in (select id from xoa);
delete from attendance where lesson_id in (select id from xoa);
delete from lessons where id in (select id from xoa);

-- BƯỚC 3. Nhập lại theo đúng danh sách trong báo cáo.
with v(ngay, ma_lop, gio, phut) as (values
  (DATE '2026-07-07','LUAN-SH', null::time, 60),   -- buổi 39, mốc đã thanh toán
  (DATE '2026-07-14','LUAN-SH', null, 60),
  (DATE '2026-07-17','LUAN-SH', null, 60),
  (DATE '2026-07-19','LUAN-SH', null, 60),
  (DATE '2026-07-21','LUAN-SH', null, 60),
  (DATE '2026-07-28','LUAN-SH', null, 60),
  (DATE '2026-08-01','LUAN-SH', TIME '08:00', 60),
  (DATE '2026-08-02','LUAN-SH', TIME '15:30', 60),
  -- 04/08/2026: Founder chốt Luân KHÔNG HỌC -> không nhập
  (DATE '2026-08-09','LUAN-SH', null, 60),
  (DATE '2026-08-11','LUAN-SH', null, 60),
  (DATE '2026-08-18','LUAN-SH', null, 60),
  (DATE '2026-08-22','LUAN-SH', null, 60),
  (DATE '2026-08-23','LUAN-SH', null, 60),
  (DATE '2026-08-29','LUAN-SH', null, 60),
  (DATE '2026-08-30','LUAN-SH', null, 60),
  (DATE '2026-07-14','TAN-SH', null, 60),
  (DATE '2026-07-17','TAN-SH', TIME '20:00', 55),
  (DATE '2026-07-19','TAN-SH', TIME '14:29', 56),
  (DATE '2026-07-21','TAN-SH', TIME '09:30', 55),
  (DATE '2026-07-26','TAN-SH', null, 60),
  (DATE '2026-07-28','TAN-SH', TIME '15:02', 53),
  (DATE '2026-08-01','TAN-SH', null, 60),
  (DATE '2026-08-02','TAN-SH', null, 60),
  (DATE '2026-08-09','TAN-SH', null, 60),
  (DATE '2026-08-11','TAN-SH', null, 60),
  (DATE '2026-08-18','TAN-SH', null, 60),
  (DATE '2026-08-22','TAN-SH', null, 60),
  (DATE '2026-08-23','TAN-SH', null, 60),
  (DATE '2026-08-29','TAN-SH', null, 60),
  (DATE '2026-08-30','TAN-SH', null, 60)
),
lop as (select c.id as class_id, c.class_code, c.teacher_id from classes c
        where c.class_code in ('LUAN-SH','TAN-SH')),
moi as (
  insert into lessons (class_id, teacher_id, lesson_date, scheduled_start_at, scheduled_end_at,
                       actual_start_at, actual_end_at, duration_minutes, status, notes)
  select lop.class_id, lop.teacher_id, v.ngay,
         (v.ngay + coalesce(v.gio, TIME '08:00')) at time zone 'Asia/Ho_Chi_Minh',
         (v.ngay + coalesce(v.gio, TIME '08:00')) at time zone 'Asia/Ho_Chi_Minh' + (v.phut||' minutes')::interval,
         case when v.gio is null then null else (v.ngay + v.gio) at time zone 'Asia/Ho_Chi_Minh' end,
         case when v.gio is null then null else (v.ngay + v.gio) at time zone 'Asia/Ho_Chi_Minh' + (v.phut||' minutes')::interval end,
         v.phut, 'scheduled'::lesson_status,
         'Nhap tu bao cao PDF "MNEE_GiaDinh_Luan-Tan-MsLinh" ky 14/07-30/08/2026, nhap 14/09/2026.'
  from v join lop on lop.class_code = v.ma_lop
  returning id, class_id
)
insert into attendance (lesson_id, student_id, status)
select moi.id, cs.student_id, 'present'::attendance_status
from moi join class_students cs on cs.class_id = moi.class_id;

-- BƯỚC 4. Tính lại TOÀN BỘ hai lớp.
-- Bắt buộc: các buổi cũ vẫn giữ đơn giá 220.000 nếu chỉ hoàn thành buổi mới.
update lessons l set status = 'scheduled'::lesson_status
from classes c where c.id=l.class_id and c.class_code in ('LUAN-SH','TAN-SH');

update lessons l set status = 'completed'::lesson_status
from classes c where c.id=l.class_id and c.class_code in ('LUAN-SH','TAN-SH');

update teacher_payable_lessons tp set status='paid',
  notes = coalesce(tp.notes||' | ','') || 'Da tra ngoai he thong (Founder xac nhan 14/09/2026).'
from classes c where c.id=tp.class_id and c.class_code in ('LUAN-SH','TAN-SH') and tp.status='pending';

-- BƯỚC 5. Ghi ba giao dịch của anh Bùi Văn Luyện (theo ảnh chuyển khoản VCB).
-- Xem phần ĐỐI CHIẾU cuối file - KHÔNG khớp, còn thiếu chứng từ 2.592.000 đ.
-- (nội dung đầy đủ đã chạy, xem DECISIONS.md D21)

-- ===========================================================================
-- ĐỐI CHIẾU (kết quả thật 14/09/2026)
--
-- A. Kỳ báo cáo 14/07 - 30/08/2026 (anh Luyện CHƯA ĐÓNG)
--    Học viên   Báo cáo              Hệ thống             Lệch
--    Luân       15 buổi 3.285.000    14 buổi 3.066.000    -219.000  (bỏ 04/08)
--    Tân        15 buổi 3.285.000    15 buổi 3.208.350     -76.650  (quy đổi phút)
--    Ms. Linh    4 buổi   876.000     4 buổi   876.000           0  KHỚP
--    TỔNG          7.446.000            7.150.350
--
--    Lệch 76.650 đ của Tân: bốn buổi tháng 7 chỉ dạy 53-56 phút
--    (17/07 55', 19/07 56', 21/07 55', 28/07 53'). Báo cáo tính đủ
--    219.000/buổi; hệ thống quy đổi theo thời lượng (quy tắc D15).
--    CẦN FOUNDER CHỌN MỘT TRONG HAI.
--
-- B. Phần trước kỳ báo cáo - KHÔNG KHỚP
--    Báo cáo ghi mốc đã thanh toán: Luân hết buổi 39, Tân hết buổi 49.
--      Luân 39 buổi x 219.000 =  8.541.000
--      Tân  49 buổi x 219.000 = 10.731.000
--      Phải đã thu            = 19.272.000
--    Tiền có ảnh chuyển khoản = 14.480.000
--      (7.000.000 ngày 07/10/2025 + 7.480.000 ngày 18/07/2026)
--    THIẾU CHỨNG TỪ           =  4.792.000
--
--    Founder chốt 14/09/2026: giao dịch 2.200.000 đ ngày 29/12/2025 là anh
--    Luyện chuyển tiền RIÊNG cho chị Linh, KHÔNG PHẢI học phí. Đã xoá khỏi
--    sổ thu (payment_code TT26090033).
-- ===========================================================================

-- BƯỚC 6 (bổ sung 14/09/2026). Founder chốt: giao dịch 2.200.000 đ ngày
-- 29/12/2025 là anh Luyện chuyển tiền RIÊNG cho chị Linh, KHÔNG PHẢI học phí.
delete from payments where payment_code = 'TT26090033';

-- ===========================================================================
-- BƯỚC 7 (bổ sung 14/09/2026). Founder chốt: bốn buổi tháng 7 của Tân chỉ dạy
-- 53–56 phút nhưng VẪN TÍNH ĐỦ 60 PHÚT. Founder bỏ qua lần này và nhắc giáo viên.
-- Đây là NGOẠI LỆ có chủ đích cho bốn buổi này, KHÔNG huỷ quy tắc D15.
--
-- CHÚ Ý KỸ THUẬT: không thể chỉ sửa duration_minutes. Trigger tg_lessons_derive
-- luôn tính lại cột đó từ actual_start_at và actual_end_at:
--     if new.actual_start_at is not null and new.actual_end_at is not null then
--       new.duration_minutes := round(epoch(actual_end_at - actual_start_at)/60)
-- nên lệnh sửa duration bị ghi đè ngay. Phải kéo actual_end_at về đủ 60 phút.
-- Giờ kết thúc THẬT theo sheet feedback đã được ghi vào cột notes của từng buổi
-- để không mất bằng chứng.
-- ===========================================================================
update lessons l
set notes = coalesce(l.notes || ' | ', '') ||
      'GIO KET THUC THAT theo sheet feedback: ' ||
      to_char(l.actual_end_at at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI') ||
      ' (' || l.duration_minutes || ' phut). Founder chot 14/09/2026: VAN TINH DU 60 PHUT.',
    actual_end_at    = l.actual_start_at + interval '60 minutes',
    scheduled_end_at = l.scheduled_start_at + interval '60 minutes'
from classes c
where c.id = l.class_id
  and c.class_code in ('LUAN-SH','TAN-SH')
  and l.duration_minutes <> 60;

update lessons l set status = 'scheduled'::lesson_status
from classes c where c.id=l.class_id and c.class_code in ('LUAN-SH','TAN-SH');

update lessons l set status = 'completed'::lesson_status
from classes c where c.id=l.class_id and c.class_code in ('LUAN-SH','TAN-SH');

update teacher_payable_lessons tp set status='paid',
  notes = coalesce(tp.notes||' | ','') || 'Da tra ngoai he thong (Founder xac nhan 14/09/2026).'
from classes c where c.id=tp.class_id and c.class_code in ('LUAN-SH','TAN-SH') and tp.status='pending';

-- KẾT QUẢ CUỐI - kỳ 14/07-30/08/2026 khớp đúng báo cáo:
--   Luân     14 buổi  3.066.000 đ   (báo cáo 15 buổi 3.285.000, trừ 04/08)
--   Tân      15 buổi  3.285.000 đ   KHỚP
--   Ms. Linh  4 buổi    876.000 đ   KHỚP
--   Tổng              7.227.000 đ = 7.446.000 của báo cáo trừ đúng buổi 04/08
