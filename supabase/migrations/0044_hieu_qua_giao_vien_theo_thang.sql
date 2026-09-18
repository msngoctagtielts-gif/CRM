-- 0044 — Hiệu quả từng giáo viên theo tháng.
--
-- Cô Ngọc: "gõ vào Giáo Viên, tôi không thấy tổng tháng đó họ dạy bao nhiêu,
-- bao nhiêu giờ, tương ứng doanh thu họ mang lại cho trung tâm để tôi xếp loại".
--
-- GHÉP HAI NGUỒN, VÀ CHỖ DỄ SAI
--   teacher_payable_lessons  → số buổi, số phút, tiền trả giáo viên
--   lesson_consumptions      → doanh thu ghi nhận
--
--   Một buổi lớp nhóm có NHIỀU dòng lesson_consumptions — mỗi học viên một
--   dòng. Gộp một lần thì số PHÚT bị nhân lên theo sĩ số. Nên số phút lấy từ
--   nhánh chi phí, doanh thu lấy từ nhánh consumption, rồi full outer join.
--
-- CHẶN CỨNG `where public.is_founder()`. View này chứa doanh thu và lợi nhuận
-- trung tâm — giáo viên tuyệt đối không được thấy.
drop view if exists public.v_hieu_qua_gv_thang;

create view public.v_hieu_qua_gv_thang as
with chi_phi as (
  select date_trunc('month', pl.lesson_date::timestamptz)::date as thang,
         pl.teacher_id,
         count(*)                                    as so_buoi,
         sum(pl.duration_minutes)                    as so_phut,
         sum(pl.amount)                              as tra_giao_vien,
         count(*) filter (where pl.has_video)        as buoi_co_video,
         count(*) filter (where pl.status <> 'paid') as buoi_chua_tra,
         round(avg(pl.qc_score) filter (where pl.qc_score is not null), 1) as diem_qc
    from public.teacher_payable_lessons pl
   group by 1, 2
),
doanh_thu as (
  select date_trunc('month', l.lesson_date::timestamptz)::date as thang,
         l.teacher_id,
         sum(lc.recognized_amount)     as doanh_thu,
         count(distinct lc.student_id) as so_hoc_vien
    from public.lesson_consumptions lc
    join public.lessons l on l.id = lc.lesson_id
   where l.teacher_id is not null
   group by 1, 2
)
select coalesce(c.thang, d.thang)           as thang,
       coalesce(c.teacher_id, d.teacher_id) as teacher_id,
       t.full_name                          as ten_giao_vien,
       t.status::text                       as trang_thai_gv,
       t.teaching_role,
       coalesce(c.so_buoi, 0)               as so_buoi,
       coalesce(c.so_phut, 0)               as so_phut,
       round(coalesce(c.so_phut, 0) / 60.0, 1) as so_gio,
       coalesce(d.so_hoc_vien, 0)           as so_hoc_vien,
       coalesce(d.doanh_thu, 0)             as doanh_thu,
       coalesce(c.tra_giao_vien, 0)         as tra_giao_vien,
       coalesce(d.doanh_thu, 0) - coalesce(c.tra_giao_vien, 0) as loi_nhuan_gop,
       case when coalesce(d.doanh_thu, 0) > 0
            then round((coalesce(d.doanh_thu,0) - coalesce(c.tra_giao_vien,0))
                       / d.doanh_thu * 100, 1)
       end                                  as ty_suat_phan_tram,
       case when coalesce(c.so_phut, 0) > 0
            then round(coalesce(d.doanh_thu, 0) / (c.so_phut / 60.0))
       end                                  as doanh_thu_moi_gio,
       coalesce(c.buoi_co_video, 0)         as buoi_co_video,
       coalesce(c.buoi_chua_tra, 0)         as buoi_chua_tra,
       c.diem_qc
  from chi_phi c
  full outer join doanh_thu d
       on d.thang = c.thang and d.teacher_id = c.teacher_id
  join public.teachers t
       on t.id = coalesce(c.teacher_id, d.teacher_id)
 where public.is_founder();

comment on view public.v_hieu_qua_gv_thang is
  'Hieu qua tung giao vien theo thang: buoi, gio, doanh thu ghi nhan, tien tra GV, loi nhuan gop. CHI FOUNDER.';

revoke all on public.v_hieu_qua_gv_thang from authenticated, anon;
grant select on public.v_hieu_qua_gv_thang to authenticated;
