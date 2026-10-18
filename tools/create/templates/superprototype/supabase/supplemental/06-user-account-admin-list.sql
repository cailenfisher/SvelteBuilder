-- Every principal with its email address, for the administration screens.
--
-- The email address is identity, kept in auth.users (the principal–identity split): no public
-- table carries it, and PostgREST cannot read auth.users. So the admin screens that list users
-- and name the holders of roles read it through this function.
--
-- SECURITY DEFINER because auth.users is unreadable to the request role; it therefore checks
-- current_user_admin() itself, and takes no caller-supplied identity. Sharers see emails through
-- each entity's list_<entity>_principal instead (A20 in docs/ACCESS-CONTROL-DECISIONS.md).

create or replace function public.admin_list_user_account()
returns table (
  id            bigint,
  email_address text,
  admin         boolean,
  created_at    timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not coalesce((select public.current_user_admin()), false) then
    raise exception 'administrator privileges required' using errcode = '42501';
  end if;

  return query
  select ua.id, u.email::text, ua.admin, ua.created_at
  from public.user_account ua
  join auth.users u on u.id = ua.auth_user_id
  order by u.email;
end;
$$;

revoke execute on function public.admin_list_user_account() from public, anon;
grant execute on function public.admin_list_user_account() to authenticated;
