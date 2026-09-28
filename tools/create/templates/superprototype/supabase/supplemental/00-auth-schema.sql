-- Auth schema bootstrap and session variable helper
--
-- This file must sort FIRST among all supplemental files (filename prefix 00-).
-- It creates the auth schema namespace (used by Auth.js in Native; present but
-- largely managed by Supabase in SuperPrototype), and defines the STABLE helper
-- function that every RLS policy uses to read the current user's domain principal
-- id from the transaction-local session config.
--
-- WHY STABLE: Postgres evaluates STABLE functions once per transaction rather than
-- once per row. Without STABLE the planner re-executes current_user_id() for every
-- row scanned, turning a cheap config lookup into a per-row cost. VOLATILE (the
-- default) is incorrect here and must not be used.

create schema if not exists auth;

-- ── Session variable helper ───────────────────────────────────────────────────

create or replace function public.current_user_id()
returns bigint
language sql
stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::bigint;
$$;

-- Grant execute to the roles used by application connections.
-- 'authenticated' is the Supabase role for logged-in PostgREST requests.
-- 'anon' does not call this function (policies that invoke it are restricted to
-- 'authenticated'), but granting here is harmless and avoids confusion if the
-- role set changes.
grant execute on function public.current_user_id() to authenticated, anon;
