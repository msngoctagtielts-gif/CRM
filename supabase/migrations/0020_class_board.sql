-- 0020 — Bảng điều khiển lớp học
--
-- Founder hỏi ngày 15/09/2026: "làm thế nào để tôi theo dõi được tình trạng
-- học viên của mình đang diễn ra như thế nào và các buổi học gần nhất của họ".
--
-- Trang /classes hiện chỉ liệt kê lớp, giáo viên và sĩ số — những thứ không đổi
-- hằng tuần. Nó không trả lời được câu hỏi duy nhất mà một người điều hành cần
-- hỏi mỗi sáng: LỚP NÀO ĐANG IM LẶNG BẤT THƯỜNG.
--
-- Đo ngày 15/09/2026: 20 trong 21 lớp không có buổi nào trong tháng 9. Lớp
-- Thiên Ái im lặng 111 ngày. Không ai biết vì không có chỗ nào hiện ra.
--
-- MỘT ĐIỀU VIEW NÀY KHÔNG LÀM ĐƯỢC, và không được giả vờ làm được: nó không
-- phân biệt "lớp đã nghỉ" với "lớp vẫn dạy nhưng chưa ai nhập". Cả hai đều ra
-- cùng một con số ngày im lặng. Phân biệt được hay không phụ thuộc vào việc
-- giáo viên có nhập buổi học hay không, không phụ thuộc vào truy vấn này.
--
-- security_invoker = on: RLS trên các bảng gốc vẫn là hàng rào thật. Giáo viên
-- đọc view này chỉ thấy lớp mình dạy, và các cột tiền ra 0 vì payments và
-- lesson_consumptions là của riêng Founder.

create or replace view v_class_board
with (security_invoker = on) as
with buoi as (
  select
    l.class_id,
    count(*) filter (where l.status = 'completed')                      as tong_buoi,
    max(l.lesson_date) filter (where l.status = 'completed')            as buoi_gan_nhat,
    count(*) filter (
      where l.status = 'completed'
        and l.lesson_date >= date_trunc('month', current_date)::date
    )                                                                   as buoi_thang_nay,
    -- Buổi thiếu giờ dạy thực tế KHÔNG sinh được dòng trả lương
    -- (fn_generate_payable_lesson đòi v_has_time). Đây là nguyên nhân duy nhất
    -- khiến 314/458 buổi không có chi phí giáo viên tính đến 15/09/2026.
    count(*) filter (
      where l.status = 'completed' and l.actual_start_at is null
    )                                                                   as buoi_thieu_gio
  from lessons l
  group by l.class_id
),
noi_dung as (
  select l.class_id,
         count(tr.id) as so_bao_cao
  from lessons l
  join teaching_reports tr on tr.lesson_id = l.id
  where l.status = 'completed'
  group by l.class_id
),
video as (
  select r.class_id,
         count(*)                                    as so_video,
         count(*) filter (where r.mirrored_at is null) as video_dang_muon
  from recordings r
  where r.status = 'active'
  group by r.class_id
),
tien as (
  -- Công nợ tính theo BUỔI ĐÃ HỌC trừ ĐÃ THU, không tính theo gói đã bán.
  -- Cột outstanding_amount của v_enrollment_balances lấy net_amount của gói,
  -- mà net_amount chỉ đúng nếu gói được cập nhật mỗi lần gia hạn — thực tế
  -- không phải vậy, nên với lớp trả trước nó cho số sai rất xa (lớp Tân báo
  -- thừa 7.050.000 đ trong khi đang thiếu 3.285.000 đ).
  select b.class_id,
         sum(b.revenue_recognized - b.total_paid) as con_thieu
  from v_enrollment_balances b
  where b.status in ('active', 'paused')
  group by b.class_id
)
select
  c.id                                           as class_id,
  c.name                                         as ten_lop,
  c.status                                       as trang_thai_lop,
  c.teacher_id,
  t.display_name                                 as giao_vien,
  coalesce(sv.si_so, 0)                          as si_so,
  coalesce(b.tong_buoi, 0)                       as tong_buoi,
  b.buoi_gan_nhat,
  case when b.buoi_gan_nhat is not null
       then current_date - b.buoi_gan_nhat end   as ngay_im_lang,
  coalesce(b.buoi_thang_nay, 0)                  as buoi_thang_nay,
  coalesce(b.buoi_thieu_gio, 0)                  as buoi_thieu_gio,
  coalesce(nd.so_bao_cao, 0)                     as so_bao_cao,
  coalesce(v.so_video, 0)                        as so_video,
  coalesce(v.video_dang_muon, 0)                 as video_dang_muon,
  coalesce(ti.con_thieu, 0)                      as con_thieu,
  (select count(*) from class_schedules cs where cs.class_id = c.id) as so_lich
from classes c
left join teachers t on t.id = c.teacher_id
left join lateral (
  select count(*) as si_so from class_students cs
   where cs.class_id = c.id and cs.status = 'active'
) sv on true
left join buoi b   on b.class_id = c.id
left join noi_dung nd on nd.class_id = c.id
left join video v  on v.class_id = c.id
left join tien ti  on ti.class_id = c.id;

comment on view v_class_board is
  'Tình trạng vận hành của từng lớp: buổi gần nhất, số ngày im lặng, buổi thiếu giờ dạy, nội dung và video đã có, học phí còn thiếu. Không phân biệt được lớp đã nghỉ với lớp chưa ai nhập.';
