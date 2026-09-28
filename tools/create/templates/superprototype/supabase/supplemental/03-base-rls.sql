-- RLS policies for scaffold-level tables: user_account, navigation_item
--
-- BEFORE → AFTER mapping for predicates:
--   auth.uid() = id  (uuid comparison)
--     → public.current_user_id() = id  (bigint comparison)
--   auth.jwt() ->> 'role' = 'admin'  (JWT claim — removed Supabase dependency)
--     → exists (select 1 from public.user_account where id = public.current_user_id() and admin)

alter table public.user_account enable row level security;

drop policy if exists "user_account_owner_read" on public.user_account;
create policy "user_account_owner_read"
  on public.user_account for select
  to authenticated
  using (public.current_user_id() = id);

drop policy if exists "user_account_owner_update" on public.user_account;
create policy "user_account_owner_update"
  on public.user_account for update
  to authenticated
  using (public.current_user_id() = id)
  with check (public.current_user_id() = id);

drop policy if exists "user_account_admin_all" on public.user_account;
create policy "user_account_admin_all"
  on public.user_account for all
  to authenticated
  using (
    exists (
      select 1 from public.user_account
      where id = public.current_user_id() and admin
    )
  )
  with check (
    exists (
      select 1 from public.user_account
      where id = public.current_user_id() and admin
    )
  );

-- ────────────────────────────────────────────────────────────────────────────

alter table public.navigation_item enable row level security;

drop policy if exists "navigation_item_public_read" on public.navigation_item;
create policy "navigation_item_public_read"
  on public.navigation_item for select
  to anon, authenticated
  using (active);

drop policy if exists "navigation_item_admin_write" on public.navigation_item;
create policy "navigation_item_admin_write"
  on public.navigation_item for all
  to authenticated
  using (
    exists (
      select 1 from public.user_account
      where id = public.current_user_id() and admin
    )
  )
  with check (
    exists (
      select 1 from public.user_account
      where id = public.current_user_id() and admin
    )
  );
