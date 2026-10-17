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
