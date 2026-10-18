-- Access control: the core tables' cross-package foreign keys, row level security and
-- privileges. The design is docs/ACCESS-CONTROL.md; the reasons are
-- docs/ACCESS-CONTROL-DECISIONS.md (A1–A22).
--
-- Drizzle-kit generates CREATE TABLE for the six tables of @sveltebuilder/access. This file
-- adds what Drizzle cannot express from inside that package.
--
-- Like 00-local-text-rls.sql, it depends only on public.current_user_id() and
-- public.current_user_admin(), which the scaffold template supplies (SuperPrototype:
-- 00-auth-functions.sql). `01-` sorts it after `00-auth-functions.sql`; a `00-` name would
-- not (`00-access` sorts before `00-auth`). sync:supabase places the generated per-entity SQL,
-- access-generated.sql, directly after this file (A21).
--
-- WHO MAY READ AND WRITE
--
-- Nobody but an administrator selects these tables directly. Everyone else learns what they
-- hold through the definer functions that check it. Nobody writes them directly at all, an
-- administrator included: every write goes through a SECURITY DEFINER RPC that checks its
-- caller itself (A12). RLS cannot see which columns an allowed UPDATE touches, and cannot
-- express "the role granted must not exceed the granter's own rights", and a rule a route can
-- skip by calling the Data API directly is no rule — 05-user-account-hardening.sql records how
-- that was proven on user_account.
--
-- Because every write goes through an RPC, those RPCs set updated_at themselves, and the
-- tables need no updated_at trigger.
--
-- Helpers are called as (select public.current_user_admin()) so the planner evaluates the
-- STABLE function once per statement, and every policy names its role with `to`.

-- ── Cross-package foreign keys ────────────────────────────────────────────────

do $$ begin
  alter table public.user_group_member
    add constraint fk_user_group_member_user_account
    foreign key (user_account_id) references public.user_account(id) on delete cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.role_assignment
    add constraint fk_role_assignment_user_account
    foreign key (user_account_id) references public.user_account(id) on delete cascade;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.role_assignment
    add constraint fk_role_assignment_granted_by
    foreign key (granted_by) references public.user_account(id) on delete set null;
exception when duplicate_object then null;
end $$;

-- ── Row level security and privileges ─────────────────────────────────────────

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'permission', 'role', 'role_permission', 'user_group', 'user_group_member', 'role_assignment'
  ] loop
    execute format('alter table public.%I enable row level security', v_table);

    execute format('drop policy if exists %I on public.%I', v_table || '_admin_read', v_table);
    execute format(
      'create policy %I on public.%I for select to authenticated
         using ((select public.current_user_admin()))',
      v_table || '_admin_read', v_table);

    execute format(
      'revoke insert, update, delete, truncate, references, trigger on public.%I
         from anon, authenticated',
      v_table);
  end loop;
end $$;

-- ── role_assignment targets ───────────────────────────────────────────────────
--
-- Two rules a CHECK constraint cannot express, because each reads another table.
--
-- A scope must be one the permission catalog names. A typo ('artcle') would otherwise be
-- stored and grant nothing, silently: no policy ever asks about a scope that does not exist.
--
-- An external group may hold roles on single rows only (A10). Its members reach data through
-- per-entity assignments and relationship predicates, never through a broad grant. `external`
-- is set when a group is created and no RPC changes it, so checking it here, at assignment
-- time, is enough.
--
-- Not SECURITY DEFINER: every write to role_assignment already runs inside a definer RPC.

create or replace function public.role_assignment_check_target()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.scope is not null
     and not exists (select 1 from public.permission p where p.scope = new.scope) then
    raise exception 'no permission names the scope %', new.scope
      using errcode = '23503';
  end if;

  if new.user_group_id is not null
     and exists (
       select 1 from public.user_group g where g.id = new.user_group_id and g.external
     ) then
    raise exception 'an external group can be assigned roles on single rows only'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists role_assignment_check_target on public.role_assignment;
create trigger role_assignment_check_target
  before insert or update on public.role_assignment
  for each row execute function public.role_assignment_check_target();

-- ── The helpers every policy calls ────────────────────────────────────────────
--
-- SECURITY DEFINER because the access tables are unreadable to the people whose access they
-- describe. STABLE, `set search_path = ''`, and always called as `(select …)` with literal
-- arguments, for the reasons at the top of 00-auth-functions.sql: the planner hoists the call
-- into an InitPlan evaluated once per statement, not once per row (A14).

create or replace function public.current_user_group_ids()
returns integer[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(m.user_group_id), '{}')
  from public.user_group_member m
  where m.user_account_id = (select public.current_user_id())
$$;

-- The broad question only: may the current user do `p_action` to every row of `p_scope`?
-- True for an administrator (A5), or through any unexpired global or `p_scope` assignment,
-- the user's own or one of their groups', whose role holds (p_scope, p_action). A global
-- assignment covers exactly the scopes its role's permissions name. It never looks at
-- per-entity assignments; those are answered by the generated current_user_<entity>_ids().

create or replace function public.current_user_can(p_scope text, p_action text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select public.current_user_admin()), false)
    or exists (
      select 1
      from public.role_assignment ra
      join public.role_permission rp on rp.role_id = ra.role_id
      join public.permission p on p.id = rp.permission_id
      where p.scope = p_scope
        and p.action = p_action
        and (ra.scope is null or ra.scope = p_scope)
        and (ra.expires_at is null or ra.expires_at > now())
        and (
          ra.user_account_id = (select public.current_user_id())
          or ra.user_group_id = any ((select public.current_user_group_ids())::integer[])
        )
    )
$$;

-- Every scope in which the current user may do anything at all: through any unexpired global
-- or scope assignment whose role holds a permission there, their own or a group's. An
-- administrator holds every scope in the catalog. This is what lets staff into the admin area,
-- and decides which entries of its menu they see (A24); it never decides a single row.
--
-- access-generated.sql replaces it, when any manifest declares entity-level access, with a
-- version that also counts assignments on single rows: a Contributor given one article is staff
-- too, and sees Articles in the menu.
create or replace function public.current_user_scopes()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct p.scope order by p.scope), '{}')
  from public.permission p
  where coalesce((select public.current_user_admin()), false)
     or exists (
       select 1
       from public.role_assignment ra
       join public.role_permission rp on rp.role_id = ra.role_id
       where rp.permission_id = p.id
         and (ra.scope is null or ra.scope = p.scope)
         and (ra.expires_at is null or ra.expires_at > now())
         and (
           ra.user_account_id = (select public.current_user_id())
           or ra.user_group_id = any ((select public.current_user_group_ids())::integer[])
         )
     )
$$;

-- The roles that apply to a scope: those holding at least one permission on it. For the sharing
-- form of an entity's access panel, whose users may not read the role tables themselves. Which
-- roles exist is not secret; who holds them is, and that stays behind list_<entity>_access.
create or replace function public.list_scope_role(p_scope text)
returns table (id integer, slug text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.slug
  from public.role r
  where exists (
    select 1 from public.role_permission rp
    join public.permission p on p.id = rp.permission_id
    where rp.role_id = r.id and p.scope = p_scope
  )
  order by r.slug nulls last, r.id
$$;

-- ── Administrator RPCs ────────────────────────────────────────────────────────
--
-- The only way to change roles, groups and global or scope assignments (A5, A12). Each
-- checks current_user_admin() itself, so a direct .rpc() call is held to the same rule as
-- the admin screens, and raises 42501 (insufficient_privilege) when it is not met.
--
-- plpgsql, not sql: create_role and create_user_group call create_local_text_entry() from
-- 04-admin-write-rpc.sql, which applies after this file. plpgsql resolves the call when it
-- runs; a `language sql` body is checked when it is created.
--
-- A role's or group's name is copy, under the `role` or `user_group` scope with slug `name`
-- (A16), written in the same transaction as the row so no role ever renders [missing: name].
-- Deleting the row deletes its copy, for the same reason in reverse.

create or replace function public.access_require_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not coalesce((select public.current_user_admin()), false) then
    raise exception 'administrator privileges required' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.access_delete_entity_copy(p_scope text, p_entity_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.local_text t
  using public.local_text_link l
  where t.link = l.id and l.scope = p_scope and l.entity_id = p_entity_id;

  delete from public.local_text_link l
  where l.scope = p_scope and l.entity_id = p_entity_id;
end;
$$;

-- Creates an administrator's role, with its name and permissions, in one transaction. Cloning
-- a module-managed role (O6) is this call with that role's permission ids.
create or replace function public.create_role(
  p_locale_ids     bigint[],
  p_names          text[],
  p_permission_ids integer[] default '{}'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role_id integer;
begin
  perform public.access_require_admin();

  if not exists (select 1 from unnest(p_names) n where btrim(coalesce(n, '')) <> '') then
    raise exception 'a role needs a name in at least one locale';
  end if;

  insert into public.role default values returning id into v_role_id;

  perform public.create_local_text_entry('name', 'role', p_locale_ids, p_names, v_role_id);

  insert into public.role_permission (role_id, permission_id)
  select v_role_id, p.id
  from public.permission p
  where p.id = any (coalesce(p_permission_ids, '{}'));

  return v_role_id;
end;
$$;

-- Replaces a role's permissions with exactly the given set. A module-managed role (non-null
-- slug) is refused: its module's seed would put back whatever an admin removed (O6).
create or replace function public.set_role_permissions(
  p_role_id        integer,
  p_permission_ids integer[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text;
begin
  perform public.access_require_admin();

  select r.slug into v_slug from public.role r where r.id = p_role_id;
  if not found then
    raise exception 'no such role';
  end if;
  if v_slug is not null then
    raise exception 'role % is managed by its module; clone it to change it', v_slug
      using errcode = '42501';
  end if;

  delete from public.role_permission rp
  where rp.role_id = p_role_id
    and rp.permission_id <> all (coalesce(p_permission_ids, '{}'));

  insert into public.role_permission (role_id, permission_id)
  select p_role_id, p.id
  from public.permission p
  where p.id = any (coalesce(p_permission_ids, '{}'))
  on conflict do nothing;

  update public.role set updated_at = now() where id = p_role_id;
end;
$$;

-- Deletes an administrator's role, its permissions and every assignment of it, and its copy.
create or replace function public.delete_role(p_role_id integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text;
begin
  perform public.access_require_admin();

  select r.slug into v_slug from public.role r where r.id = p_role_id;
  if not found then
    raise exception 'no such role';
  end if;
  if v_slug is not null then
    raise exception 'role % is managed by its module and cannot be deleted', v_slug
      using errcode = '42501';
  end if;

  delete from public.role where id = p_role_id;
  perform public.access_delete_entity_copy('role', p_role_id);
end;
$$;

-- A global (p_scope null) or scope assignment. The trigger refuses an unknown scope and an
-- external group; the CHECK constraint refuses anything but exactly one principal.
create or replace function public.create_role_assignment(
  p_role_id         integer,
  p_user_account_id bigint,
  p_user_group_id   integer,
  p_scope           text,
  p_expires_at      timestamptz default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role_assignment_id integer;
begin
  perform public.access_require_admin();

  insert into public.role_assignment
    (role_id, user_account_id, user_group_id, scope, granted_by, expires_at)
  values
    (p_role_id, p_user_account_id, p_user_group_id, nullif(btrim(coalesce(p_scope, '')), ''),
     (select public.current_user_id()), p_expires_at)
  returning id into v_role_assignment_id;

  return v_role_assignment_id;
end;
$$;

create or replace function public.delete_role_assignment(p_role_assignment_id integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.access_require_admin();

  delete from public.role_assignment where id = p_role_assignment_id;
  if not found then
    raise exception 'no such role assignment';
  end if;
end;
$$;

-- `external` is fixed when the group is created: no RPC changes it, which is what lets the
-- role_assignment trigger check it only at assignment time.
create or replace function public.create_user_group(
  p_locale_ids bigint[],
  p_names      text[],
  p_external   boolean default false
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_group_id integer;
begin
  perform public.access_require_admin();

  if not exists (select 1 from unnest(p_names) n where btrim(coalesce(n, '')) <> '') then
    raise exception 'a group needs a name in at least one locale';
  end if;

  insert into public.user_group (external) values (coalesce(p_external, false))
  returning id into v_user_group_id;

  perform public.create_local_text_entry('name', 'user_group', p_locale_ids, p_names, v_user_group_id);

  return v_user_group_id;
end;
$$;

-- Deletes a group, its memberships and every assignment it holds, and its copy.
create or replace function public.delete_user_group(p_user_group_id integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.access_require_admin();

  delete from public.user_group where id = p_user_group_id;
  if not found then
    raise exception 'no such group';
  end if;
  perform public.access_delete_entity_copy('user_group', p_user_group_id);
end;
$$;

create or replace function public.add_user_group_member(
  p_user_group_id   integer,
  p_user_account_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.access_require_admin();

  insert into public.user_group_member (user_group_id, user_account_id)
  values (p_user_group_id, p_user_account_id)
  on conflict do nothing;

  update public.user_group set updated_at = now() where id = p_user_group_id;
end;
$$;

create or replace function public.remove_user_group_member(
  p_user_group_id   integer,
  p_user_account_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.access_require_admin();

  delete from public.user_group_member
  where user_group_id = p_user_group_id and user_account_id = p_user_account_id;
  if not found then
    raise exception 'not a member of that group';
  end if;

  update public.user_group set updated_at = now() where id = p_user_group_id;
end;
$$;

-- ── Execute privileges ────────────────────────────────────────────────────────
--
-- Stated, never inherited. Postgres grants EXECUTE to PUBLIC by default, and Supabase's
-- bootstrap grants it to anon as well, so each function is first revoked from both.
--
-- The two helpers are executable by anon too, because a policy's functions run as the role
-- querying, and a policy written `to anon` may call them. The administrator RPCs are for
-- signed-in callers, and check admin themselves. The two internal functions are called only
-- from inside other definer functions, so nobody needs to execute them directly.

revoke execute on function public.role_assignment_check_target() from public, anon, authenticated;
revoke execute on function public.current_user_group_ids() from public, anon;
revoke execute on function public.current_user_can(text, text) from public, anon;
revoke execute on function public.current_user_scopes() from public, anon;
revoke execute on function public.list_scope_role(text) from public, anon;
revoke execute on function public.access_require_admin() from public, anon, authenticated;
revoke execute on function public.access_delete_entity_copy(text, bigint) from public, anon, authenticated;
revoke execute on function public.create_role(bigint[], text[], integer[]) from public, anon;
revoke execute on function public.set_role_permissions(integer, integer[]) from public, anon;
revoke execute on function public.delete_role(integer) from public, anon;
revoke execute on function public.create_role_assignment(integer, bigint, integer, text, timestamptz) from public, anon;
revoke execute on function public.delete_role_assignment(integer) from public, anon;
revoke execute on function public.create_user_group(bigint[], text[], boolean) from public, anon;
revoke execute on function public.delete_user_group(integer) from public, anon;
revoke execute on function public.add_user_group_member(integer, bigint) from public, anon;
revoke execute on function public.remove_user_group_member(integer, bigint) from public, anon;

grant execute on function public.current_user_group_ids() to authenticated, anon;
grant execute on function public.current_user_can(text, text) to authenticated, anon;
grant execute on function public.current_user_scopes() to authenticated;
grant execute on function public.list_scope_role(text) to authenticated;
grant execute on function public.create_role(bigint[], text[], integer[]) to authenticated;
grant execute on function public.set_role_permissions(integer, integer[]) to authenticated;
grant execute on function public.delete_role(integer) to authenticated;
grant execute on function public.create_role_assignment(integer, bigint, integer, text, timestamptz) to authenticated;
grant execute on function public.delete_role_assignment(integer) to authenticated;
grant execute on function public.create_user_group(bigint[], text[], boolean) to authenticated;
grant execute on function public.delete_user_group(integer) to authenticated;
grant execute on function public.add_user_group_member(integer, bigint) to authenticated;
grant execute on function public.remove_user_group_member(integer, bigint) to authenticated;
