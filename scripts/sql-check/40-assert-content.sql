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
  insert into public.article (article_status_id, canonical_slug, published_at, embargo_until)
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
    'article_checklist_state', 'media_asset_rights', 'article_preview_token',
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
  insert into public.subscriber (email_address, locale)
  values ('canary@example.test', 'en')
  on conflict (email_address) do nothing;

  select count(*) into v_before from public.subscriber;
  if v_before = 0 then
    raise exception 'could not seed a subscriber row, so the delete check would be vacuous';
  end if;

  set local role anon;

  begin
    insert into public.subscriber (email_address, locale) values ('attacker@example.test', 'en');
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
    insert into public.section (slug, ordinal) values ('anon-owned', 999);
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
declare v_subscriber bigint;
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

  -- An unknown newsletter is an error rather than a silent no-op, so a typo in a form does
  -- not look like a successful signup.
  set local role anon;
  begin
    perform public.content_subscribe('reader@example.test', 'no-such-newsletter', 'en');
    raise exception 'content_subscribe accepted an unknown newsletter';
  exception when raise_exception then
    null;
  end;
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
