-- ============================================================
-- Locales
-- ============================================================
insert into public.locale (code, name, native_name, dir) values
  ('en',    'English',             'English',            'ltr'),
  ('fr',    'French',              'Français',           'ltr'),
  ('es',    'Spanish',             'Español',            'ltr'),
  ('de',    'German',              'Deutsch',            'ltr'),
  ('pt-BR', 'Portuguese (Brazil)', 'Português (Brasil)', 'ltr'),
  ('ja',    'Japanese',            '日本語',               'ltr'),
  ('zh-CN', 'Chinese (Simplified)','简体中文',             'ltr'),
  ('ar',    'Arabic',              'العربية',            'rtl')
on conflict (code) do nothing;

-- ============================================================
-- Application dictionary — local_text_link entries
-- (scope = null for all global application copy)
-- ============================================================
insert into public.local_text_link (slug, scope, entity_id) values
  ('app.name',               null, null),
  ('app.tagline',            null, null),
  ('nav.home',               null, null),
  ('nav.back',               null, null),
  ('nav.menu',               null, null),
  ('nav.close',              null, null),
  ('nav.search',             null, null),
  ('action.save',            null, null),
  ('action.cancel',          null, null),
  ('action.confirm',         null, null),
  ('action.delete',          null, null),
  ('action.edit',            null, null),
  ('action.submit',          null, null),
  ('action.continue',        null, null),
  ('action.back',            null, null),
  ('action.close',           null, null),
  ('action.add',             null, null),
  ('action.remove',          null, null),
  ('action.view',            null, null),
  ('action.loading',         null, null),
  ('feedback.success',       null, null),
  ('feedback.error',         null, null),
  ('feedback.not_found',     null, null),
  ('feedback.unauthorized',  null, null),
  ('feedback.empty',         null, null),
  ('feedback.required',      null, null),
  ('feedback.saving',        null, null),
  ('feedback.saved',         null, null),
  ('feedback.confirm_delete',null, null),
  ('locale.select',          null, null),
  ('locale.current',         null, null),
  ('pagination.next',        null, null),
  ('pagination.previous',    null, null),
  ('pagination.page',        null, null),
  ('pagination.of',          null, null),
  ('user.profile',           null, null),
  ('user.settings',          null, null),
  ('user.sign_in',           null, null),
  ('user.sign_out',          null, null),
  ('user.sign_up',           null, null),
  ('user.email',             null, null),
  ('user.password',          null, null),
  ('user.forgot_password',   null, null)
on conflict do nothing;

-- ============================================================
-- English copy
-- ============================================================
insert into public.local_text (link, locale, content)
select
  l.id,
  (select id from public.locale where code = 'en'),
  l.content
from (values
  ('app.name',                'SvelteBuilder App'),
  ('app.tagline',             'Built with SvelteBuilder'),
  ('nav.home',                'Home'),
  ('nav.back',                'Back'),
  ('nav.menu',                'Menu'),
  ('nav.close',               'Close'),
  ('nav.search',              'Search'),
  ('action.save',             'Save'),
  ('action.cancel',           'Cancel'),
  ('action.confirm',          'Confirm'),
  ('action.delete',           'Delete'),
  ('action.edit',             'Edit'),
  ('action.submit',           'Submit'),
  ('action.continue',         'Continue'),
  ('action.back',             'Back'),
  ('action.close',            'Close'),
  ('action.add',              'Add'),
  ('action.remove',           'Remove'),
  ('action.view',             'View'),
  ('action.loading',          'Loading…'),
  ('feedback.success',        'Success'),
  ('feedback.error',          'Something went wrong'),
  ('feedback.not_found',      'Page not found'),
  ('feedback.unauthorized',   'You are not authorized to view this page'),
  ('feedback.empty',          'Nothing here yet'),
  ('feedback.required',       'This field is required'),
  ('feedback.saving',         'Saving…'),
  ('feedback.saved',          'Saved'),
  ('feedback.confirm_delete', 'Are you sure you want to delete this?'),
  ('locale.select',           'Select language'),
  ('locale.current',          'Current language'),
  ('pagination.next',         'Next'),
  ('pagination.previous',     'Previous'),
  ('pagination.page',         'Page'),
  ('pagination.of',           'of'),
  ('user.profile',            'Profile'),
  ('user.settings',           'Settings'),
  ('user.sign_in',            'Sign in'),
  ('user.sign_out',           'Sign out'),
  ('user.sign_up',            'Sign up'),
  ('user.email',              'Email'),
  ('user.password',           'Password'),
  ('user.forgot_password',    'Forgot password?')
) as v(slug, content)
join public.local_text_link l on l.slug = v.slug and l.scope is null and l.entity_id is null
on conflict (link, locale) do nothing;

-- ============================================================
-- French copy
-- ============================================================
insert into public.local_text (link, locale, content)
select
  l.id,
  (select id from public.locale where code = 'fr'),
  l.content
from (values
  ('app.name',                'Application SvelteBuilder'),
  ('app.tagline',             'Construit avec SvelteBuilder'),
  ('nav.home',                'Accueil'),
  ('nav.back',                'Retour'),
  ('nav.menu',                'Menu'),
  ('nav.close',               'Fermer'),
  ('nav.search',              'Rechercher'),
  ('action.save',             'Enregistrer'),
  ('action.cancel',           'Annuler'),
  ('action.confirm',          'Confirmer'),
  ('action.delete',           'Supprimer'),
  ('action.edit',             'Modifier'),
  ('action.submit',           'Soumettre'),
  ('action.continue',         'Continuer'),
  ('action.back',             'Retour'),
  ('action.close',            'Fermer'),
  ('action.add',              'Ajouter'),
  ('action.remove',           'Supprimer'),
  ('action.view',             'Voir'),
  ('action.loading',          'Chargement…'),
  ('feedback.success',        'Succès'),
  ('feedback.error',          'Une erreur est survenue'),
  ('feedback.not_found',      'Page introuvable'),
  ('feedback.unauthorized',   'Vous n''êtes pas autorisé à voir cette page'),
  ('feedback.empty',          'Rien ici pour l''instant'),
  ('feedback.required',       'Ce champ est obligatoire'),
  ('feedback.saving',         'Enregistrement…'),
  ('feedback.saved',          'Enregistré'),
  ('feedback.confirm_delete', 'Êtes-vous sûr de vouloir supprimer ceci ?'),
  ('locale.select',           'Choisir la langue'),
  ('locale.current',          'Langue actuelle'),
  ('pagination.next',         'Suivant'),
  ('pagination.previous',     'Précédent'),
  ('pagination.page',         'Page'),
  ('pagination.of',           'sur'),
  ('user.profile',            'Profil'),
  ('user.settings',           'Paramètres'),
  ('user.sign_in',            'Se connecter'),
  ('user.sign_out',           'Se déconnecter'),
  ('user.sign_up',            'S''inscrire'),
  ('user.email',              'Courriel'),
  ('user.password',           'Mot de passe'),
  ('user.forgot_password',    'Mot de passe oublié ?')
) as v(slug, content)
join public.local_text_link l on l.slug = v.slug and l.scope is null and l.entity_id is null
on conflict (link, locale) do nothing;
