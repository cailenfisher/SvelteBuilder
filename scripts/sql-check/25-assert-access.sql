-- What must be true of access control in any scaffold's database (docs/ACCESS-CONTROL.md §9).
--
-- Every check raises rather than returning a row, so `psql -v ON_ERROR_STOP=1` turns a
-- violated expectation into a non-zero exit. Read the raise message, not the line.
--
-- The checks impersonate principals the way a request does: `set local role authenticated`
-- (or anon) plus a JWT subject, since a check run as the owner would pass against a database
-- with no policies at all. Fixtures are made as the owner, under scopes no module uses
-- (`sql_check_widget`, `sql_check_gadget`), and removed at the end so the module assertions
-- that follow see the database as the seed left it.

-- ── Fixtures ──────────────────────────────────────────────────────────────────

-- The subjects of this file's principals. 20-assert-base.sql made the first administrator
-- (…0001) and one non-admin (…0002).
--   …c001 holds nothing          …c002 scope grant on widget   …c003 member of an internal group
--   …c004 expired grant           …c005 global grant            …c006 member of an external group
insert into auth.users (id, email)
select ('cccccccc-0000-4000-8000-00000000c00' || n)::uuid, 'access-' || n || '@example.test'
from generate_series(1, 6) as n
on conflict (id) do nothing;

do $$
declare
  n integer;
begin
  for n in 1..6 loop
    set local role authenticated;
    perform set_config('request.jwt.claim.sub', 'cccccccc-0000-4000-8000-00000000c00' || n, true);
    perform public.ensure_user_account();
    reset role;
  end loop;
end $$;

-- The lookups are SECURITY DEFINER so they still answer once a check has signed in as someone
-- whom RLS hides these rows from.
create function pg_temp.account_id(p_n integer) returns bigint language sql stable security definer as $$
  select ua.id from public.user_account ua
  where ua.auth_user_id = ('cccccccc-0000-4000-8000-00000000c00' || p_n)::uuid
$$;

create function pg_temp.sign_in(p_sub text) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', p_sub, true);
end $$;

create function pg_temp.sign_in_fixture(p_n integer) returns void language sql as $$
  select pg_temp.sign_in('cccccccc-0000-4000-8000-00000000c00' || p_n)
$$;

create function pg_temp.sign_in_admin() returns void language sql as $$
  select pg_temp.sign_in('aaaaaaaa-0000-4000-8000-000000000001')
$$;

insert into public.permission (scope, action) values
  ('sql_check_widget', 'read'),
  ('sql_check_widget', 'update'),
  ('sql_check_gadget', 'update')
on conflict do nothing;

-- An administrator's role holding update on both scopes, and a module-managed one.
insert into public.role (slug) values ('sql_check_managed') on conflict do nothing;

do $$
declare
  v_editor  integer;
  v_managed integer;
  v_internal integer;
  v_external integer;
begin
  insert into public.role default values returning id into v_editor;
  insert into public.local_text_link (slug, scope, entity_id)
  values ('sql_check_fixture', 'role', v_editor);

  select id into v_managed from public.role where slug = 'sql_check_managed';

  insert into public.role_permission (role_id, permission_id)
  select r.id, p.id
  from (values (v_editor), (v_managed)) as r(id)
  cross join public.permission p
  where p.scope in ('sql_check_widget', 'sql_check_gadget') and p.action = 'update';

  insert into public.user_group (external) values (false) returning id into v_internal;
  insert into public.user_group (external) values (true) returning id into v_external;
  insert into public.local_text_link (slug, scope, entity_id)
  values ('sql_check_fixture', 'user_group', v_internal),
         ('sql_check_fixture', 'user_group', v_external);

  insert into public.user_group_member (user_group_id, user_account_id) values
    (v_internal, pg_temp.account_id(3)),
    (v_external, pg_temp.account_id(6));

  insert into public.role_assignment (role_id, user_account_id, user_group_id, scope, expires_at) values
    (v_editor, pg_temp.account_id(2), null, 'sql_check_widget', null),
    (v_editor, null, v_internal, 'sql_check_widget', null),
    (v_editor, pg_temp.account_id(4), null, 'sql_check_widget', now() - interval '1 day'),
    (v_editor, pg_temp.account_id(5), null, null, null);
end $$;

-- The fixture role is the one with a sql_check_fixture link and no slug.
create function pg_temp.editor_role_id() returns integer language sql stable security definer as $$
  select r.id from public.role r
  join public.local_text_link l on l.scope = 'role' and l.entity_id = r.id
  where l.slug = 'sql_check_fixture' and r.slug is null
$$;

create function pg_temp.user_group_id(p_external boolean) returns integer language sql stable security definer as $$
  select g.id from public.user_group g
  join public.local_text_link l on l.scope = 'user_group' and l.entity_id = g.id
  where l.slug = 'sql_check_fixture' and g.external = p_external
$$;

-- ── current_user_can, at every target width ──────────────────────────────────

do $$
begin
  perform pg_temp.sign_in_fixture(1);
  if public.current_user_can('sql_check_widget', 'update') then
    raise exception 'a user with no assignment can update widgets';
  end if;

  perform pg_temp.sign_in_fixture(2);
  if not public.current_user_can('sql_check_widget', 'update') then
    raise exception 'a scope grant on widget does not admit widget.update';
  end if;
  if public.current_user_can('sql_check_gadget', 'update') then
    raise exception 'a scope grant on widget admits gadget.update, another scope';
  end if;
  if public.current_user_can('sql_check_widget', 'read') then
    raise exception 'a scope grant admits widget.read, which its role does not hold';
  end if;

  perform pg_temp.sign_in_fixture(5);
  if not (public.current_user_can('sql_check_widget', 'update')
          and public.current_user_can('sql_check_gadget', 'update')) then
    raise exception 'a global grant does not admit every scope its role names';
  end if;
  if public.current_user_can('sql_check_widget', 'read') then
    raise exception 'a global grant admits widget.read, which its role does not hold';
  end if;

  perform pg_temp.sign_in_fixture(3);
  if not public.current_user_can('sql_check_widget', 'update') then
    raise exception 'a grant to a group does not reach its member';
  end if;

  perform pg_temp.sign_in_fixture(4);
  if public.current_user_can('sql_check_widget', 'update') then
    raise exception 'an expired assignment still grants';
  end if;

  -- Administrators hold everything, with no assignment at all (A5).
  perform pg_temp.sign_in_admin();
  if not public.current_user_can('sql_check_widget', 'read') then
    raise exception 'an administrator with no assignment is refused';
  end if;
end $$;

do $$
begin
  set local role anon;
  perform set_config('request.jwt.claim.sub', '', true);
  if public.current_user_can('sql_check_widget', 'update') then
    raise exception 'anon can update widgets';
  end if;
  if cardinality(public.current_user_group_ids()) <> 0 then
    raise exception 'anon belongs to a group';
  end if;
end $$;

-- Removing a member removes the access the group gave them.
do $$
begin
  delete from public.user_group_member
  where user_group_id = pg_temp.user_group_id(false) and user_account_id = pg_temp.account_id(3);

  perform pg_temp.sign_in_fixture(3);
  if public.current_user_can('sql_check_widget', 'update') then
    raise exception 'a former member keeps the group''s access';
  end if;
end $$;

-- ── role_assignment refuses what it must ─────────────────────────────────────

do $$
begin
  begin
    insert into public.role_assignment (role_id, user_group_id, scope)
    values (pg_temp.editor_role_id(), pg_temp.user_group_id(true), 'sql_check_widget');
    raise exception 'an external group received a scope assignment';
  exception when check_violation then null;
  end;

  begin
    insert into public.role_assignment (role_id, user_group_id, scope)
    values (pg_temp.editor_role_id(), pg_temp.user_group_id(true), null);
    raise exception 'an external group received a global assignment';
  exception when check_violation then null;
  end;

  begin
    insert into public.role_assignment (role_id, user_account_id, scope)
    values (pg_temp.editor_role_id(), pg_temp.account_id(1), 'sql_check_widgte');
    raise exception 'an assignment on a scope no permission names was accepted';
  exception when foreign_key_violation then null;
  end;

  begin
    insert into public.role_assignment (role_id, user_account_id, user_group_id, scope)
    values (pg_temp.editor_role_id(), pg_temp.account_id(1), pg_temp.user_group_id(false), null);
    raise exception 'an assignment with two principals was accepted';
  exception when check_violation then null;
  end;

  -- NULLS NOT DISTINCT: a second identical global assignment is a duplicate, not a new row.
  begin
    insert into public.role_assignment (role_id, user_account_id, scope)
    values (pg_temp.editor_role_id(), pg_temp.account_id(5), null);
    raise exception 'a duplicate global assignment was accepted';
  exception when unique_violation then null;
  end;
end $$;

-- ── Nobody writes the access tables directly, and only admins read them ──────

do $$
declare
  v_table     text;
  v_role      text;
  v_privilege text;
  v_seen      integer;
begin
  foreach v_table in array array[
    'permission', 'role', 'role_permission', 'user_group', 'user_group_member', 'role_assignment'
  ] loop
    foreach v_role in array array['anon', 'authenticated'] loop
      foreach v_privilege in array array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
        if has_table_privilege(v_role, 'public.' || v_table, v_privilege) then
          raise exception '% holds % on %', v_role, v_privilege, v_table;
        end if;
      end loop;
    end loop;

    -- Holding a grant, a non-admin still reads none of it.
    perform pg_temp.sign_in_fixture(2);
    execute format('select count(*) from public.%I', v_table) into v_seen;
    if v_seen <> 0 then
      raise exception 'a non-admin reads % row(s) of %', v_seen, v_table;
    end if;

    perform pg_temp.sign_in_admin();
    execute format('select count(*) from public.%I', v_table) into v_seen;
    if v_seen = 0 then
      raise exception 'an administrator reads no rows of %', v_table;
    end if;
    reset role;
  end loop;
end $$;

-- ── The administrator RPCs refuse everyone else ──────────────────────────────

do $$
declare
  v_call  text;
  v_calls text[];
begin
  v_calls := array[
    format('select public.create_role(array[(select id from public.locale where code = %L)], array[%L])', 'en', 'Intruder'),
    format('select public.set_role_permissions(%s, %L)', pg_temp.editor_role_id(), '{}'),
    format('select public.delete_role(%s)', pg_temp.editor_role_id()),
    format('select public.create_role_assignment(%s, %s, null, null)', pg_temp.editor_role_id(), pg_temp.account_id(1)),
    format('select public.delete_role_assignment(%s)', (select min(id) from public.role_assignment)),
    format('select public.create_user_group(array[(select id from public.locale where code = %L)], array[%L])', 'en', 'Intruders'),
    format('select public.delete_user_group(%s)', pg_temp.user_group_id(false)),
    format('select public.add_user_group_member(%s, %s)', pg_temp.user_group_id(false), pg_temp.account_id(1)),
    format('select public.remove_user_group_member(%s, %s)', pg_temp.user_group_id(true), pg_temp.account_id(6))
  ];

  perform pg_temp.sign_in_fixture(5);  -- a global grant is not administrator

  foreach v_call in array v_calls loop
    begin
      execute v_call;
      raise exception 'a non-admin was allowed: %', v_call;
    exception when insufficient_privilege then null;
    end;
  end loop;

  if has_function_privilege('anon', 'public.create_role(bigint[], text[], integer[])', 'EXECUTE') then
    raise exception 'anon may execute create_role';
  end if;
end $$;

-- ── Administrator RPCs, as an administrator ──────────────────────────────────

do $$
declare
  v_en      bigint := (select id from public.locale where code = 'en');
  v_fr      bigint := (select id from public.locale where code = 'fr');
  v_update  integer := (select id from public.permission where scope = 'sql_check_widget' and action = 'update');
  v_read    integer := (select id from public.permission where scope = 'sql_check_widget' and action = 'read');
  v_role_id integer;
  v_group_id integer;
  v_assignment_id integer;
  v_held    integer[];
begin
  perform pg_temp.sign_in_admin();

  v_role_id := public.create_role(array[v_en, v_fr], array['Widget reader', 'Lecteur de widgets'], array[v_read]);

  reset role;
  if (select count(*) from public.local_text t
      join public.local_text_link l on l.id = t.link
      where l.scope = 'role' and l.slug = 'name' and l.entity_id = v_role_id) <> 2 then
    raise exception 'create_role did not write its name in both locales';
  end if;
  perform pg_temp.sign_in_admin();

  perform public.set_role_permissions(v_role_id, array[v_read, v_update]);
  select array_agg(permission_id order by permission_id) into v_held
  from public.role_permission where role_id = v_role_id;
  if v_held is distinct from (select array_agg(x order by x) from unnest(array[v_read, v_update]) x) then
    raise exception 'set_role_permissions did not set exactly the given permissions';
  end if;

  v_group_id := public.create_user_group(array[v_en], array['Widget desk']);
  perform public.add_user_group_member(v_group_id, pg_temp.account_id(1));
  v_assignment_id := public.create_role_assignment(v_role_id, null, v_group_id, 'sql_check_widget');

  if (select granted_by from public.role_assignment where id = v_assignment_id)
     is distinct from public.current_user_id() then
    raise exception 'create_role_assignment did not record who granted it';
  end if;

  perform pg_temp.sign_in_fixture(1);
  if not public.current_user_can('sql_check_widget', 'read') then
    raise exception 'an assignment made through the RPCs does not grant';
  end if;

  perform pg_temp.sign_in_admin();
  perform public.remove_user_group_member(v_group_id, pg_temp.account_id(1));
  perform public.delete_role_assignment(v_assignment_id);
  perform public.delete_user_group(v_group_id);
  perform public.delete_role(v_role_id);

  reset role;
  if exists (select 1 from public.local_text_link
             where (scope = 'role' and entity_id = v_role_id)
                or (scope = 'user_group' and entity_id = v_group_id)) then
    raise exception 'deleting a role or group left its copy behind';
  end if;
end $$;

-- ── A module-managed role cannot be changed ──────────────────────────────────

do $$
declare
  v_managed integer := (select id from public.role where slug = 'sql_check_managed');
begin
  perform pg_temp.sign_in_admin();

  begin
    perform public.set_role_permissions(v_managed, '{}');
    raise exception 'a module-managed role''s permissions were changed';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.delete_role(v_managed);
    raise exception 'a module-managed role was deleted';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ── Cleanup ───────────────────────────────────────────────────────────────────

do $$
begin
  delete from public.role where slug = 'sql_check_managed' or id = pg_temp.editor_role_id();
  delete from public.user_group where id in (pg_temp.user_group_id(false), pg_temp.user_group_id(true));
  delete from public.local_text_link where slug = 'sql_check_fixture' and scope in ('role', 'user_group');
  delete from public.permission where scope like 'sql_check_%';
  delete from public.user_account where auth_user_id::text like 'cccccccc-0000-4000-8000-00000000c00%';
  delete from auth.users where id::text like 'cccccccc-0000-4000-8000-00000000c00%';
end $$;
