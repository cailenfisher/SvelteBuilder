-- user_account: close the self-promotion hole
--
-- Confirmed exploitable, not theorised. The base template's `user_account_owner_update`
-- policy (removed in 03-base-rls.sql) read `using (current_user_id() = id) with check
-- (current_user_id() = id)` — "update your own row". As any authenticated principal:
--
--   PATCH /rest/v1/user_account?id=eq.<own id>   {"admin": true}
--
-- returned 200 with the row updated, after which public.current_user_admin() returned
-- true and that principal held the whole (admin) area. The same request can rewrite
-- auth_user_id, repointing a principal at someone else's auth identity — an
-- account-takeover primitive.
--
-- Two things combined to allow it. Supabase's bootstrap grants give anon and
-- authenticated full DML on everything in public — the same root cause as the content
-- module's RLS incident — so RLS was the only restraint. And Postgres RLS cannot
-- restrict which *columns* an allowed UPDATE may touch: "update your own row"
-- necessarily includes every column on that row, admin included. A `with check` cannot
-- narrow this either — policies see only the NEW row, never OLD, so there is no way to
-- express "unchanged except for these columns".
--
-- The fix is column privileges, the only mechanism in Postgres that operates at column
-- granularity — not a better policy. user_account's columns are id, auth_user_id,
-- created_at, updated_at, active, admin: a principal has no legitimate reason to write
-- any of them, so write access goes away entirely and the one legitimate change —
-- promoting or demoting an administrator — moves to a SECURITY DEFINER function that
-- checks caller admin status itself.
--
-- SELECT is deliberately left alone: user_account_owner_read (03-base-rls.sql) is what
-- lets the (admin) layout read its own admin flag, and user_account_admin_all is what
-- lets an administrator read the roster. Nothing in the scaffold writes this table as
-- the request role — ensure_user_account() is SECURITY DEFINER, so it needs no grant.

revoke insert, update, delete, truncate, references, trigger
  on public.user_account from anon, authenticated;

-- The only sanctioned write. SECURITY DEFINER because the caller has no UPDATE
-- privilege on this table at all now, so both the admin check and the
-- last-administrator guard have to live in here — a guard enforced only in the route
-- could be skipped by calling the Data API directly, which is exactly how the hole
-- above was proven.
create or replace function public.admin_set_user_admin(
  p_user_account_id bigint,
  p_admin           boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_count integer;
begin
  if not coalesce((select public.current_user_admin()), false) then
    raise exception 'admin privileges required';
  end if;

  if p_user_account_id is null or p_admin is null then
    raise exception 'user_account_id and admin are both required';
  end if;

  -- Removing the last administrator would lock everyone out of the admin area with no
  -- route back in but direct SQL. Counted here rather than in the route so the guard
  -- holds for any caller, including a direct .rpc() call.
  if p_admin = false then
    select count(*) into v_admin_count from public.user_account where admin;
    if v_admin_count <= 1 then
      raise exception 'there has to be at least one administrator';
    end if;
  end if;

  update public.user_account
  set admin = p_admin,
      updated_at = now()
  where id = p_user_account_id;

  if not found then
    raise exception 'no such principal';
  end if;
end;
$$;

grant execute on function public.admin_set_user_admin(bigint, boolean) to authenticated;
