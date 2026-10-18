-- UI copy for @sveltebuilder/access's components and the access admin screens (scope `access`).
--
-- The standard permission actions' labels are here. A module seeds the labels for its own
-- scopes (`access.permission_scope.<scope>`) and verbs (`access.permission_action.<verb>`) in its
-- own seed, under this scope. Role and group names are entity copy (`name` under `role` or
-- `user_group`), written by the RPCs that create them.

insert into public.local_text_link (slug, scope, entity_id)
select v.slug, 'access', null
from (values
  ('access.permission_action.read'),
  ('access.permission_action.create'),
  ('access.permission_action.update'),
  ('access.permission_action.delete'),
  ('access.permission_action.share'),
  ('access.role_permission.caption'),
  ('access.role_assignment.principal'),
  ('access.role_assignment.role'),
  ('access.role_assignment.target'),
  ('access.role_assignment.expires_at'),
  ('access.role_assignment.action'),
  ('access.role_assignment.target_global'),
  ('access.role_assignment.target_scope'),
  ('access.role_assignment.target_entity'),
  ('access.role_assignment.no_expiry'),
  ('access.role_assignment.expired'),
  ('access.role_assignment.empty'),
  ('access.role_assignment_panel.title'),
  ('access.role_assignment_panel.direct'),
  ('access.role_assignment_panel.inherited'),
  ('access.role_assignment_panel.inherited_hint'),
  ('access.user_group.external'),
  ('access.user_group_member.email_address'),
  ('access.user_group_member.created_at'),
  ('access.user_group_member.action'),
  ('access.user_group_member.empty')
) as v(slug)
on conflict do nothing;

insert into public.local_text (link, locale, content)
select l.id, (select id from public.locale where code = v.locale_code), v.content
from (values
  ('access.permission_action.read', 'en', 'Read'),
  ('access.permission_action.read', 'fr', 'Lire'),
  ('access.permission_action.create', 'en', 'Create'),
  ('access.permission_action.create', 'fr', 'Créer'),
  ('access.permission_action.update', 'en', 'Edit'),
  ('access.permission_action.update', 'fr', 'Modifier'),
  ('access.permission_action.delete', 'en', 'Delete'),
  ('access.permission_action.delete', 'fr', 'Supprimer'),
  ('access.permission_action.share', 'en', 'Share'),
  ('access.permission_action.share', 'fr', 'Partager'),
  ('access.role_permission.caption', 'en', 'Permissions of {$role}'),
  ('access.role_permission.caption', 'fr', 'Permissions de {$role}'),
  ('access.role_assignment.principal', 'en', 'Who'),
  ('access.role_assignment.principal', 'fr', 'Qui'),
  ('access.role_assignment.role', 'en', 'Role'),
  ('access.role_assignment.role', 'fr', 'Rôle'),
  ('access.role_assignment.target', 'en', 'Applies to'),
  ('access.role_assignment.target', 'fr', 'S''applique à'),
  ('access.role_assignment.expires_at', 'en', 'Ends'),
  ('access.role_assignment.expires_at', 'fr', 'Prend fin'),
  ('access.role_assignment.action', 'en', 'Actions'),
  ('access.role_assignment.action', 'fr', 'Actions'),
  ('access.role_assignment.target_global', 'en', 'Everywhere'),
  ('access.role_assignment.target_global', 'fr', 'Partout'),
  ('access.role_assignment.target_scope', 'en', '{$scope} (all)'),
  ('access.role_assignment.target_scope', 'fr', '{$scope} (tous)'),
  ('access.role_assignment.target_entity', 'en', 'This item only'),
  ('access.role_assignment.target_entity', 'fr', 'Cet élément seulement'),
  ('access.role_assignment.no_expiry', 'en', 'No end date'),
  ('access.role_assignment.no_expiry', 'fr', 'Sans date de fin'),
  ('access.role_assignment.expired', 'en', 'Expired'),
  ('access.role_assignment.expired', 'fr', 'Expiré'),
  ('access.role_assignment.empty', 'en', 'No one has access this way.'),
  ('access.role_assignment.empty', 'fr', 'Personne n''a accès de cette façon.'),
  ('access.role_assignment_panel.title', 'en', 'Who has access'),
  ('access.role_assignment_panel.title', 'fr', 'Qui a accès'),
  ('access.role_assignment_panel.direct', 'en', 'Given on this item'),
  ('access.role_assignment_panel.direct', 'fr', 'Accordé sur cet élément'),
  ('access.role_assignment_panel.inherited', 'en', 'From broader roles'),
  ('access.role_assignment_panel.inherited', 'fr', 'Par des rôles plus larges'),
  ('access.role_assignment_panel.inherited_hint', 'en', 'Access from a broader role is changed on that user''s or group''s page, not here.'),
  ('access.role_assignment_panel.inherited_hint', 'fr', 'L''accès donné par un rôle plus large se modifie sur la page de l''utilisateur ou du groupe, pas ici.'),
  ('access.user_group.external', 'en', 'External'),
  ('access.user_group.external', 'fr', 'Externe'),
  ('access.user_group_member.email_address', 'en', 'Email address'),
  ('access.user_group_member.email_address', 'fr', 'Adresse e-mail'),
  ('access.user_group_member.created_at', 'en', 'Added'),
  ('access.user_group_member.created_at', 'fr', 'Ajouté le'),
  ('access.user_group_member.action', 'en', 'Actions'),
  ('access.user_group_member.action', 'fr', 'Actions'),
  ('access.user_group_member.empty', 'en', 'No members yet.'),
  ('access.user_group_member.empty', 'fr', 'Aucun membre pour l''instant.')
) as v(slug, locale_code, content)
join public.local_text_link l
  on l.slug = v.slug and l.scope = 'access' and l.entity_id is null
on conflict (link, locale) do nothing;
