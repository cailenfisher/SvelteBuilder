-- RLS policies for the i18n tables: locale, local_text_link, local_text
--
-- Admin write access is gated on user_account.admin rather than a Supabase JWT
-- role claim. The subquery is cheap because public.current_user_id() is
-- STABLE — Postgres evaluates it once per transaction, not once per row.

alter table public.locale enable row level security;

drop policy if exists "locale_public_read" on public.locale;
create policy "locale_public_read"
  on public.locale for select
  to anon, authenticated
  using (true);

drop policy if exists "locale_admin_write" on public.locale;
create policy "locale_admin_write"
  on public.locale for all
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

alter table public.local_text_link enable row level security;

drop policy if exists "local_text_link_public_read" on public.local_text_link;
create policy "local_text_link_public_read"
  on public.local_text_link for select
  to anon, authenticated
  using (true);

drop policy if exists "local_text_link_admin_write" on public.local_text_link;
create policy "local_text_link_admin_write"
  on public.local_text_link for all
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

alter table public.local_text enable row level security;

drop policy if exists "local_text_public_read" on public.local_text;
create policy "local_text_public_read"
  on public.local_text for select
  to anon, authenticated
  using (true);

drop policy if exists "local_text_admin_write" on public.local_text;
create policy "local_text_admin_write"
  on public.local_text for all
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
