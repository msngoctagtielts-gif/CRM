-- 0050 — Chỗ lưu kết quả XÁC MINH buổi học từ video, tách khỏi số giáo viên khai.
--
-- VÌ SAO TÁCH RA HAI CỘT KHÁC NHAU
--   teaching_reports.duration_minutes là số giáo viên KHAI. Cột mới dưới đây là
--   số ĐO ĐƯỢC từ video. Không ghi đè lên nhau, vì:
--     · Lương và học phí đang tính theo lessons.duration_minutes. Sửa tự động
--       theo kết quả máy đọc là đổi tiền của giáo viên và của phụ huynh mà
--       không ai duyệt.
--     · Founder cần NHÌN THẤY độ lệch giữa số khai và số thật để quyết định,
--       chứ không phải để hệ thống âm thầm ghi đè.
--
--   Sheet của trung tâm đã có sẵn cột "Thời lượng học thực tế (phút)" với mọi
--   dòng ghi "Chưa xác minh" — đây là bản trong cơ sở dữ liệu của đúng cột đó.

alter table public.teaching_reports
  add column if not exists phut_thuc_te      int,
  add column if not exists gian_doan         jsonb,
  add column if not exists khong_khi_lop     text,
  add column if not exists thoi_gian_hv_noi  int,
  add column if not exists nguon_xac_minh    text,
  add column if not exists xac_minh_luc      timestamptz;

comment on column public.teaching_reports.phut_thuc_te is
  'So phut hoc THUC TE do tu video. KHAC voi duration_minutes la so giao vien khai.';
comment on column public.teaching_reports.gian_doan is
  'Mang JSON cac lan gian doan tren 30 giay: [{tu, den, so_giay, dien_ra_gi}].';
comment on column public.teaching_reports.khong_khi_lop is
  'Mo ta khong khi lop hoc, can cu vao loi thoai va nhip buoi hoc trong video.';
comment on column public.teaching_reports.thoi_gian_hv_noi is
  'So phut hoc vien noi (STT). Dung de do lop giao tiep co dat chuan khong.';
comment on column public.teaching_reports.nguon_xac_minh is
  'Ai xac minh: gemini | teacher | founder. Null = chua xac minh.';

-- Xem nhanh do lech giua so khai va so do duoc. CHI FOUNDER.
drop view if exists public.v_xac_minh_buoi_hoc;

create view public.v_xac_minh_buoi_hoc as
select l.id                       as lesson_id,
       c.class_code,
       c.name                     as ten_lop,
       t.full_name                as giao_vien,
       l.lesson_date,
       l.duration_minutes         as phut_khai,
       tr.phut_thuc_te,
       tr.phut_thuc_te - l.duration_minutes as lech_phut,
       tr.thoi_gian_hv_noi,
       case when tr.phut_thuc_te > 0
            then round(tr.thoi_gian_hv_noi::numeric / tr.phut_thuc_te * 100)
       end                        as ty_le_hv_noi_phan_tram,
       tr.khong_khi_lop,
       tr.gian_doan,
       tr.nguon_xac_minh,
       tr.xac_minh_luc,
       (select count(*) from public.recordings r
         where r.lesson_id = l.id and r.url like '%youtu%') as so_video_youtube,
       (select count(*) from public.recordings r
         where r.lesson_id = l.id and r.url like '%zoom%')  as so_video_zoom
  from public.lessons l
  join public.classes c        on c.id = l.class_id
  left join public.teachers t  on t.id = l.teacher_id
  left join public.teaching_reports tr on tr.lesson_id = l.id
 where l.status = 'completed'
   and public.is_founder();

comment on view public.v_xac_minh_buoi_hoc is
  'Doi chieu so phut giao vien khai voi so phut do tu video. CHI FOUNDER.';

revoke all on public.v_xac_minh_buoi_hoc from authenticated, anon;
grant select on public.v_xac_minh_buoi_hoc to authenticated;
