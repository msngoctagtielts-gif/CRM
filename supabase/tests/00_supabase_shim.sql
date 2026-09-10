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
