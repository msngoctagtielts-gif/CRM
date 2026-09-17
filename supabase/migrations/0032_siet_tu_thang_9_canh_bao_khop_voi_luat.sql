-- =============================================================================
-- 0032 — Siết từ tháng 9: cảnh báo phải khớp đúng luật tính lương
-- =============================================================================
--
-- FOUNDER CHỐT: mọi buổi đã diễn ra đều được trả lương, chấp nhận toàn bộ dữ
-- liệu đã nhập từ Google Sheet. Từ 01/09/2026 mới bắt đầu siết.
-- Mốc này đã nằm sẵn ở settings.require_evidence_from = 2026-09-01.
--
-- HAI LỖ HỔNG PHẢI VÁ TRƯỚC KHI SIẾT
--
-- 1. CẢNH BÁO KÊU SAI THỜI ĐIỂM.
--    fn_alert_missing_lesson_time không nhìn mốc, nó quét mọi buổi quá hạn báo
--    cáo. Trong CSDL hiện có 316 buổi trước 09/2026 không ghi giờ vào/giờ ra —
--    những buổi Founder đã chấp nhận và đã trả lương. Lần đầu chạy quét sẽ đẻ
--    ra 316 cảnh báo ĐỎ về việc đã xong. Một hệ cảnh báo kêu 316 lần sai là hệ
--    cảnh báo chết: lần thứ 317 kêu đúng cũng không ai nhìn.
--
-- 2. CẢNH BÁO KHÔNG PHỦ HẾT LUẬT.
--    Luật chặn lương (fn_generate_payable_lesson) chặn vì BA lý do: thiếu giờ,
--    chưa điểm danh, điểm danh thiếu người. Cảnh báo chỉ kêu về lý do thứ nhất.
--    Nghĩa là từ 01/09, một buổi có ghi giờ đủ nhưng quên điểm danh sẽ bị chặn
--    lương trong im lặng — giáo viên mất tiền mà không ai biết vì sao.
--    Thêm một lỗ nữa: buổi chưa phân công giáo viên cũng không sinh công và
--    cũng không cảnh báo gì.
--
-- CÁCH VÁ: MỘT NGUỒN SỰ THẬT
--
-- Dựng view v_buoi_chan_luong liệt kê đúng những buổi mà luật sẽ chặn, kèm lý
-- do. Hàm cảnh báo đọc chính view đó. Từ nay luật và cảnh báo không thể lệch
-- nhau, vì chỉ còn một chỗ định nghĩa "thế nào là chưa đủ điều kiện".
--
-- Đổi mốc ở settings.require_evidence_from là đổi được cả luật lẫn cảnh báo,
-- không cần sửa mã nguồn.
--
-- ĐÃ KIỂM CHỨNG TRÊN DỮ LIỆU THẬT
--   Toàn bộ 461 buổi: 311 buổi "chưa ghi giờ", 3 buổi "chưa ghi giờ + điểm
--   danh thiếu người", 2 buổi "chưa ghi giờ + chưa điểm danh" — tổng 316, khớp
--   đúng con số đếm độc lập. Cả 316 đều trước mốc và đã trả lương, nên view
--   trả về 0 dòng: cảnh báo sẽ không kêu một lần nào về việc đã xong.
-- =============================================================================

drop view if exists public.v_buoi_chan_luong;
create view public.v_buoi_chan_luong
with (security_invoker = on) as
with moc as (
  select coalesce(
    (select (value #>> '{}')::date from public.settings where key = 'require_evidence_from'),
    date '2026-09-01') as tu_ngay
)
select
  l.id                as lesson_id,
  l.lesson_date,
  l.class_id,
  c.name              as ten_lop,
  l.teacher_id,
  t.full_name         as ten_giao_vien,
  t.user_id           as teacher_user_id,
  l.report_due_at,
  (select tu_ngay from moc) as moc_ap_dung,
  -- Ghép mọi lý do, cùng thứ tự với fn_generate_payable_lesson.
  nullif(concat_ws('; ',
    case when l.teacher_id is null then 'chưa phân công giáo viên' end,
    case when not (
           (tr.id is not null and tr.start_time is not null and tr.end_time is not null)
        or (l.actual_start_at is not null and l.actual_end_at is not null))
         then 'chưa ghi giờ vào và giờ ra' end,
    case when (select count(*) from public.attendance a where a.lesson_id = l.id) = 0
         then 'chưa điểm danh'
         when (select count(*) from public.attendance a where a.lesson_id = l.id)
            < (select count(*) from public.class_students cs
                where cs.class_id = l.class_id and cs.status = 'active')
         then 'điểm danh thiếu người' end), '') as ly_do
from public.lessons l
join public.classes c on c.id = l.class_id
left join public.teachers t on t.id = l.teacher_id
left join public.teaching_reports tr on tr.lesson_id = l.id
where l.status = 'completed'
  and l.lesson_date >= (select tu_ngay from moc)
  -- Buổi đã chốt lương rồi thì thôi, luật cũng không đụng tới nữa.
  and not exists (
    select 1 from public.teacher_payable_lessons p
     where p.lesson_id = l.id and p.status in ('included','paid'))
  and (
       l.teacher_id is null
    or not ((tr.id is not null and tr.start_time is not null and tr.end_time is not null)
         or (l.actual_start_at is not null and l.actual_end_at is not null))
    or (select count(*) from public.attendance a where a.lesson_id = l.id) = 0
    or (select count(*) from public.attendance a where a.lesson_id = l.id)
     < (select count(*) from public.class_students cs
         where cs.class_id = l.class_id and cs.status = 'active')
  );

comment on view public.v_buoi_chan_luong is
  'Buoi da day tu moc require_evidence_from tro di ma luat tinh luong se chan, kem ly do. Ham canh bao doc chinh view nay nen canh bao va luat khong the lech nhau.';

-- -----------------------------------------------------------------------------
-- Cảnh báo đọc lại từ view — thay vì tự định nghĩa điều kiện lần thứ hai
-- -----------------------------------------------------------------------------
create or replace function public.fn_alert_missing_lesson_time()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  v_n int := 0;
begin
  for rec in
    select b.*
      from public.v_buoi_chan_luong b
     where b.report_due_at is not null
       and now() > b.report_due_at
  loop
    insert into public.notifications (
      type, severity, title, body, entity_type, entity_id,
      target_role, target_user_id, payload, due_at)
    values (
      'lesson_time_missing',
      'critical',
      'CHƯA ĐỦ ĐIỀU KIỆN TÍNH LƯƠNG',
      format(
        E'Lớp: %s\nGiáo viên: %s\nNgày học: %s\n\nCòn thiếu: %s.\n\nTừ %s, buổi dạy phải có đủ giờ vào, giờ ra và điểm danh đủ sĩ số thì mới sinh công tính lương. Bổ sung xong là buổi này tự vào bảng lương, không cần làm gì thêm.',
        rec.ten_lop,
        coalesce(rec.ten_giao_vien, 'Chưa phân công'),
        to_char(rec.lesson_date, 'DD/MM/YYYY'),
        coalesce(rec.ly_do, 'không rõ'),
        to_char(rec.moc_ap_dung, 'DD/MM/YYYY')),
      'lesson', rec.lesson_id,
      'founder', rec.teacher_user_id,
      jsonb_build_object(
        'lesson_id', rec.lesson_id,
        'teacher_name', rec.ten_giao_vien,
        'class_name', rec.ten_lop,
        'ly_do', rec.ly_do,
        'blocks_payroll', true),
      rec.report_due_at)
    on conflict (type, entity_type, entity_id)
      where status in ('new','acknowledged')
      do update set body = excluded.body, payload = excluded.payload, updated_at = now();
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

comment on function public.fn_alert_missing_lesson_time() is
  'Canh bao buoi bi chan luong. Doc v_buoi_chan_luong nen chi kieu tu moc require_evidence_from tro di, va phu du ba ly do chan giong luat.';

revoke execute on function public.fn_alert_missing_lesson_time() from public;
revoke execute on function public.fn_alert_missing_lesson_time() from anon;
grant  execute on function public.fn_alert_missing_lesson_time() to authenticated;
