-- =============================================================================
-- 00_supabase_shim.sql  (TEST ONLY — never applied to a Supabase project)
--
-- Recreates the small part of the Supabase platform that our migrations depend
-- on (auth schema, auth.users, auth.uid(), the anon/authenticated roles) so the
-- migrations can be applied to a plain PostgreSQL cluster in CI.
-- =============================================================================

create schema if not exists auth;

create table if not exists auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text unique,
  encrypted_password  text,
  raw_user_meta_data  jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- In Supabase auth.uid() reads the JWT. In tests we also honour a session GUC
-- so a test can "become" a user with: set local test.user_id = '<uuid>';
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('test.user_id', true), '')::uuid,
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  );
$$;

do $$ begin create role anon nologin;          exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;

grant usage on schema auth to authenticated, anon;
grant select on auth.users to authenticated;

-- -----------------------------------------------------------------------------
-- pg_cron — Supabase có sẵn extension này, cluster tạm thì không.
--
-- Migration 0035 và 0048 gọi `cron.schedule(...)` để hẹn lịch sao lưu hằng tuần
-- và quét cảnh báo hằng ngày. Không có lớp giả lập này thì toàn bộ bộ kiểm thử
-- dừng ở 0035 — và nó ĐÃ dừng như vậy kể từ khi 0035 được thêm vào.
--
-- Giả lập chỉ ghi lại lời hẹn vào một bảng, không thật sự chạy gì. Đủ để
-- migration đi qua và để kiểm thử xác nhận lịch đã được đăng ký đúng tên.
-- run-local.sh chịu trách nhiệm vô hiệu hoá dòng `create extension pg_cron`.
-- -----------------------------------------------------------------------------
create schema if not exists cron;

create table if not exists cron.job (
  jobid    bigserial primary key,
  jobname  text unique,
  schedule text,
  command  text
);

create or replace function cron.schedule(job_name text, schedule text, command text)
returns bigint language sql as $$
  insert into cron.job (jobname, schedule, command)
  values (job_name, schedule, command)
  on conflict (jobname) do update
    set schedule = excluded.schedule, command = excluded.command
  returning jobid;
$$;

create or replace function cron.unschedule(job_name text)
returns boolean language sql as $$
  delete from cron.job where jobname = job_name;
  select true;
$$;
