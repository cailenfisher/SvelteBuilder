-- =============================================================================
-- @sveltebuilder/blog — Seed Data
-- blog_seed.sql
--
-- Populates:
--   1. UI copy (scope = 'blog') — all application-level text strings
--   2. Sample data — 3 published posts, 2 categories, 3 tags, 2 comments
--
-- Entity text pattern:
--   slug = field name (e.g. 'title', 'name'), scope = table name,
--   entity_id = bigint PK of the entity.
--   e.g. slug='title', scope='post', entity_id=1
--
-- Sample data uses OVERRIDING SYSTEM VALUE to set explicit bigint IDs (1, 2, 3)
-- so that subsequent local_text_link inserts can reference them directly.
--
-- Locale assumption: 'en' and 'fr' exist in public.locale (from hermes seed).
-- Run hermes base seed before this file.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. UI COPY — scope: 'blog'
-- ---------------------------------------------------------------------------
insert into public.local_text_link (slug, scope, entity_id) values
  ('blog.post.list.title',           'blog', null),
  ('blog.post.list.empty',           'blog', null),
  ('blog.post.detail.not_found',     'blog', null),
  ('blog.post.detail.comment_count', 'blog', null),
  ('blog.comment.form.title',        'blog', null),
  ('blog.comment.form.body.label',   'blog', null),
  ('blog.comment.form.submit',       'blog', null),
  ('blog.comment.form.cancel',       'blog', null),
  ('blog.comment.pending',           'blog', null),
  ('blog.admin.post.list.title',     'blog', null),
  ('blog.admin.post.new',            'blog', null),
  ('blog.admin.post.edit',           'blog', null),
  ('blog.admin.post.delete',         'blog', null),
  ('blog.admin.post.publish',        'blog', null),
  ('blog.admin.post.unpublish',      'blog', null),
  ('blog.admin.post.save_draft',     'blog', null),
  ('blog.admin.category.list.title', 'blog', null),
  ('blog.admin.tag.list.title',      'blog', null),
  ('blog.status.draft',              'blog', null),
  ('blog.status.review',             'blog', null),
  ('blog.status.published',          'blog', null),
  ('blog.status.archived',           'blog', null),
  ('blog.reading_time',              'blog', null),
  ('blog.post.by',                   'blog', null),
  ('blog.post.updated',              'blog', null)
on conflict do nothing;

-- English UI copy
insert into public.local_text (link, locale, content)
select l.id,
       (select id from public.locale where code = 'en'),
       v.content
from (values
  ('blog.post.list.title',           'Blog'),
  ('blog.post.list.empty',           'No posts yet.'),
  ('blog.post.detail.not_found',     'Post not found.'),
  ('blog.post.detail.comment_count', '{count} comments'),
  ('blog.comment.form.title',        'Leave a comment'),
  ('blog.comment.form.body.label',   'Comment'),
  ('blog.comment.form.submit',       'Post comment'),
  ('blog.comment.form.cancel',       'Cancel'),
  ('blog.comment.pending',           'Your comment is awaiting moderation.'),
  ('blog.admin.post.list.title',     'Posts'),
  ('blog.admin.post.new',            'New post'),
  ('blog.admin.post.edit',           'Edit post'),
  ('blog.admin.post.delete',         'Delete post'),
  ('blog.admin.post.publish',        'Publish'),
  ('blog.admin.post.unpublish',      'Unpublish'),
  ('blog.admin.post.save_draft',     'Save draft'),
  ('blog.admin.category.list.title', 'Categories'),
  ('blog.admin.tag.list.title',      'Tags'),
  ('blog.status.draft',              'Draft'),
  ('blog.status.review',             'In review'),
  ('blog.status.published',          'Published'),
  ('blog.status.archived',           'Archived'),
  ('blog.reading_time',              '{minutes} min read'),
  ('blog.post.by',                   'By {author}'),
  ('blog.post.updated',              'Updated {date}')
) as v(slug, content)
join public.local_text_link l
  on l.slug = v.slug and l.scope = 'blog' and l.entity_id is null
on conflict (link, locale) do nothing;

-- French UI copy
insert into public.local_text (link, locale, content)
select l.id,
       (select id from public.locale where code = 'fr'),
       v.content
from (values
  ('blog.post.list.title',           'Blog'),
  ('blog.post.list.empty',           'Aucun article pour l''instant.'),
  ('blog.post.detail.not_found',     'Article introuvable.'),
  ('blog.post.detail.comment_count', '{count} commentaires'),
  ('blog.comment.form.title',        'Laisser un commentaire'),
  ('blog.comment.form.body.label',   'Commentaire'),
  ('blog.comment.form.submit',       'Publier le commentaire'),
  ('blog.comment.form.cancel',       'Annuler'),
  ('blog.comment.pending',           'Votre commentaire est en attente de modération.'),
  ('blog.admin.post.list.title',     'Articles'),
  ('blog.admin.post.new',            'Nouvel article'),
  ('blog.admin.post.edit',           'Modifier l''article'),
  ('blog.admin.post.delete',         'Supprimer l''article'),
  ('blog.admin.post.publish',        'Publier'),
  ('blog.admin.post.unpublish',      'Dépublier'),
  ('blog.admin.post.save_draft',     'Enregistrer le brouillon'),
  ('blog.admin.category.list.title', 'Catégories'),
  ('blog.admin.tag.list.title',      'Tags'),
  ('blog.status.draft',              'Brouillon'),
  ('blog.status.review',             'En révision'),
  ('blog.status.published',          'Publié'),
  ('blog.status.archived',           'Archivé'),
  ('blog.reading_time',              '{minutes} min de lecture'),
  ('blog.post.by',                   'Par {author}'),
  ('blog.post.updated',              'Mis à jour le {date}')
) as v(slug, content)
join public.local_text_link l
  on l.slug = v.slug and l.scope = 'blog' and l.entity_id is null
on conflict (link, locale) do nothing;

-- ---------------------------------------------------------------------------
-- 2. SAMPLE DATA
-- ---------------------------------------------------------------------------

-- Sample user (placeholder — replace with real auth.users id in production)
-- Seed assumes user_account with id '00000000-0000-0000-0000-000000000001' exists.

-- ---------------------------------------------------------------------------
-- Categories (IDs 1, 2)
-- ---------------------------------------------------------------------------
insert into public.post_category (id, slug, active, sort_order) overriding system value values
  (1, 'technology', true, 1),
  (2, 'design',     true, 2)
on conflict (id) do nothing;

-- Category name links — slug='name', scope='post_category', entity_id=category.id
insert into public.local_text_link (slug, scope, entity_id) values
  ('name', 'post_category', 1),
  ('name', 'post_category', 2)
on conflict (slug, scope, entity_id) do nothing;

insert into public.local_text (link, locale, content)
select l.id,
       (select id from public.locale where code = 'en'),
       v.content
from (values
  (1::bigint, 'Technology'),
  (2::bigint, 'Design')
) as v(entity_id, content)
join public.local_text_link l
  on l.slug = 'name' and l.scope = 'post_category' and l.entity_id = v.entity_id
on conflict (link, locale) do nothing;

insert into public.local_text (link, locale, content)
select l.id,
       (select id from public.locale where code = 'fr'),
       v.content
from (values
  (1::bigint, 'Technologie'),
  (2::bigint, 'Design')
) as v(entity_id, content)
join public.local_text_link l
  on l.slug = 'name' and l.scope = 'post_category' and l.entity_id = v.entity_id
on conflict (link, locale) do nothing;

-- ---------------------------------------------------------------------------
-- Tags (IDs 1, 2, 3)
-- ---------------------------------------------------------------------------
insert into public.post_tag (id, slug, active) overriding system value values
  (1, 'svelte',    true),
  (2, 'web-dev',   true),
  (3, 'ui-design', true)
on conflict (id) do nothing;

-- Tag name links
insert into public.local_text_link (slug, scope, entity_id) values
  ('name', 'post_tag', 1),
  ('name', 'post_tag', 2),
  ('name', 'post_tag', 3)
on conflict (slug, scope, entity_id) do nothing;

insert into public.local_text (link, locale, content)
select l.id,
       (select id from public.locale where code = 'en'),
       v.content
from (values
  (1::bigint, 'Svelte'),
  (2::bigint, 'Web Dev'),
  (3::bigint, 'UI Design')
) as v(entity_id, content)
join public.local_text_link l
  on l.slug = 'name' and l.scope = 'post_tag' and l.entity_id = v.entity_id
on conflict (link, locale) do nothing;

insert into public.local_text (link, locale, content)
select l.id,
       (select id from public.locale where code = 'fr'),
       v.content
from (values
  (1::bigint, 'Svelte'),
  (2::bigint, 'Développement Web'),
  (3::bigint, 'Design UI')
) as v(entity_id, content)
join public.local_text_link l
  on l.slug = 'name' and l.scope = 'post_tag' and l.entity_id = v.entity_id
on conflict (link, locale) do nothing;

-- ---------------------------------------------------------------------------
-- Posts (IDs 1, 2, 3)
-- ---------------------------------------------------------------------------
insert into public.post (id, slug, user_account_id, status, featured, allow_comment, reading_time_minute, published_at) overriding system value values
  (
    1,
    'building-with-svelte-5-runes',
    '00000000-0000-0000-0000-000000000001',
    'published', true, true, 5,
    '2026-01-15 10:00:00+00'
  ),
  (
    2,
    'design-systems-at-scale-lessons-learned',
    '00000000-0000-0000-0000-000000000001',
    'published', false, true, 8,
    '2026-02-20 14:30:00+00'
  ),
  (
    3,
    'sveltekit-routing-patterns-for-multilingual-apps',
    '00000000-0000-0000-0000-000000000001',
    'published', false, true, 3,
    '2026-03-10 09:15:00+00'
  )
on conflict (id) do nothing;

-- Post copy links — slug = field name, scope = 'post', entity_id = post.id
insert into public.local_text_link (slug, scope, entity_id) values
  ('title',   'post', 1),
  ('excerpt', 'post', 1),
  ('body',    'post', 1),
  ('title',   'post', 2),
  ('excerpt', 'post', 2),
  ('body',    'post', 2),
  ('title',   'post', 3),
  ('excerpt', 'post', 3),
  ('body',    'post', 3)
on conflict (slug, scope, entity_id) do nothing;

-- English post copy
insert into public.local_text (link, locale, content)
select l.id,
       (select id from public.locale where code = 'en'),
       v.content
from (values
  ('title',   1::bigint, 'Building with Svelte 5 Runes'),
  ('excerpt', 1::bigint, 'Svelte 5 introduces runes — a new reactivity primitive that replaces the old reactive declarations. This post explores what changes and what stays the same.'),
  ('body',    1::bigint, '<p>Svelte 5 represents the most significant evolution of the framework since its inception. The introduction of runes — $state, $derived, $effect, and $props — provides an explicit, composable reactivity model that works both inside and outside of Svelte components.</p><p>One of the biggest practical changes is how you declare reactive state. Where previously you wrote <code>let count = 0</code> and Svelte inferred reactivity from the context, you now write <code>let count = $state(0)</code> to make the intent explicit. This seemingly small change has large implications for tooling, mental models, and library interoperability.</p><p>The $derived rune replaces reactive declarations (<code>$: doubled = count * 2</code>) with <code>let doubled = $derived(count * 2)</code>. The semantics are the same but the syntax is consistent with other runes and works in any JavaScript module.</p>'),
  ('title',   2::bigint, 'Design Systems at Scale: Lessons Learned'),
  ('excerpt', 2::bigint, 'After building component libraries for several large products, patterns emerge. Here are the decisions that aged well — and the ones that didn''t.'),
  ('body',    2::bigint, '<p>A design system is never finished. It is a living agreement between design and engineering about how a product should feel, behave, and grow. When that agreement breaks down — usually under deadline pressure — inconsistencies creep in and compound over time.</p><p>The single most important decision in a design system is the token layer. Tokens create a layer of indirection between raw values and their usage: instead of <code>#1e293b</code> appearing 400 times across your codebase, you reference <code>var(--color-text-primary)</code>. This makes theming, dark mode, and brand updates tractable.</p><p>The second most important decision is what NOT to build. A design system component should encode a constraint, not just a style. A Button component that accepts any CSS class is not a constraint — it is a styled div with extra steps. The constraint is that buttons look and behave consistently everywhere they appear, which requires saying no to one-off variations.</p>'),
  ('title',   3::bigint, 'SvelteKit Routing Patterns for Multilingual Apps'),
  ('excerpt', 3::bigint, 'Handling multiple languages in SvelteKit requires decisions at the routing, data loading, and rendering layers. This post maps out the tradeoffs.'),
  ('body',    3::bigint, '<p>There are three main approaches to multilingual routing in SvelteKit: prefix-based routes (<code>/en/about</code>, <code>/fr/about</code>), cookie or header negotiation with a single URL space, and subdomain routing (<code>en.example.com</code>). Each has tradeoffs in SEO, cache behaviour, and implementation complexity.</p><p>Prefix-based routing is the most SEO-friendly approach because each locale gets a distinct canonical URL that crawlers can index independently. The downside is that all routes must be duplicated under each locale prefix, which increases route maintenance overhead.</p><p>The SvelteBuilder approach uses cookie and Accept-Language header negotiation. The locale is resolved in a server hook and stored in event.locals, making it available to all load functions without URL changes. hreflang alternate links are added in the page head so search engines understand the locale relationship between pages.</p>')
) as v(slug, entity_id, content)
join public.local_text_link l
  on l.slug = v.slug and l.scope = 'post' and l.entity_id = v.entity_id
on conflict (link, locale) do nothing;

-- French post copy
insert into public.local_text (link, locale, content)
select l.id,
       (select id from public.locale where code = 'fr'),
       v.content
from (values
  ('title',   1::bigint, 'Construire avec les Runes de Svelte 5'),
  ('excerpt', 1::bigint, 'Svelte 5 introduit les runes — une nouvelle primitive de réactivité qui remplace les anciennes déclarations réactives. Cet article explore ce qui change et ce qui reste identique.'),
  ('body',    1::bigint, '<p>Svelte 5 représente l''évolution la plus significative du framework depuis sa création. L''introduction des runes — $state, $derived, $effect et $props — fournit un modèle de réactivité explicite et composable qui fonctionne à la fois dans et hors des composants Svelte.</p><p>L''un des changements pratiques les plus importants concerne la façon de déclarer l''état réactif. Là où auparavant on écrivait <code>let count = 0</code> et Svelte inférait la réactivité depuis le contexte, on écrit maintenant <code>let count = $state(0)</code> pour rendre l''intention explicite.</p>'),
  ('title',   2::bigint, 'Systèmes de Design à Grande Échelle : Leçons Apprises'),
  ('excerpt', 2::bigint, 'Après avoir construit des bibliothèques de composants pour plusieurs grands produits, des patterns émergent. Voici les décisions qui ont bien vieilli — et celles qui n''ont pas.'),
  ('body',    2::bigint, '<p>Un système de design n''est jamais terminé. C''est un accord vivant entre le design et l''ingénierie sur la façon dont un produit doit se sentir, se comporter et évoluer. Quand cet accord se rompt — généralement sous la pression des délais — des incohérences s''infiltrent et s''accumulent avec le temps.</p><p>La décision la plus importante dans un système de design est la couche de tokens. Les tokens créent une couche d''indirection entre les valeurs brutes et leur utilisation.</p>'),
  ('title',   3::bigint, 'Patterns de Routage SvelteKit pour Applications Multilingues'),
  ('excerpt', 3::bigint, 'La gestion de plusieurs langues dans SvelteKit nécessite des décisions au niveau du routage, du chargement des données et du rendu. Cet article cartographie les compromis.'),
  ('body',    3::bigint, '<p>Il existe trois approches principales pour le routage multilingue dans SvelteKit : les routes préfixées (<code>/fr/a-propos</code>), la négociation par cookie ou en-tête avec un espace URL unique, et le routage par sous-domaine. Chaque approche présente des compromis en termes de SEO, de comportement de cache et de complexité d''implémentation.</p><p>L''approche SvelteBuilder utilise la négociation par cookie et l''en-tête Accept-Language. La locale est résolue dans un hook serveur et stockée dans event.locals.</p>')
) as v(slug, entity_id, content)
join public.local_text_link l
  on l.slug = v.slug and l.scope = 'post' and l.entity_id = v.entity_id
on conflict (link, locale) do nothing;

-- Post ↔ category links
insert into public.post_category_post (post_category_id, post_id) values
  (1, 1),  -- technology → post 1
  (1, 2),  -- technology → post 2
  (2, 2),  -- design     → post 2
  (1, 3)   -- technology → post 3
on conflict do nothing;

-- Post ↔ tag links
insert into public.post_post_tag (post_id, post_tag_id) values
  (1, 1),  -- post 1 → svelte
  (1, 2),  -- post 1 → web-dev
  (2, 3),  -- post 2 → ui-design
  (3, 1),  -- post 3 → svelte
  (3, 2)   -- post 3 → web-dev
on conflict do nothing;

-- Sample approved comments on post 1
-- SCOPE DEVIATION: body is stored directly — not a LocalText link.
insert into public.comment (post_id, user_account_id, body, approved) values
  (
    1,
    '00000000-0000-0000-0000-000000000001',
    'Great overview! The $derived rune especially changes how I think about computed state. Looking forward to migrating our app.',
    true
  ),
  (
    1,
    '00000000-0000-0000-0000-000000000001',
    'The explicit syntax took some getting used to, but once it clicks the mental model is much cleaner than the old reactive label approach.',
    true
  )
on conflict do nothing;
