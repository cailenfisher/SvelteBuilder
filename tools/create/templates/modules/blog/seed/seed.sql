-- ============================================================
-- @sveltebuilder/blog — dictionary seed
-- All keys use scope = 'blog'. Entity-bound copy (post titles,
-- bodies, excerpts, category/tag names) is seeded per-entity
-- by the application, not here.
-- ============================================================

-- ── local_text_link entries ───────────────────────────────────────────────────
insert into public.local_text_link (slug, scope, entity_id) values
  -- Status labels
  ('blog.status.draft',                  'blog', null),
  ('blog.status.review',                 'blog', null),
  ('blog.status.published',              'blog', null),
  ('blog.status.archived',               'blog', null),
  -- Admin UI — post list
  ('blog.admin.post.list.title',         'blog', null),
  ('blog.admin.post.list.all',           'blog', null),
  ('blog.admin.table.title',             'blog', null),
  ('blog.admin.table.status',            'blog', null),
  ('blog.admin.table.published_at',      'blog', null),
  -- Admin UI — post actions
  ('blog.admin.post.new',                'blog', null),
  ('blog.admin.post.edit',               'blog', null),
  ('blog.admin.post.delete',             'blog', null),
  ('blog.admin.post.delete.warning',     'blog', null),
  ('blog.admin.post.publish',            'blog', null),
  ('blog.admin.post.unpublish',          'blog', null),
  ('blog.admin.post.save_draft',         'blog', null),
  -- Admin UI — post form fields
  ('blog.field.status',                  'blog', null),
  ('blog.field.reading_time_minute',     'blog', null),
  ('blog.field.featured',                'blog', null),
  ('blog.field.allow_comment',           'blog', null),
  -- Public blog
  ('blog.post.list.title',               'blog', null),
  ('blog.post.detail.comment_count',     'blog', null),
  ('blog.post.detail.sign_in_to_comment','blog', null),
  -- Comments
  ('blog.comment.form.title',            'blog', null),
  ('blog.comment.form.submit',           'blog', null),
  ('blog.comment.form.cancel',           'blog', null),
  ('blog.comment.pending',               'blog', null)
on conflict do nothing;

-- ── English copy ──────────────────────────────────────────────────────────────
insert into public.local_text (link, locale, content)
select
  l.id,
  (select id from public.locale where code = 'en'),
  l.content
from (values
  ('blog.status.draft',                  'blog', 'Draft'),
  ('blog.status.review',                 'blog', 'In review'),
  ('blog.status.published',              'blog', 'Published'),
  ('blog.status.archived',               'blog', 'Archived'),
  ('blog.admin.post.list.title',         'blog', 'Posts'),
  ('blog.admin.post.list.all',           'blog', 'All'),
  ('blog.admin.table.title',             'blog', 'Title'),
  ('blog.admin.table.status',            'blog', 'Status'),
  ('blog.admin.table.published_at',      'blog', 'Published'),
  ('blog.admin.post.new',                'blog', 'New post'),
  ('blog.admin.post.edit',               'blog', 'Edit post'),
  ('blog.admin.post.delete',             'blog', 'Delete post'),
  ('blog.admin.post.delete.warning',     'blog', 'This action cannot be undone.'),
  ('blog.admin.post.publish',            'blog', 'Publish'),
  ('blog.admin.post.unpublish',          'blog', 'Unpublish'),
  ('blog.admin.post.save_draft',         'blog', 'Save draft'),
  ('blog.field.status',                  'blog', 'Status'),
  ('blog.field.reading_time_minute',     'blog', 'Reading time (min)'),
  ('blog.field.featured',                'blog', 'Featured'),
  ('blog.field.allow_comment',           'blog', 'Allow comments'),
  ('blog.post.list.title',               'blog', 'Blog'),
  ('blog.post.detail.comment_count',     'blog', '{count} comments'),
  ('blog.post.detail.sign_in_to_comment','blog', 'Sign in to leave a comment.'),
  ('blog.comment.form.title',            'blog', 'Leave a comment'),
  ('blog.comment.form.submit',           'blog', 'Post comment'),
  ('blog.comment.form.cancel',           'blog', 'Cancel'),
  ('blog.comment.pending',               'blog', 'Your comment is pending approval.')
) as v(slug, scope, content)
join public.local_text_link l
  on l.slug = v.slug and l.scope = v.scope and l.entity_id is null
on conflict (link, locale) do nothing;

-- ── French copy ───────────────────────────────────────────────────────────────
insert into public.local_text (link, locale, content)
select
  l.id,
  (select id from public.locale where code = 'fr'),
  l.content
from (values
  ('blog.status.draft',                  'blog', 'Brouillon'),
  ('blog.status.review',                 'blog', 'En révision'),
  ('blog.status.published',              'blog', 'Publié'),
  ('blog.status.archived',               'blog', 'Archivé'),
  ('blog.admin.post.list.title',         'blog', 'Articles'),
  ('blog.admin.post.list.all',           'blog', 'Tous'),
  ('blog.admin.table.title',             'blog', 'Titre'),
  ('blog.admin.table.status',            'blog', 'Statut'),
  ('blog.admin.table.published_at',      'blog', 'Publié le'),
  ('blog.admin.post.new',                'blog', 'Nouvel article'),
  ('blog.admin.post.edit',               'blog', 'Modifier l''article'),
  ('blog.admin.post.delete',             'blog', 'Supprimer l''article'),
  ('blog.admin.post.delete.warning',     'blog', 'Cette action est irréversible.'),
  ('blog.admin.post.publish',            'blog', 'Publier'),
  ('blog.admin.post.unpublish',          'blog', 'Dépublier'),
  ('blog.admin.post.save_draft',         'blog', 'Enregistrer le brouillon'),
  ('blog.field.status',                  'blog', 'Statut'),
  ('blog.field.reading_time_minute',     'blog', 'Temps de lecture (min)'),
  ('blog.field.featured',                'blog', 'À la une'),
  ('blog.field.allow_comment',           'blog', 'Autoriser les commentaires'),
  ('blog.post.list.title',               'blog', 'Blog'),
  ('blog.post.detail.comment_count',     'blog', '{count} commentaires'),
  ('blog.post.detail.sign_in_to_comment','blog', 'Connectez-vous pour laisser un commentaire.'),
  ('blog.comment.form.title',            'blog', 'Laisser un commentaire'),
  ('blog.comment.form.submit',           'blog', 'Publier le commentaire'),
  ('blog.comment.form.cancel',           'blog', 'Annuler'),
  ('blog.comment.pending',               'blog', 'Votre commentaire est en attente de modération.')
) as v(slug, scope, content)
join public.local_text_link l
  on l.slug = v.slug and l.scope = v.scope and l.entity_id is null
on conflict (link, locale) do nothing;
