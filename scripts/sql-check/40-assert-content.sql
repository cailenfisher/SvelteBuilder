-- Content-specific expectations. Skipped entirely when the module was not selected, so one
-- assertion set can run against any scaffold.
--
-- The point of most of this is the access model. Every table in this module had RLS disabled
-- until 2026-10-01, so these are the first checks that any of its data is protected at all,
-- and they are written from the attacker's side: what can a caller holding only the
-- publishable key actually reach?

-- ── The seed landed, and the one slug code depends on exists ─────────────────

do $$
declare v_count integer;
begin
  if to_regclass('public.article_status') is null then
    raise notice 'content not installed — skipping';
    return;
  end if;

  -- 'published' is the single slug with meaning in code: the public read policy and every
  -- public query test for it by name. Without it the module is inert rather than empty,
  -- which is the state it shipped in before it had a seed at all.
  if not exists (select 1 from public.article_status where slug = 'published') then
    raise exception 'no article_status row with slug ''published'' — nothing can be published';
  end if;

  select count(*) into v_count from public.publisher_profile;
  if v_count = 0 then
    raise exception 'no publisher_profile — the feeds and JSON-LD have no publisher identity';
  end if;

  -- Every seeded entity whose name lives in the i18n tables must actually have one, or it
  -- renders as the [missing: …] sentinel wherever it appears.
  select count(*) into v_count
  from public.article_status s
  where not exists (
    select 1 from public.local_text_link l
    where l.slug = 'name' and l.scope = 'article_status' and l.entity_id = s.id
  );
  if v_count > 0 then raise exception '% article_status row(s) have no name link', v_count; end if;

  select count(*) into v_count
  from public.section s
  where not exists (
    select 1 from public.local_text_link l
    where l.slug = 'name' and l.scope = 'section' and l.entity_id = s.id
  );
  if v_count > 0 then raise exception '% section(s) have no name link', v_count; end if;
end $$;

-- ── A reader sees published articles and nothing else ────────────────────────

do $$
declare
  v_visible   integer;
  v_draft_id  bigint;
  v_block_id  bigint;
begin
  if to_regclass('public.article') is null then return; end if;

  -- Set up a draft as the owner, so RLS is not in the way of arranging the test.
  insert into public.article (article_status_id, canonical_slug)
  values ((select id from public.article_status where slug = 'draft'), 'sqlcheck-secret-draft')
  on conflict (canonical_slug) do nothing;

  select id into v_draft_id from public.article where canonical_slug = 'sqlcheck-secret-draft';

  insert into public.article_block (article_id, block_type, position, content)
  values (v_draft_id, 'paragraph', 0, '{}'::jsonb)
  returning id into v_block_id;

  -- An embargoed-but-published article: published status, embargo in the future. It must be
  -- as invisible as a draft, which is the whole reason the column exists.
  insert into public.article (article_status_id, canonical_slug, published_at, embargo_expires_at)
  values (
    (select id from public.article_status where slug = 'published'),
    'sqlcheck-embargoed',
    now(),
    now() + interval '1 day'
  )
  on conflict (canonical_slug) do nothing;

  -- A soft-deleted published article, which must also stay hidden.
  insert into public.article (article_status_id, canonical_slug, published_at, deleted_at)
  values (
    (select id from public.article_status where slug = 'published'),
    'sqlcheck-deleted',
    now(),
    now()
  )
  on conflict (canonical_slug) do nothing;

  set local role anon;

  if exists (select 1 from public.article where canonical_slug = 'sqlcheck-secret-draft') then
    raise exception 'anon can read a draft article';
  end if;
  if exists (select 1 from public.article where canonical_slug = 'sqlcheck-embargoed') then
    raise exception 'anon can read an embargoed article before its embargo lifts';
  end if;
  if exists (select 1 from public.article where canonical_slug = 'sqlcheck-deleted') then
    raise exception 'anon can read a soft-deleted article';
  end if;

  -- The seeded sample article is published and unembargoed, so it must be readable — a
  -- policy that hides everything would otherwise pass every check above.
  select count(*) into v_visible from public.article;
  if v_visible = 0 then
    raise exception 'anon can read no articles at all — the read policy is too narrow';
  end if;

  -- A draft's body must not leak through the block table either.
  if exists (select 1 from public.article_block where id = v_block_id) then
    raise exception 'anon can read the blocks of a draft article';
  end if;
end $$;

-- ── Editorial workflow, licensing, secrets and PII are closed ────────────────

do $$
declare
  v_table text;
  v_rows  integer;
begin
  if to_regclass('public.article_revision') is null then return; end if;

  set local role anon;

  -- Each of these returns zero rows for anon not because they are empty but because no
  -- policy admits anon at all. Revisions hold unpublished drafts; preview tokens are the
  -- credentials that unlock them; subscriber is PII.
  foreach v_table in array array[
    'article_revision', 'article_assignment', 'publish_checklist_item',
    'article_checklist_state', 'media_asset_rights', 'media_asset_source',
    'article_preview_token',
    'subscriber', 'newsletter_subscription'
  ] loop
    execute format('select count(*) from public.%I', v_table) into v_rows;
    if v_rows <> 0 then
      raise exception 'anon can read %, which should admit admins only', v_table;
    end if;
  end loop;

  -- publish_checklist_item is seeded, so "zero rows" above proves a policy is refusing rather
  -- than the table merely being empty. Confirm that, otherwise the loop is vacuous — and
  -- reset the role first, because `set local role` holds for the rest of the block and the
  -- owner is who needs to do the counting.
  reset role;
  if (select count(*) from public.publish_checklist_item) = 0 then
    raise exception 'publish_checklist_item appears empty to the owner — the seed did not run';
  end if;
end $$;

-- And the writes. This is the exploit that was verified against the module before it had any
-- policies: as anon, inserting and then deleting every row of subscriber both succeeded.
do $$
declare
  v_before integer;
  v_after  integer;
begin
  if to_regclass('public.subscriber') is null then return; end if;

  -- Seed a row to delete, as the owner, so the delete check has something to destroy. Without
  -- this the table could be empty and "nothing was deleted" would prove nothing.
  insert into public.subscriber (email_address, locale_id)
  values ('canary@example.test', (select id from public.locale where code = 'en'))
  on conflict (email_address) do nothing;

  select count(*) into v_before from public.subscriber;
  if v_before = 0 then
    raise exception 'could not seed a subscriber row, so the delete check would be vacuous';
  end if;

  set local role anon;

  begin
    insert into public.subscriber (email_address, locale_id)
      values ('attacker@example.test', (select id from public.locale where code = 'en'));
    raise exception 'anon INSERTED into subscriber — the PII table is writable';
  exception when insufficient_privilege then
    null; -- refused, as intended
  end;

  -- A DELETE that RLS forbids affects zero rows rather than raising, so the row count is the
  -- only thing that distinguishes "refused" from "deleted everything". Counting as the owner
  -- afterwards, because as anon the table reads empty either way.
  begin
    delete from public.subscriber;
  exception when insufficient_privilege then
    null;
  end;

  reset role;
  select count(*) into v_after from public.subscriber;
  if v_after <> v_before then
    raise exception 'anon DELETED % subscriber row(s)', v_before - v_after;
  end if;

  set local role anon;
  begin
    insert into public.section (slug, position) values ('anon-owned', 999);
    raise exception 'anon INSERTED a section — public taxonomy is writable';
  exception when insufficient_privilege then
    null;
  end;
end $$;

-- ── Comments: readable when approved, submittable only as pending ────────────

do $$
declare
  v_article bigint;
  v_pending bigint;
begin
  if to_regclass('public.comment') is null then return; end if;

  select id into v_article
  from public.article
  where canonical_slug = 'welcome-to-sveltebuilder-content';

  insert into public.comment (article_id, author_name, author_email, body, status)
  values (v_article, 'Pending Person', 'pending@example.test', 'awaiting moderation', 'pending')
  returning id into v_pending;

  insert into public.comment (article_id, author_name, author_email, body, status)
  values (v_article, 'Approved Person', 'approved@example.test', 'published comment', 'approved');

  set local role anon;

  if exists (select 1 from public.comment where id = v_pending) then
    raise exception 'anon can read a pending comment — moderation is visible to readers';
  end if;
  if not exists (select 1 from public.comment where status = 'approved') then
    raise exception 'anon cannot read approved comments, so no article can show any';
  end if;

  -- Submitting is allowed, but only as pending: the with check on status is what stops a
  -- submitter approving their own comment by posting the field.
  insert into public.comment (article_id, author_name, author_email, body, status)
  values (v_article, 'Visitor', 'visitor@example.test', 'a new comment', 'pending');

  begin
    insert into public.comment (article_id, author_name, author_email, body, status)
    values (v_article, 'Sneaky', 'sneaky@example.test', 'self-approved', 'approved');
    raise exception 'anon submitted a pre-approved comment';
  exception when insufficient_privilege then
    null; -- refused, as intended
  end;
end $$;

-- ── Newsletter signup works without granting anon the PII table ──────────────

do $$
declare
  v_subscriber bigint;
  v_refused    boolean := false;
begin
  if to_regclass('public.subscriber') is null then return; end if;

  set local role anon;

  -- The function is how a signup form reaches a table anon cannot touch.
  perform public.content_subscribe('reader@example.test', 'daily-briefing', 'fr');

  -- Idempotent: signing up twice is not an error and does not duplicate the subscription.
  perform public.content_subscribe('reader@example.test', 'daily-briefing', 'fr');

  reset role;

  select id into v_subscriber from public.subscriber where email_address = 'reader@example.test';
  if v_subscriber is null then
    raise exception 'content_subscribe did not create the subscriber';
  end if;
  if (select count(*) from public.newsletter_subscription where subscriber_id = v_subscriber) <> 1 then
    raise exception 'content_subscribe did not create exactly one subscription';
  end if;

  -- The language is stored as a locale row, the one the reader chose.
  if (select l.code from public.subscriber s join public.locale l on l.id = s.locale_id
      where s.id = v_subscriber) is distinct from 'fr' then
    raise exception 'content_subscribe did not store the chosen locale';
  end if;

  -- A code the project does not have falls back to English instead of failing the signup.
  set local role anon;
  perform public.content_subscribe('reader@example.test', 'daily-briefing', 'xx');
  reset role;
  if (select l.code from public.subscriber s join public.locale l on l.id = s.locale_id
      where s.id = v_subscriber) is distinct from 'en' then
    raise exception 'content_subscribe did not fall back to en for an unknown locale code';
  end if;

  -- An unknown newsletter is an error rather than a silent no-op, so a typo in a form does
  -- not look like a successful signup. The flag, not a raise inside the block, records the
  -- outcome: a raise there would be caught by the handler meant for the function's own error.
  set local role anon;
  begin
    perform public.content_subscribe('reader@example.test', 'no-such-newsletter', 'en');
  exception when raise_exception then
    v_refused := true;
  end;
  reset role;
  if not v_refused then
    raise exception 'content_subscribe accepted an unknown newsletter';
  end if;
end $$;

-- ── Preview by token shows a draft, and only to whoever holds the token ──────

do $$
declare
  v_draft bigint;
  v_token text := 'sqlcheck-preview-token';
begin
  if to_regclass('public.article_preview_token') is null then return; end if;

  select id into v_draft from public.article where canonical_slug = 'sqlcheck-secret-draft';

  insert into public.article_preview_token (article_id, token, expires_at)
  values (v_draft, v_token, now() + interval '1 hour')
  on conflict (token) do nothing;

  insert into public.article_preview_token (article_id, token, expires_at)
  values (v_draft, 'sqlcheck-expired-token', now() - interval '1 hour')
  on conflict (token) do nothing;

  set local role anon;

  -- The token is the credential: with it, the draft is readable even though the read policy
  -- hides it, and even for a caller who is not signed in at all.
  if not exists (select 1 from public.content_preview_article(v_token)) then
    raise exception 'a valid preview token does not resolve its article';
  end if;
  if not exists (select 1 from public.content_preview_blocks(v_token)) then
    raise exception 'a valid preview token does not resolve its blocks';
  end if;

  -- An expired token resolves nothing, and neither does a guess.
  if exists (select 1 from public.content_preview_article('sqlcheck-expired-token')) then
    raise exception 'an expired preview token still resolves its article';
  end if;
  if exists (select 1 from public.content_preview_article('not-a-real-token')) then
    raise exception 'an unknown preview token resolves something';
  end if;

  -- And holding no token gets nothing: the token table itself stays closed, so drafts are
  -- not enumerable by listing outstanding links.
  if exists (select 1 from public.article_preview_token) then
    raise exception 'anon can list preview tokens, making every draft with a link readable';
  end if;
end $$;

-- ── Media: one rights row per asset, the public projection, the atomic writes ─

do $$
declare
  v_admin       bigint;
  v_admin_sub   uuid;
  v_member_sub  uuid;
  v_locale      bigint;
  v_cc          bigint;
  v_reserved    bigint;
  v_rows        integer;
  v_license_url text;
begin
  if to_regclass('public.media_asset_source') is null then return; end if;

  select ua.id, ua.auth_user_id into v_admin, v_admin_sub
  from public.user_account ua where ua.admin order by ua.id limit 1;
  select ua.auth_user_id into v_member_sub
  from public.user_account ua where not ua.admin order by ua.id limit 1;
  select id into v_locale from public.locale where code = 'en';

  -- Arranged as the owner; the assertions below run as the roles under test.
  insert into public.media_asset (media_type, storage_key, mime_type, user_account_id)
  values ('image', 'sqlcheck/cc.jpg', 'image/jpeg', v_admin) returning id into v_cc;
  insert into public.media_asset (media_type, storage_key, mime_type, user_account_id)
  values ('image', 'sqlcheck/reserved.jpg', 'image/jpeg', v_admin) returning id into v_reserved;

  insert into public.media_asset_rights (media_asset_id, license) values (v_cc, 'creative_commons');
  insert into public.media_asset_rights (media_asset_id, license) values (v_reserved, 'all_rights_reserved');

  -- One rights row per asset: this is what lets set_media_asset_rights use `on conflict`.
  begin
    insert into public.media_asset_rights (media_asset_id, license) values (v_cc, 'royalty_free');
    raise exception 'a second media_asset_rights row for one asset was accepted';
  exception when unique_violation then
    null;
  end;

  insert into public.media_asset_source (media_asset_id, source_url, license_url)
  values (v_cc, 'https://commons.example/cc', 'https://creativecommons.org/licenses/by/4.0/'),
         (v_reserved, 'https://vendor.example/secret-page', null);

  set local role anon;

  -- The projection carries the Creative Commons asset's two URLs...
  select license_url into v_license_url
  from public.media_asset_attribution where media_asset_id = v_cc;
  if v_license_url is distinct from 'https://creativecommons.org/licenses/by/4.0/' then
    raise exception 'anon cannot read a Creative Commons asset''s attribution through the view';
  end if;

  -- ...and nothing about a license that is not meant to be attributed in public.
  if exists (select 1 from public.media_asset_attribution where media_asset_id = v_reserved) then
    raise exception 'the attribution view exposes an all_rights_reserved asset''s source';
  end if;

  -- The tables behind it stay closed.
  select count(*) into v_rows from public.media_asset_source;
  if v_rows <> 0 then raise exception 'anon can read media_asset_source directly'; end if;
  select count(*) into v_rows from public.media_asset_rights;
  if v_rows <> 0 then raise exception 'anon can read media_asset_rights directly'; end if;

  -- The write functions are invoker-security: a non-admin is refused by RLS inside them.
  reset role;
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', v_member_sub::text, true);
  begin
    perform public.create_media_asset('image', 'sqlcheck/member.jpg', 'image/jpeg', 'royalty_free');
    raise exception 'a non-admin created a media asset through create_media_asset';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform public.set_media_asset_rights(v_cc, 'public_domain');
    raise exception 'a non-admin changed an asset''s rights through set_media_asset_rights';
  exception when insufficient_privilege then
    null;
  end;

  -- An admin writes the asset, its rights, its source and its copy in one call, and re-running
  -- the rights write updates in place.
  reset role;
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', v_admin_sub::text, true);
  declare v_new bigint;
  begin
    v_new := public.create_media_asset(
      'image', 'sqlcheck/created.jpg', 'image/jpeg', 'creative_commons',
      p_source_url => 'https://commons.example/created',
      p_license_url => 'https://creativecommons.org/licenses/by-sa/2.0/',
      p_locale_id => v_locale,
      p_alt_text => 'Alt', p_caption => 'Caption', p_credit => 'Credit'
    );
    perform public.set_media_asset_rights(v_new, 'creative_commons', true, null,
      'https://commons.example/created-2', 'https://creativecommons.org/licenses/by-sa/2.0/');

    reset role;
    if (select count(*) from public.media_asset_rights where media_asset_id = v_new) <> 1 then
      raise exception 'set_media_asset_rights did not update in place';
    end if;
    if (select source_url from public.media_asset_source where media_asset_id = v_new)
       <> 'https://commons.example/created-2' then
      raise exception 'set_media_asset_rights did not update the source';
    end if;
    if (select count(*) from public.local_text_link l
        join public.local_text t on t.link = l.id
        where l.scope = 'media_asset' and l.entity_id = v_new
          and l.slug in ('alt_text', 'caption', 'credit')) <> 3 then
      raise exception 'create_media_asset did not write all three pieces of copy';
    end if;

    -- A blank source URL removes the source row.
    perform public.set_media_asset_rights(v_new, 'creative_commons', true, null, '');
    if exists (select 1 from public.media_asset_source where media_asset_id = v_new) then
      raise exception 'a blank source URL left a source row behind';
    end if;
  end;
end $$;

-- ══ Access control (docs/ACCESS-CONTROL.md §7, §9) ════════════════════════════
--
-- Content's adoption of roles and permissions, impersonating each kind of staff member:
--   …d001 Writer (content_writer, everywhere)     …d002 Editor (content_editor, everywhere)
--   …d003 Contributor on article A only            …d004 signed in, holds nothing
--   …d005 assigned to article A as copy editor, holds no role
-- Articles A and B are drafts made for this block, each with one paragraph. Fixtures are made as
-- the owner and removed at the end.

insert into auth.users (id, email)
select ('dddddddd-0000-4000-8000-00000000d00' || n)::uuid, 'content-' || n || '@example.test'
from generate_series(1, 5) as n
on conflict (id) do nothing;

do $$
declare
  n integer;
begin
  if to_regclass('public.article') is null then return; end if;
  for n in 1..5 loop
    set local role authenticated;
    perform set_config('request.jwt.claim.sub', 'dddddddd-0000-4000-8000-00000000d00' || n, true);
    perform public.ensure_user_account();
    reset role;
  end loop;
end $$;

create function pg_temp.account_id(p_n integer) returns bigint language sql stable security definer as $$
  select ua.id from public.user_account ua
  where ua.auth_user_id = ('dddddddd-0000-4000-8000-00000000d00' || p_n)::uuid
$$;

create function pg_temp.sign_in(p_n integer) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', 'dddddddd-0000-4000-8000-00000000d00' || p_n, true);
end $$;

create function pg_temp.sign_in_admin() returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
end $$;

create function pg_temp.article_id(p_letter text) returns bigint language plpgsql stable security definer as $$
begin
  -- Called from declarations, which run before a block's own module check.
  if to_regclass('public.article') is null then return null; end if;
  return (select id from public.article where canonical_slug = 'sqlcheck-access-' || p_letter);
end $$;

create function pg_temp.role_id(p_slug text) returns integer language sql stable security definer as $$
  select id from public.role where slug = p_slug
$$;

do $$
declare
  v_draft bigint;
begin
  if to_regclass('public.article') is null then return; end if;
  v_draft := (select id from public.article_status where slug = 'draft');
  insert into public.article (article_status_id, canonical_slug) values
    (v_draft, 'sqlcheck-access-a'), (v_draft, 'sqlcheck-access-b');
  insert into public.article_block (article_id, block_type, position)
  select a.id, 'paragraph', 1 from public.article a where a.canonical_slug like 'sqlcheck-access-%';

  insert into public.role_assignment (role_id, user_account_id, scope) values
    (pg_temp.role_id('content_writer'), pg_temp.account_id(1), null),
    (pg_temp.role_id('content_editor'), pg_temp.account_id(2), null);
  insert into public.article_role_assignment (article_id, role_id, user_account_id)
  values (pg_temp.article_id('a'), pg_temp.role_id('content_contributor'), pg_temp.account_id(3));
  insert into public.article_assignment (article_id, user_account_id, article_assignment_role)
  values (pg_temp.article_id('a'), pg_temp.account_id(5), 'copy');
end $$;

-- ── Who reaches the admin area (A24) ──────────────────────────────────────────

do $$
begin
  if to_regclass('public.article') is null then return; end if;
  perform pg_temp.sign_in(4);
  if cardinality(public.current_user_scopes()) <> 0 then
    raise exception 'a user with no role holds scopes: %', public.current_user_scopes();
  end if;

  perform pg_temp.sign_in(1);
  if not (public.current_user_scopes() @> array['article', 'media_asset']) then
    raise exception 'a Writer does not hold article and media_asset: %', public.current_user_scopes();
  end if;
  if 'section' = any (public.current_user_scopes()) then
    raise exception 'a Writer holds section';
  end if;

  -- A role on a single article is enough to be staff for articles.
  perform pg_temp.sign_in(3);
  if public.current_user_scopes() <> array['article'] then
    raise exception 'a Contributor on one article does not hold exactly article: %', public.current_user_scopes();
  end if;
end $$;

-- ── Drafts: nobody without access, and edits only where allowed ──────────────

do $$
declare
  v_a bigint := pg_temp.article_id('a');
  v_b bigint := pg_temp.article_id('b');
  v_rows integer;
begin
  if to_regclass('public.article') is null then return; end if;
  perform pg_temp.sign_in(4);
  if exists (select 1 from public.article where id in (v_a, v_b)) then
    raise exception 'a user with no role reads a draft';
  end if;
  update public.article set comment_allowed = false where id = v_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'a user with no role updated a draft'; end if;

  -- A Contributor on A edits A and its body, and nothing of B (A18).
  perform pg_temp.sign_in(3);
  update public.article set comment_allowed = false where id = v_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'a Contributor on A cannot edit A'; end if;
  update public.article_block set position = 2 where article_id = v_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'a Contributor on A cannot edit A''s body'; end if;
  update public.article_block set position = 2 where article_id = v_b;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'a Contributor on A edited B''s body'; end if;
  delete from public.article where id = v_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'a Contributor deleted an article'; end if;

  -- Assigned to A: reads and edits A and its body, not B.
  perform pg_temp.sign_in(5);
  if not exists (select 1 from public.article where id = v_a) then
    raise exception 'an assigned copy editor cannot read their article';
  end if;
  update public.article_block set position = 3 where article_id = v_a;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'an assigned copy editor cannot edit their article''s body'; end if;
  update public.article set comment_allowed = true where id = v_b;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'an assigned copy editor edited an article they are not on'; end if;
end $$;

-- ── Publishing (A19) ──────────────────────────────────────────────────────────

do $$
declare
  v_a bigint := pg_temp.article_id('a');
begin
  if to_regclass('public.article') is null then return; end if;
  -- Satisfy the checklist first, so only permission stands between anyone and publishing below.
  insert into public.article_checklist_state (article_id, publish_checklist_item_id, satisfied)
  select v_a, i.id, true from public.publish_checklist_item i;

  -- Moving a draft along is editing; publishing is not.
  perform pg_temp.sign_in(5);
  perform public.content_transition_article_status(v_a, 'in_review');
  begin
    perform public.content_transition_article_status(v_a, 'published');
    raise exception 'an assigned copy editor published';
  exception when insufficient_privilege then null;
  end;

  -- Nobody, an administrator included, sets the status without the function.
  perform pg_temp.sign_in_admin();
  begin
    update public.article set article_status_id = (select id from public.article_status where slug = 'published')
    where id = v_a;
    raise exception 'an administrator set article_status_id directly, skipping the checklist';
  exception when insufficient_privilege then null;
  end;

  -- The Editor publishes, and only the Editor unpublishes.
  perform pg_temp.sign_in(2);
  perform public.content_transition_article_status(v_a, 'published');

  perform pg_temp.sign_in(5);
  begin
    perform public.content_transition_article_status(v_a, 'draft');
    raise exception 'an assigned copy editor unpublished';
  exception when insufficient_privilege then null;
  end;

  perform pg_temp.sign_in(2);
  perform public.content_transition_article_status(v_a, 'draft');
end $$;

do $$
declare
  v_column text;
begin
  if to_regclass('public.article') is null then return; end if;
  -- Every column of article is updatable but the two the workflow function owns, and the identity.
  for v_column in
    select attname from pg_attribute
    where attrelid = 'public.article'::regclass and attnum > 0 and not attisdropped
  loop
    if v_column in ('id', 'article_status_id', 'published_at') then
      if has_column_privilege('authenticated', 'public.article', v_column, 'UPDATE') then
        raise exception 'article.% is directly updatable', v_column;
      end if;
    elsif not has_column_privilege('authenticated', 'public.article', v_column, 'UPDATE') then
      raise exception 'article.% is not in the column grant: add it in 02-content-rls.sql', v_column;
    end if;
  end loop;
end $$;

-- ── Creating: the Writer becomes the author, and nothing arrives published ────

do $$
declare
  v_new bigint;
  v_rows integer;
begin
  if to_regclass('public.article') is null then return; end if;
  perform pg_temp.sign_in(1);
  v_new := public.content_create_article(
    'sqlcheck-access-writer', (select id from public.locale where code = 'en'), 'A Writer''s story');

  if not exists (
    select 1 from public.article_assignment
    where article_id = v_new and user_account_id = pg_temp.account_id(1) and article_assignment_role = 'author'
  ) then
    raise exception 'creating an article did not make the Writer its author';
  end if;
  update public.article set comment_allowed = false where id = v_new;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'a Writer cannot edit the article they created'; end if;

  begin
    perform public.content_transition_article_status(v_new, 'published');
    raise exception 'a Writer published';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.article (article_status_id, canonical_slug, published_at)
    values ((select id from public.article_status where slug = 'published'), 'sqlcheck-access-sneaky', now());
    raise exception 'a Writer inserted an article already published';
  exception when insufficient_privilege then null;
  end;

  perform pg_temp.sign_in(4);
  begin
    perform public.content_create_article(
      'sqlcheck-access-nobody', (select id from public.locale where code = 'en'), 'No');
    raise exception 'a user with no role created an article';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ── Assigning is giving access (A13) ──────────────────────────────────────────

do $$
declare
  v_a bigint := pg_temp.article_id('a');
begin
  if to_regclass('public.article') is null then return; end if;
  -- The Contributor may edit A but not share it, so may not assign anyone to it.
  perform pg_temp.sign_in(3);
  begin
    insert into public.article_assignment (article_id, user_account_id, article_assignment_role)
    values (v_a, pg_temp.account_id(4), 'author');
    raise exception 'a Contributor assigned someone to an article';
  exception when insufficient_privilege then null;
  end;

  -- Being assigned is not enough either.
  perform pg_temp.sign_in(5);
  begin
    insert into public.article_assignment (article_id, user_account_id, article_assignment_role)
    values (v_a, pg_temp.account_id(4), 'photo');
    raise exception 'an assigned copy editor assigned someone else';
  exception when insufficient_privilege then null;
  end;

  -- The Editor may.
  perform pg_temp.sign_in(2);
  insert into public.article_assignment (article_id, user_account_id, article_assignment_role)
  values (v_a, pg_temp.account_id(4), 'photo');
end $$;

-- ── Scope tables, and comment addresses ──────────────────────────────────────

do $$
begin
  if to_regclass('public.article') is null then return; end if;
  perform pg_temp.sign_in(1);
  begin
    insert into public.section (slug, position) values ('sqlcheck-access-section', 999);
    raise exception 'a Writer created a section';
  exception when insufficient_privilege then null;
  end;

  perform pg_temp.sign_in(2);
  insert into public.section (slug, position) values ('sqlcheck-access-section', 999);

  -- A commenter's email address is readable by nobody through the API (Clarion finding 6).
  if has_column_privilege('anon', 'public.comment', 'author_email', 'SELECT')
     or has_column_privilege('authenticated', 'public.comment', 'author_email', 'SELECT') then
    raise exception 'comment.author_email is selectable through the API';
  end if;
  if not has_column_privilege('anon', 'public.comment', 'body', 'SELECT') then
    raise exception 'comment.body is not selectable, so approved comments cannot be shown';
  end if;
  set local role anon;
  begin
    perform author_email from public.comment limit 1;
    raise exception 'anon read comment.author_email';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ── Cleanup ───────────────────────────────────────────────────────────────────

do $$
begin
  if to_regclass('public.article') is null then return; end if;
  delete from public.local_text using public.local_text_link l
  where local_text.link = l.id and l.scope = 'article'
    and l.entity_id in (select id from public.article where canonical_slug like 'sqlcheck-access-%');
  delete from public.local_text_link
  where scope = 'article'
    and entity_id in (select id from public.article where canonical_slug like 'sqlcheck-access-%');
  delete from public.article where canonical_slug like 'sqlcheck-access-%';
  delete from public.section where slug = 'sqlcheck-access-section';
  delete from public.role_assignment where user_account_id in (pg_temp.account_id(1), pg_temp.account_id(2));
  delete from public.user_account where auth_user_id::text like 'dddddddd-0000-4000-8000-00000000d00%';
  delete from auth.users where id::text like 'dddddddd-0000-4000-8000-00000000d00%';
end $$;
