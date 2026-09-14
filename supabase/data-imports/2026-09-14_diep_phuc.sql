with v(ngay, ma_lop, phut) as (values
  (DATE '2026-06-01', 'DIEP-PH', 60),
  (DATE '2026-06-05', 'DIEP-PH', 60),
  (DATE '2026-06-09', 'DIEP-RO', 60),
  (DATE '2026-06-10', 'DIEP-RO', 60),
  (DATE '2026-06-15', 'DIEP-PH', 60),
  (DATE '2026-06-16', 'DIEP-RO', 60),
  (DATE '2026-06-17', 'DIEP-RO', 60),
  (DATE '2026-06-19', 'DIEP-PH', 60),
  (DATE '2026-06-22', 'DIEP-PH', 60),
  (DATE '2026-06-23', 'DIEP-RO', 60),
  (DATE '2026-06-26', 'DIEP-PH', 60),
  (DATE '2026-06-29', 'DIEP-PH', 60),
  (DATE '2026-06-30', 'DIEP-RO', 60),
  (DATE '2026-07-01', 'DIEP-RO', 60),
  (DATE '2026-07-03', 'DIEP-PH', 60),
  (DATE '2026-07-06', 'DIEP-PH', 60),
  (DATE '2026-07-07', 'DIEP-RO', 60),
  (DATE '2026-07-08', 'DIEP-RO', 60),
  (DATE '2026-07-10', 'DIEP-PH', 60),
  (DATE '2026-07-13', 'DIEP-PH', 60),
  (DATE '2026-07-14', 'DIEP-RO', 60),
  (DATE '2026-07-15', 'DIEP-RO', 60),
  (DATE '2026-07-17', 'DIEP-PH', 60),
  (DATE '2026-07-20', 'DIEP-PH', 60),
  (DATE '2026-07-21', 'DIEP-RO', 60),
  (DATE '2026-07-22', 'DIEP-RO', 60),
  (DATE '2026-07-24', 'DIEP-PH', 60),
  (DATE '2026-07-27', 'DIEP-PH', 60),
  (DATE '2026-07-29', 'DIEP-RO', 60),
  (DATE '2026-07-31', 'DIEP-PH', 60),
  (DATE '2026-08-03', 'DIEP-PH', 60),
  (DATE '2026-08-04', 'DIEP-RO', 60),
  (DATE '2026-08-05', 'DIEP-RO', 60),
  (DATE '2026-08-10', 'DIEP-PH', 60),
  (DATE '2026-08-11', 'DIEP-RO', 60),
  (DATE '2026-08-12', 'DIEP-PH', 60),
  (DATE '2026-08-12', 'DIEP-RO', 60),
  (DATE '2026-08-14', 'DIEP-PH', 60),
  (DATE '2026-08-17', 'DIEP-PH', 60),
  (DATE '2026-08-18', 'DIEP-RO', 60),
  (DATE '2026-08-19', 'DIEP-PH', 60),
  (DATE '2026-08-19', 'DIEP-RO', 60),
  (DATE '2026-08-25', 'DIEP-RO', 60),
  (DATE '2026-08-26', 'DIEP-RO', 60),
  (DATE '2026-06-01', 'PHUC-PH', 60),
  (DATE '2026-06-06', 'PHUC-PH', 60),
  (DATE '2026-06-07', 'PHUC-PH', 30),
  (DATE '2026-06-11', 'PHUC-SH', 60),
  (DATE '2026-06-15', 'PHUC-PH', 60),
  (DATE '2026-06-18', 'PHUC-SH', 60),
  (DATE '2026-06-22', 'PHUC-SH', 60),
  (DATE '2026-06-25', 'PHUC-SH', 60),
  (DATE '2026-06-29', 'PHUC-SH', 60),
  (DATE '2026-07-02', 'PHUC-SH', 60),
  (DATE '2026-07-04', 'PHUC-PH', 60),
  (DATE '2026-07-06', 'PHUC-SH', 60),
  (DATE '2026-07-09', 'PHUC-PH', 60),
  (DATE '2026-07-09', 'PHUC-SH', 60),
  (DATE '2026-07-11', 'PHUC-PH', 60),
  (DATE '2026-07-13', 'PHUC-SH', 60),
  (DATE '2026-07-16', 'PHUC-SH', 60),
  (DATE '2026-07-20', 'PHUC-SH', 60),
  (DATE '2026-07-25', 'PHUC-PH', 60),
  (DATE '2026-07-27', 'PHUC-SH', 60),
  (DATE '2026-07-30', 'PHUC-SH', 60),
  (DATE '2026-08-01', 'PHUC-PH', 60),
  (DATE '2026-08-03', 'PHUC-SH', 60),
  (DATE '2026-08-10', 'PHUC-SH', 60),
  (DATE '2026-08-13', 'PHUC-SH', 60),
  (DATE '2026-08-17', 'PHUC-SH', 60),
  (DATE '2026-08-22', 'PHUC-PH', 60),
  (DATE '2026-08-27', 'PHUC-SH', 60)
),
lop as (select c.id as class_id, c.class_code, c.teacher_id, cs.student_id
        from classes c join class_students cs on cs.class_id = c.id
        where c.class_code in ('DIEP-PH','DIEP-RO','PHUC-PH','PHUC-SH')),
moi as (
  insert into lessons (class_id, teacher_id, lesson_date, scheduled_start_at, scheduled_end_at,
                       duration_minutes, status, notes)
  select lop.class_id, lop.teacher_id, v.ngay,
         (v.ngay + TIME '19:00') at time zone 'Asia/Ho_Chi_Minh',
         (v.ngay + TIME '19:00') at time zone 'Asia/Ho_Chi_Minh' + (v.phut||' minutes')::interval,
         v.phut, 'scheduled'::lesson_status,
         'Nhập từ 2 báo cáo PDF gửi chị Hương (T6-T7 và T8/2026) ngày 14/09/2026. Báo cáo chỉ ghi NGÀY, không ghi giờ dạy thực tế.'
  from v join lop on lop.class_code = v.ma_lop
  returning id, class_id
)
insert into attendance (lesson_id, student_id, status)
select moi.id, lop.student_id, 'present'::attendance_status
 from moi join lop on lop.class_id = moi.class_id;

-- Chuyển sang hoàn thành SAU KHI đã có điểm danh. Doanh thu chỉ sinh ra ở bước
-- đổi trạng thái này.
update lessons l set status = 'completed'::lesson_status
from classes c
where c.id = l.class_id
  and c.class_code in ('DIEP-PH','DIEP-RO','PHUC-PH','PHUC-SH')
  and l.status = 'scheduled';

-- Đối chiếu sau khi chạy (đã khớp đúng báo cáo ngày 14/09/2026):
--   Diệp T6 2.470.000 + T7 3.230.000 = 5.700.000 đ  (báo cáo: 5.700.000)
--   Diệp T8 2.660.000 đ                              (báo cáo: 2.660.000)
--   Phúc T6 1.615.000 + T7 2.280.000 = 3.895.000 đ  (báo cáo: 3.895.000)
--   Phúc T8 1.330.000 đ                              (báo cáo: 1.330.000)
-- Buổi 30 phút ngày 07/06 của Phúc quy đổi thành 0,5 buổi = 95.000 đ (D15).
