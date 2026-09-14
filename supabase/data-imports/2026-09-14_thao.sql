-- Nhập 44 buổi học đã dạy của lớp THAO-PH (chị Thảo).
-- Nguồn: báo cáo "Chị Thảo" chốt 26/07/2026 (33 buổi, có đánh số và tên giáo
-- viên từng buổi) + báo cáo kỳ 28/07-19/08/2026 (11 buổi).
--
-- KHÔNG ghi giờ dạy thực tế (actual_start_at/end_at để trống). Báo cáo chỉ có
-- NGÀY, không có giờ. Để trống là đúng sự thật, và nhờ đó hệ thống KHÔNG sinh
-- bản ghi tính lương cho các buổi này - lương tháng 5 đến tháng 8 trung tâm đã
-- trả ngoài hệ thống rồi, sinh ra nữa là trả hai lần.
--
-- Giờ 22:00 lấy từ file feedback tháng 5 (các buổi 22:00-23:00). Các buổi khác
-- dùng cùng giờ này vì báo cáo không ghi giờ - chỉ NGÀY là có bằng chứng.
-- Ngày 28/07 có hai buổi nên buổi thứ hai để 23:30 cho khác khoá.
--
-- Bốn buổi miễn phí (is_billable = false): 16/05 buổi đầu vào, và 07/07, 11/07,
-- 17/07 là ba buổi đầu với cô Phương.
with v(ngay, gio, ma_gv, tinh_phi) as (values
  (DATE '2026-05-16', TIME '22:00', 'TRANG', false),
  (DATE '2026-05-17', TIME '22:00', 'TRANG', true),
  (DATE '2026-05-18', TIME '22:00', 'TRANG', true),
  (DATE '2026-05-19', TIME '22:00', 'TRANG', true),
  (DATE '2026-05-20', TIME '22:00', 'TRANG', true),
  (DATE '2026-05-21', TIME '22:00', 'TRANG', true),
  (DATE '2026-05-25', TIME '22:00', 'TRANG', true),
  (DATE '2026-05-28', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-01', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-02', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-03', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-04', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-06', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-08', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-10', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-12', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-15', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-17', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-19', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-22', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-23', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-24', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-27', TIME '22:00', 'TRANG', true),
  (DATE '2026-06-30', TIME '22:00', 'TRANG', true),
  (DATE '2026-07-02', TIME '22:00', 'TRANG', true),
  (DATE '2026-07-06', TIME '22:00', 'TRANG', true),
  (DATE '2026-07-07', TIME '22:00', 'PHUONG', false),
  (DATE '2026-07-11', TIME '22:00', 'PHUONG', false),
  (DATE '2026-07-17', TIME '22:00', 'PHUONG', false),
  (DATE '2026-07-19', TIME '22:00', 'PHUONG', true),
  (DATE '2026-07-20', TIME '22:00', 'PHUONG', true),
  (DATE '2026-07-22', TIME '22:00', 'PHUONG', true),
  (DATE '2026-07-26', TIME '22:00', 'PHUONG', true),
  (DATE '2026-07-28', TIME '22:00', 'PHUONG', true),
  (DATE '2026-07-28', TIME '23:30', 'PHUONG', true),
  (DATE '2026-08-01', TIME '22:00', 'PHUONG', true),
  (DATE '2026-08-03', TIME '22:00', 'PHUONG', true),
  (DATE '2026-08-08', TIME '22:00', 'PHUONG', true),
  (DATE '2026-08-09', TIME '22:00', 'PHUONG', true),
  (DATE '2026-08-12', TIME '22:00', 'PHUONG', true),
  (DATE '2026-08-14', TIME '22:00', 'PHUONG', true),
  (DATE '2026-08-16', TIME '22:00', 'PHUONG', true),
  (DATE '2026-08-17', TIME '22:00', 'PHUONG', true),
  (DATE '2026-08-19', TIME '22:00', 'PHUONG', true)
),
lop as (select c.id as class_id, e.student_id
        from classes c join student_enrollments e on e.class_id = c.id
        where c.class_code = 'THAO-PH'),
gv as (select case when full_name = 'Nguyễn Thị Lệ Trang' then 'TRANG' else 'PHUONG' end as ma, id
       from teachers where full_name in ('Nguyễn Thị Lệ Trang','Ms. Phương')),
moi as (
  insert into lessons (class_id, teacher_id, lesson_date, scheduled_start_at, scheduled_end_at,
                       duration_minutes, status, notes)
  select lop.class_id, gv.id, v.ngay,
         (v.ngay + v.gio) at time zone 'Asia/Ho_Chi_Minh',
         (v.ngay + v.gio) at time zone 'Asia/Ho_Chi_Minh' + interval '60 minutes',
         60, 'scheduled'::lesson_status,
         'Nhập từ báo cáo PDF ngày 14/09/2026. Báo cáo chỉ ghi NGÀY, không ghi giờ dạy - giờ hiển thị chỉ để xếp thứ tự.'
  from v cross join lop join gv on gv.ma = v.ma_gv
  returning id, lesson_date
)
-- Không nối lại với v theo ngày: ngày 28/07 có HAI buổi nên nối theo ngày sẽ
-- sinh ra bốn dòng điểm danh cho hai buổi. Bốn ngày miễn phí liệt kê thẳng.
insert into attendance (lesson_id, student_id, status, is_billable)
select moi.id, lop.student_id, 'present'::attendance_status,
       moi.lesson_date not in (date '2026-05-16', date '2026-07-07',
                               date '2026-07-11', date '2026-07-17')
from moi cross join lop;

-- Chuyển sang hoàn thành SAU KHI đã có điểm danh. Bản ghi doanh thu chỉ sinh ra
-- ở bước chuyển trạng thái này (trigger trg_lesson_consume_all), nên nhập thẳng
-- 'completed' ngay từ đầu sẽ không sinh được gì.
update lessons l set status = 'completed'::lesson_status
from classes c
where c.id = l.class_id and c.class_code = 'THAO-PH' and l.status = 'scheduled';
