-- =============================================================================
-- @sveltebuilder/blog — DDL
-- blog.sql
--
-- Naming conventions: singular snake_case tables, bigint identity PK, <table>_id FKs,
-- _at timestamp suffixes, no is_/has_ boolean prefixes.
--
-- i18n convention: domain entities carry NO copy fields (no title, name, body,
-- description, excerpt). All human-facing copy is linked via the hermes
-- local_text_link / local_text system using the standard polymorphic pattern:
--   slug = field name (e.g. 'title', 'name'), scope = table name,
--   entity_id = bigint PK of the entity.
-- Callers resolve via: localText('title', 'post', post.id)
--
-- Routing slugs (post.slug, post_category.slug, post_tag.slug) are URL-safe
-- identifiers for routing only — not display copy.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------
create type post_status as enum ('draft', 'review', 'published', 'archived');

-- ---------------------------------------------------------------------------
-- Updated-at trigger function (shared by post and comment)
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- post
--
-- slug: URL-routing key (e.g. 'building-with-svelte-5'). Locale-independent.
--   NOT display copy — title/excerpt/body are in local_text.
-- published_at: global first-publish timestamp for feed ordering. A post is
--   considered "published in locale X" when its title, body, and excerpt
--   local_text rows exist for locale X AND status = 'published'. There is no
--   per-locale status column on this table.
-- ---------------------------------------------------------------------------
create table public.post (
  id                  bigint generated always as identity primary key,
  slug                text not null unique,
  user_account_id     uuid not null references public.user_account(id),
  status              post_status not null default 'draft',
  featured            boolean not null default false,
  allow_comment       boolean not null default true,
  reading_time_minute integer,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger post_set_updated_at
  before update on public.post
  for each row execute function set_updated_at();

alter table public.post enable row level security;

-- Public: read published posts
create policy "post_public_read"
  on public.post for select
  to anon, authenticated
  using (status = 'published');

-- Authors: full access to their own posts
create policy "post_author_all"
  on public.post for all
  to authenticated
  using (user_account_id = auth.uid())
  with check (user_account_id = auth.uid());

-- Admins: full access
create policy "post_admin_all"
  on public.post for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- ---------------------------------------------------------------------------
-- post_category
--
-- slug: URL-routing/filtering key (e.g. 'technology'). Locale-independent.
-- Display names are linked via local_text_link with scope = 'post_category',
--   entity_id = post_category.id.
-- ---------------------------------------------------------------------------
create table public.post_category (
  id         bigint generated always as identity primary key,
  slug       text not null unique,
  active     boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

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

-- ---------------------------------------------------------------------------
-- post_tag
--
-- slug: URL-routing/filtering key (e.g. 'svelte'). Locale-independent.
-- Display names are linked via local_text_link with scope = 'post_tag',
--   entity_id = post_tag.id.
-- ---------------------------------------------------------------------------
create table public.post_tag (
  id         bigint generated always as identity primary key,
  slug       text not null unique,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

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

-- ---------------------------------------------------------------------------
-- Junction: post_category_post (alphabetical column order per conventions)
-- ---------------------------------------------------------------------------
create table public.post_category_post (
  post_category_id bigint not null references public.post_category(id) on delete cascade,
  post_id          bigint not null references public.post(id) on delete cascade,
  primary key (post_category_id, post_id)
);

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

-- ---------------------------------------------------------------------------
-- Junction: post_post_tag (alphabetical column order per conventions)
-- ---------------------------------------------------------------------------
create table public.post_post_tag (
  post_id     bigint not null references public.post(id) on delete cascade,
  post_tag_id bigint not null references public.post_tag(id) on delete cascade,
  primary key (post_id, post_tag_id)
);

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

-- ---------------------------------------------------------------------------
-- comment
--
-- SCOPE DEVIATION: comment.body is user-generated content, not editorial copy.
-- It is stored directly as plain text, not linked via local_text. It is not
-- translated. This is the only copy field on any blog domain entity.
-- ---------------------------------------------------------------------------
create table public.comment (
  id                bigint generated always as identity primary key,
  post_id           bigint not null references public.post(id) on delete cascade,
  user_account_id   uuid references public.user_account(id) on delete set null,
  parent_comment_id bigint references public.comment(id) on delete cascade,
  body              text not null,
  approved          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger comment_set_updated_at
  before update on public.comment
  for each row execute function set_updated_at();

alter table public.comment enable row level security;

-- Public: read approved comments on published posts
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

-- Authenticated: insert comments on posts that allow comments
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

-- Authors: update/delete their own comments
create policy "comment_author_update"
  on public.comment for update
  to authenticated
  using (user_account_id = auth.uid())
  with check (user_account_id = auth.uid());

create policy "comment_author_delete"
  on public.comment for delete
  to authenticated
  using (user_account_id = auth.uid());

-- Admins: full access
create policy "comment_admin_all"
  on public.comment for all
  to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index idx_post_slug                 on public.post(slug);
create index idx_post_status_published     on public.post(status, published_at desc);
create index idx_post_user_account         on public.post(user_account_id);
create index idx_post_category_post_post   on public.post_category_post(post_id);
create index idx_post_post_tag_post        on public.post_post_tag(post_id);
create index idx_comment_post              on public.comment(post_id, created_at);
create index idx_comment_parent            on public.comment(parent_comment_id);
