-- What must be true of entity-level access: the SQL sync:supabase generates for a scope listed
-- under `access.entity` (docs/ACCESS-CONTROL.md §2.2, §3.2, §9).
--
-- sql-check declares that access on navigation_item (scripts/sql-check/access-fixture.json), so
-- the generated table and functions are asserted before any real module adopts them. Every
-- check raises; fixtures are removed at the end.

do $$
begin
  if to_regclass('public.navigation_item_role_assignment') is null then
    raise exception 'navigation_item_role_assignment is missing: sql-check declares access on '
      'navigation_item before sync (access-fixture.json), so the generator wrote nothing';
  end if;
  if (select count(*) from public.permission where scope = 'navigation_item') <> 3 then
    raise exception 'the generated permission catalog for navigation_item is not in the migration';
  end if;
end $$;

-- ── Fixtures ──────────────────────────────────────────────────────────────────

-- …e001 shares item A          …e002 edits A through an internal group   …e003 holds nothing
-- …e004 shares every item       …e005 edits A through an external group
insert into auth.users (id, email)
select ('eeeeeeee-0000-4000-8000-00000000e00' || n)::uuid, 'entity-' || n || '@example.test'
from generate_series(1, 5) as n
on conflict (id) do nothing;

do $$
declare
  n integer;
begin
  for n in 1..5 loop
    set local role authenticated;
    perform set_config('request.jwt.claim.sub', 'eeeeeeee-0000-4000-8000-00000000e00' || n, true);
    perform public.ensure_user_account();
    reset role;
  end loop;
end $$;

create function pg_temp.account_id(p_n integer) returns bigint language sql stable security definer as $$
  select ua.id from public.user_account ua
  where ua.auth_user_id = ('eeeeeeee-0000-4000-8000-00000000e00' || p_n)::uuid
$$;

create function pg_temp.sign_in(p_sub text) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', p_sub, true);
end $$;

create function pg_temp.sign_in_fixture(p_n integer) returns void language sql as $$
  select pg_temp.sign_in('eeeeeeee-0000-4000-8000-00000000e00' || p_n)
$$;

create function pg_temp.sign_in_admin() returns void language sql as $$
  select pg_temp.sign_in('aaaaaaaa-0000-4000-8000-000000000001')
$$;

-- Two items, and four roles found by their fixture slug: viewer (read, share), editor
-- (read, update), owner (read, update, share), and empty (no navigation_item permission).
do $$
declare
  v_link bigint;
begin
  insert into public.local_text_link (slug, scope, entity_id)
  values ('sql_check_entity_item', null, null)
  on conflict do nothing;
  select id into v_link from public.local_text_link
  where slug = 'sql_check_entity_item' and scope is null and entity_id is null;

  insert into public.navigation_item (local_text_link_id, href, menu) values
    (v_link, '/sql-check/a', 'sql_check'),
    (v_link, '/sql-check/b', 'sql_check');

  insert into public.role (slug) values
    ('sql_check_viewer'), ('sql_check_editor'), ('sql_check_owner'), ('sql_check_empty');

  insert into public.role_permission (role_id, permission_id)
  select r.id, p.id
  from public.role r
  join public.permission p on p.scope = 'navigation_item'
  where (r.slug = 'sql_check_viewer' and p.action in ('read', 'share'))
     or (r.slug = 'sql_check_editor' and p.action in ('read', 'update'))
     or (r.slug = 'sql_check_owner');

  insert into public.user_group (external) values (false), (true);
end $$;

create function pg_temp.item_id(p_letter text) returns bigint language sql stable security definer as $$
  select id from public.navigation_item where href = '/sql-check/' || p_letter
$$;

create function pg_temp.role_id(p_name text) returns integer language sql stable security definer as $$
  select id from public.role where slug = 'sql_check_' || p_name
$$;

-- The two groups are the newest internal and external ones; this file made them last.
create function pg_temp.user_group_id(p_external boolean) returns integer language sql stable security definer as $$
  select max(id) from public.user_group where external = p_external
$$;

do $$
begin
  insert into public.user_group_member (user_group_id, user_account_id) values
    (pg_temp.user_group_id(false), pg_temp.account_id(2)),
    (pg_temp.user_group_id(true), pg_temp.account_id(5));

  insert into public.navigation_item_role_assignment
    (navigation_item_id, role_id, user_account_id, user_group_id, expires_at) values
    (pg_temp.item_id('a'), pg_temp.role_id('viewer'), pg_temp.account_id(1), null, null),
    (pg_temp.item_id('a'), pg_temp.role_id('editor'), null, pg_temp.user_group_id(false), null),
    (pg_temp.item_id('a'), pg_temp.role_id('editor'), null, pg_temp.user_group_id(true), null),
    -- Expired, so it must grant e003 nothing.
    (pg_temp.item_id('a'), pg_temp.role_id('editor'), pg_temp.account_id(3), null, now() - interval '1 day'),
    -- Someone else's grant on B, which a sharer of A alone must not be able to read.
    (pg_temp.item_id('b'), pg_temp.role_id('viewer'), pg_temp.account_id(5), null, null);

  insert into public.role_assignment (role_id, user_account_id, scope)
  values (pg_temp.role_id('owner'), pg_temp.account_id(4), 'navigation_item');
end $$;

-- ── current_user_<entity>_ids: one row, the right action, unexpired ──────────

do $$
declare
  v_a bigint := pg_temp.item_id('a');
begin
  perform pg_temp.sign_in_fixture(1);
  if public.current_user_navigation_item_ids('share') <> array[v_a] then
    raise exception 'an entity grant of share on A does not admit exactly A';
  end if;
  if cardinality(public.current_user_navigation_item_ids('update')) <> 0 then
    raise exception 'a viewer holds update';
  end if;

  perform pg_temp.sign_in_fixture(2);
  if public.current_user_navigation_item_ids('update') <> array[v_a] then
    raise exception 'an entity grant through an internal group does not admit A';
  end if;

  perform pg_temp.sign_in_fixture(5);
  if public.current_user_navigation_item_ids('update') <> array[v_a] then
    raise exception 'an entity grant through an external group does not admit A';
  end if;

  perform pg_temp.sign_in_fixture(3);
  if cardinality(public.current_user_navigation_item_ids('update')) <> 0 then
    raise exception 'an expired entity grant still admits';
  end if;

  -- Broad grants are current_user_can's question, never this one's.
  perform pg_temp.sign_in_fixture(4);
  if cardinality(public.current_user_navigation_item_ids('update')) <> 0 then
    raise exception 'current_user_navigation_item_ids answers for a scope grant';
  end if;
end $$;

-- ── current_user_<entity>_actions: every width ───────────────────────────────

do $$
declare
  v_a bigint := pg_temp.item_id('a');
  v_b bigint := pg_temp.item_id('b');
  v_got text[];
begin
  perform pg_temp.sign_in_fixture(1);
  select array_agg(h.navigation_item_id || ':' || h.action order by h.navigation_item_id || ':' || h.action) into v_got
  from public.current_user_navigation_item_actions(array[v_a, v_b]) h;
  if v_got is distinct from array[v_a || ':read', v_a || ':share'] then
    raise exception 'a viewer of A holds %', v_got;
  end if;

  perform pg_temp.sign_in_fixture(4);
  if (select count(*) from public.current_user_navigation_item_actions(array[v_a, v_b])) <> 6 then
    raise exception 'a scope grant of three actions does not cover both items';
  end if;

  perform pg_temp.sign_in_admin();
  if (select count(*) from public.current_user_navigation_item_actions(array[v_a])) <> 3 then
    raise exception 'an administrator does not hold every catalog action';
  end if;
end $$;

-- ── Sharing: escalation refused ──────────────────────────────────────────────

do $$
declare
  v_a bigint := pg_temp.item_id('a');
  v_b bigint := pg_temp.item_id('b');
  v_id integer;
begin
  -- e002 holds read and update on A, everything the editor role holds, but not share.
  perform pg_temp.sign_in_fixture(2);
  begin
    perform public.create_navigation_item_role_assignment(v_a, pg_temp.role_id('editor'), pg_temp.account_id(4), null);
    raise exception 'a user without share granted access';
  exception when insufficient_privilege then null;
  end;

  perform pg_temp.sign_in_fixture(1);

  -- e001 holds share and read on A, but not update. e004 holds no assignment on A, so a
  -- refusal here can only be the escalation check.
  begin
    perform public.create_navigation_item_role_assignment(v_a, pg_temp.role_id('editor'), pg_temp.account_id(4), null);
    raise exception 'a viewer granted update, which they do not hold';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.create_navigation_item_role_assignment(v_b, pg_temp.role_id('viewer'), pg_temp.account_id(3), null);
    raise exception 'a user shared an item they hold no share on';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.create_navigation_item_role_assignment(v_a, pg_temp.role_id('empty'), pg_temp.account_id(3), null);
    raise exception 'a role with no navigation_item permission was granted on an item';
  exception when invalid_parameter_value then null;
  end;

  v_id := public.create_navigation_item_role_assignment(v_a, pg_temp.role_id('viewer'), pg_temp.account_id(3), null);
  if (select granted_by from public.navigation_item_role_assignment where id = v_id) <> pg_temp.account_id(1) then
    raise exception 'an entity grant did not record who made it';
  end if;

  -- A scope-wide sharer may grant on any item, up to what they hold.
  perform pg_temp.sign_in_fixture(4);
  perform public.create_navigation_item_role_assignment(v_b, pg_temp.role_id('editor'), pg_temp.account_id(3), null);

  perform pg_temp.sign_in_fixture(3);
  if not (v_b = any (public.current_user_navigation_item_ids('update'))) then
    raise exception 'an entity grant made through the RPC does not admit';
  end if;

  -- Removing: e003 holds share on A only (the viewer grant above), so not on B.
  begin
    perform public.delete_navigation_item_role_assignment(
      (select id from public.navigation_item_role_assignment where navigation_item_id = v_b limit 1));
    raise exception 'a user removed access to an item they hold no share on';
  exception when insufficient_privilege then null;
  end;
end $$;

-- E1, as designed: any sharer of an item may remove any assignment on it.
do $$
begin
  perform pg_temp.sign_in_fixture(3);
  perform public.delete_navigation_item_role_assignment(
    (select a.id from public.navigation_item_role_assignment a
     where a.navigation_item_id = pg_temp.item_id('a') and a.user_account_id = pg_temp.account_id(1)));
end $$;

-- ── The panel and the picker ─────────────────────────────────────────────────

do $$
declare
  v_a bigint := pg_temp.item_id('a');
  v_b bigint := pg_temp.item_id('b');
begin
  perform pg_temp.sign_in_fixture(2);  -- edits A, cannot share it
  begin
    perform public.list_navigation_item_access(v_a);
    raise exception 'a non-sharer read an item''s access panel';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.list_navigation_item_principal(v_a);
    raise exception 'a non-sharer read the principal picker';
  exception when insufficient_privilege then null;
  end;

  perform pg_temp.sign_in_fixture(3);  -- shares A
  if not exists (
    select 1 from public.list_navigation_item_access(v_a) l
    where l.navigation_item_id is null and l.scope = 'navigation_item'
      and l.user_account_id = pg_temp.account_id(4)
  ) then
    raise exception 'the access panel does not show access inherited from a scope grant';
  end if;
  if exists (
    select 1 from public.list_navigation_item_access(v_a) l
    where l.navigation_item_id is not null and l.navigation_item_id <> v_a
  ) then
    raise exception 'the access panel for A shows another item''s grants';
  end if;
  if not exists (
    select 1 from public.list_navigation_item_access(v_a) l
    where l.user_account_id = pg_temp.account_id(3) and l.email_address = 'entity-3@example.test'
  ) then
    raise exception 'the access panel does not name a user principal by email';
  end if;
  if (select count(*) from public.list_navigation_item_principal(v_a) where user_group_id is not null)
     < 2 then
    raise exception 'the principal picker does not list groups';
  end if;
  if not exists (select 1 from public.list_navigation_item_principal(v_a)
                 where email_address = 'entity-1@example.test') then
    raise exception 'the principal picker does not list users by email';
  end if;

  -- The table itself: a sharer of A reads A's grants and their own, nothing else of B's.
  if exists (select 1 from public.navigation_item_role_assignment a
             where a.navigation_item_id = v_b and a.user_account_id is distinct from pg_temp.account_id(3)) then
    raise exception 'a sharer of A reads another user''s grant on B';
  end if;
end $$;

do $$
begin
  if has_table_privilege('authenticated', 'public.navigation_item_role_assignment', 'INSERT')
     or has_table_privilege('authenticated', 'public.navigation_item_role_assignment', 'UPDATE')
     or has_table_privilege('authenticated', 'public.navigation_item_role_assignment', 'DELETE')
     or has_table_privilege('anon', 'public.navigation_item_role_assignment', 'INSERT') then
    raise exception 'navigation_item_role_assignment is writable directly';
  end if;
  if has_function_privilege('anon', 'public.create_navigation_item_role_assignment(bigint, integer, bigint, integer, timestamptz)', 'EXECUTE') then
    raise exception 'anon may execute create_navigation_item_role_assignment';
  end if;
end $$;

-- ── Deleting the row deletes its assignments ─────────────────────────────────

do $$
declare
  v_b bigint := pg_temp.item_id('b');
begin
  delete from public.navigation_item where id = v_b;
  if exists (select 1 from public.navigation_item_role_assignment where navigation_item_id = v_b) then
    raise exception 'deleting an item left its assignments behind';
  end if;
end $$;

-- ── Cleanup ───────────────────────────────────────────────────────────────────

do $$
begin
  delete from public.user_group where id in (pg_temp.user_group_id(false), pg_temp.user_group_id(true));
  delete from public.navigation_item where menu = 'sql_check';
  delete from public.local_text_link where slug = 'sql_check_entity_item' and scope is null;
  delete from public.role where slug like 'sql_check_%';
  delete from public.user_account where auth_user_id::text like 'eeeeeeee-0000-4000-8000-00000000e00%';
  delete from auth.users where id::text like 'eeeeeeee-0000-4000-8000-00000000e00%';
end $$;
