-- =============================================================================
-- 0035 — Sao lưu dữ liệu tự động hàng tuần
-- =============================================================================
--
-- VÌ SAO CẦN
--   Tổ chức Supabase đang ở gói Free. Theo tài liệu chính thức của Supabase:
--   sao lưu tự động hằng ngày chỉ có từ gói Pro trở lên, và dự án gói Free bị
--   tạm dừng nếu 7 ngày ít hoạt động (có 90 ngày để khôi phục). Supabase
--   khuyến nghị dự án Free tự xuất dữ liệu định kỳ và giữ bản sao nơi khác.
--
-- VÌ SAO DÙNG pg_cron CHỨ KHÔNG DÙNG CRON CỦA NETLIFY
--   Hai endpoint cron sẵn có (/api/cron/*) đều cần SUPABASE_SERVICE_ROLE_KEY
--   và CRON_SECRET trên Netlify — hiện chưa cấu hình, nên chúng không chạy
--   được. pg_cron chạy thẳng trong Postgres: không cần khoá bí mật nào, không
--   phụ thuộc Netlify, và mỗi lần chạy cũng là một lần hoạt động cơ sở dữ liệu
--   nên giữ cho dự án Free không bị tạm dừng vì im lặng.
--
-- BẢN SAO NÀY CHỐNG ĐƯỢC GÌ VÀ KHÔNG CHỐNG ĐƯỢC GÌ
--   Chống được: xoá nhầm, nhập sai hàng loạt, migration hỏng dữ liệu.
--   KHÔNG chống được: mất cả dự án Supabase — vì bản sao nằm cùng chỗ với dữ
--   liệu gốc. Muốn chống rủi ro đó thì phải tải một bản về máy hoặc Drive.
--   Màn hình /sao-luu nói rõ điều này, không để người dùng yên tâm nhầm.
--
-- KHÔNG SAO LƯU HAI BẢNG
--   audit_logs    — là nhật ký, không phải dữ liệu nghiệp vụ, và phình nhanh.
--   notifications — sinh lại được bằng các hàm quét.
--   Vẫn đếm số dòng của chúng để biết hệ thống đang ở trạng thái nào.
--
-- ĐÃ ĐO TRÊN DỮ LIỆU THẬT
--   Bản đầu tiên: 2,71 MB cho 3.439 dòng (460 buổi học, 449 báo cáo, 460 dòng
--   lương, 22 học viên). Giữ 6 bản ≈ 16 MB, thoải mái trong hạn 500 MB gói Free.
-- =============================================================================

create extension if not exists pg_cron;

create table if not exists public.data_backups (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  loai              text not null default 'tu_dong'
                    check (loai in ('tu_dong', 'thu_cong')),
  du_lieu           jsonb not null,
  so_dong           jsonb not null,
  kich_thuoc_bytes  bigint not null,
  ghi_chu           text
);

comment on table public.data_backups is
  'Ban sao du lieu nghiep vu. Chi Founder doc duoc. Nam cung du an nen chong duoc xoa nham va migration hong, KHONG chong duoc mat ca du an.';

create index if not exists idx_data_backups_created on public.data_backups (created_at desc);

alter table public.data_backups enable row level security;

drop policy if exists backups_founder_all on public.data_backups;
create policy backups_founder_all on public.data_backups
  for all to authenticated
  using (public.is_founder()) with check (public.is_founder());

-- -----------------------------------------------------------------------------
-- Hàm lõi — KHÔNG cấp quyền cho authenticated. Chỉ pg_cron (chạy bằng postgres)
-- và service_role gọi được. Giáo viên không thể tự tạo bản sao.
-- -----------------------------------------------------------------------------
create or replace function public.fn_tao_ban_sao_luu(p_loai text default 'tu_dong')
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_bang text[] := array[
    'roles', 'users', 'settings', 'programs', 'levels',
    'teachers', 'teacher_rates', 'teacher_availability',
    'students', 'parents', 'student_parents', 'leads', 'lead_activities',
    'classes', 'class_schedules', 'class_students',
    'lessons', 'attendance', 'recordings', 'homework',
    'teaching_reports', 'teaching_report_students',
    'student_enrollments', 'tuition_packages', 'tuition_rates',
    'tuition_statements', 'payments', 'lesson_consumptions',
    'teacher_payable_lessons', 'teacher_payroll', 'teacher_payroll_adjustments',
    'expenses', 'documents', 'placement_tests', 'trial_classes'
  ];
  v_ten  text;
  v_data jsonb := '{}'::jsonb;
  v_dem  jsonb := '{}'::jsonb;
  v_rows jsonb;
  v_n    bigint;
  v_size bigint;
  v_id   uuid;
begin
  foreach v_ten in array v_bang loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb), count(*) from public.%I t',
      v_ten)
    into v_rows, v_n;
    v_data := v_data || jsonb_build_object(v_ten, v_rows);
    v_dem  := v_dem  || jsonb_build_object(v_ten, v_n);
  end loop;

  execute 'select count(*) from public.audit_logs'    into v_n;
  v_dem := v_dem || jsonb_build_object('audit_logs_khong_sao_luu', v_n);
  execute 'select count(*) from public.notifications' into v_n;
  v_dem := v_dem || jsonb_build_object('notifications_khong_sao_luu', v_n);

  v_size := pg_column_size(v_data);

  -- Chặn trước khi làm đầy dung lượng gói Free (500 MB).
  if v_size > 20 * 1024 * 1024 then
    insert into public.notifications (
      type, severity, title, body, entity_type, target_role)
    values (
      'backup_qua_lon', 'critical',
      'BẢN SAO LƯU QUÁ LỚN — ĐÃ DỪNG',
      format('Dữ liệu đã lên %s MB, vượt ngưỡng 20 MB nên không tạo bản sao trong cơ sở dữ liệu nữa. Cần chuyển sang xuất ra ngoài hoặc nâng gói.',
             round(v_size / 1048576.0, 1)),
      'system', 'founder')
    on conflict do nothing;
    return null;
  end if;

  insert into public.data_backups (loai, du_lieu, so_dong, kich_thuoc_bytes)
  values (p_loai, v_data, v_dem, v_size)
  returning id into v_id;

  -- Giữ 6 bản gần nhất: đủ nhìn lại một tháng rưỡi mà không phình dung lượng.
  delete from public.data_backups
   where id in (select id from public.data_backups order by created_at desc offset 6);

  return v_id;
end;
$$;

revoke execute on function public.fn_tao_ban_sao_luu(text) from public;
revoke execute on function public.fn_tao_ban_sao_luu(text) from anon;
revoke execute on function public.fn_tao_ban_sao_luu(text) from authenticated;
grant  execute on function public.fn_tao_ban_sao_luu(text) to service_role;

-- -----------------------------------------------------------------------------
-- Lớp vỏ cho nút "Tạo bản sao ngay" trên giao diện. Tự kiểm tra Founder bên
-- trong, nên dù có cấp cho authenticated thì giáo viên gọi cũng bị chặn.
-- -----------------------------------------------------------------------------
create or replace function public.fn_sao_luu_thu_cong()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_founder() then
    raise exception 'Chỉ Founder mới tạo được bản sao lưu.';
  end if;
  return public.fn_tao_ban_sao_luu('thu_cong');
end;
$$;

revoke execute on function public.fn_sao_luu_thu_cong() from public;
revoke execute on function public.fn_sao_luu_thu_cong() from anon;
grant  execute on function public.fn_sao_luu_thu_cong() to authenticated;

-- -----------------------------------------------------------------------------
-- Lịch chạy: 03:00 sáng Chủ nhật giờ Việt Nam = 20:00 thứ Bảy UTC.
-- pg_cron đọc giờ UTC nên phải quy đổi, không ghi 03:00 thẳng vào đây.
-- -----------------------------------------------------------------------------
select cron.unschedule('sao_luu_hang_tuan')
 where exists (select 1 from cron.job where jobname = 'sao_luu_hang_tuan');

select cron.schedule(
  'sao_luu_hang_tuan',
  '0 20 * * 6',
  $cron$ select public.fn_tao_ban_sao_luu('tu_dong'); $cron$
);
