-- 0018: Học phí tính theo thời lượng thực tế của buổi học.
--
-- QUY TẮC NGHIỆP VỤ (Founder chốt 14/09/2026):
--   Đơn giá chuẩn là buổi 60 PHÚT. Buổi dài hơn hay ngắn hơn thì quy đổi theo
--   tỉ lệ từ chính đơn giá gốc đó:
--     30 phút = 0,5 x giá gốc      90 phút = 1,5 x giá gốc
--
-- VÌ SAO PHẢI SỬA: fn_consume_lesson cũ ghi nhận doanh thu bằng đúng đơn giá,
-- bất kể buổi dài bao nhiêu:
--     lessons_deducted = 1;  recognized_amount = v_price;
-- Nên một buổi 90 phút bị tính bằng giá buổi 60 phút - thu thiếu một nửa tiếng.
-- Ngược lại buổi 30 phút bị tính đủ giá - thu thừa của phụ huynh.
--
-- BẰNG CHỨNG QUY TẮC NÀY ĐÃ ĐƯỢC ÁP DỤNG NGOÀI HỆ THỐNG:
--   - Bé Vũ Hoàng Phúc, buổi 30 phút ngày 07/06/2026 (lớp Ms. Phương): trung tâm
--     tính 95.000 d = 190.000 x 0,5. Ghi trong báo cáo học phí T6-T7/2026.
--   - Bảo Ngọc, 5 buổi 90 phút tháng 8/2026: thu 1.868.000 d, trong khi
--     249.000 x 1,5 x 5 = 1.867.500 d. Lệch 500 d do làm tròn lúc thu.
--
-- CÁCH SỬA: nhân cả số buổi trừ đi lẫn số tiền ghi nhận với (thời lượng / 60).
-- Đơn giá gốc vẫn lưu nguyên trong price_per_lesson để đối chiếu được, không
-- nhân sẵn vào đó - nhìn vào dòng dữ liệu vẫn biết giá chuẩn là bao nhiêu.
--
-- Buổi không ghi thời lượng thì coi là 60 phút, giống cách fn_generate_payable_lesson
-- đang làm, để hai bên tiền vào và tiền ra dùng chung một giả định.

create or replace function public.fn_consume_lesson(p_attendance_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  a           public.attendance;
  l           public.lessons;
  v_enroll_id uuid;
  v_price     numeric(14,2);
  v_duration  int;
  v_ratio     numeric(10,4);
begin
  select * into a from public.attendance where id = p_attendance_id;
  if not found then return; end if;

  select * into l from public.lessons where id = a.lesson_id;
  if not found then return; end if;

  if l.status <> 'completed' or not a.is_billable then
    delete from public.lesson_consumptions
     where lesson_id = a.lesson_id and student_id = a.student_id;
    return;
  end if;

  if exists (select 1 from public.lesson_consumptions
              where lesson_id = a.lesson_id and student_id = a.student_id) then
    return;
  end if;

  v_enroll_id := public.fn_pick_enrollment(a.student_id, l.class_id);
  if v_enroll_id is null then
    return;
  end if;

  -- D11: đơn giá theo ngày buổi học diễn ra.
  v_price := public.fn_resolve_tuition_rate(v_enroll_id, l.lesson_date);

  -- Quy đổi theo thời lượng. Chuẩn là 60 phút.
  v_duration := coalesce(l.duration_minutes, 60);
  v_ratio    := v_duration::numeric / 60;

  insert into public.lesson_consumptions (
    enrollment_id, lesson_id, student_id, attendance_id,
    lessons_deducted, price_per_lesson, recognized_amount, recognized_at)
  values (
    v_enroll_id, a.lesson_id, a.student_id, a.id,
    v_ratio,
    coalesce(v_price, 0),
    round(coalesce(v_price, 0) * v_ratio),
    coalesce(l.actual_end_at, l.scheduled_end_at))
  on conflict (enrollment_id, lesson_id, student_id) do nothing;
end;
$$;

comment on function public.fn_consume_lesson(uuid) is
  'Ghi nhận doanh thu cho một lượt điểm danh. Học phí quy đổi theo thời lượng '
  'buổi học, lấy buổi 60 phút làm chuẩn (Founder chốt 14/09/2026).';
