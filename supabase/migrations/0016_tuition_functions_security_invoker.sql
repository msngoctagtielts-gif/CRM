-- =============================================================================
-- 0016_tuition_functions_security_invoker.sql
--
-- Vá tiếp lỗ hổng còn lại sau 0015.
--
-- Sau khi thu hồi quyền của `anon`, Advisor còn báo 13 hàm mà người ĐÃ ĐĂNG NHẬP
-- gọi được. Rà từng hàm thì 11 hàm là an toàn:
--   · is_founder / is_teacher / is_staff / current_role_code / current_teacher_id
--     → chỉ trả về thông tin về CHÍNH người gọi
--   · teaches_class / teaches_student / teaches_lesson / student_in_lesson_class
--     → chỉ trả về boolean trong phạm vi của chính người gọi
--   · fn_build_payroll / fn_build_tuition_statement
--     → tự kiểm `is_founder()` ngay dòng đầu
--
-- Nhưng HAI hàm thì rò rỉ thật:
--   · fn_resolve_tuition_rate(enrollment, ngày) → trả về ĐƠN GIÁ HỌC PHÍ
--   · fn_enrollment_payer_name(enrollment)      → trả về TÊN NGƯỜI ĐÓNG TIỀN
--
-- Cả hai là SECURITY DEFINER nên khi giáo viên gọi thẳng qua
-- /rest/v1/rpc/... thì chúng BỎ QUA Row Level Security. Giáo viên chỉ cần dò
-- enrollment_id là đọc được học phí của học viên — đúng thứ mà toàn bộ thiết kế
-- RLS đang cố giấu đi.
--
-- Cách vá: chuyển sang SECURITY INVOKER.
--   · Gọi từ view v_enrollment_balances  → chạy bằng quyền người xem, nên giáo
--     viên nhận NULL còn Founder vẫn thấy đủ. View vốn đã trả 0 dòng cho giáo
--     viên nên không mất gì.
--   · Gọi từ trong fn_consume_lesson (SECURITY DEFINER) → vẫn chạy bằng quyền
--     của hàm bao ngoài, nên việc ghi nhận doanh thu không bị ảnh hưởng.
-- =============================================================================

create or replace function public.fn_resolve_tuition_rate(
  p_enrollment_id uuid,
  p_on_date date default current_date
)
returns numeric
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce(
    (select r.price_per_lesson
       from public.tuition_rates r
      where r.enrollment_id = p_enrollment_id
        and r.effective_from <= p_on_date
        and (r.effective_to is null or r.effective_to >= p_on_date)
      order by r.effective_from desc
      limit 1),
    (select e.price_per_lesson
       from public.student_enrollments e
      where e.id = p_enrollment_id)
  );
$$;

comment on function public.fn_resolve_tuition_rate(uuid, date) is
  'SECURITY INVOKER có chủ đích: học phí phải chịu RLS. Giáo viên gọi hàm này sẽ nhận NULL.';

create or replace function public.fn_enrollment_payer_name(p_enrollment_id uuid)
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce(
    (select p.full_name from public.parents p
      join public.student_enrollments e on e.payer_parent_id = p.id
     where e.id = p_enrollment_id),
    (select s.full_name from public.students s
      join public.student_enrollments e on e.payer_student_id = s.id
     where e.id = p_enrollment_id),
    (select s.full_name from public.students s
      join public.student_enrollments e on e.student_id = s.id
     where e.id = p_enrollment_id)
  );
$$;

comment on function public.fn_enrollment_payer_name(uuid) is
  'SECURITY INVOKER có chủ đích: tên người đóng học phí phải chịu RLS (D14).';

grant execute on function public.fn_resolve_tuition_rate(uuid, date) to authenticated;
grant execute on function public.fn_enrollment_payer_name(uuid) to authenticated;
