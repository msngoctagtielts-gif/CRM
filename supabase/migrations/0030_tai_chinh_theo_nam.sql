-- =============================================================================
-- 0030 — Tài chính theo năm/tháng + đánh dấu giáo viên đã nghỉ
-- =============================================================================
--
-- VÌ SAO CÓ MIGRATION NÀY
--
-- Founder không xem được lương từng tháng của từng giáo viên. Nguyên nhân thật:
-- bảng teacher_payroll (kỳ lương) chỉ có 7 bản ghi nháp của tháng 08/2026, tất
-- cả đều 0 buổi / 0 đồng; trong khi 460 buổi đã trả nằm ở
-- teacher_payable_lessons với payroll_id = NULL. Màn hình /payroll đọc kỳ lương
-- nên hiện ra 7 dòng rỗng.
--
-- KHÔNG sinh kỳ lương ngược cho 17 tháng quá khứ, vì kỳ lương là chứng từ có
-- trạng thái duyệt/đã trả và người duyệt — dựng ngược sẽ tạo chứng từ giả.
-- Thay vào đó đọc thẳng từ buổi đã trả, vốn là dữ liệu gốc.
--
-- HAI VIEW
--   v_tai_chinh_thang  — mỗi tháng một dòng: thu, lương, chi khác, còn lại,
--                        kèm chỉ số vận hành. CHỈ Founder đọc được.
--   v_luong_gv_thang   — mỗi giáo viên × mỗi tháng. RLS của
--                        teacher_payable_lessons tự lo phạm vi: giáo viên chỉ
--                        thấy dòng của chính mình.
--
-- VÌ SAO v_tai_chinh_thang PHẢI CHẶN CỨNG BẰNG is_founder()
--   View dùng security_invoker. Nếu giáo viên truy vấn, họ đọc được lương của
--   chính mình nhưng thu và chi đều bằng 0 (RLS chặn payments/expenses), ra một
--   con số "còn lại" âm vô nghĩa. Chặn ở mệnh đề WHERE để họ nhận đúng 0 dòng.
--
-- HAI CỘT MỚI TRÊN teachers
--   ended_date, end_reason — hiện chỉ có status active/archived, không biết
--   nghỉ từ khi nào và vì sao. Dữ liệu buổi dạy và lương của người đã nghỉ vẫn
--   giữ nguyên (khoá ngoại không xoá), nên đây chỉ bổ sung ngữ cảnh.
-- =============================================================================

alter table public.teachers add column if not exists ended_date  date;
alter table public.teachers add column if not exists end_reason  text;

comment on column public.teachers.ended_date  is
  'Ngày làm việc cuối cùng. NULL = đang cộng tác. Không ảnh hưởng lịch sử buổi dạy.';
comment on column public.teachers.end_reason  is
  'Lý do ngừng cộng tác, ghi tự do. Chỉ Founder đọc được qua RLS của bảng teachers.';

-- Chỉ ràng buộc khi cả hai cùng có giá trị; không ép người nhập phải điền đủ.
alter table public.teachers drop constraint if exists chk_teachers_ended_sau_hired;
alter table public.teachers add  constraint chk_teachers_ended_sau_hired
  check (ended_date is null or hired_date is null or ended_date >= hired_date);

-- -----------------------------------------------------------------------------
-- Lương từng giáo viên theo tháng — nguồn là buổi đã trả, không phải kỳ lương
-- -----------------------------------------------------------------------------
drop view if exists public.v_luong_gv_thang;
create view public.v_luong_gv_thang
with (security_invoker = on) as
select
  date_trunc('month', pl.lesson_date)::date          as thang,
  to_char(pl.lesson_date, 'YYYY')                    as nam,
  pl.teacher_id,
  t.full_name                                        as ten_giao_vien,
  t.status::text                                     as trang_thai_gv,
  pl.currency                                        as tien_te,
  count(*)                                           as so_buoi,
  sum(pl.duration_minutes)                           as so_phut,
  sum(pl.amount)                                     as tien,
  count(*) filter (where pl.status = 'paid')         as buoi_da_tra,
  count(*) filter (where pl.status <> 'paid')        as buoi_chua_tra,
  sum(pl.amount) filter (where pl.status <> 'paid')  as tien_chua_tra,
  count(*) filter (where pl.has_video)               as buoi_co_video,
  round(avg(pl.qc_score) filter (where pl.qc_score is not null), 1) as diem_qc
from public.teacher_payable_lessons pl
join public.teachers t on t.id = pl.teacher_id
group by 1, 2, 3, 4, 5, 6;

comment on view public.v_luong_gv_thang is
  'Lương theo giáo viên × tháng, tính từ buổi đã sinh công. Gom theo currency nên không cộng nhầm hai loại tiền. Giáo viên chỉ thấy dòng của mình (RLS bảng gốc).';

-- -----------------------------------------------------------------------------
-- Bức tranh tài chính từng tháng — CHỈ Founder
-- -----------------------------------------------------------------------------
drop view if exists public.v_tai_chinh_thang;
create view public.v_tai_chinh_thang
with (security_invoker = on) as
with cac_thang as (
  select distinct date_trunc('month', payment_date)::date as thang
    from public.payments where status = 'confirmed'
  union
  select distinct date_trunc('month', lesson_date)::date
    from public.teacher_payable_lessons
  union
  select distinct date_trunc('month', expense_date)::date
    from public.expenses
  union
  select distinct date_trunc('month', lesson_date)::date
    from public.lessons
)
select
  m.thang,
  to_char(m.thang, 'YYYY') as nam,

  -- Tiền. Chỉ cộng VND; dòng ngoại tệ đếm riêng để không cộng nhầm tỷ giá.
  coalesce((select sum(p.amount) from public.payments p
             where p.status = 'confirmed' and p.currency = 'VND'
               and date_trunc('month', p.payment_date) = m.thang), 0) as thu,
  coalesce((select sum(pl.amount) from public.teacher_payable_lessons pl
             where pl.currency = 'VND'
               and date_trunc('month', pl.lesson_date) = m.thang), 0) as luong_gv,
  coalesce((select sum(e.amount) from public.expenses e
             where e.currency = 'VND'
               and date_trunc('month', e.expense_date) = m.thang), 0) as chi_khac,
  (select count(*) from public.payments p
     where p.status = 'confirmed' and p.currency <> 'VND'
       and date_trunc('month', p.payment_date) = m.thang)
  + (select count(*) from public.expenses e
     where e.currency <> 'VND'
       and date_trunc('month', e.expense_date) = m.thang) as dong_ngoai_te,

  -- Vận hành.
  (select count(*) from public.lessons l
     where l.status = 'completed'
       and date_trunc('month', l.lesson_date) = m.thang) as buoi_day,
  (select count(*) from public.lessons l
     where l.status = 'cancelled'
       and date_trunc('month', l.lesson_date) = m.thang) as buoi_huy,
  (select count(distinct l.class_id) from public.lessons l
     where l.status = 'completed'
       and date_trunc('month', l.lesson_date) = m.thang) as so_lop,
  (select count(distinct l.teacher_id) from public.lessons l
     where l.status = 'completed'
       and date_trunc('month', l.lesson_date) = m.thang) as so_giao_vien,
  (select count(distinct a.student_id) from public.attendance a
     join public.lessons l on l.id = a.lesson_id
     where l.status = 'completed'
       and date_trunc('month', l.lesson_date) = m.thang) as so_hoc_vien,

  -- Chất lượng. Chỉ hai chỉ số có dữ liệu thật; has_evidence và sent_to_parent
  -- hiện chưa bao giờ được ghi nên KHÔNG đưa vào, tránh hiện 0% sai lệch.
  (select count(*) from public.teacher_payable_lessons pl
     where pl.has_video and date_trunc('month', pl.lesson_date) = m.thang) as buoi_co_video,
  (select count(*) from public.teacher_payable_lessons pl
     where date_trunc('month', pl.lesson_date) = m.thang) as buoi_tinh_luong,
  (select round(avg(pl.qc_score), 1) from public.teacher_payable_lessons pl
     where pl.qc_score is not null
       and date_trunc('month', pl.lesson_date) = m.thang) as diem_qc
from cac_thang m
where public.is_founder();

comment on view public.v_tai_chinh_thang is
  'Thu - lương - chi khác theo từng tháng, kèm chỉ số vận hành. Chặn cứng bằng is_founder() trong WHERE: giáo viên truy vấn sẽ nhận 0 dòng thay vì số liệu một nửa.';
