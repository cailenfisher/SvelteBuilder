-- The smallest stand-in for the parts of a Supabase database that generated SQL
-- expects, so migrations and seeds can be applied to plain Postgres.
--
-- Everything here is Supabase's, not the scaffold's. If a check fails because of
-- something in this file, the fix belongs here — the schema under test is only
-- responsible for what it creates itself.

create schema if not exists auth;

-- The scaffold FKs user_account.auth_user_id to this.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- Supabase derives this from the verified request JWT. Reading a session setting
-- instead lets a check impersonate a principal with
-- `set local request.jwt.claim.sub = '<uuid>'`, which is what makes it possible to
-- assert that RLS refuses the right people.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

-- The roles PostgREST connects as.
do $$ begin create role anon nologin noinherit;
exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin noinherit;
exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin noinherit bypassrls;
exception when duplicate_object then null; end $$;

-- A Supabase project grants these at bootstrap, for existing objects and by default
-- for anything created later. Without it every direct table read fails with
-- "permission denied" before RLS is ever consulted — a property of this stub, not of
-- the schema, and a confusing one to debug from the error alone.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;
