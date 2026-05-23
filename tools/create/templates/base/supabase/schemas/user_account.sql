-- Application-level user record mirroring auth.users. One row per authenticated user.
create table public.user_account (
  id            uuid primary key references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  display_name  text not null,
  email_address text not null,
  active        boolean not null default true,
  constraint uq_user_account_email unique (email_address)
);

create index idx_user_account_email on public.user_account (email_address);

alter table public.user_account enable row level security;

create policy "user_account_owner_read"
  on public.user_account for select
  to authenticated
  using (auth.uid() = id);

create policy "user_account_owner_update"
  on public.user_account for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "user_account_admin_all"
  on public.user_account for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');
