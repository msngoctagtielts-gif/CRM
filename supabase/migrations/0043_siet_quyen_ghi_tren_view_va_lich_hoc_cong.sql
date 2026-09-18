-- 0043 — Siết quyền ghi trên view, và thêm lịch học sắp tới cho cổng.
--
-- LỖ HỔNG ĐÃ KHAI THÁC ĐƯỢC (18/09/2026)
--   Supabase mặc định chạy `grant all on all tables in schema public to
--   authenticated`, và lệnh đó áp cho CẢ VIEW. Trong 25 view của hệ thống có 4
--   view Postgres xếp loại tự động ghi được (auto-updatable):
--
--     v_portal_hoc_phi · v_ho_so_giao_vien · v_hoc_vien_tam_ngung · v_quality_alerts
--
--   View chạy với quyền chủ sở hữu (postgres) chứ không phải quyền người gọi,
--   nên ghi qua view là ĐI VÒNG QUA RLS của bảng gốc.
--
--   Đã thử thật với phiên đăng nhập của phụ huynh lớp Tân/Luân:
--
--     update v_portal_hoc_phi set price_per_lesson = 1;
--
--   Lệnh chạy lọt. Đơn giá hai hợp đồng HD260005 và HD260006 đổi từ 219.000 đ
--   xuống 1 đ. (Chạy trong transaction rồi rollback — dữ liệu thật không đổi.)
--
--   Cổng chưa bị lợi dụng chỉ vì Netlify đang chặn bằng SSO, không phải vì hệ
--   thống tự bảo vệ được.
--
-- CÁCH VÁ
--   View trong hệ này chỉ để ĐỌC. Mọi thao tác ghi đi qua bảng gốc (có RLS) hoặc
--   qua hàm security definer có kiểm tra quyền bên trong. Nên thu hồi toàn bộ
--   quyền ghi trên mọi view, giữ lại đúng SELECT.
--
--   Đã kiểm trước khi thu hồi: không một dòng mã nào trong src/ hay portal/src/
--   ghi qua view (grep .insert/.update/.delete/.upsert sau .from('v_...')).

do $$
declare
  v record;
begin
  for v in
    select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'v'
  loop
    execute format(
      'revoke insert, update, delete, truncate, references, trigger on public.%I from authenticated, anon',
      v.relname);
    execute format('grant select on public.%I to authenticated', v.relname);
  end loop;
end $$;

-- Lịch học sắp tới — phụ huynh hỏi nhiều nhất là "hôm nào con học".
--
-- Đọc từ class_schedules (lịch lặp hằng tuần) chứ KHÔNG từ bảng lessons. Lý do:
-- lessons chỉ có khi đã nhập buổi đã dạy, mà tháng 09/2026 hiện mới nhập 1 buổi
-- trong khi 17 lớp vẫn đang chạy — dựa vào lessons thì cổng sẽ báo "không có
-- buổi nào sắp tới" dù lớp vẫn học đều.
--
-- weekday theo quy ước Postgres: 0 = Chủ nhật.
-- Lọc cứng theo tài khoản đăng nhập, y như ba view cổng còn lại.
drop view if exists public.v_portal_lich_hoc;

create view public.v_portal_lich_hoc as
select
  cs.student_id,
  c.name                                   as ten_lop,
  t.full_name                              as giao_vien,
  s.weekday,
  s.start_time,
  s.duration_minutes,
  -- Nếu hôm nay đúng thứ đó nhưng giờ học đã qua thì đẩy sang tuần sau.
  case
    when k.cach_ngay = 0
     and s.start_time <= (now() at time zone 'Asia/Ho_Chi_Minh')::time
    then (current_date + 7)::date
    else (current_date + k.cach_ngay)::date
  end                                      as ngay_ke_tiep
from public.class_students cs
join public.classes c          on c.id = cs.class_id
join public.class_schedules s  on s.class_id = c.id
left join public.teachers t    on t.id = c.teacher_id
cross join lateral (
  select ((s.weekday - extract(dow from current_date)::int) + 7) % 7 as cach_ngay
) k
where cs.status = 'active'
  and c.status  = 'active'
  and s.status  = 'active'
  and (s.effective_from is null or s.effective_from <= current_date)
  and (s.effective_to   is null or s.effective_to   >= current_date)
  and cs.student_id in (select public.fn_hoc_vien_cua_tai_khoan());

comment on view public.v_portal_lich_hoc is
  'Buổi học kế tiếp của từng học viên, suy ra từ lịch lặp hằng tuần. Chỉ đọc; lọc cứng theo auth.uid().';

revoke all on public.v_portal_lich_hoc from authenticated, anon;
grant select on public.v_portal_lich_hoc to authenticated;
