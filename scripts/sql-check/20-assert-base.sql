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
