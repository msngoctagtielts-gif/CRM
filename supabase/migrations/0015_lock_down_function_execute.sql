-- =============================================================================
-- 0015_lock_down_function_execute.sql
--
-- VÁ LỖI BẢO MẬT phát hiện bởi Supabase Security Advisor ngày 10/09/2026.
--
-- Vấn đề: PostgreSQL mặc định cấp EXECUTE cho PUBLIC trên mọi hàm mới. Các
-- migration trước có `grant execute ... to authenticated` nhưng KHÔNG thu hồi
-- quyền mặc định của PUBLIC, nên vai trò `anon` — người CHƯA ĐĂNG NHẬP, dùng
-- khoá công khai vốn nằm sẵn trong trình duyệt — gọi được cả 39 hàm
-- SECURITY DEFINER qua /rest/v1/rpc/...
--
-- Mức độ nghiêm trọng thật sự:
--   · fn_resolve_teacher_rate   → đọc được ĐƠN GIÁ LƯƠNG của giáo viên
--   · fn_resolve_tuition_rate   → đọc được ĐƠN GIÁ HỌC PHÍ của học viên
--   · fn_enrollment_payer_name  → đọc được tên người đóng học phí
--   · fn_consume_lesson         → buộc ghi nhận doanh thu cho một buổi học
--   · fn_generate_payable_lesson, fn_recalc_payroll → can thiệp bảng lương
--   · fn_refresh_report_status, fn_score_report_qc  → đổi trạng thái báo cáo
--
-- Cách vá: thu hồi sạch, rồi cấp lại ĐÚNG những hàm cần thiết, cho ĐÚNG vai trò.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Thu hồi toàn bộ quyền thực thi mặc định
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from authenticated;

-- Hàm tạo về sau cũng không còn được cấp mặc định cho PUBLIC.
alter default privileges in schema public revoke execute on functions from public;

-- -----------------------------------------------------------------------------
-- 2. Cấp lại cho `authenticated` đúng những hàm BẮT BUỘC phải gọi được
--
--    (a) Hàm dùng trong biểu thức RLS — policy được tính bằng quyền của người
--        truy vấn, thiếu EXECUTE là không đọc được bảng nào cả.
--    (b) Hàm dùng trong view security_invoker — cùng lý do.
--    (c) Hàm ứng dụng gọi qua rpc() và tự kiểm quyền Founder bên trong.
-- -----------------------------------------------------------------------------

-- (a) dùng trong policy RLS
grant execute on function public.is_founder() to authenticated;
grant execute on function public.is_teacher() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.current_role_code() to authenticated;
grant execute on function public.current_teacher_id() to authenticated;
grant execute on function public.teaches_class(uuid) to authenticated;
grant execute on function public.teaches_student(uuid) to authenticated;
grant execute on function public.teaches_lesson(uuid) to authenticated;
grant execute on function public.student_in_lesson_class(uuid, uuid) to authenticated;

-- (b) dùng trong view
grant execute on function public.student_age(date) to authenticated;
grant execute on function public.fn_resolve_tuition_rate(uuid, date) to authenticated;
grant execute on function public.fn_enrollment_payer_name(uuid) to authenticated;

-- (c) ứng dụng gọi trực tiếp; cả hai đã tự kiểm `is_founder()` bên trong nên
--     phải chạy bằng quyền người dùng để kiểm tra đó có ý nghĩa.
grant execute on function public.fn_build_payroll(uuid, date, date) to authenticated;
grant execute on function public.fn_build_tuition_statement(uuid, date, date) to authenticated;

-- Hàm nhãn thuần, không đọc dữ liệu nào.
grant execute on function public.fn_missing_field_label(text) to authenticated;
grant execute on function public.fn_qc_criterion_label(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Hàm quét và sinh cảnh báo: CHỈ service role
--
-- Các hàm này không tự kiểm quyền bên trong, nên không cấp cho `authenticated`.
-- Nút "Quét lại ngay" của Founder đi qua server action (đã kiểm quyền ở tầng
-- ứng dụng) và dùng service role để gọi — xem src/app/(app)/alerts/actions.ts.
-- -----------------------------------------------------------------------------
grant execute on function public.fn_scan_overdue_reports() to service_role;
grant execute on function public.fn_alert_missing_lesson_time() to service_role;
grant execute on function public.fn_alert_lesson_balance() to service_role;
grant execute on function public.fn_alert_not_sent_to_parent() to service_role;

-- KHÔNG cấp lại cho bất kỳ vai trò nào — chỉ trigger hoặc hàm khác gọi tới:
--   · toàn bộ tg_*                → chạy trong ngữ cảnh trigger
--   · fn_consume_lesson           · fn_pick_enrollment
--   · fn_generate_payable_lesson  · fn_recalc_payroll
--   · fn_refresh_report_status    · fn_report_missing_fields
--   · fn_score_report_qc          · setting_int
--   · fn_resolve_teacher_rate     → ĐƠN GIÁ LƯƠNG, tuyệt đối không mở ra API

-- -----------------------------------------------------------------------------
-- 4. Cố định search_path cho 11 hàm còn thiếu
--
-- Hàm không cố định search_path có thể bị đánh lừa nếu kẻ tấn công tạo được đối
-- tượng trùng tên ở schema đứng trước trong đường dẫn tìm kiếm.
-- -----------------------------------------------------------------------------
alter function public.tg_set_updated_at()           set search_path = public, pg_temp;
alter function public.student_age(date)             set search_path = public, pg_temp;
alter function public.tg_assign_student_code()      set search_path = public, pg_temp;
alter function public.tg_assign_teacher_code()      set search_path = public, pg_temp;
alter function public.tg_assign_class_code()        set search_path = public, pg_temp;
alter function public.tg_attendance_defaults()      set search_path = public, pg_temp;
alter function public.tg_assign_enrollment_code()   set search_path = public, pg_temp;
alter function public.tg_assign_payment_code()      set search_path = public, pg_temp;
alter function public.tg_assign_lead_code()         set search_path = public, pg_temp;
alter function public.fn_missing_field_label(text)  set search_path = public, pg_temp;
alter function public.fn_qc_criterion_label(text)   set search_path = public, pg_temp;
