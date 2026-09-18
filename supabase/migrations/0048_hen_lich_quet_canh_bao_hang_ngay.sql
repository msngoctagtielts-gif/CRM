-- 0048 — Quét cảnh báo hằng ngày, chạy THẲNG TRONG DATABASE bằng pg_cron.
--
-- VÌ SAO KHÔNG DÙNG /api/cron/scan-reports
--   Endpoint đó đã có sẵn nhưng đòi CRON_SECRET và SUPABASE_SERVICE_ROLE_KEY trên
--   Netlify — cả hai chưa bao giờ được cấu hình. Kết quả: hệ cảnh báo xây xong từ
--   lâu nhưng CHƯA TỪNG CHẠY MỘT LẦN NÀO (bảng notifications rỗng cho tới
--   18/09/2026). Cùng lý do và cùng cách xử lý như bản sao lưu hằng tuần
--   (migration 0035): chạy trong Postgres thì không cần khoá bí mật nào.
--
-- Endpoint HTTP vẫn giữ lại để bấm quét tay từ màn hình /alerts khi cần.

create or replace function public.fn_quet_canh_bao()
returns jsonb
language plpgsql security definer set search_path to 'public', 'pg_temp'
as $function$
declare
  v_qua_han   int;
  v_thieu_gio int;
  v_so_du     int;
  v_chua_gui  int;
begin
  select count(*) into v_qua_han from public.fn_scan_overdue_reports();
  v_thieu_gio := public.fn_alert_missing_lesson_time();
  v_so_du     := public.fn_alert_lesson_balance();
  v_chua_gui  := public.fn_alert_not_sent_to_parent();

  return jsonb_build_object(
    'quet_luc',           now(),
    'bao_cao_qua_han',    v_qua_han,
    'buoi_thieu_gio',     v_thieu_gio,
    'so_du_buoi',         v_so_du,
    'chua_gui_phu_huynh', v_chua_gui);
end;
$function$;

comment on function public.fn_quet_canh_bao() is
  'Chay ca bon phep quet canh bao. Duoc pg_cron goi hang ngay 07:00 gio Viet Nam.';

-- KHÔNG cấp quyền cho authenticated: hàm này ghi vào notifications và chỉ dành
-- cho lịch tự động. Founder bấm quét tay thì đi qua /alerts như cũ.
revoke all on function public.fn_quet_canh_bao() from public, authenticated, anon;

-- 00:00 UTC = 07:00 giờ Việt Nam, mỗi ngày. Đặt sau khi trung tâm đã dạy xong
-- ngày hôm trước và trước khi cô Ngọc bắt đầu ngày làm việc.
select cron.unschedule('quet_canh_bao_hang_ngay')
 where exists (select 1 from cron.job where jobname = 'quet_canh_bao_hang_ngay');

select cron.schedule('quet_canh_bao_hang_ngay', '0 0 * * *',
                     $$ select public.fn_quet_canh_bao(); $$);
