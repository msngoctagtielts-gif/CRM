-- 0022 — Hồ sơ từng buổi học đã dạy: có đủ bốn thứ hay chưa
--
-- Founder nói ngày 15/09/2026: "mỗi lần tìm kiếm thông tin là 1 điều rất áp
-- lực vì tôi chưa có sự sắp xếp sẵn có". Phân hệ 6 (Học thuật & chất lượng)
-- trong bảng của cô chưa có màn hình nào, nên câu hỏi "buổi nào còn thiếu hồ
-- sơ" hiện phải hỏi từng lớp một.
--
-- Bốn thứ một buổi đã dạy phải có, theo đúng thứ tự cô yêu cầu giáo viên làm:
--   1. giờ vào / giờ ra thật   -> không có thì KHÔNG sinh được dòng trả lương
--   2. nội dung bài học        -> không có thì phụ huynh không biết con học gì
--   3. nhận xét học viên       -> phần AI sẽ viết từ video
--   4. link video              -> căn cứ đối chiếu giờ khai của giáo viên
--
-- View này KHÔNG chấm điểm giáo viên. Buổi tháng 5–8 thiếu giờ là do hệ thống
-- lúc đó chưa bắt buộc, không phải do giáo viên khai gian. Founder đã chốt bỏ
-- qua các buổi trước tháng 9 (xem DECISIONS.md D38). Cột lesson_date để trên
-- màn hình lọc được mốc đó.
--
-- security_invoker = on: giáo viên đọc view này chỉ thấy buổi của lớp mình.

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
       and btrim(coalesce(tr.lesson_content, '')) <> ''
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
  'Mỗi buổi đã dạy một dòng, kèm bốn cờ: có giờ thật, có nội dung bài, có nhận xét học viên, có video. Dùng cho phân hệ 6 — Học thuật & chất lượng.';
