-- 0023 — Sửa cách đếm "có nội dung bài" trong v_ho_so_buoi_hoc
--
-- Khi nhập nội dung lịch sử từ 21 bảng feedback (15/09/2026) mới thấy: phần
-- lớn giáo viên KHÔNG điền cột "Nội dung bài học", mà viết toàn bộ diễn biến
-- buổi học vào cột "Điểm mạnh (gửi PH/HV)". Lớp Ms. Tuyết: 57 buổi có báo
-- cáo nhưng chỉ 16 buổi có lesson_content.
--
-- Nếu chỉ đếm lesson_content thì màn hình chất lượng sẽ báo 41 buổi "thiếu
-- nội dung" trong khi nội dung có thật, chỉ nằm ở cột khác. Con số sai kiểu
-- này nguy hiểm hơn không có con số, vì nó khiến Founder đi nhắc giáo viên
-- về việc họ đã làm.
--
-- Đổi: co_noi_dung = có lesson_content HOẶC có strengths.

create or replace view v_ho_so_buoi_hoc
with (security_invoker = on) as
select
  l.id                                              as lesson_id,
  l.class_id,
  c.name                                            as ten_lop,
  l.teacher_id,
  t.display_name                                    as giao_vien,
  l.lesson_date,
  l.topic,
  (l.actual_start_at is not null
     and l.actual_end_at is not null)               as co_gio,
  exists (
    select 1 from teaching_reports tr
     where tr.lesson_id = l.id
       and (btrim(coalesce(tr.lesson_content, '')) <> ''
            or btrim(coalesce(tr.strengths, '')) <> '')
  )                                                 as co_noi_dung,
  exists (
    select 1 from teaching_reports tr
     join teaching_report_students trs on trs.report_id = tr.id
    where tr.lesson_id = l.id
  )                                                 as co_nhan_xet,
  exists (
    select 1 from recordings r
     where r.lesson_id = l.id and r.status = 'active'
  )                                                 as co_video
from lessons l
join classes c on c.id = l.class_id
left join teachers t on t.id = l.teacher_id
where l.status = 'completed';

comment on view v_ho_so_buoi_hoc is
  'Mỗi buổi đã dạy một dòng, kèm bốn cờ: có giờ thật, có nội dung bài, có nhận xét học viên, có video. Cột co_noi_dung nhận cả lesson_content lẫn strengths vì nhiều bảng feedback cũ ghi toàn bộ nội dung vào ô Điểm mạnh. Dùng cho phân hệ 6 — Học thuật & chất lượng.';
