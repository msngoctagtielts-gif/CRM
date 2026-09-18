-- 0047 — Cảnh báo số dư buổi phải đo theo TIỀN ĐÃ ĐÓNG, không theo lessons_purchased.
--
-- LỖI CỦA BẢN CŨ
--   Hàm đọc v_enrollment_balances.lessons_remaining = lessons_purchased − đã học.
--   Nhưng các gia đình đóng bù theo đợt KHÔNG được cộng thêm vào lessons_purchased
--   — hợp đồng vẫn ghi 10 hoặc 20 buổi trong khi họ đã đóng tiền cho 46, 57 buổi.
--
--   Đo được ngày 18/09/2026, ngay sau khi ghi bốn khoản thu thật:
--
--     Học viên    bản cũ   bản mới   sự thật
--     Luân         −36      +0,15    đã đóng đủ
--     Tân          −47      +0,19    đã đóng đủ
--     Toàn          −4       0,00    đã đóng đủ (vừa bù 1.000.000 đ)
--     Ms. Linh      +6       0,00    đã đóng đúng 4 buổi đã học
--     Vy            +3      −7,00    ĐÃ HỌC 7 BUỔI, CHƯA ĐÓNG ĐỒNG NÀO
--     Nhi           +5      −5,00    ĐÃ HỌC 5 BUỔI, CHƯA ĐÓNG ĐỒNG NÀO
--     Kiên          +9      −1,00    ĐÃ HỌC 1 BUỔI, CHƯA ĐÓNG ĐỒNG NÀO
--
--   Bản cũ sai cả hai chiều: vừa kêu oan bốn người đã trả đủ, vừa GIẤU ba người
--   học mà chưa trả — tổng 3.510.000 đ chưa thu.
--
-- CÁCH ĐO MỚI
--   buổi đã trả tiền = tiền đã thu ÷ đơn giá
--   còn lại          = buổi đã trả tiền − buổi đã học
--
--   Dùng được cho cả gói mua trước lẫn đóng bù theo đợt, vì nó chỉ nhìn tiền
--   thật vào và buổi thật ra.
--
--   Ngưỡng âm đặt ở −0,5 buổi chứ không phải 0: các đợt cũ tính 220.000 đ trong
--   khi hợp đồng ghi 219.000 đ, để lại sai số làm tròn vài phần trăm buổi —
--   đó là làm tròn, không phải nợ.

create or replace function public.fn_alert_lesson_balance()
returns integer
language plpgsql security definer set search_path to 'public'
as $function$
declare
  rec      record;
  v_n      int := 0;
  v_thresh int := public.setting_int('alert_lessons_remaining', 2);
begin
  for rec in
    select e.id as enrollment_id, e.student_id, s.full_name, e.price_per_lesson,
           coalesce((select sum(c.lessons_deducted) from public.lesson_consumptions c
                      where c.enrollment_id = e.id), 0) as da_hoc,
           coalesce((select sum(p.amount) from public.payments p
                      where p.enrollment_id = e.id and p.status = 'confirmed'), 0) as da_dong
      from public.student_enrollments e
      join public.students s on s.id = e.student_id
     where e.status = 'active'
       and e.billing_mode = 'prepaid_package'
       and e.price_per_lesson > 0
  loop
    declare
      v_con_lai   numeric := round(rec.da_dong / rec.price_per_lesson - rec.da_hoc, 2);
      v_con_thieu numeric := round(rec.da_hoc * rec.price_per_lesson - rec.da_dong);
      v_am        boolean;
    begin
      if v_con_lai > v_thresh then
        continue;
      end if;
      v_am := v_con_lai <= -0.5;

      insert into public.notifications (
        type, severity, title, body, entity_type, entity_id, target_role, payload)
      values (
        case when v_am then 'lessons_overdrawn' else 'lessons_running_low' end,
        (case when v_am then 'critical' else 'warning' end)::notification_severity,
        case when v_am
             then 'KHẨN — ĐÃ HỌC VƯỢT SỐ TIỀN ĐÃ ĐÓNG'
             else 'SẮP HẾT BUỔI — CẦN NHẮC ĐÓNG HỌC PHÍ' end,
        format(
          E'Học viên: %s\nĐã học: %s buổi · Đã đóng đủ cho: %s buổi\nCòn lại: %s buổi\nCần thu thêm: %s ₫',
          rec.full_name,
          trim(to_char(rec.da_hoc, 'FM999990.99')),
          trim(to_char(round(rec.da_dong / rec.price_per_lesson, 2), 'FM999990.99')),
          trim(to_char(v_con_lai, 'FM999990.99')),
          trim(to_char(greatest(v_con_thieu, 0), 'FM999,999,999,999'))),
        'enrollment', rec.enrollment_id, 'founder',
        jsonb_build_object(
          'student_id', rec.student_id, 'student_name', rec.full_name,
          'da_hoc', rec.da_hoc, 'da_dong', rec.da_dong,
          'con_lai_buoi', v_con_lai, 'con_thieu_tien', greatest(v_con_thieu, 0)))
      on conflict (type, entity_type, entity_id)
        where status in ('new','acknowledged')
        do update set body = excluded.body, payload = excluded.payload, updated_at = now();
      v_n := v_n + 1;
    end;
  end loop;
  return v_n;
end;
$function$;
