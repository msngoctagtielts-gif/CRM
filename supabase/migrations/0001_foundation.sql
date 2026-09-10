-- =============================================================================
-- 0001_foundation.sql
-- MNEE Management System - extensions, enums, shared helpers
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- -----------------------------------------------------------------------------
-- Enums (stable business vocabularies)
-- -----------------------------------------------------------------------------
do $$ begin
  create type student_status as enum
    ('lead','placement','trial','active','paused','completed','inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type class_type as enum ('one_to_one','one_to_two','small_group');
exception when duplicate_object then null; end $$;

do $$ begin
  create type class_status as enum ('draft','active','paused','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lesson_status as enum
    ('scheduled','in_progress','completed','cancelled','no_show','rescheduled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum
    ('present','late','absent_excused','absent_unexcused','no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum
    ('draft','submitted','incomplete','needs_review','approved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enrollment_status as enum
    ('draft','active','paused','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('cash','bank_transfer','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending','confirmed','refunded','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type expense_category as enum
    ('teacher_salary','software','marketing','advertising',
     'equipment','office','training','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payroll_status as enum ('draft','pending_review','approved','paid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payable_status as enum ('pending','included','excluded','paid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_status as enum
    ('new','contacted','consultation','placement_test','trial',
     'follow_up','enrolled','lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type record_status as enum ('active','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_severity as enum ('info','warning','critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_status as enum ('new','acknowledged','resolved','dismissed');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Centre-wide settings (single row keyed by text)
-- -----------------------------------------------------------------------------
create table if not exists public.settings (
  key          text primary key,
  value        jsonb not null,
  description  text,
  updated_at   timestamptz not null default now(),
  updated_by   uuid
);

comment on table public.settings is
  'Cấu hình vận hành của trung tâm. Không chứa bí mật (secret nằm ở biến môi trường).';

create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.tg_set_updated_at();

insert into public.settings (key, value, description) values
  ('report_deadline_hours', '10'::jsonb,
   'Số giờ kể từ khi kết thúc buổi học mà giáo viên phải nộp đủ báo cáo'),
  ('timezone', '"Asia/Ho_Chi_Minh"'::jsonb, 'Múi giờ vận hành'),
  ('currency', '"VND"'::jsonb, 'Đơn vị tiền tệ'),
  ('default_lesson_duration_minutes', '60'::jsonb, 'Thời lượng buổi học mặc định'),
  ('centre_name', '"Ms.Ngọc Elite English"'::jsonb, 'Tên trung tâm')
on conflict (key) do nothing;

create or replace function public.setting_int(p_key text, p_default int)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select (value #>> '{}')::int from public.settings where key = p_key), p_default);
$$;

-- -----------------------------------------------------------------------------
-- Audit log (who changed what) - powers "Founder approves corrections"
-- -----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  table_name  text not null,
  record_id   uuid,
  action      text not null check (action in ('INSERT','UPDATE','DELETE')),
  actor_id    uuid,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_logs_record on public.audit_logs (table_name, record_id);
create index if not exists idx_audit_logs_created on public.audit_logs (created_at desc);

create or replace function public.tg_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if tg_op = 'DELETE' then
    insert into public.audit_logs (table_name, record_id, action, actor_id, old_data)
    values (tg_table_name, old.id, tg_op, v_actor, to_jsonb(old));
    return old;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs (table_name, record_id, action, actor_id, old_data, new_data)
    values (tg_table_name, new.id, tg_op, v_actor, to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into public.audit_logs (table_name, record_id, action, actor_id, new_data)
    values (tg_table_name, new.id, tg_op, v_actor, to_jsonb(new));
    return new;
  end if;
end;
$$;
