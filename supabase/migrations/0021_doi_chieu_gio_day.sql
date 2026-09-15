-- 0021 — Đối chiếu giờ dạy giáo viên khai với độ dài video thật
--
-- Founder chốt 15/09/2026, sau khi phát hiện bảng feedback cũ có 17/41 buổi mà
-- chính giáo viên ghi "no exact Start/End found" nhưng ô giờ vẫn được điền theo
-- lịch. Từ tháng 9: giáo viên BẮT BUỘC ghi giờ vào và giờ ra, và phải "căn cứ
-- vào video để biết mức độ chính xác và trung thực của giáo viên".
--
-- View này là vế thứ hai của phép đối chiếu. Không có nó thì giờ khai báo là
-- lời khai một chiều, không có gì kiểm chứng.
--
-- Độ dài video do AI điền khi đọc video (xem src/lib/ai/feedback.ts). Trường
-- `video_duration` bị `enforceNoFabrication` xoá sạch khi AI không mở được
-- video, nên con số vào đây luôn là số AI thật sự đo được, không phải đoán.
--
-- NGƯỠNG 10 PHÚT: video luôn ngắn hơn buổi học thật một chút — giáo viên bấm
-- ghi sau khi chào hỏi, tắt trước khi dặn dò xong. Lệch dưới 10 phút là bình
-- thường. Lệch trên 10 phút là con số CẦN HỎI LẠI, không phải bằng chứng gian
-- dối: video có thể bị cắt, mất mạng giữa buổi, hoặc quay làm hai đoạn.

create or replace view v_doi_chieu_gio_day
with (security_invoker = on) as
select
  l.id                                   as lesson_id,
  l.class_id,
  c.name                                 as ten_lop,
  t.display_name                         as giao_vien,
  l.lesson_date,
  l.duration_minutes                     as phut_khai_bao,
  round(sum(r.duration_seconds) / 60.0)  as phut_video,
  round(l.duration_minutes - sum(r.duration_seconds) / 60.0) as lech_phut,
  count(r.id)                            as so_doan_video
from lessons l
join classes c  on c.id = l.class_id
left join teachers t on t.id = l.teacher_id
join recordings r on r.lesson_id = l.id
              and r.status = 'active'
              and r.duration_seconds is not null
where l.status = 'completed'
  and l.duration_minutes is not null
group by l.id, l.class_id, c.name, t.display_name, l.lesson_date, l.duration_minutes;

comment on view v_doi_chieu_gio_day is
  'So giờ dạy giáo viên khai với tổng độ dài video của buổi. Lệch trên 10 phút là con số cần hỏi lại, không phải kết luận gian dối.';
