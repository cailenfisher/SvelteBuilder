-- Blog module supplements: cross-package FKs, updated_at triggers, RLS policies

-- ── Cross-package foreign keys ───────────────────────────────────────────────
-- These reference user_account which is defined in the scaffold schema, not
-- the blog Drizzle schema, so they cannot be expressed in drizzle-kit output.

alter table public.post
  add constraint fk_post_user_account
  foreign key (user_account_id) references public.user_account(id) on delete cascade;

alter table public.comment
  add constraint fk_comment_user_account
  foreign key (user_account_id) references public.user_account(id) on delete set null;

-- ── updated_at trigger ───────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger post_set_updated_at
  before update on public.post
  for each row execute function set_updated_at();

create trigger comment_set_updated_at
  before update on public.comment
  for each row execute function set_updated_at();

-- ── RLS policies ─────────────────────────────────────────────────────────────

alter table public.post enable row level security;

create policy "post_public_read"
  on public.post for select
  to anon, authenticated
  using (status = 'published');

create policy "post_author_all"
  on public.post for all
  to authenticated
  using (user_account_id = auth.uid())
  with check (user_account_id = auth.uid());

create policy "post_admin_all"
  on public.post for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- ────────────────────────────────────────────────────────────────────────────

alter table public.post_category enable row level security;

create policy "post_category_public_read"
  on public.post_category for select
  to anon, authenticated
  using (true);

create policy "post_category_admin_all"
  on public.post_category for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- ────────────────────────────────────────────────────────────────────────────

alter table public.post_tag enable row level security;

create policy "post_tag_public_read"
  on public.post_tag for select
  to anon, authenticated
  using (true);

create policy "post_tag_admin_all"
  on public.post_tag for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- ────────────────────────────────────────────────────────────────────────────

alter table public.post_category_post enable row level security;

create policy "post_category_post_public_read"
  on public.post_category_post for select
  to anon, authenticated
  using (true);

create policy "post_category_post_admin_all"
  on public.post_category_post for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- ────────────────────────────────────────────────────────────────────────────

alter table public.post_post_tag enable row level security;

create policy "post_post_tag_public_read"
  on public.post_post_tag for select
  to anon, authenticated
  using (true);

create policy "post_post_tag_admin_all"
  on public.post_post_tag for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- ────────────────────────────────────────────────────────────────────────────

alter table public.comment enable row level security;

create policy "comment_public_read"
  on public.comment for select
  to anon, authenticated
  using (
    approved = true
    and exists (
      select 1 from public.post p
      where p.id = post_id and p.status = 'published'
    )
  );

create policy "comment_auth_insert"
  on public.comment for insert
  to authenticated
  with check (
    user_account_id = auth.uid()
    and exists (
      select 1 from public.post p
      where p.id = post_id
        and p.status = 'published'
        and p.allow_comment = true
    )
  );

create policy "comment_author_update"
  on public.comment for update
  to authenticated
  using (user_account_id = auth.uid())
  with check (user_account_id = auth.uid());

create policy "comment_author_delete"
  on public.comment for delete
  to authenticated
  using (user_account_id = auth.uid());

create policy "comment_admin_all"
  on public.comment for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');
