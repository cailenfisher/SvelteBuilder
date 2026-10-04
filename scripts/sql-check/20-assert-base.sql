-- What must be true of any scaffold's database once its migration and seed have run.
--
-- Every check raises rather than returning a row, so `psql -v ON_ERROR_STOP=1` turns a
-- violated expectation into a non-zero exit. Read the raise message, not the line.

-- ── The i18n tables are populated and internally consistent ──────────────────

do $$
declare
  v_locales integer;
  v_links   integer;
  v_orphans integer;
begin
  select count(*) into v_locales from public.locale;
  if v_locales = 0 then
    raise exception 'no locales seeded';
  end if;

  select count(*) into v_links from public.local_text_link;
  if v_links = 0 then
    raise exception 'no local_text_link rows seeded';
  end if;

  -- Every link must have copy. A link with none renders the [missing: …] sentinel
  -- wherever it is read, which is a silent defect: the page still ships.
  select count(*) into v_orphans
  from public.local_text_link l
  where not exists (select 1 from public.local_text t where t.link = l.id);
  if v_orphans > 0 then
    raise exception '% local_text_link row(s) have no copy in any locale', v_orphans;
  end if;
end $$;

-- Both required locales, for every link. CLAUDE.md's seed conventions require en and
-- fr at minimum; the screen-bundle unit suite checks the seed source declares them,
-- this checks the rows actually landed.
do $$
declare
  v_gaps integer;
  v_code text;
begin
  foreach v_code in array array['en', 'fr'] loop
    select count(*) into v_gaps
    from public.local_text_link l
    where not exists (
      select 1 from public.local_text t
      join public.locale lo on lo.id = t.locale
      where t.link = l.id and lo.code = v_code
    );
    if v_gaps > 0 then
      raise exception '% link(s) have no % copy', v_gaps, v_code;
    end if;
  end loop;
end $$;

-- The unique constraint that makes seeds re-runnable. A plain UNIQUE would not
-- constrain global rows at all, because Postgres treats NULLs as distinct — so
-- `on conflict do nothing` would become a silent no-op and re-running a seed would
-- duplicate every global link.
do $$
begin
  if not exists (
    select 1
    from pg_index i
    join pg_class c on c.oid = i.indrelid
    where c.relname = 'local_text_link' and i.indisunique and i.indnullsnotdistinct
  ) then
    raise exception 'local_text_link has no UNIQUE NULLS NOT DISTINCT index';
  end if;
end $$;

-- ── The seed is re-runnable ──────────────────────────────────────────────────
--
-- Not a property of the SQL in isolation: it depends on every insert carrying the
-- right conflict clause. The harness applies the seed a second time before this runs,
-- so a duplicate here means some insert is missing one.

do $$
declare v_dupes integer;
begin
  select count(*) into v_dupes from (
    select slug, scope, entity_id
    from public.local_text_link
    group by slug, scope, entity_id
    having count(*) > 1
  ) d;
  if v_dupes > 0 then
    raise exception 're-running the seed duplicated % local_text_link row(s)', v_dupes;
  end if;
end $$;

-- ── The identity bridge ──────────────────────────────────────────────────────

do $$
declare v_bad text;
begin
  -- Both helpers must be SECURITY DEFINER, STABLE, and have an empty search_path.
  -- Each is load-bearing and each fails in a different, non-obvious way: as invoker
  -- they recurse through user_account's own policy; as VOLATILE they are re-evaluated
  -- per row; with an inherited search_path they can be tricked into running a shadowed
  -- object with elevated privileges.
  select string_agg(p.proname, ', ') into v_bad
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('current_user_id', 'current_user_admin')
    and (
      not p.prosecdef
      or p.provolatile <> 's'
      or coalesce(array_to_string(p.proconfig, ','), '') not like '%search_path=%'
    );

  if v_bad is not null then
    raise exception 'identity helper(s) not SECURITY DEFINER + STABLE + search_path: %', v_bad;
  end if;
end $$;

-- ── RLS is on wherever a policy was written ──────────────────────────────────

do $$
declare v_unprotected text;
begin
  select string_agg(distinct c.relname, ', ') into v_unprotected
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  where not c.relrowsecurity;

  if v_unprotected is not null then
    raise exception 'table(s) have policies but RLS disabled: %', v_unprotected;
  end if;
end $$;

-- ── Every table has RLS, full stop ───────────────────────────────────────────
--
-- The check above only catches a table someone wrote policies for and then left unprotected.
-- It says nothing about a table with no policies at all, which is the worse case and the one
-- that actually shipped: all 27 of the content module's tables had RLS disabled, and with
-- Supabase's bootstrap grants — all privileges on public tables to anon and authenticated —
-- that made every one of them readable AND writable by anyone holding the publishable key.
-- `subscriber` and `comment` included. It was verified exploitable, not theorised: as anon,
-- inserting and then deleting every row of `subscriber` both succeeded.
--
-- Nothing else can catch this. A table with no policies is valid SQL, typechecks nowhere,
-- and behaves perfectly in every test that runs as an owner. This is the gate.

do $$
declare v_unprotected text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into v_unprotected
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    -- Drizzle's own bookkeeping, which the application never reaches through PostgREST.
    and c.relname not like '\_\_drizzle%'
    and not c.relrowsecurity;

  if v_unprotected is not null then
    raise exception
      'table(s) in public have no row level security, so anon can read and write them: %',
      v_unprotected;
  end if;
end $$;

-- A table with RLS enabled and no policy at all denies everything, which is safe but is
-- almost always a mistake rather than an intention — it means a screen reading it returns
-- nothing, silently.
do $$
declare v_policyless text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into v_policyless
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relrowsecurity
    and c.relname not like '\_\_drizzle%'
    and not exists (select 1 from pg_policy p where p.polrelid = c.oid);

  if v_policyless is not null then
    raise exception 'table(s) have RLS enabled but no policies, so they deny everything: %',
      v_policyless;
  end if;
end $$;

-- ── Provisioning, as a request performs it ───────────────────────────────────

insert into auth.users (id, email)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'first-admin@example.test')
on conflict (id) do nothing;

do $$
declare v_id bigint;
begin
  -- The first principal ever created is granted admin, since a freshly seeded database
  -- has no other route into the admin area. That emptiness check has to run as definer:
  -- under RLS a brand-new user can see no user_account rows at all, so the same check
  -- in application code would read "empty" for every new user and grant admin to all.
  set local role authenticated;
  set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

  v_id := public.ensure_user_account();
  if v_id is null then
    raise exception 'ensure_user_account() returned null for a signed-in identity';
  end if;
  if public.current_user_id() <> v_id then
    raise exception 'current_user_id() disagrees with ensure_user_account()';
  end if;
  if not public.current_user_admin() then
    raise exception 'the first principal was not granted admin';
  end if;

  -- Idempotent: a second call for the same identity returns the same principal rather
  -- than provisioning another.
  if public.ensure_user_account() <> v_id then
    raise exception 'ensure_user_account() provisioned a second principal for one identity';
  end if;
end $$;

-- A second identity must NOT be an admin — the emptiness check has to be an emptiness
-- check, not a "grant everyone" bug.
insert into auth.users (id, email)
values ('aaaaaaaa-0000-4000-8000-000000000002', 'second@example.test')
on conflict (id) do nothing;

do $$
begin
  set local role authenticated;
  set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000002';

  perform public.ensure_user_account();
  if public.current_user_admin() then
    raise exception 'the second principal was granted admin';
  end if;
end $$;

-- ── user_account's self-promotion hole stays closed ──────────────────────────
--
-- Confirmed exploitable 2026-10-03: the owner-update policy that used to live here let
-- any authenticated principal PATCH its own row's `admin` column to true, because RLS
-- cannot restrict which columns an allowed UPDATE may touch. The fix is revoking the
-- grant outright, not a tighter policy — checked both statically and behaviorally.

do $$
begin
  if has_table_privilege('authenticated', 'public.user_account', 'UPDATE')
     or has_table_privilege('authenticated', 'public.user_account', 'INSERT')
     or has_table_privilege('authenticated', 'public.user_account', 'DELETE')
     or has_table_privilege('anon', 'public.user_account', 'UPDATE')
     or has_table_privilege('anon', 'public.user_account', 'INSERT')
     or has_table_privilege('anon', 'public.user_account', 'DELETE')
  then
    raise exception 'anon/authenticated can still write user_account directly — the self-promotion hole is open';
  end if;
end $$;

do $$
declare
  v_second_id bigint;
  v_message   text;
begin
  select id into v_second_id
  from public.user_account
  where auth_user_id = 'aaaaaaaa-0000-4000-8000-000000000002';

  set local role authenticated;
  set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000002';

  -- A raw UPDATE must be refused at the privilege check, before RLS is even
  -- consulted — this is what the static check above already asserts, proven here
  -- end to end the way PostgREST would actually see it.
  begin
    update public.user_account set admin = true where id = v_second_id;
    raise exception 'a non-admin principal updated user_account directly';
  exception when insufficient_privilege then
    null; -- refused, as intended
  end;

  -- The RPC is the only route left, and it must refuse a non-admin promoting itself.
  -- Caught into a variable rather than relied on as control flow, because a bare
  -- `exception when raise_exception` here would also catch the sentinel this block
  -- raises on its own success path — they share the same SQLSTATE.
  v_message := null;
  begin
    perform public.admin_set_user_admin(v_second_id, true);
  exception when raise_exception then
    v_message := sqlerrm;
  end;

  if v_message is null then
    raise exception 'a non-admin principal self-promoted via admin_set_user_admin()';
  elsif v_message <> 'admin privileges required' then
    raise exception 'admin_set_user_admin() refused the non-admin for the wrong reason: %', v_message;
  end if;
end $$;

do $$
declare
  v_first_id  bigint;
  v_second_id bigint;
  v_message   text;
begin
  select id into v_first_id
  from public.user_account where auth_user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
  select id into v_second_id
  from public.user_account where auth_user_id = 'aaaaaaaa-0000-4000-8000-000000000002';

  set local role authenticated;
  set local request.jwt.claim.sub = 'aaaaaaaa-0000-4000-8000-000000000001';

  -- The actual admin may promote another principal through the RPC …
  perform public.admin_set_user_admin(v_second_id, true);
  if not exists (select 1 from public.user_account where id = v_second_id and admin) then
    raise exception 'admin_set_user_admin() did not promote the target principal';
  end if;

  -- … and demote them again, which is safe while two admins exist.
  perform public.admin_set_user_admin(v_second_id, false);
  if exists (select 1 from public.user_account where id = v_second_id and admin) then
    raise exception 'admin_set_user_admin() did not demote the target principal';
  end if;

  -- But refuses to demote the last administrator — that would lock everyone out of
  -- the admin area with no route back in but direct SQL. Same caught-into-a-variable
  -- shape as above, for the same reason.
  v_message := null;
  begin
    perform public.admin_set_user_admin(v_first_id, false);
  exception when raise_exception then
    v_message := sqlerrm;
  end;

  if v_message is null then
    raise exception 'admin_set_user_admin() demoted the last administrator';
  elsif v_message <> 'there has to be at least one administrator' then
    raise exception
      'admin_set_user_admin() refused the last-admin demotion for the wrong reason: %', v_message;
  end if;
end $$;

-- ── An anonymous caller reads public copy and writes nothing ─────────────────

do $$
declare v_count integer;
begin
  set local role anon;

  select count(*) into v_count from public.local_text_link;
  if v_count = 0 then
    raise exception 'anon cannot read local_text_link, so no page can render copy';
  end if;

  begin
    insert into public.local_text_link (slug, scope, entity_id)
    values ('anon.probe', null, null);
    raise exception 'anon inserted a local_text_link row — RLS is not applying';
  exception when insufficient_privilege then
    null; -- refused, as intended
  end;
end $$;

-- ── Every SECURITY DEFINER function has a fixed search_path ──────────────────
--
-- Not a style rule. A definer function without one inherits the caller's search_path and
-- can be made to run a shadowed object with the owner's privileges. It also breaks
-- composition: an unqualified type name in a DECLARE does not resolve when a hardened
-- caller has set search_path to empty, which is how the module's five stock functions
-- were found to be missing it.

do $$
declare v_bad text;
begin
  select string_agg(p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', ', ')
    into v_bad
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and coalesce(array_to_string(p.proconfig, ','), '') not like '%search_path=%';

  if v_bad is not null then
    raise exception 'SECURITY DEFINER function(s) with no fixed search_path: %', v_bad;
  end if;
end $$;

-- ── Policies call the identity helpers in the sanctioned shape ───────────────
--
-- Two anti-patterns, both of which typecheck nowhere, pass every other assertion in
-- this file, and behave correctly in any test that runs as one principal.
--
-- 1. A bare `public.current_user_id()` in a predicate is re-evaluated per row; wrapped
--    as `(select …)` the planner hoists it into an InitPlan run once per statement. The
--    catalog makes the two distinguishable: Postgres deparses the wrapped form as
--    `( SELECT current_user_id() AS current_user_id)` and the bare form as
--    `current_user_id()`, so a bare call is any occurrence the wrapped count cannot
--    account for.
--
-- 2. Testing `user_account.admin` inline, via `exists (select 1 from
--    public.user_account …)`, instead of calling public.current_user_admin(). The
--    inline form runs as the caller, so it re-enters user_account's own policies and
--    silently depends on user_account_owner_read continuing to admit exactly the row it
--    asks for. Narrow that policy and every inline check starts denying admins. The
--    helper is SECURITY DEFINER and does not have the problem. Policies on
--    user_account itself are exempt — that is where the admin column legitimately lives.
--
-- All 40 of the logistic module's policies carried both patterns until 2026-10-01.

do $$
declare
  v_bare   text;
  v_inline text;
begin
  select string_agg(format('%s.%s', tablename, policyname), ', ' order by tablename, policyname)
    into v_bare
  from pg_policies
  cross join lateral (select coalesce(qual, '') || ' ' || coalesce(with_check, '') as expr) e
  where schemaname = 'public'
    and (
      regexp_count(e.expr, 'current_user_id\(\)')
        > regexp_count(e.expr, 'SELECT current_user_id\(\)')
      or regexp_count(e.expr, 'current_user_admin\(\)')
        > regexp_count(e.expr, 'SELECT current_user_admin\(\)')
    );

  if v_bare is not null then
    raise exception 'policy/policies call an identity helper bare instead of (select fn()): %', v_bare;
  end if;

  select string_agg(format('%s.%s', tablename, policyname), ', ' order by tablename, policyname)
    into v_inline
  from pg_policies
  cross join lateral (select coalesce(qual, '') || ' ' || coalesce(with_check, '') as expr) e
  where schemaname = 'public'
    and tablename <> 'user_account'
    and e.expr like '%user_account.admin%';

  if v_inline is not null then
    raise exception 'policy/policies test user_account.admin inline instead of calling public.current_user_admin(): %', v_inline;
  end if;
end $$;
