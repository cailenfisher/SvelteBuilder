# MIGRATION-ACCESS-CONTROL.md — adding roles and permissions to an existing project

For a project scaffolded before access control (`docs/ACCESS-CONTROL.md`). Screens are scaffolded
once and owned by your app (`CLAUDE.md`, guardrail 10), so an upgrade brings none of the files
below by itself. This guide is how to apply them.

> [!IMPORTANT]
> **With logistic, plan the upgrade with your warehouse staff in mind.** Until now any signed-in
> user could read every logistic table and do floor work. Afterwards someone with no role sees
> nothing (§4). Have the list of who should keep access ready, and give them the Warehouse
> operator role as soon as the migration is applied (§3).

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
and SuperPrototype files every project gets; the content and logistic ones only if you have
that module.

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
| `.sveltebuilder/registry/@sveltebuilder-logistic.json` | logistic's manifest, now with `access` |
| `supabase/supplemental/05-logistic-supplements.sql`, `supabase/seeds/logistic.sql` | logistic's policies and functions, rewritten; its roles, copy and menu entries |
| `src/lib/server/content/`: `article.ts`, `article-assignment.ts`, `article-role-assignment.ts`, `comment.ts` | content's data modules |
| `src/lib/Role/` | the shared role assignment form |
| `src/routes/(admin)/+layout.server.ts` | admits staff (A24) |
| `src/routes/(admin)/admin/`: `role/`, `user-group/`, `user-account/`, `role-assignment-action.ts`, `require-access.ts` (delete the old `require-administrator.ts`) | the access screens |
| `src/routes/(admin)/admin/*/+page.server.ts` for locale, local-text and navigation-item | now administrator-only in their loaders |
| `src/lib/server/logistic/` | logistic's data modules: the RPC calls no longer pass a user account |
| `src/routes/(admin)/admin/logistic/`, `src/routes/(warehouse)/` | logistic's screens, with actions; the warehouse admits staff with a warehouse role |
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
it reaches a hosted database without the seed; the seed brings the copy and the modules' roles.

With logistic, give the warehouse staff their role straight away: at `/admin/user-account`, open
each person and give them **Warehouse operator** (or **Logistics manager**) everywhere. To restore
the old behaviour for every existing account at once, which you probably do not want if signup is
open, run this as an administrator in the SQL editor:

```sql
insert into public.role_assignment (role_id, user_account_id)
select r.id, ua.id
from public.role r cross join public.user_account ua
where r.slug = 'logistic_operator' and not ua.admin
on conflict do nothing;
```

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
- **Logistic is staff-only** (A22). A signed-in user with no logistic role reads nothing and
  cannot reach `/warehouse`. Operators read everything and receive, pick, count and grade;
  managers also create, update, delete, adjust stock and approve counts. Administrators are
  unchanged.
- **Logistic's RPCs lost their user account parameter.** `logistic_receive_receipt_line`,
  `_record_picked_quantity`, `_complete_pick_task`, `_grade_return_line`,
  `_approve_cycle_count`, `_create_shipment`, `_create_return_authorization` and
  `_create_cycle_count` take the actor from the session; the old signatures are dropped. Code of
  your own that calls them must drop the argument. The stock primitives (`logistic_adjust_stock`,
  `_reserve_stock`, `_release_stock_reservation`, `_consume_stock`, `_ensure_stock_level`) can no
  longer be called through the API at all; adjust stock with `logistic_adjust_stock_level`.
- **Warehouse workers no longer update lines directly.** Picking, receiving, counting and grading
  go through the verb RPCs, so a direct `PATCH` of a pick line is refused.
