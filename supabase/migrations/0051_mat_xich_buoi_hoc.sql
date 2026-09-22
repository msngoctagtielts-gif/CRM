-- 0051 — MẮT XÍCH BUỔI HỌC.
--
-- Cô Ngọc hỏi: làm sao để hệ thống là "một chuỗi liên kết với nhau đưa ra kết
-- quả tuyệt đối". View này trả lời bằng cách ĐO chuỗi đó, không mô tả nó.
--
-- Một buổi học đi qua tám mắt xích:
--   1 có buổi   2 có báo cáo   3 báo cáo có nội dung   4 đã chấm chất lượng
--   5 đã xác minh video   6 đã trừ học phí học viên   7 đã tính vào lương
--   8 đã gửi phụ huynh
--
-- Mắt xích nào đứt thì tiền hoặc uy tín rơi ở đúng chỗ đó:
--   đứt ở 6 nhưng nối ở 7 = trung tâm trả tiền giáo viên cho buổi không ai bị
--     trừ học phí. Đó là lỗ, và hiện hệ thống ĐANG CHO PHÉP nó xảy ra âm thầm.
--   đứt ở 2 nhưng nối ở 7 = trả lương cho buổi không có bằng chứng dạy.
--   đứt ở 8 = phụ huynh không thấy con mình học gì, dù giáo viên đã viết.
--
-- KHÔNG tự động vá. View chỉ soi. Vá là quyết định của Founder, vì mỗi mắt xích
-- đứt có thể có lý do thật (buổi học thử, buổi bù, buổi tặng).

drop view if exists public.v_mat_xich_buoi_hoc;

create view public.v_mat_xich_buoi_hoc as
with tru as (
  select lesson_id,
         sum(recognized_amount) as tien_hoc_phi,
         count(*)               as so_hoc_vien_bi_tru
    from public.lesson_consumptions
   group by lesson_id
)
select l.id                                   as lesson_id,
       c.id                                   as class_id,
       c.class_code,
       c.name                                 as ten_lop,
       t.full_name                            as giao_vien,
       l.lesson_date,
       l.duration_minutes,

       -- Tám mắt xích
       true                                        as x1_co_buoi,
       (tr.id is not null)                         as x2_co_bao_cao,
       (coalesce(btrim(tr.lesson_content), '') <> '') as x3_co_noi_dung,
       (tr.qc_score is not null)                   as x4_da_cham_qc,
       (tr.phut_thuc_te is not null)               as x5_da_xac_minh,
       (tru.lesson_id is not null)                 as x6_da_tru_hoc_phi,
       (tpl.lesson_id is not null)                 as x7_da_vao_luong,
       (tr.sent_to_parent_at is not null)          as x8_da_gui_ph,

       (case when tr.id is not null then 1 else 0 end
      + case when coalesce(btrim(tr.lesson_content), '') <> '' then 1 else 0 end
      + case when tr.qc_score is not null then 1 else 0 end
      + case when tr.phut_thuc_te is not null then 1 else 0 end
      + case when tru.lesson_id is not null then 1 else 0 end
      + case when tpl.lesson_id is not null then 1 else 0 end
      + case when tr.sent_to_parent_at is not null then 1 else 0 end
      + 1)                                    as so_mat_xich_dat,

       -- Mắt xích đứt sớm nhất — chỗ cần sửa trước.
       case
         when tr.id is null                                  then 'Thiếu báo cáo'
         when coalesce(btrim(tr.lesson_content), '') = ''     then 'Báo cáo trống nội dung'
         when tru.lesson_id is null and tpl.lesson_id is not null
                                                              then 'Trả lương nhưng không trừ học phí'
         when tru.lesson_id is null                           then 'Chưa trừ học phí'
         when tpl.lesson_id is null                           then 'Chưa vào lương'
         when tr.qc_score is null                             then 'Chưa chấm chất lượng'
         when tr.sent_to_parent_at is null                    then 'Chưa gửi phụ huynh'
         when tr.phut_thuc_te is null                         then 'Chưa xác minh video'
         else null
       end                                    as diem_dut,

       -- Mức nghiêm trọng, để xếp việc nào làm trước.
       case
         when tpl.lesson_id is not null and tru.lesson_id is null then 'tien'
         when tpl.lesson_id is not null and tr.id is null         then 'tien'
         when tr.id is null                                       then 'bang_chung'
         when coalesce(btrim(tr.lesson_content), '') = ''         then 'bang_chung'
         when tr.sent_to_parent_at is null                        then 'phu_huynh'
         when tr.phut_thuc_te is null                             then 'xac_minh'
         else 'du'
       end                                    as muc_do,

       tpl.amount                             as tien_tra_giao_vien,
       tru.tien_hoc_phi,
       tru.so_hoc_vien_bi_tru,
       tr.id                                  as report_id,
       tr.status::text                        as trang_thai_bao_cao
  from public.lessons l
  join public.classes c                 on c.id = l.class_id
  left join public.teachers t           on t.id = l.teacher_id
  left join public.teaching_reports tr  on tr.lesson_id = l.id
  left join tru                         on tru.lesson_id = l.id
  left join public.teacher_payable_lessons tpl on tpl.lesson_id = l.id
 where l.status = 'completed'
   and public.is_founder();

comment on view public.v_mat_xich_buoi_hoc is
  'Do do kin cua chuoi Buoi hoc -> Bao cao -> QC -> Xac minh -> Hoc phi -> Luong -> Phu huynh. CHI FOUNDER.';

revoke all on public.v_mat_xich_buoi_hoc from authenticated, anon;
grant select on public.v_mat_xich_buoi_hoc to authenticated;
