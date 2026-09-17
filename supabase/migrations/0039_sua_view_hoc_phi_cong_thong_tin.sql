-- =============================================================================
-- 0039 — v_portal_hoc_phi phải đọc thẳng bảng gốc
-- =============================================================================
--
-- LỖI PHÁT HIỆN KHI KIỂM THỬ BẰNG PHIÊN ĐĂNG NHẬP THẬT
--   Bản đầu của v_portal_hoc_phi đọc qua v_enrollment_balances. View đó khai
--   báo security_invoker = on nên chạy bằng quyền người gọi; khi phụ huynh truy
--   vấn, RLS của student_enrollments (chỉ Founder) chặn lại, kết quả là cổng
--   trả về 0 dòng học phí trong khi dữ liệu vẫn có.
--
--   Chỉ định nghĩa view rồi nhìn SQL thì không thấy. Phải giả lập đúng phiên
--   đăng nhập của vai người dùng mới lộ ra.
--
-- Tính lại ngay trong view này, không mượn view khác, để hàng rào lọc và nguồn
-- dữ liệu nằm cùng một chỗ.
-- =============================================================================

drop view if exists public.v_portal_hoc_phi;
create view public.v_portal_hoc_phi as
select
  e.student_id,
  e.enrollment_code,
  e.billing_mode::text as hinh_thuc,
  e.status::text       as trang_thai,
  e.start_date,
  e.price_per_lesson,
  e.lessons_purchased,
  coalesce((select sum(c.lessons_deducted) from public.lesson_consumptions c
             where c.enrollment_id = e.id), 0)                   as lessons_used,
  e.lessons_purchased
    - coalesce((select sum(c.lessons_deducted) from public.lesson_consumptions c
                 where c.enrollment_id = e.id), 0)               as lessons_remaining,
  e.net_amount         as tong_hoc_phi,
  coalesce((select sum(p.amount) from public.payments p
             where p.enrollment_id = e.id and p.status = 'confirmed'), 0) as da_dong,
  e.net_amount
    - coalesce((select sum(p.amount) from public.payments p
                 where p.enrollment_id = e.id and p.status = 'confirmed'), 0) as con_lai_phai_dong
from public.student_enrollments e
where e.student_id in (select public.fn_hoc_vien_cua_tai_khoan());

comment on view public.v_portal_hoc_phi is
  'Cong hoc vien: hoc phi cua chinh minh, tinh thang tu bang goc. Khong muon view khac de tranh bi RLS cua view do chan.';

revoke all on public.v_portal_hoc_phi from public, anon;
grant select on public.v_portal_hoc_phi to authenticated;
