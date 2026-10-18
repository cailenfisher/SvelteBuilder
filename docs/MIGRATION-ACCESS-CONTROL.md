# MIGRATION-ACCESS-CONTROL.md — adding roles and permissions to an existing project

For a project scaffolded before access control (`docs/ACCESS-CONTROL.md`). Screens are scaffolded
once and owned by your app (`CLAUDE.md`, guardrail 10), so an upgrade brings none of the files
below by itself. This guide is how to apply them.

> [!NOTE]
> Logistic's adoption (Phase 9) is not in this guide yet. Until it is, a project with logistic
> keeps logistic's existing policies.

---

## 1. Rename before you sync

Content's `article_assignment.role` is now `article_assignment_role`. Run this once, **before**
`sveltebuilder sync:supabase`, or drizzle-kit asks whether the column was renamed or replaced,
and replacing it drops every assignment:

```sql
begin;

alter table public.article_assignment rename column role to article_assignment_role;

update public.local_text_link
set slug = 'content.article_assignment_queue.article_assignment_role'
where slug = 'content.article_assignment_queue.role' and scope = 'content' and entity_id is null;

commit;
```

## 2. Bring in the new files

Copy these from a freshly scaffolded project (same template and modules) into yours. The base
and SuperPrototype files every project gets; the content ones only if you have content.

| File | What it is |
| --- | --- |
| `package.json`: `@sveltebuilder/access` | the package, at the release's version |
| `.sveltebuilder/registry/@sveltebuilder-access.json` | registers the access tables |
| `.sveltebuilder/registry/@sveltebuilder-content.json` | content's manifest, now with `access` |
| `src/app.css`: the `@sveltebuilder/access/styles/components.css` line, after coreui's | the access components' styles |
| `supabase/supplemental/01-access.sql` | the core: helpers, admin RPCs, RLS |
| `supabase/supplemental/06-user-account-admin-list.sql` | users with their email, for administrators |
| `supabase/supplemental/02-content-rls.sql`, `03-content-media.sql` | content's policies, rewritten |
| `supabase/seeds/01-access.sql`, `00-base-navigation.sql`, `content.sql` | copy, menu entries, content's roles |
| `src/lib/server/schema.ts` | `navigation_item.permission_scope` |
| `src/lib/server/`: `permission.ts`, `role.ts`, `role-permission.ts`, `role-assignment.ts`, `user-group.ts`, `user-group-member.ts`, `user-account.ts`, `navigation-item.ts`, `form-error.ts` | data modules |
| `src/lib/server/content/`: `article.ts`, `article-assignment.ts`, `article-role-assignment.ts`, `comment.ts` | content's data modules |
| `src/lib/Role/` | the shared role assignment form |
| `src/routes/(admin)/+layout.server.ts` | admits staff (A24) |
| `src/routes/(admin)/admin/`: `role/`, `user-group/`, `user-account/`, `role-assignment-action.ts`, `require-administrator.ts` | the access screens |
| `src/routes/(admin)/admin/*/+page.server.ts` for locale, local-text and navigation-item | now administrator-only in their loaders |
| `src/routes/(admin)/admin/content/article/` | the article screens, with actions and the access panel |
| the locale, local-text and navigation-item create forms under `src/routes/(admin)/admin/` | submit buttons say "Create" |

If you changed any of these files, merge rather than overwrite.

## 3. Sync and apply

```sh
pnpm sveltebuilder sync:supabase
pnpm supabase db push --include-seed   # hosted; locally, pnpm db:reset
```

sync writes `supabase/supplemental/access-generated.sql` from the manifests and puts it, with the
changed supplemental files, into a new migration. The permission catalog is in that migration, so
it reaches a hosted database without the seed; the seed brings the copy and content's roles.

## 4. What behaves differently afterwards

- **Staff can reach `/admin`.** Anyone holding a role sees the admin area, with only the menu
  entries for scopes they hold. Before, only administrators could sign in to it. Administrators
  see and can do exactly what they could before.
- **Nobody sets an article's status directly**, an administrator included: the status and the
  publish date change only through `content_transition_article_status`, so the publish checklist
  can no longer be skipped by a direct `PATCH`.
- **A commenter's email address is unreadable through the API**, to everyone. No screen showed
  it; a moderation screen that needs it would read it through a definer function.
- **Content's three roles exist** (Editor, Writer, Contributor) and are held by nobody until an
  administrator gives them.
