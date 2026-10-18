-- Seed data for @sveltebuilder/content
-- Depends on: locale table seeded (base seed), local_text_link, local_text
--
-- The module shipped with no seed at all, which made it structurally inert rather than
-- merely empty: every public query resolves the slug 'published' through article_status, and
-- with no rows in that table there is no such status, so nothing can ever be published and
-- every page renders nothing. The workflow statuses below are the minimum for the module to
-- function; the sample article is so a fresh scaffold has something to show.
--
-- Conventions, per CLAUDE.md: no manual IDs, resolve foreign keys by slug, resolve locale
-- IDs by code, `on conflict do nothing` everywhere so the seed is re-runnable.

-- ──────────────────────────────────────────────────────────────────────────────
-- Article workflow statuses
--
-- Ordinal is the workflow order, which is what the admin screens sort by. 'published' is
-- the one slug with meaning in code — the public read policy and every public query test
-- for it by name — so it must exist under exactly this spelling.
-- ──────────────────────────────────────────────────────────────────────────────

insert into article_status (slug, position) values
  ('pitch',     10),
  ('draft',     20),
  ('in_review', 30),
  ('ready',     40),
  ('published', 50),
  ('archived',  60)
on conflict (slug) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Publish checklist
--
-- The gate an article passes before publishing. `required` distinguishes a blocker from a
-- reminder; an editor can publish past an unticked optional item.
-- ──────────────────────────────────────────────────────────────────────────────

insert into publish_checklist_item (slug, position, required) values
  ('headline_approved',   10, true),
  ('copy_edited',         20, true),
  ('legal_reviewed',      30, false),
  ('images_credited',     40, true),
  ('links_checked',       50, false),
  ('seo_fields_complete', 60, false)
on conflict (slug) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Publisher identity
--
-- A singleton: the site's own identity, read by the RSS feed, the sitemaps and the
-- NewsArticle JSON-LD. No slug to conflict on, so guarded by a not-exists instead.
-- ──────────────────────────────────────────────────────────────────────────────

insert into publisher_profile (url)
select 'https://example.com'
where not exists (select 1 from publisher_profile);

-- ──────────────────────────────────────────────────────────────────────────────
-- Sections and topics
-- ──────────────────────────────────────────────────────────────────────────────

insert into section (slug, position, active) values
  ('news',     10, true),
  ('opinion',  20, true),
  ('business', 30, true),
  ('culture',  40, true)
on conflict (slug) do nothing;

insert into topic (slug, active) values
  ('local-government', true),
  ('transport',        true),
  ('housing',          true)
on conflict (slug) do nothing;

insert into tag (slug) values
  ('explainer'),
  ('investigation')
on conflict (slug) do nothing;

insert into newsletter (slug, active) values
  ('daily-briefing', true)
on conflict (slug) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- A sample published article
--
-- One article, filed in a section, with a byline and three blocks, so a fresh scaffold
-- renders a real page rather than an empty list. Published and unembargoed, so the public
-- read policy admits it.
-- ──────────────────────────────────────────────────────────────────────────────

insert into author_profile (slug, active) values
  ('sample-author', true)
on conflict (slug) do nothing;

insert into article (article_status_id, canonical_slug, published_at)
select (select id from article_status where slug = 'published'),
       'welcome-to-sveltebuilder-content',
       now()
on conflict (canonical_slug) do nothing;

insert into article_section (article_id, section_id)
select a.id, s.id
from article a, section s
where a.canonical_slug = 'welcome-to-sveltebuilder-content'
  and s.slug = 'news'
on conflict do nothing;

insert into article_byline (article_id, author_profile_id, position)
select a.id, p.id, 0
from article a, author_profile p
where a.canonical_slug = 'welcome-to-sveltebuilder-content'
  and p.slug = 'sample-author'
on conflict do nothing;

-- Blocks carry their prose in the i18n tables like everything else, so `content` holds only
-- structure. A paragraph block's text is entity-bound copy keyed by the block's own id,
-- which is why the copy inserts below join back through position.
--
-- Guarded by a not-exists rather than `on conflict do nothing`: (article_id, position) has an
-- index but no unique constraint, so there is no conflict for Postgres to detect and the
-- clause would be a silent no-op — re-running the seed would add three more blocks each time.
insert into article_block (article_id, block_type, position, content)
select a.id, v.block_type::article_block_type, v.position, '{}'::jsonb
from article a,
  (values ('heading', 0), ('paragraph', 1), ('paragraph', 2)) as v(block_type, position)
where a.canonical_slug = 'welcome-to-sveltebuilder-content'
  and not exists (
    select 1 from article_block b
    where b.article_id = a.id and b.position = v.position
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- local_text_link — entity-bound copy
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
select 'name', 'article_status', s.id from article_status s
on conflict do nothing;

insert into local_text_link (slug, scope, entity_id)
select 'label', 'publish_checklist_item', i.id from publish_checklist_item i
on conflict do nothing;

insert into local_text_link (slug, scope, entity_id)
select 'name', 'section', s.id from section s
on conflict do nothing;

insert into local_text_link (slug, scope, entity_id)
select 'name', 'topic', t.id from topic t
on conflict do nothing;

insert into local_text_link (slug, scope, entity_id)
select 'name', 'tag', t.id from tag t
on conflict do nothing;

insert into local_text_link (slug, scope, entity_id)
select 'name', 'newsletter', n.id from newsletter n
on conflict do nothing;

insert into local_text_link (slug, scope, entity_id)
select 'name', 'publisher_profile', p.id from publisher_profile p
on conflict do nothing;

insert into local_text_link (slug, scope, entity_id)
select 'name', 'author_profile', p.id from author_profile p
on conflict do nothing;

-- An article's headline, its dek and the body of each block. The slugs are what ArticleDetail
-- reads — 'headline' and 'dek' — so they are spelled out one statement each rather than
-- generated from a values list: a literal slug beside its literal scope is the form the
-- screen-bundle suite can read back, and a seed it cannot parse is a seed nothing checks.
insert into local_text_link (slug, scope, entity_id)
select 'headline', 'article', a.id from article a
where a.canonical_slug = 'welcome-to-sveltebuilder-content'
on conflict do nothing;

insert into local_text_link (slug, scope, entity_id)
select 'dek', 'article', a.id from article a
where a.canonical_slug = 'welcome-to-sveltebuilder-content'
on conflict do nothing;

insert into local_text_link (slug, scope, entity_id)
select 'text', 'article_block', b.id
from article_block b
join article a on a.id = b.article_id
where a.canonical_slug = 'welcome-to-sveltebuilder-content'
on conflict do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- English copy
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.display
from (values
  ('pitch',     'Pitch'),
  ('draft',     'Draft'),
  ('in_review', 'In review'),
  ('ready',     'Ready'),
  ('published', 'Published'),
  ('archived',  'Archived')
) as v(entity_slug, display)
join article_status s on s.slug = v.entity_slug
join local_text_link l on l.slug = 'name' and l.scope = 'article_status' and l.entity_id = s.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.display
from (values
  ('headline_approved',   'Headline approved'),
  ('copy_edited',         'Copy edited'),
  ('legal_reviewed',      'Legal reviewed'),
  ('images_credited',     'Images credited'),
  ('links_checked',       'Links checked'),
  ('seo_fields_complete', 'SEO fields complete')
) as v(entity_slug, display)
join publish_checklist_item i on i.slug = v.entity_slug
join local_text_link l
  on l.slug = 'label' and l.scope = 'publish_checklist_item' and l.entity_id = i.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.display
from (values
  ('news', 'News'), ('opinion', 'Opinion'), ('business', 'Business'), ('culture', 'Culture')
) as v(entity_slug, display)
join section s on s.slug = v.entity_slug
join local_text_link l on l.slug = 'name' and l.scope = 'section' and l.entity_id = s.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.display
from (values
  ('local-government', 'Local government'), ('transport', 'Transport'), ('housing', 'Housing')
) as v(entity_slug, display)
join topic t on t.slug = v.entity_slug
join local_text_link l on l.slug = 'name' and l.scope = 'topic' and l.entity_id = t.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.display
from (values ('explainer', 'Explainer'), ('investigation', 'Investigation')) as v(entity_slug, display)
join tag t on t.slug = v.entity_slug
join local_text_link l on l.slug = 'name' and l.scope = 'tag' and l.entity_id = t.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), 'Daily Briefing'
from newsletter n
join local_text_link l on l.slug = 'name' and l.scope = 'newsletter' and l.entity_id = n.id
where n.slug = 'daily-briefing'
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), 'The Example Post'
from publisher_profile p
join local_text_link l on l.slug = 'name' and l.scope = 'publisher_profile' and l.entity_id = p.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), 'Sample Author'
from author_profile p
join local_text_link l
  on l.slug = 'name' and l.scope = 'author_profile' and l.entity_id = p.id
where p.slug = 'sample-author'
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('headline', 'Welcome to SvelteBuilder Content'),
  ('dek',      'A sample article, seeded so a fresh scaffold has a real page to render.')
) as v(slug, content)
join article a on a.canonical_slug = 'welcome-to-sveltebuilder-content'
join local_text_link l on l.slug = v.slug and l.scope = 'article' and l.entity_id = a.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  (0, 'What this module gives you'),
  (1, 'The article you are reading is seeded data: one article, three blocks, a byline and a section. Its text lives in the i18n tables rather than in a column, which is why switching locale rewrites this paragraph rather than falling back to English.'),
  (2, 'Replace it, or delete it and write your own. The schema, the publish workflow and the feeds are the parts worth keeping.')
) as v(position, content)
join article a on a.canonical_slug = 'welcome-to-sveltebuilder-content'
join article_block b on b.article_id = a.id and b.position = v.position
join local_text_link l on l.slug = 'text' and l.scope = 'article_block' and l.entity_id = b.id
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- French copy
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.display
from (values
  ('pitch',     'Proposition'),
  ('draft',     'Brouillon'),
  ('in_review', 'En révision'),
  ('ready',     'Prêt'),
  ('published', 'Publié'),
  ('archived',  'Archivé')
) as v(entity_slug, display)
join article_status s on s.slug = v.entity_slug
join local_text_link l on l.slug = 'name' and l.scope = 'article_status' and l.entity_id = s.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.display
from (values
  ('headline_approved',   'Titre approuvé'),
  ('copy_edited',         'Texte révisé'),
  ('legal_reviewed',      'Validation juridique'),
  ('images_credited',     'Images créditées'),
  ('links_checked',       'Liens vérifiés'),
  ('seo_fields_complete', 'Champs SEO complets')
) as v(entity_slug, display)
join publish_checklist_item i on i.slug = v.entity_slug
join local_text_link l
  on l.slug = 'label' and l.scope = 'publish_checklist_item' and l.entity_id = i.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.display
from (values
  ('news', 'Actualités'), ('opinion', 'Opinion'), ('business', 'Économie'), ('culture', 'Culture')
) as v(entity_slug, display)
join section s on s.slug = v.entity_slug
join local_text_link l on l.slug = 'name' and l.scope = 'section' and l.entity_id = s.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.display
from (values
  ('local-government', 'Collectivités locales'), ('transport', 'Transport'), ('housing', 'Logement')
) as v(entity_slug, display)
join topic t on t.slug = v.entity_slug
join local_text_link l on l.slug = 'name' and l.scope = 'topic' and l.entity_id = t.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.display
from (values ('explainer', 'Explication'), ('investigation', 'Enquête')) as v(entity_slug, display)
join tag t on t.slug = v.entity_slug
join local_text_link l on l.slug = 'name' and l.scope = 'tag' and l.entity_id = t.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), 'Le point quotidien'
from newsletter n
join local_text_link l on l.slug = 'name' and l.scope = 'newsletter' and l.entity_id = n.id
where n.slug = 'daily-briefing'
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), 'The Example Post'
from publisher_profile p
join local_text_link l on l.slug = 'name' and l.scope = 'publisher_profile' and l.entity_id = p.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), 'Auteur exemple'
from author_profile p
join local_text_link l
  on l.slug = 'name' and l.scope = 'author_profile' and l.entity_id = p.id
where p.slug = 'sample-author'
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('headline', 'Bienvenue dans SvelteBuilder Content'),
  ('dek',      'Un article d''exemple, pour qu''un projet neuf ait une vraie page à afficher.')
) as v(slug, content)
join article a on a.canonical_slug = 'welcome-to-sveltebuilder-content'
join local_text_link l on l.slug = v.slug and l.scope = 'article' and l.entity_id = a.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  (0, 'Ce que ce module vous apporte'),
  (1, 'L''article que vous lisez est une donnée d''amorçage : un article, trois blocs, une signature et une rubrique. Son texte vit dans les tables i18n plutôt que dans une colonne, ce qui explique pourquoi changer de langue réécrit ce paragraphe au lieu de revenir à l''anglais.'),
  (2, 'Remplacez-le, ou supprimez-le et écrivez le vôtre. Le schéma, le flux de publication et les flux de syndication sont les parties qui méritent d''être conservées.')
) as v(position, content)
join article a on a.canonical_slug = 'welcome-to-sveltebuilder-content'
join article_block b on b.article_id = a.id and b.position = v.position
join local_text_link l on l.slug = 'text' and l.scope = 'article_block' and l.entity_id = b.id
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — article bundle
--
-- Application-level copy for this module lives under scope 'content' with a null entity_id,
-- which is what the screens load through loadScopedCopy. Entity-bound copy — a headline, a
-- block's text — is keyed by entity id instead and loaded by id, because the 'article' scope
-- is unbounded.
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('content.comment.heading',        'content', null),
  ('content.comment.leave',          'content', null),
  ('content.comment.name',           'content', null),
  ('content.comment.email',          'content', null),
  ('content.comment.body',           'content', null),
  ('content.comment.submit',         'content', null),
  ('content.comment.pending',        'content', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('content.comment.heading',        'Comments'),
  ('content.comment.leave',          'Leave a comment'),
  ('content.comment.name',           'Name'),
  ('content.comment.email',          'Email'),
  ('content.comment.body',           'Comment'),
  ('content.comment.submit',         'Submit comment'),
  ('content.comment.pending',        'Your comment has been submitted and is awaiting moderation.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('content.comment.heading',        'Commentaires'),
  ('content.comment.leave',          'Laisser un commentaire'),
  ('content.comment.name',           'Nom'),
  ('content.comment.email',          'Courriel'),
  ('content.comment.body',           'Commentaire'),
  ('content.comment.submit',         'Envoyer'),
  ('content.comment.pending',        'Votre commentaire a été envoyé et attend la modération.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

-- Copy the newsletter signup form asks for. No screen renders it yet, which is how these went
-- unseeded; tools/create/test/screen-bundle.test.ts now checks every module-scoped slug a
-- component asks for, not only the ones a screen does.

insert into local_text_link (slug, scope, entity_id)
values
  ('content.newsletter_subscription_form.signup_heading',       'content', null),
  ('content.newsletter_subscription_form.signup_description',   'content', null),
  ('content.newsletter_subscription_form.email_label',          'content', null),
  ('content.newsletter_subscription_form.email_placeholder',    'content', null),
  ('content.newsletter_subscription_form.submit_label',         'content', null),
  ('content.newsletter_subscription_form.success_message',      'content', null),
  ('content.newsletter_subscription_form.error_message',        'content', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('content.newsletter_subscription_form.signup_heading',       'Get the newsletter'),
  ('content.newsletter_subscription_form.signup_description',   'The day''s most important stories, in your inbox.'),
  ('content.newsletter_subscription_form.email_label',          'Email address'),
  ('content.newsletter_subscription_form.email_placeholder',    'you@example.com'),
  ('content.newsletter_subscription_form.submit_label',         'Subscribe'),
  ('content.newsletter_subscription_form.success_message',      'Check your inbox to confirm your subscription.'),
  ('content.newsletter_subscription_form.error_message',        'We could not subscribe that address. Please try again.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('content.newsletter_subscription_form.signup_heading',       'Recevoir l''infolettre'),
  ('content.newsletter_subscription_form.signup_description',   'L''essentiel de l''actualité du jour, dans votre boîte de réception.'),
  ('content.newsletter_subscription_form.email_label',          'Adresse courriel'),
  ('content.newsletter_subscription_form.email_placeholder',    'vous@exemple.com'),
  ('content.newsletter_subscription_form.submit_label',         'S''abonner'),
  ('content.newsletter_subscription_form.success_message',      'Consultez votre boîte de réception pour confirmer votre abonnement.'),
  ('content.newsletter_subscription_form.error_message',        'Nous n''avons pas pu abonner cette adresse. Veuillez réessayer.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

-- Copy the module's list, queue and workflow components ask for: column headings, table and
-- pagination labels, assignment role names, and the workflow panel's headings and form.

insert into local_text_link (slug, scope, entity_id)
values
  ('content.article_list.headline',              'content', null),
  ('content.article_list.status',                'content', null),
  ('content.article_list.empty',                 'content', null),
  ('content.article_list.canonical_slug',        'content', null),
  ('content.article_list.created_at',            'content', null),
  ('content.article_assignment_queue.article',   'content', null),
  ('content.article_assignment_queue.article_assignment_role', 'content', null),
  ('content.article_assignment_queue.assignee',  'content', null),
  ('content.article_assignment_queue.status',    'content', null),
  ('content.article_assignment_queue.due_at',    'content', null),
  ('content.article_assignment_queue.empty',     'content', null),
  ('content.article_assignment_role.author',     'content', null),
  ('content.article_assignment_role.editor',     'content', null),
  ('content.article_assignment_role.photo',      'content', null),
  ('content.article_assignment_role.copy',       'content', null),
  ('content.subscriber_list.email_address',      'content', null),
  ('content.subscriber_list.locale',             'content', null),
  ('content.subscriber_list.confirmed_at',       'content', null),
  ('content.subscriber_list.created_at',         'content', null),
  ('content.subscriber_list.pending',            'content', null),
  ('content.subscriber_list.empty',              'content', null),
  ('content.subscriber_list.count',              'content', null),
  ('content.pagination.label',                   'content', null),
  ('content.pagination.previous',                'content', null),
  ('content.pagination.next',                    'content', null),
  ('content.article_workflow.title',             'content', null),
  ('content.article_workflow.status',            'content', null),
  ('content.article_workflow.checklist',         'content', null),
  ('content.article_workflow.required',          'content', null),
  ('content.article_workflow.transition',        'content', null),
  ('content.article_workflow.save',              'content', null),
  ('content.article_workflow.publish_blocked',   'content', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('content.article_list.headline',              'Headline'),
  ('content.article_list.status',                'Status'),
  ('content.article_list.empty',                 'No articles found.'),
  ('content.article_list.canonical_slug',        'URL slug'),
  ('content.article_list.created_at',            'Created'),
  ('content.article_assignment_queue.article',   'Article'),
  ('content.article_assignment_queue.article_assignment_role', 'Role'),
  ('content.article_assignment_queue.assignee',  'Assignee'),
  ('content.article_assignment_queue.status',    'Status'),
  ('content.article_assignment_queue.due_at',    'Due'),
  ('content.article_assignment_queue.empty',     'No assignments in the queue.'),
  ('content.article_assignment_role.author',     'Author'),
  ('content.article_assignment_role.editor',     'Editor'),
  ('content.article_assignment_role.photo',      'Photo'),
  ('content.article_assignment_role.copy',       'Copy editing'),
  ('content.subscriber_list.email_address',      'Email address'),
  ('content.subscriber_list.locale',             'Language'),
  ('content.subscriber_list.confirmed_at',       'Confirmed'),
  ('content.subscriber_list.created_at',         'Joined'),
  ('content.subscriber_list.pending',            'Pending'),
  ('content.subscriber_list.empty',              'No subscribers yet.'),
  ('content.subscriber_list.count',              '.input {$count :number} .match $count one {{{$count} subscriber}} * {{{$count} subscribers}}'),
  ('content.pagination.label',                   'Pagination'),
  ('content.pagination.previous',                'Previous page'),
  ('content.pagination.next',                    'Next page'),
  ('content.article_workflow.title',             'Article workflow'),
  ('content.article_workflow.status',            'Status'),
  ('content.article_workflow.checklist',         'Checklist'),
  ('content.article_workflow.required',          'Required'),
  ('content.article_workflow.transition',        'Move to'),
  ('content.article_workflow.save',              'Save'),
  ('content.article_workflow.publish_blocked',   'Publishing is blocked until every required item is ticked.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('content.article_list.headline',              'Titre'),
  ('content.article_list.status',                'Statut'),
  ('content.article_list.empty',                 'Aucun article trouvé.'),
  ('content.article_list.canonical_slug',        'Identifiant d''URL'),
  ('content.article_list.created_at',            'Créé'),
  ('content.article_assignment_queue.article',   'Article'),
  ('content.article_assignment_queue.article_assignment_role', 'Rôle'),
  ('content.article_assignment_queue.assignee',  'Responsable'),
  ('content.article_assignment_queue.status',    'Statut'),
  ('content.article_assignment_queue.due_at',    'Échéance'),
  ('content.article_assignment_queue.empty',     'Aucune affectation en attente.'),
  ('content.article_assignment_role.author',     'Auteur'),
  ('content.article_assignment_role.editor',     'Éditeur'),
  ('content.article_assignment_role.photo',      'Photo'),
  ('content.article_assignment_role.copy',       'Révision'),
  ('content.subscriber_list.email_address',      'Adresse courriel'),
  ('content.subscriber_list.locale',             'Langue'),
  ('content.subscriber_list.confirmed_at',       'Confirmé'),
  ('content.subscriber_list.created_at',         'Inscrit le'),
  ('content.subscriber_list.pending',            'En attente'),
  ('content.subscriber_list.empty',              'Aucun abonné pour l''instant.'),
  ('content.subscriber_list.count',              '.input {$count :number} .match $count one {{{$count} abonné}} * {{{$count} abonnés}}'),
  ('content.pagination.label',                   'Pagination'),
  ('content.pagination.previous',                'Page précédente'),
  ('content.pagination.next',                    'Page suivante'),
  ('content.article_workflow.title',             'Flux de travail de l''article'),
  ('content.article_workflow.status',            'Statut'),
  ('content.article_workflow.checklist',         'Liste de contrôle'),
  ('content.article_workflow.required',          'Obligatoire'),
  ('content.article_workflow.transition',        'Passer à'),
  ('content.article_workflow.save',              'Enregistrer'),
  ('content.article_workflow.publish_blocked',   'La publication est bloquée tant que tous les éléments obligatoires ne sont pas cochés.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

-- Copy ArticleBlockEditor asks for: its controls, and a name for each article_block_type.

insert into local_text_link (slug, scope, entity_id)
values
  ('content.article_block_editor.region',              'content', null),
  ('content.article_block_editor.block_list',          'content', null),
  ('content.article_block_editor.block_controls',      'content', null),
  ('content.article_block_editor.move_up',             'content', null),
  ('content.article_block_editor.move_down',           'content', null),
  ('content.article_block_editor.remove',              'content', null),
  ('content.article_block_editor.heading_level',       'content', null),
  ('content.article_block_editor.text',                'content', null),
  ('content.article_block_editor.media',               'content', null),
  ('content.article_block_editor.media_selected',      'content', null),
  ('content.article_block_editor.provider',            'content', null),
  ('content.article_block_editor.provider_youtube',    'content', null),
  ('content.article_block_editor.provider_vimeo',      'content', null),
  ('content.article_block_editor.provider_self',       'content', null),
  ('content.article_block_editor.provider_twitter',    'content', null),
  ('content.article_block_editor.provider_instagram',  'content', null),
  ('content.article_block_editor.provider_other',      'content', null),
  ('content.article_block_editor.url',                 'content', null),
  ('content.article_block_editor.add',                 'content', null),
  ('content.article_block_editor.add_after',           'content', null),
  ('content.article_block_editor.add_first',           'content', null),
  ('content.article_block_editor.empty',               'content', null),
  ('content.article_block_type.paragraph',             'content', null),
  ('content.article_block_type.heading',               'content', null),
  ('content.article_block_type.image',                 'content', null),
  ('content.article_block_type.gallery',               'content', null),
  ('content.article_block_type.video',                 'content', null),
  ('content.article_block_type.embed',                 'content', null),
  ('content.article_block_type.pullquote',             'content', null),
  ('content.article_block_type.live_update',           'content', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('content.article_block_editor.region',              'Article block editor'),
  ('content.article_block_editor.block_list',          'Content blocks'),
  ('content.article_block_editor.block_controls',      'Block controls'),
  ('content.article_block_editor.move_up',             'Move block {$position} up'),
  ('content.article_block_editor.move_down',           'Move block {$position} down'),
  ('content.article_block_editor.remove',              'Remove block {$position}'),
  ('content.article_block_editor.heading_level',       'Heading level'),
  ('content.article_block_editor.text',                '{$blockType} text, block {$position}'),
  ('content.article_block_editor.media',               '{$blockType}: select a media asset in the media panel.'),
  ('content.article_block_editor.media_selected',      'Asset selected'),
  ('content.article_block_editor.provider',            'Provider'),
  ('content.article_block_editor.provider_youtube',    'YouTube'),
  ('content.article_block_editor.provider_vimeo',      'Vimeo'),
  ('content.article_block_editor.provider_self',       'Self-hosted'),
  ('content.article_block_editor.provider_twitter',    'Twitter / X'),
  ('content.article_block_editor.provider_instagram',  'Instagram'),
  ('content.article_block_editor.provider_other',      'Other'),
  ('content.article_block_editor.url',                 'URL'),
  ('content.article_block_editor.add',                 'Add block'),
  ('content.article_block_editor.add_after',           'Add block after block {$position}'),
  ('content.article_block_editor.add_first',           'Add first block'),
  ('content.article_block_editor.empty',               'No blocks yet.'),
  ('content.article_block_type.paragraph',             'Paragraph'),
  ('content.article_block_type.heading',               'Heading'),
  ('content.article_block_type.image',                 'Image'),
  ('content.article_block_type.gallery',               'Gallery'),
  ('content.article_block_type.video',                 'Video'),
  ('content.article_block_type.embed',                 'Embed'),
  ('content.article_block_type.pullquote',             'Pull quote'),
  ('content.article_block_type.live_update',           'Live update')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('content.article_block_editor.region',              'Éditeur de blocs d''article'),
  ('content.article_block_editor.block_list',          'Blocs de contenu'),
  ('content.article_block_editor.block_controls',      'Commandes du bloc'),
  ('content.article_block_editor.move_up',             'Monter le bloc {$position}'),
  ('content.article_block_editor.move_down',           'Descendre le bloc {$position}'),
  ('content.article_block_editor.remove',              'Supprimer le bloc {$position}'),
  ('content.article_block_editor.heading_level',       'Niveau de titre'),
  ('content.article_block_editor.text',                'Texte ({$blockType}), bloc {$position}'),
  ('content.article_block_editor.media',               '{$blockType} : choisissez un média dans le panneau des médias.'),
  ('content.article_block_editor.media_selected',      'Média sélectionné'),
  ('content.article_block_editor.provider',            'Fournisseur'),
  ('content.article_block_editor.provider_youtube',    'YouTube'),
  ('content.article_block_editor.provider_vimeo',      'Vimeo'),
  ('content.article_block_editor.provider_self',       'Hébergé sur le site'),
  ('content.article_block_editor.provider_twitter',    'Twitter / X'),
  ('content.article_block_editor.provider_instagram',  'Instagram'),
  ('content.article_block_editor.provider_other',      'Autre'),
  ('content.article_block_editor.url',                 'URL'),
  ('content.article_block_editor.add',                 'Ajouter un bloc'),
  ('content.article_block_editor.add_after',           'Ajouter un bloc après le bloc {$position}'),
  ('content.article_block_editor.add_first',           'Ajouter un premier bloc'),
  ('content.article_block_editor.empty',               'Aucun bloc.'),
  ('content.article_block_type.paragraph',             'Paragraphe'),
  ('content.article_block_type.heading',               'Titre'),
  ('content.article_block_type.image',                 'Image'),
  ('content.article_block_type.gallery',               'Galerie'),
  ('content.article_block_type.video',                 'Vidéo'),
  ('content.article_block_type.embed',                 'Contenu intégré'),
  ('content.article_block_type.pullquote',             'Citation en exergue'),
  ('content.article_block_type.live_update',           'Mise à jour en direct')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — section bundle
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('content.section.subsections',     'content', null),
  ('content.section.pagination',      'content', null),
  ('content.section.empty',           'content', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('content.section.subsections',     'Subsections'),
  ('content.section.pagination',      'Article pages'),
  ('content.section.empty',           'Nothing published here yet.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('content.section.subsections',     'Sous-rubriques'),
  ('content.section.pagination',      'Pages d''articles'),
  ('content.section.empty',           'Rien de publié pour le moment.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — feeds bundle
--
-- content.feed.title is a fallback for a scaffold with no publisher_profile seeded; normally a
-- feed titles itself after the publication's own name.
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('content.feed.title',              'content', null),
  ('content.feed.description',        'content', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('content.feed.title',              'Latest articles'),
  ('content.feed.description',        'The most recently published articles.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('content.feed.title',              'Derniers articles'),
  ('content.feed.description',        'Les articles les plus récemment publiés.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — preview bundle
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('content.article_preview.title_prefix',      'content', null),
  ('content.article_preview.banner',            'content', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('content.article_preview.title_prefix',      '[Preview]'),
  ('content.article_preview.banner',            'Preview mode — this article is not published.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('content.article_preview.title_prefix',      '[Aperçu]'),
  ('content.article_preview.banner',            'Mode aperçu — cet article nest pas publié.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Screen copy — article-admin bundle
-- ──────────────────────────────────────────────────────────────────────────────

insert into local_text_link (slug, scope, entity_id)
values
  ('content.article_admin.article',            'content', null),
  ('content.article_admin.new',                 'content', null),
  ('content.article_admin.create',              'content', null),
  ('content.article_admin.headline',            'content', null),
  ('content.article_admin.slug',                'content', null),
  ('content.article_admin.filter_all',          'content', null),
  ('content.article_admin.filter_status',       'content', null),
  ('content.article_admin.body',                'content', null),
  ('content.article_admin.filing',              'content', null),
  ('content.article_admin.section',            'content', null),
  ('content.article_admin.article_byline',             'content', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('content.article_admin.article',            'Articles'),
  ('content.article_admin.new',                 'New article'),
  ('content.article_admin.create',              'Create article'),
  ('content.article_admin.headline',            'Headline'),
  ('content.article_admin.slug',                'URL slug'),
  ('content.article_admin.filter_all',          'All'),
  ('content.article_admin.filter_status',       'Filter articles by status'),
  ('content.article_admin.body',                'Body'),
  ('content.article_admin.filing',              'Filing'),
  ('content.article_admin.section',            'Sections'),
  ('content.article_admin.article_byline',             'Bylines')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('content.article_admin.article',            'Articles'),
  ('content.article_admin.new',                 'Nouvel article'),
  ('content.article_admin.create',              'Créer l''article'),
  ('content.article_admin.headline',            'Titre'),
  ('content.article_admin.slug',                'Identifiant d''URL'),
  ('content.article_admin.filter_all',          'Tous'),
  ('content.article_admin.filter_status',       'Filtrer les articles par statut'),
  ('content.article_admin.body',                'Corps'),
  ('content.article_admin.filing',              'Classement'),
  ('content.article_admin.section',            'Rubriques'),
  ('content.article_admin.article_byline',             'Signatures')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

-- Copy the module's reading components ask for that was hard-coded English until 2026-10-14.

insert into local_text_link (slug, scope, entity_id)
values
  ('content.article_block_renderer.gallery', 'content', null),
  ('content.article_block_renderer.embed',   'content', null),
  ('content.article_byline_list.by',         'content', null),
  ('content.article_card.topics',            'content', null),
  ('content.article_detail.published',       'content', null),
  ('content.article_detail.updated',         'content', null),
  ('content.author_profile_detail.articles', 'content', null),
  ('content.front_detail.brief',             'content', null),
  ('content.front_curation_board.empty',     'content', null),
  ('content.front_curation_board.list',      'content', null),
  ('content.front_curation_board.move_up',   'content', null),
  ('content.front_curation_board.move_down', 'content', null),
  ('content.front_curation_board.remove',    'content', null),
  ('content.front_layout_variant.lead',      'content', null),
  ('content.front_layout_variant.secondary', 'content', null),
  ('content.front_layout_variant.river',     'content', null),
  ('content.front_layout_variant.brief',     'content', null),
  ('content.live_coverage_detail.region',    'content', null),
  ('content.live_coverage_detail.live',      'content', null),
  ('content.live_coverage_detail.ended',     'content', null),
  ('content.live_coverage_detail.pinned',    'content', null),
  ('content.live_coverage_detail.all',       'content', null),
  ('content.live_coverage_detail.empty',     'content', null),
  ('content.live_update.label',              'content', null),
  ('content.live_update.pinned_label',       'content', null),
  ('content.live_update.pinned',             'content', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('content.article_block_renderer.gallery', 'Photo gallery'),
  ('content.article_block_renderer.embed',   '{$provider} embed'),
  ('content.article_byline_list.by',         'By'),
  ('content.article_card.topics',            'Topics'),
  ('content.article_detail.published',       'Published {$date}'),
  ('content.article_detail.updated',         'Updated {$date}'),
  ('content.author_profile_detail.articles', 'Articles by {$name}'),
  ('content.front_detail.brief',             'Briefs'),
  ('content.front_curation_board.empty',     'No articles on this front.'),
  ('content.front_curation_board.list',      'Article slots on {$front}'),
  ('content.front_curation_board.move_up',   'Move {$headline} up'),
  ('content.front_curation_board.move_down', 'Move {$headline} down'),
  ('content.front_curation_board.remove',    'Remove {$headline} from the front'),
  ('content.front_layout_variant.lead',      'Lead'),
  ('content.front_layout_variant.secondary', 'Secondary'),
  ('content.front_layout_variant.river',     'River'),
  ('content.front_layout_variant.brief',     'Brief'),
  ('content.live_coverage_detail.region',    'Live coverage'),
  ('content.live_coverage_detail.live',      'Live'),
  ('content.live_coverage_detail.ended',     'Coverage ended'),
  ('content.live_coverage_detail.pinned',    'Pinned updates'),
  ('content.live_coverage_detail.all',       'All updates'),
  ('content.live_coverage_detail.empty',     'No updates yet.'),
  ('content.live_update.label',              'Live update'),
  ('content.live_update.pinned_label',       'Pinned live update'),
  ('content.live_update.pinned',             'Pinned')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('content.article_block_renderer.gallery', 'Galerie photo'),
  ('content.article_block_renderer.embed',   'Contenu intégré {$provider}'),
  ('content.article_byline_list.by',         'Par'),
  ('content.article_card.topics',            'Sujets'),
  ('content.article_detail.published',       'Publié le {$date}'),
  ('content.article_detail.updated',         'Mis à jour le {$date}'),
  ('content.author_profile_detail.articles', 'Articles de {$name}'),
  ('content.front_detail.brief',             'En bref'),
  ('content.front_curation_board.empty',     'Aucun article sur cette une.'),
  ('content.front_curation_board.list',      'Emplacements d''articles de {$front}'),
  ('content.front_curation_board.move_up',   'Monter {$headline}'),
  ('content.front_curation_board.move_down', 'Descendre {$headline}'),
  ('content.front_curation_board.remove',    'Retirer {$headline} de la une'),
  ('content.front_layout_variant.lead',      'À la une'),
  ('content.front_layout_variant.secondary', 'Secondaire'),
  ('content.front_layout_variant.river',     'Fil'),
  ('content.front_layout_variant.brief',     'Brève'),
  ('content.live_coverage_detail.region',    'Couverture en direct'),
  ('content.live_coverage_detail.live',      'En direct'),
  ('content.live_coverage_detail.ended',     'Couverture terminée'),
  ('content.live_coverage_detail.pinned',    'Mises à jour épinglées'),
  ('content.live_coverage_detail.all',       'Toutes les mises à jour'),
  ('content.live_coverage_detail.empty',     'Aucune mise à jour pour l''instant.'),
  ('content.live_update.label',              'Mise à jour en direct'),
  ('content.live_update.pinned_label',       'Mise à jour en direct épinglée'),
  ('content.live_update.pinned',             'Épinglée')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

-- Why a form action failed: each action returns one of these slugs, and the screen shows it in the
-- reader's language ($lib/server/form-error.ts, $lib/FormError/form-error.ts).

insert into local_text_link (slug, scope, entity_id)
values
  ('content.error.slug_required',           'content', null),
  ('content.error.headline_required',       'content', null),
  ('content.error.slug_in_use',             'content', null),
  ('content.error.article_create_failed',   'content', null),
  ('content.error.article_create_forbidden', 'content', null),
  ('content.error.status_required',         'content', null),
  ('content.error.status_change_forbidden', 'content', null),
  ('content.error.checklist_item_invalid',  'content', null),
  ('content.error.checklist_update_failed', 'content', null),
  ('content.error.comment_incomplete',      'content', null),
  ('content.error.comment_closed',          'content', null),
  ('content.error.comment_submit_failed',   'content', null),
  ('content.error.status_change_refused',   'content', null),
  ('content.error.not_ready_to_publish',    'content', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('content.error.slug_required',           'A URL slug is required.'),
  ('content.error.headline_required',       'A headline is required.'),
  ('content.error.slug_in_use',             'That URL slug is already in use.'),
  ('content.error.article_create_failed',   'Failed to create the article.'),
  ('content.error.article_create_forbidden', 'You may not create articles.'),
  ('content.error.status_required',         'Choose a status.'),
  ('content.error.status_change_forbidden', 'Not permitted to change this article’s status.'),
  ('content.error.checklist_item_invalid',  'Invalid checklist item.'),
  ('content.error.checklist_update_failed', 'Failed to update the checklist.'),
  ('content.error.comment_incomplete',      'Name, email and comment are all required.'),
  ('content.error.comment_closed',          'This article is not accepting comments.'),
  ('content.error.comment_submit_failed',   'Failed to submit your comment.'),
  ('content.error.status_change_refused',   'The status could not be changed.'),
  ('content.error.not_ready_to_publish',    'This article is not ready to publish.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('content.error.slug_required',           'Un identifiant d''URL est obligatoire.'),
  ('content.error.headline_required',       'Un titre est obligatoire.'),
  ('content.error.slug_in_use',             'Cet identifiant d''URL est déjà utilisé.'),
  ('content.error.article_create_failed',   'La création de l''article a échoué.'),
  ('content.error.article_create_forbidden', 'Vous n''êtes pas autorisé à créer des articles.'),
  ('content.error.status_required',         'Choisissez un statut.'),
  ('content.error.status_change_forbidden', 'Vous n''êtes pas autorisé à changer le statut de cet article.'),
  ('content.error.checklist_item_invalid',  'Élément de liste de contrôle non valide.'),
  ('content.error.checklist_update_failed', 'La mise à jour de la liste de contrôle a échoué.'),
  ('content.error.comment_incomplete',      'Le nom, l''adresse courriel et le commentaire sont obligatoires.'),
  ('content.error.comment_closed',          'Cet article n''accepte pas de commentaires.'),
  ('content.error.comment_submit_failed',   'L''envoi de votre commentaire a échoué.'),
  ('content.error.status_change_refused',   'Le statut n''a pas pu être changé.'),
  ('content.error.not_ready_to_publish',    'Cet article n''est pas prêt à être publié.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

-- Why an article cannot be published yet: validateArticleForPublish returns these slugs, and the
-- publish action formats them in the editor's language.

insert into local_text_link (slug, scope, entity_id)
values
  ('content.publish_validation.headline_required',      'content', null),
  ('content.publish_validation.headline_too_long',      'content', null),
  ('content.publish_validation.dek_required',           'content', null),
  ('content.publish_validation.byline_required',        'content', null),
  ('content.publish_validation.section_required',       'content', null),
  ('content.publish_validation.block_required',         'content', null),
  ('content.publish_validation.block_text_missing',     'content', null),
  ('content.publish_validation.image_missing',          'content', null),
  ('content.publish_validation.alt_text_missing',       'content', null),
  ('content.publish_validation.publisher_missing',      'content', null),
  ('content.publish_validation.publisher_name_missing', 'content', null),
  ('content.publish_validation.publisher_url_missing',  'content', null),
  ('content.publish_validation.published_at_offset',    'content', null),
  ('content.publish_validation.embargo_passed',         'content', null),
  ('content.publish_validation.rights_missing',         'content', null),
  ('content.publish_validation.license_url_missing',    'content', null),
  ('content.publish_validation.license_expired',        'content', null),
  ('content.publish_validation.credit_missing',         'content', null),
  ('content.publish_validation.source_missing',         'content', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('content.publish_validation.headline_required',      'The headline is missing.'),
  ('content.publish_validation.headline_too_long',      'The headline is longer than 110 characters, the Google News limit.'),
  ('content.publish_validation.dek_required',           'The dek (standfirst) is missing.'),
  ('content.publish_validation.byline_required',        'Assign at least one byline.'),
  ('content.publish_validation.section_required',       'File the article under at least one section.'),
  ('content.publish_validation.block_required',         'The article has no body.'),
  ('content.publish_validation.block_text_missing',     'Block {$position} has no text.'),
  ('content.publish_validation.image_missing',          'Image block {$position} has no image attached.'),
  ('content.publish_validation.alt_text_missing',       'Image block {$position} has no alt text, which accessibility and structured data both need.'),
  ('content.publish_validation.publisher_missing',      'No publisher profile is set up, and structured data needs one.'),
  ('content.publish_validation.publisher_name_missing', 'The publisher profile has no name.'),
  ('content.publish_validation.publisher_url_missing',  'The publisher profile has no URL.'),
  ('content.publish_validation.published_at_offset',    'The publication date {$date} has no timezone offset.'),
  ('content.publish_validation.embargo_passed',         'The embargo date has passed. Remove or extend it.'),
  ('content.publish_validation.rights_missing',         'Image block {$position} has no rights recorded.'),
  ('content.publish_validation.license_url_missing',    'Image block {$position} is Creative Commons but has no license URL.'),
  ('content.publish_validation.license_expired',        'Image block {$position} has a license that expired on {$date}.'),
  ('content.publish_validation.credit_missing',         'Image block {$position} needs a credit line written in {$locale}.'),
  ('content.publish_validation.source_missing',         'Image block {$position} has no source recorded.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('content.publish_validation.headline_required',      'Le titre est manquant.'),
  ('content.publish_validation.headline_too_long',      'Le titre dépasse 110 caractères, la limite de Google Actualités.'),
  ('content.publish_validation.dek_required',           'Le chapeau est manquant.'),
  ('content.publish_validation.byline_required',        'Attribuez au moins une signature.'),
  ('content.publish_validation.section_required',       'Classez l''article dans au moins une rubrique.'),
  ('content.publish_validation.block_required',         'L''article n''a pas de corps.'),
  ('content.publish_validation.block_text_missing',     'Le bloc {$position} n''a pas de texte.'),
  ('content.publish_validation.image_missing',          'Le bloc image {$position} n''a pas d''image.'),
  ('content.publish_validation.alt_text_missing',       'Le bloc image {$position} n''a pas de texte alternatif, nécessaire à l''accessibilité et aux données structurées.'),
  ('content.publish_validation.publisher_missing',      'Aucun profil d''éditeur n''est configuré, alors que les données structurées en ont besoin.'),
  ('content.publish_validation.publisher_name_missing', 'Le profil d''éditeur n''a pas de nom.'),
  ('content.publish_validation.publisher_url_missing',  'Le profil d''éditeur n''a pas d''URL.'),
  ('content.publish_validation.published_at_offset',    'La date de publication {$date} n''a pas de décalage horaire.'),
  ('content.publish_validation.embargo_passed',         'La date d''embargo est passée. Supprimez-la ou repoussez-la.'),
  ('content.publish_validation.rights_missing',         'Le bloc image {$position} n''a pas de droits enregistrés.'),
  ('content.publish_validation.license_url_missing',    'Le bloc image {$position} est sous licence Creative Commons mais n''a pas d''URL de licence.'),
  ('content.publish_validation.license_expired',        'La licence du bloc image {$position} a expiré le {$date}.'),
  ('content.publish_validation.credit_missing',         'Le bloc image {$position} doit avoir une mention de crédit rédigée en {$locale}.'),
  ('content.publish_validation.source_missing',         'Le bloc image {$position} n''a pas de source enregistrée.')
) as v(slug, content)
join local_text_link l on l.slug = v.slug and l.scope = 'content' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Access: the roles this module manages (docs/ACCESS-CONTROL.md §7)
-- ──────────────────────────────────────────────────────────────────────────────
--
-- A role with a slug is module-managed: its permissions are this seed's, and nobody can change
-- them in the admin screens (O6). Administrators clone one to make a version they can change.
-- The permissions themselves come from this module's manifest (`access`), written into the
-- migration by sync:supabase, so they exist before this runs.
--
--   Editor       everything content offers, including publishing, sharing and moderation.
--   Writer       reads every article, creates articles (and is made the author of each one it
--                creates, which lets it keep editing them), and uploads and edits media. Cannot
--                publish.
--   Contributor  reads and edits an article. Meant to be given on single articles, from the
--                article's access panel, to a freelancer or guest writer; given broadly it would
--                edit every article.

insert into role (slug) values
  ('content_editor'), ('content_writer'), ('content_contributor')
on conflict (slug) do nothing;

insert into role_permission (role_id, permission_id)
select r.id, p.id
from role r
join permission p on (
  (r.slug = 'content_editor' and p.scope in (
    'article', 'section', 'topic', 'tag', 'front', 'media_asset', 'newsletter', 'comment'))
  or (r.slug = 'content_writer' and (
    (p.scope = 'article' and p.action in ('read', 'create'))
    or (p.scope = 'media_asset' and p.action in ('read', 'create', 'update'))))
  or (r.slug = 'content_contributor' and p.scope = 'article' and p.action in ('read', 'update'))
)
where r.slug in ('content_editor', 'content_writer', 'content_contributor')
on conflict do nothing;

insert into local_text_link (slug, scope, entity_id)
select 'name', 'role', r.id from role r
where r.slug in ('content_editor', 'content_writer', 'content_contributor')
on conflict do nothing;

-- Labels for this module's permission scopes and its own verbs, under the access scope, where
-- the permission grid and the role assignment screens look for them.
insert into local_text_link (slug, scope, entity_id) values
  ('access.permission_scope.article',     'access', null),
  ('access.permission_scope.section',     'access', null),
  ('access.permission_scope.topic',       'access', null),
  ('access.permission_scope.tag',         'access', null),
  ('access.permission_scope.front',       'access', null),
  ('access.permission_scope.media_asset', 'access', null),
  ('access.permission_scope.newsletter',  'access', null),
  ('access.permission_scope.comment',     'access', null),
  ('access.permission_action.publish',    'access', null),
  ('access.permission_action.moderate',   'access', null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.display
from (values
  ('content_editor', 'Editor'), ('content_writer', 'Writer'), ('content_contributor', 'Contributor')
) as v(role_slug, display)
join role r on r.slug = v.role_slug
join local_text_link l on l.slug = 'name' and l.scope = 'role' and l.entity_id = r.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.display
from (values
  ('content_editor', 'Rédacteur en chef'), ('content_writer', 'Rédacteur'), ('content_contributor', 'Contributeur')
) as v(role_slug, display)
join role r on r.slug = v.role_slug
join local_text_link l on l.slug = 'name' and l.scope = 'role' and l.entity_id = r.id
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'en'), v.content
from (values
  ('access.permission_scope.article',     'access', 'Articles'),
  ('access.permission_scope.section',     'access', 'Sections'),
  ('access.permission_scope.topic',       'access', 'Topics'),
  ('access.permission_scope.tag',         'access', 'Tags'),
  ('access.permission_scope.front',       'access', 'Fronts'),
  ('access.permission_scope.media_asset', 'access', 'Media'),
  ('access.permission_scope.newsletter',  'access', 'Newsletters'),
  ('access.permission_scope.comment',     'access', 'Comments'),
  ('access.permission_action.publish',    'access', 'Publish'),
  ('access.permission_action.moderate',   'access', 'Moderate')
) as v(slug, scope, content)
join local_text_link l on l.slug = v.slug and l.scope = v.scope and l.entity_id is null
on conflict (link, locale) do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = 'fr'), v.content
from (values
  ('access.permission_scope.article',     'access', 'Articles'),
  ('access.permission_scope.section',     'access', 'Rubriques'),
  ('access.permission_scope.topic',       'access', 'Sujets'),
  ('access.permission_scope.tag',         'access', 'Mots-clés'),
  ('access.permission_scope.front',       'access', 'Unes'),
  ('access.permission_scope.media_asset', 'access', 'Médias'),
  ('access.permission_scope.newsletter',  'access', 'Infolettres'),
  ('access.permission_scope.comment',     'access', 'Commentaires'),
  ('access.permission_action.publish',    'access', 'Publier'),
  ('access.permission_action.moderate',   'access', 'Modérer')
) as v(slug, scope, content)
join local_text_link l on l.slug = v.slug and l.scope = v.scope and l.entity_id is null
on conflict (link, locale) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Admin navigation: Articles, for staff who hold anything on articles (A24)
-- ──────────────────────────────────────────────────────────────────────────────
--
-- A navigation label is global copy (scope null): the admin layout reads it from the root
-- dictionary. permission_scope 'article' shows the entry to anyone holding a role on articles,
-- broadly or on a single one, as well as to administrators.

insert into local_text_link (slug, scope, entity_id) values
  ('content.navigation.article', null, null)
on conflict do nothing;

insert into local_text (link, locale, content)
select l.id, (select id from locale where code = v.locale_code), v.content
from (values ('en', 'Articles'), ('fr', 'Articles')) as v(locale_code, content)
join local_text_link l on l.slug = 'content.navigation.article' and l.scope is null and l.entity_id is null
on conflict (link, locale) do nothing;

insert into navigation_item (local_text_link_id, href, menu, position, permission_scope)
select l.id, '/admin/content/article', 'admin', 100, 'article'
from local_text_link l
where l.slug = 'content.navigation.article' and l.scope is null and l.entity_id is null
on conflict (href, menu) do nothing;
