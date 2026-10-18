-- Content module RLS
--
-- Every table this module creates had row level security DISABLED until now, which with
-- Supabase's bootstrap grants (all privileges on public tables to anon and authenticated)
-- meant anyone holding the publishable key could read and write all 27 of them —
-- `subscriber` and `comment` included. Verified exploitable before writing this file: as
-- the anon role, inserting and then deleting every row of `subscriber` both succeeded.
--
-- Conventions, matching superprototype's 03-base-rls.sql:
--   1. Helpers are called as `(select public.current_user_admin())`, never bare, so the
--      planner hoists them into an InitPlan evaluated once per statement.
--   2. Every policy names its roles with `to`, so a policy cannot silently apply to a role
--      nobody considered.
--   3. Admin gating goes through public.current_user_admin() rather than an inline
--      `exists (select 1 from public.user_account …)`, which would run as the caller and so
--      depend on user_account's own read policy staying as it is.
--
-- The access model in one paragraph: published editorial content is world-readable;
-- everything else is governed by permissions (docs/ACCESS-CONTROL.md), which an administrator
-- holds in full. Articles are access-controlled per row as well (`article_role_assignment`),
-- and anyone assigned to an article (article_assignment) may read and edit it, without publishing,
-- deleting or sharing it. An article's blocks, bylines, taxonomy links, revisions, checklist,
-- preview links and live coverage follow the article (A18). Sections, topics, tags, fronts,
-- media and newsletters are governed per scope. Comments are world-readable once approved,
-- world-insertable as pending, and moderated with `comment.moderate`; a commenter's email
-- address is readable by no one through the API. The publish checklist's items, subscribers
-- and subscriptions stay administrator-only: configuration and reader PII. Newsletter signup
-- goes through a SECURITY DEFINER function rather than granting anon any access to `subscriber`.
--
-- This file applies after access-generated.sql, which defines
-- current_user_article_ids() for the `article` scope declared in this module's manifest.

-- ── Visibility helper ─────────────────────────────────────────────────────────
--
-- The public-visibility rule for an article, in one place: not soft-deleted, status
-- 'published', and past any embargo. It is the same predicate the module's own queries
-- used, so a row the application considered public is exactly a row RLS now admits.
--
-- SECURITY DEFINER is load-bearing twice over. It keeps the function from re-entering
-- `article`'s own policy — which would be infinite recursion for the policy that calls it —
-- and it lets a dependent table (a block, a byline) ask about an article the caller may not
-- otherwise read. STABLE and `set search_path = ''` for the usual reasons.
create or replace function public.content_article_public(p_article_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.article a
    join public.article_status s on s.id = a.article_status_id
    where a.id = p_article_id
      and a.deleted_at is null
      and s.slug = 'published'
      and (a.embargo_expires_at is null or a.embargo_expires_at <= now())
  )
$$;

grant execute on function public.content_article_public(bigint) to anon, authenticated;

-- ── Articles the current user is assigned to ─────────────────────────────────
--
-- Being assigned to an article (as its author, editor, photo or copy editor) lets you read and
-- edit it: the newsroom's own record of who works on what, read as a predicate rather than
-- copied into grants (A13). It does not let you publish, delete or share the article.
--
-- Hoisted like the access helpers: called as `(select …)::bigint[]` with no row-dependent
-- argument, it runs once per statement. SECURITY DEFINER so it can read article_assignment,
-- whose own policies call it.
create or replace function public.content_assigned_article_ids()
returns bigint[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct aa.article_id), '{}')
  from public.article_assignment aa
  where aa.user_account_id = (select public.current_user_id())
$$;

revoke execute on function public.content_assigned_article_ids() from public, anon;
grant execute on function public.content_assigned_article_ids() to authenticated;

-- ── Public taxonomy and chrome ────────────────────────────────────────────────
--
-- Read by anyone. None of these carry anything that is not already on the page: a section's
-- name, a tag, the publisher's own profile. article_status is in this group because every
-- public query resolves the slug 'published' through it — with it unreadable, the site shows
-- nothing at all.
--
-- article_status, author_profile and publisher_profile are written by administrators. The rest
-- are permission scopes declared in this module's manifest: writing one takes that scope's
-- `create`, `update` or `delete`. A front's slots follow the front.

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'article_status', 'section', 'topic', 'tag', 'author_profile', 'publisher_profile',
    'media_asset', 'newsletter', 'front', 'front_slot'
  ] loop
    execute format('alter table public.%I enable row level security', v_table);

    execute format('drop policy if exists %I on public.%I',
      'content_' || v_table || '_public_read', v_table);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      'content_' || v_table || '_public_read', v_table);

    execute format('drop policy if exists %I on public.%I',
      'content_' || v_table || '_admin', v_table);
  end loop;

  foreach v_table in array array['article_status', 'author_profile', 'publisher_profile'] loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using ((select public.current_user_admin()))
         with check ((select public.current_user_admin()))',
      'content_' || v_table || '_admin', v_table);
  end loop;

  foreach v_table in array array['section', 'topic', 'tag', 'media_asset', 'newsletter', 'front'] loop
    execute format('drop policy if exists %I on public.%I', 'content_' || v_table || '_insert', v_table);
    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check ((select public.current_user_can(%L, %L)))',
      'content_' || v_table || '_insert', v_table, v_table, 'create');

    execute format('drop policy if exists %I on public.%I', 'content_' || v_table || '_update', v_table);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using ((select public.current_user_can(%L, %L)))
         with check ((select public.current_user_can(%L, %L)))',
      'content_' || v_table || '_update', v_table, v_table, 'update', v_table, 'update');

    execute format('drop policy if exists %I on public.%I', 'content_' || v_table || '_delete', v_table);
    execute format(
      'create policy %I on public.%I for delete to authenticated
         using ((select public.current_user_can(%L, %L)))',
      'content_' || v_table || '_delete', v_table, v_table, 'delete');
  end loop;
end $$;

drop policy if exists "content_front_slot_write" on public.front_slot;
create policy "content_front_slot_write" on public.front_slot for all to authenticated
  using ((select public.current_user_can('front', 'update')))
  with check ((select public.current_user_can('front', 'update')));

-- ── Articles ──────────────────────────────────────────────────────────────────

alter table public.article enable row level security;

drop policy if exists "content_article_public_read" on public.article;
-- Inlined rather than calling content_article_public(id): the predicate is on this table's
-- own columns, so inlining lets the planner use the status and embargo indexes, and the
-- status lookup is an uncorrelated subselect evaluated once per statement. A correlated
-- function call per row would defeat both.
create policy "content_article_public_read" on public.article for select to anon, authenticated
  using (
    deleted_at is null
    and (embargo_expires_at is null or embargo_expires_at <= now())
    and article_status_id = (select id from public.article_status where slug = 'published')
  );

drop policy if exists "content_article_admin" on public.article;

-- Staff: by permission, everywhere or on this article, or by being assigned to it.
drop policy if exists "content_article_read" on public.article;
create policy "content_article_read" on public.article for select to authenticated
  using (
    (select public.current_user_can('article', 'read'))
    or id = any ((select public.current_user_article_ids('read'))::bigint[])
    or id = any ((select public.content_assigned_article_ids())::bigint[])
  );

-- A new article may not arrive already published, unless its creator may publish (A19). An
-- insert's `with check` sees the whole new row, so this needs no column grant.
drop policy if exists "content_article_insert" on public.article;
create policy "content_article_insert" on public.article for insert to authenticated
  with check (
    (select public.current_user_can('article', 'create'))
    and (
      (select public.current_user_can('article', 'publish'))
      or (
        published_at is null
        and article_status_id <> (select id from public.article_status where slug = 'published')
      )
    )
  );

drop policy if exists "content_article_update" on public.article;
create policy "content_article_update" on public.article for update to authenticated
  using (
    (select public.current_user_can('article', 'update'))
    or id = any ((select public.current_user_article_ids('update'))::bigint[])
    or id = any ((select public.content_assigned_article_ids())::bigint[])
  )
  with check (
    (select public.current_user_can('article', 'update'))
    or id = any ((select public.current_user_article_ids('update'))::bigint[])
    or id = any ((select public.content_assigned_article_ids())::bigint[])
  );

drop policy if exists "content_article_delete" on public.article;
create policy "content_article_delete" on public.article for delete to authenticated
  using (
    (select public.current_user_can('article', 'delete'))
    or id = any ((select public.current_user_article_ids('delete'))::bigint[])
  );

-- Status and the date it went live change only through content_transition_article_status,
-- which checks `article.publish` itself (A19). RLS sees a row, not the columns an UPDATE
-- touches, so the table-level UPDATE privilege is rebuilt per column: every column but those
-- two, and the identity. A column added to article later is not updatable until it is added
-- here; sql:check (40-assert-content.sql) fails until then.
revoke update on public.article from anon, authenticated;
grant update (
  canonical_slug, updated_at, deleted_at, embargo_expires_at, comment_allowed,
  lead_media_asset_id, created_at
) on public.article to authenticated;

-- ── Per-article content, visible exactly when its article is ──────────────────
--
-- Blocks, bylines and the join rows to taxonomy. Each is readable by the public only through a
-- publicly visible article, so an unpublished draft leaks neither its body nor the fact that it
-- is filed under a particular topic. Staff read and write them exactly as they may read and
-- edit the article (A18): an article's body is part of the article, not a second thing to
-- grant.

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'article_block', 'article_byline', 'article_section', 'article_topic', 'article_tag'
  ] loop
    execute format('alter table public.%I enable row level security', v_table);

    execute format('drop policy if exists %I on public.%I',
      'content_' || v_table || '_public_read', v_table);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated
         using ((select public.content_article_public(article_id)))',
      'content_' || v_table || '_public_read', v_table);

    execute format('drop policy if exists %I on public.%I',
      'content_' || v_table || '_admin', v_table);
  end loop;
end $$;

-- The policies every child of an article carries, for staff. `p_table` holds an article_id.
do $$
declare
  v_table text;
  v_read  text := $p$
    (select public.current_user_can('article', 'read'))
    or article_id = any ((select public.current_user_article_ids('read'))::bigint[])
    or article_id = any ((select public.content_assigned_article_ids())::bigint[])
  $p$;
  v_edit  text := $p$
    (select public.current_user_can('article', 'update'))
    or article_id = any ((select public.current_user_article_ids('update'))::bigint[])
    or article_id = any ((select public.content_assigned_article_ids())::bigint[])
  $p$;
begin
  foreach v_table in array array[
    'article_block', 'article_byline', 'article_section', 'article_topic', 'article_tag',
    'article_revision', 'article_checklist_state', 'article_preview_token', 'live_coverage'
  ] loop
    execute format('alter table public.%I enable row level security', v_table);

    execute format('drop policy if exists %I on public.%I', 'content_' || v_table || '_read', v_table);
    execute format('create policy %I on public.%I for select to authenticated using (%s)',
      'content_' || v_table || '_read', v_table, v_read);

    execute format('drop policy if exists %I on public.%I', 'content_' || v_table || '_write', v_table);
    execute format('create policy %I on public.%I for all to authenticated using (%s) with check (%s)',
      'content_' || v_table || '_write', v_table, v_edit, v_edit);
  end loop;
end $$;

-- ── Live coverage ─────────────────────────────────────────────────────────────
--
-- A live blog hangs off an article, and its updates off the coverage. Both follow the
-- article's visibility: coverage of an embargoed story must not be readable before the
-- story is.

alter table public.live_coverage enable row level security;

drop policy if exists "content_live_coverage_public_read" on public.live_coverage;
create policy "content_live_coverage_public_read" on public.live_coverage
  for select to anon, authenticated
  using ((select public.content_article_public(article_id)));

-- Staff policies for live_coverage are the per-article ones above (A18).
drop policy if exists "content_live_coverage_admin" on public.live_coverage;

alter table public.live_update enable row level security;

drop policy if exists "content_live_update_public_read" on public.live_update;
create policy "content_live_update_public_read" on public.live_update
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.live_coverage c
      where c.id = live_coverage_id
        and (select public.content_article_public(c.article_id))
    )
  );

-- An update follows its coverage's article. The coverage row is read under its own policies,
-- which is the point: a staff member who cannot see the coverage cannot touch its updates.
drop policy if exists "content_live_update_admin" on public.live_update;

drop policy if exists "content_live_update_read" on public.live_update;
create policy "content_live_update_read" on public.live_update for select to authenticated
  using (
    exists (
      select 1 from public.live_coverage c
      where c.id = live_coverage_id
        and (
          (select public.current_user_can('article', 'read'))
          or c.article_id = any ((select public.current_user_article_ids('read'))::bigint[])
          or c.article_id = any ((select public.content_assigned_article_ids())::bigint[])
        )
    )
  );

drop policy if exists "content_live_update_write" on public.live_update;
create policy "content_live_update_write" on public.live_update for all to authenticated
  using (
    exists (
      select 1 from public.live_coverage c
      where c.id = live_coverage_id
        and (
          (select public.current_user_can('article', 'update'))
          or c.article_id = any ((select public.current_user_article_ids('update'))::bigint[])
          or c.article_id = any ((select public.content_assigned_article_ids())::bigint[])
        )
    )
  )
  with check (
    exists (
      select 1 from public.live_coverage c
      where c.id = live_coverage_id
        and (
          (select public.current_user_can('article', 'update'))
          or c.article_id = any ((select public.current_user_article_ids('update'))::bigint[])
          or c.article_id = any ((select public.content_assigned_article_ids())::bigint[])
        )
    )
  );

-- ── Article assignments: a grant in everything but name (A13) ──────────────────
--
-- Being assigned to an article lets you edit it, so assigning someone is giving them access.
-- Writing an assignment therefore takes what giving access takes: `article.share` on that
-- article and `article.update` on it, so nobody hands out more than they hold. Being assigned
-- yourself is not enough: assigned staff may not assign others. Readable by anyone who may read
-- the article.

alter table public.article_assignment enable row level security;

drop policy if exists "content_article_assignment_admin" on public.article_assignment;

drop policy if exists "content_article_assignment_read" on public.article_assignment;
create policy "content_article_assignment_read" on public.article_assignment for select to authenticated
  using (
    (select public.current_user_can('article', 'read'))
    or article_id = any ((select public.current_user_article_ids('read'))::bigint[])
    or article_id = any ((select public.content_assigned_article_ids())::bigint[])
  );

drop policy if exists "content_article_assignment_write" on public.article_assignment;
create policy "content_article_assignment_write" on public.article_assignment for all to authenticated
  using (
    (
      (select public.current_user_can('article', 'share'))
      or article_id = any ((select public.current_user_article_ids('share'))::bigint[])
    )
    and (
      (select public.current_user_can('article', 'update'))
      or article_id = any ((select public.current_user_article_ids('update'))::bigint[])
    )
  )
  with check (
    (
      (select public.current_user_can('article', 'share'))
      or article_id = any ((select public.current_user_article_ids('share'))::bigint[])
    )
    and (
      (select public.current_user_can('article', 'update'))
      or article_id = any ((select public.current_user_article_ids('update'))::bigint[])
    )
  );

-- ── Media licensing: follows the asset ────────────────────────────────────────
--
-- No public read of any kind: media_asset_rights holds licensing terms that are nobody else's
-- business, and media_asset_source the provenance behind them (the public face of both is the
-- media_asset_attribution view in 03-content-media.sql). Staff read them with `media_asset.read`
-- and write them as they may create or edit an asset.

do $$
declare
  v_table text;
begin
  foreach v_table in array array['media_asset_rights', 'media_asset_source'] loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format('drop policy if exists %I on public.%I', 'content_' || v_table || '_admin', v_table);

    execute format('drop policy if exists %I on public.%I', 'content_' || v_table || '_read', v_table);
    execute format(
      'create policy %I on public.%I for select to authenticated
         using ((select public.current_user_can(%L, %L)))',
      'content_' || v_table || '_read', v_table, 'media_asset', 'read');

    execute format('drop policy if exists %I on public.%I', 'content_' || v_table || '_write', v_table);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using ((select public.current_user_can(%L, %L)) or (select public.current_user_can(%L, %L)))
         with check ((select public.current_user_can(%L, %L)) or (select public.current_user_can(%L, %L)))',
      'content_' || v_table || '_write', v_table,
      'media_asset', 'create', 'media_asset', 'update', 'media_asset', 'create', 'media_asset', 'update');
  end loop;
end $$;

-- ── Configuration and reader PII: administrators only ─────────────────────────
--
-- The publish checklist's items are configuration; subscribers and their subscriptions are
-- reader PII. No permission reaches them. The tables that used to share this block (revisions,
-- checklist state, preview tokens) follow their article now, above; their old admin policies
-- are dropped here so an upgraded database does not keep them beside the new ones.

drop policy if exists "content_article_revision_admin" on public.article_revision;
drop policy if exists "content_article_checklist_state_admin" on public.article_checklist_state;
drop policy if exists "content_article_preview_token_admin" on public.article_preview_token;

do $$
declare
  v_table text;
begin
  foreach v_table in array array['publish_checklist_item', 'subscriber', 'newsletter_subscription'] loop
    execute format('alter table public.%I enable row level security', v_table);

    execute format('drop policy if exists %I on public.%I',
      'content_' || v_table || '_admin', v_table);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using ((select public.current_user_admin()))
         with check ((select public.current_user_admin()))',
      'content_' || v_table || '_admin', v_table);
  end loop;
end $$;

-- Anyone who may edit some article reads the checklist it has to pass; only administrators
-- change it.
drop policy if exists "content_publish_checklist_item_staff_read" on public.publish_checklist_item;
create policy "content_publish_checklist_item_staff_read" on public.publish_checklist_item
  for select to authenticated
  using (
    (select public.current_user_can('article', 'update'))
    or cardinality((select public.current_user_article_ids('update'))::bigint[]) > 0
    or cardinality((select public.content_assigned_article_ids())::bigint[]) > 0
  );

-- ── Comments ──────────────────────────────────────────────────────────────────

alter table public.comment enable row level security;

drop policy if exists "content_comment_public_read" on public.comment;
-- Approved comments on publicly visible articles. A pending or rejected comment is visible
-- to admins only, so moderation is not a thing readers watch happen.
create policy "content_comment_public_read" on public.comment for select to anon, authenticated
  using (status = 'approved' and (select public.content_article_public(article_id)));

drop policy if exists "content_comment_public_insert" on public.comment;
-- Anyone may submit a comment, on an article that is published and accepting them, and only
-- as pending: `with check` on the status column is what stops a submitter approving their
-- own comment by posting the field.
create policy "content_comment_public_insert" on public.comment for insert to anon, authenticated
  with check (
    status = 'pending'
    and (select public.content_article_public(article_id))
    and exists (select 1 from public.article a where a.id = article_id and a.comment_allowed)
  );

-- Staff: `comment.read` sees every comment, approved or not; `comment.moderate` changes one
-- (approves, rejects); `comment.delete` removes one.
drop policy if exists "content_comment_admin" on public.comment;

drop policy if exists "content_comment_staff_read" on public.comment;
create policy "content_comment_staff_read" on public.comment for select to authenticated
  using ((select public.current_user_can('comment', 'read')));

drop policy if exists "content_comment_moderate" on public.comment;
create policy "content_comment_moderate" on public.comment for update to authenticated
  using ((select public.current_user_can('comment', 'moderate')))
  with check ((select public.current_user_can('comment', 'moderate')));

drop policy if exists "content_comment_delete" on public.comment;
create policy "content_comment_delete" on public.comment for delete to authenticated
  using ((select public.current_user_can('comment', 'delete')));

-- A commenter's email address is readable by nobody through the Data API: not the public, not
-- staff. A row policy restricts rows, not columns, and an approved comment's row is public, so
-- with table-level SELECT `?select=author_email` returned every commenter's address to anyone
-- holding the publishable key (Clarion field test, finding 6). So SELECT is rebuilt per column,
-- leaving that one out. Submitting a comment still writes it: INSERT is untouched.
revoke select on public.comment from anon, authenticated;
grant select (
  id, article_id, user_account_id, parent_comment_id, author_name, body, status, created_at,
  updated_at
) on public.comment to anon, authenticated;

-- ── Newsletter signup ─────────────────────────────────────────────────────────
--
-- Signup needs to write `subscriber`, which anon cannot touch — deliberately, because it is
-- PII and a table anon could insert into is a table anon can probe: a unique-violation on
-- the email column answers "is this person subscribed?" for anyone who asks.
--
-- So signup goes through a definer function instead. It is idempotent, and it returns void
-- rather than an id or a status, so a caller learns nothing about whether the address was
-- already on the list.
create or replace function public.content_subscribe(
  p_email_address   text,
  p_newsletter_slug text,
  p_locale          text default 'en'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscriber_id bigint;
  v_newsletter_id bigint;
  v_locale_id     bigint;
begin
  if p_email_address is null or btrim(p_email_address) = '' then
    raise exception 'an email address is required';
  end if;

  select id into v_newsletter_id
  from public.newsletter
  where slug = p_newsletter_slug;

  if not found then
    raise exception 'no such newsletter';
  end if;

  -- An unknown or empty code falls back to English rather than failing the signup: the reader's
  -- address is what matters, and the language can be corrected later.
  select id into v_locale_id
  from public.locale
  where code = coalesce(nullif(btrim(p_locale), ''), 'en');

  if not found then
    select id into v_locale_id from public.locale where code = 'en';
    if not found then
      raise exception 'no locale to subscribe in: neither % nor en is seeded', p_locale;
    end if;
  end if;

  insert into public.subscriber (email_address, locale_id)
  values (lower(btrim(p_email_address)), v_locale_id)
  on conflict (email_address) do update set locale_id = excluded.locale_id
  returning id into v_subscriber_id;

  -- Re-subscribing clears a previous unsubscribe rather than inserting a second row.
  insert into public.newsletter_subscription (newsletter_id, subscriber_id)
  values (v_newsletter_id, v_subscriber_id)
  on conflict (newsletter_id, subscriber_id) do update set unsubscribed_at = null;
end;
$$;

grant execute on function public.content_subscribe(text, text, text) to anon, authenticated;

-- ── Creating an article ───────────────────────────────────────────────────────
--
-- An article, its headline in the creator's locale, and its creator's authorship, in one
-- transaction. The headline is what makes an article findable among its siblings, so none is
-- created without one; it is entity copy, which only this function may write for a non-admin.
-- The creator is assigned as the article's author, which is what lets a Writer, who may create articles but not edit every
-- one, keep editing what they wrote (content_assigned_article_ids). SECURITY DEFINER because
-- the caller may not write article_assignment (that takes `article.share`); it therefore checks
-- `article.create` itself, and the author is the caller's own principal, never a parameter.
--
-- The article starts at the first workflow status, which is never `published`.
drop function if exists public.content_create_article(text);

create or replace function public.content_create_article(
  p_canonical_slug text,
  p_locale_id      bigint,
  p_headline       text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_account_id bigint := (select public.current_user_id());
  v_status_id       bigint;
  v_article_id      bigint;
  v_link_id         bigint;
begin
  if v_user_account_id is null or not (select public.current_user_can('article', 'create')) then
    raise exception 'creating an article requires article.create' using errcode = '42501';
  end if;
  if p_canonical_slug is null or btrim(p_canonical_slug) = ''
     or p_headline is null or btrim(p_headline) = '' or p_locale_id is null then
    raise exception 'a canonical slug, a headline and its locale are required' using errcode = '22023';
  end if;

  select s.id into v_status_id
  from public.article_status s
  where s.slug <> 'published'
  order by s.position
  limit 1;
  if not found then
    raise exception 'no unpublished article_status to start an article in';
  end if;

  insert into public.article (article_status_id, canonical_slug)
  values (v_status_id, btrim(p_canonical_slug))
  returning id into v_article_id;

  insert into public.local_text_link (slug, scope, entity_id)
  values ('headline', 'article', v_article_id)
  returning id into v_link_id;

  insert into public.local_text (link, locale, content)
  values (v_link_id, p_locale_id, btrim(p_headline));

  insert into public.article_assignment (article_id, user_account_id, article_assignment_role)
  values (v_article_id, v_user_account_id, 'author');

  return v_article_id;
end;
$$;

revoke execute on function public.content_create_article(text, bigint, text) from public, anon;
grant execute on function public.content_create_article(text, bigint, text) to authenticated;

-- ── Moving an article through the workflow ────────────────────────────────────
--
-- Three statements: resolve the target status, enforce the publish gate, and update the
-- article — stamping published_at the first time it goes live, and only the first time, so a
-- republish does not rewrite the date the story broke.
--
-- The checklist gate lives here rather than only in the route because it is the one rule that
-- must not be bypassable: an editor posting the form directly, a script, or a future second
-- screen all go through this. The editorial checks that need resolved copy — a headline within
-- Google's length limit, a dek, a byline, alt text on every image — stay in
-- validateArticleForPublish, because SQL has no dictionary and the answer depends on which
-- locale is being published.
--
-- The only writer of article_status_id and published_at (A19): the article's UPDATE grant leaves
-- both out, so this is SECURITY DEFINER and checks the caller itself. Moving an article to or
-- from `published` takes `article.publish`, everywhere or on this article; any other move takes
-- `article.update`, or being assigned to it.
create or replace function public.content_transition_article_status(
  p_article_id  bigint,
  p_status_slug text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status_id      bigint;
  v_current_slug   text;
  v_unsatisfied    text;
  v_needs_publish  boolean;
begin
  select s.slug into v_current_slug
  from public.article a
  join public.article_status s on s.id = a.article_status_id
  where a.id = p_article_id and a.deleted_at is null;
  if not found then
    raise exception 'no article %', p_article_id using errcode = '42501';
  end if;

  select id into v_status_id from public.article_status where slug = p_status_slug;
  if not found then
    raise exception 'no article_status with slug %', p_status_slug;
  end if;

  v_needs_publish := p_status_slug = 'published' or v_current_slug = 'published';

  if v_needs_publish then
    if not (
      (select public.current_user_can('article', 'publish'))
      or p_article_id = any ((select public.current_user_article_ids('publish'))::bigint[])
    ) then
      raise exception 'publishing or unpublishing requires article.publish'
        using errcode = '42501';
    end if;
  elsif not (
    (select public.current_user_can('article', 'update'))
    or p_article_id = any ((select public.current_user_article_ids('update'))::bigint[])
    or p_article_id = any ((select public.content_assigned_article_ids())::bigint[])
  ) then
    raise exception 'changing this article''s status requires article.update'
      using errcode = '42501';
  end if;

  if p_status_slug = 'published' then
    -- An item with no state row is unsatisfied, which is why this is a left join from the
    -- required items rather than a filter over the state table: never having ticked a box is
    -- the common case, not a missing record.
    select string_agg(i.slug, ', ' order by i.position) into v_unsatisfied
    from public.publish_checklist_item i
    left join public.article_checklist_state s
      on s.publish_checklist_item_id = i.id and s.article_id = p_article_id
    where i.required and coalesce(s.satisfied, false) = false;

    if v_unsatisfied is not null then
      raise exception 'publish checklist incomplete: %', v_unsatisfied;
    end if;
  end if;

  update public.article
  set article_status_id = v_status_id,
      published_at = case
        when p_status_slug = 'published' and published_at is null then now()
        else published_at
      end
  where id = p_article_id;
end;
$$;

revoke execute on function public.content_transition_article_status(bigint, text) from public, anon;
grant execute on function
  public.content_transition_article_status(bigint, text) to authenticated;

-- ── Preview by token ──────────────────────────────────────────────────────────
--
-- A preview link has to show an article RLS otherwise hides, to someone who may not be
-- signed in at all. The token is the credential, so these take it as their argument and
-- return nothing at all for one that is unknown or expired.
--
-- Written as two functions over `article` and `article_block` rather than a read policy
-- admitting "any article with a live token", because a policy cannot see which token the
-- request presented — it would make every draft with an outstanding link world-readable.

create or replace function public.content_preview_article(p_token text)
returns setof public.article
language sql
stable
security definer
set search_path = ''
as $$
  select a.*
  from public.article a
  join public.article_preview_token t on t.article_id = a.id
  where t.token = p_token
    and t.expires_at > now()
    and a.deleted_at is null
$$;

create or replace function public.content_preview_blocks(p_token text)
returns setof public.article_block
language sql
stable
security definer
set search_path = ''
as $$
  select b.*
  from public.article_block b
  join public.article_preview_token t on t.article_id = b.article_id
  where t.token = p_token
    and t.expires_at > now()
$$;

grant execute on function public.content_preview_article(text) to anon, authenticated;
grant execute on function public.content_preview_blocks(text) to anon, authenticated;
