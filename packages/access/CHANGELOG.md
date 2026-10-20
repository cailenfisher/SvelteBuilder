# @sveltebuilder/access

## 1.0.0-rc.0

### Minor Changes

- [#47](https://github.com/cailenfisher/SvelteBuilder/pull/47) [`d227635`](https://github.com/cailenfisher/SvelteBuilder/commit/d227635fb77d0232d0fd56fc277520de71b62298) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Scaffolds ship the access administration screens, linked from the admin navigation:
  - `/admin/role` and `/admin/role/[id]`: create a role, choose its permissions on the permission grid, clone a module's role to customise it, delete an administrator's role.
  - `/admin/user-group` and `/admin/user-group/[id]`: create a group (internal, or external for an outside organisation, fixed at creation), add and remove members, give it roles everywhere or on every item of a kind (never for an external group).
  - `/admin/user-account` and `/admin/user-account/[id]`: every user by email address, their groups and roles, and promoting or demoting an administrator (never the last one).

  SuperPrototype adds `admin_list_user_account()`, an administrator-only definer function listing users with their email addresses, since email lives in `auth.users`; one data module per access table in `src/lib/server/`; and `postgrestFormError()` in `$lib/server/form-error`, which reports a refused or invalid write by its Postgres code. `@sveltebuilder/access/views` exports the screens' view types. The `access` copy seed now follows the module seed shape.

- [#47](https://github.com/cailenfisher/SvelteBuilder/pull/47) [`d6af329`](https://github.com/cailenfisher/SvelteBuilder/commit/d6af3291b86ed70cd971f6d6406c059fe22e801c) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `@sveltebuilder/access` exports its components and stylesheet (`@sveltebuilder/access/styles/components.css`):
  - `RolePermissionMatrix`: a role's permissions on coreui's `CheckboxMatrix`, kinds of thing down the side and actions across the top; read-only for a module-managed role.
  - `RoleAssignmentTable`: assignments with who holds them, the role, where it applies and when it ends.
  - `RoleAssignmentPanel`: one row's access, from `list_<entity>_access`, splitting access given on the row (removable through the host's `removeAction`) from access inherited from a broader role (never removable there).
  - `UserGroupMemberTable`: a group's members.

  Each resolves its copy from the dictionary, with the usual `dictionary` prop override. Scaffolds import the stylesheet after coreui's, and seed the `access` scope's UI copy in English and French (`supabase/seeds/01-access.sql`).

- [#47](https://github.com/cailenfisher/SvelteBuilder/pull/47) [`3b98e10`](https://github.com/cailenfisher/SvelteBuilder/commit/3b98e102b31e94f2cd3fa725ca2901e5e1feaab6) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Content adopts roles and permissions (docs/ACCESS-CONTROL.md §7).

  **Breaking (content):** `article_assignment.role` is now `article_assignment_role`, and the exported `ArticleAssignment` type's `role` field is `articleAssignmentRole`. Run the rename in `docs/MIGRATION-2.0.md` before syncing. `CommentList` takes `CommentRow` (a comment without its author's email address); a `Comment` still satisfies it.

  Content's manifest declares its permission catalog and per-article access; its seed adds the Editor, Writer and Contributor roles. Its policies now grant by permission, by role on a single article, and by being assigned to an article, which lets you read and edit it and its body. Creating an article goes through `content_create_article`, which also writes its headline and makes the creator its author. Only `content_transition_article_status` changes an article's status, and moving to or from published takes `article.publish`. Assigning someone to an article takes `article.share`. A commenter's email address is selectable by nobody through the API. The article views gain optional `actions`; `@sveltebuilder/access/views` gains `RoleAssignmentPanelView`.

  Scaffolds admit staff to `/admin`: anyone holding a role sees the admin area and the menu entries for scopes they hold (`navigation_item.permission_scope`), while administrator screens refuse them in their loaders. The article screens show only the controls the reader may use, and the access panel to anyone who may share the article. `current_user_scopes()` and `list_scope_role()` join the core access SQL, and `sync:supabase` generates an entity-aware `current_user_scopes()`.

- [#47](https://github.com/cailenfisher/SvelteBuilder/pull/47) [`83b1a4f`](https://github.com/cailenfisher/SvelteBuilder/commit/83b1a4f20da52fc2062e746ebe07c7482349fc7d) Thanks [@cailenfisher](https://github.com/cailenfisher)! - New package `@sveltebuilder/access`: the Drizzle schema for roles and permissions (`permission`, `role`, `role_permission`, `user_group`, `user_group_member`, `role_assignment`), the standard permission actions, and the view-model types its components and screens will share.

  Every scaffold now depends on it and registers its schema, and ships `supabase/supplemental/01-access.sql`: the tables' foreign keys to `user_account`, row level security (administrators may read; nobody else may), and every direct write revoked from `anon` and `authenticated`. Nothing grants access through these tables yet. See `docs/ACCESS-CONTROL.md`.

### Patch Changes

- Updated dependencies [[`9763d7b`](https://github.com/cailenfisher/SvelteBuilder/commit/9763d7badb9ab3b116906de32aaf41c6115535e8), [`23bace2`](https://github.com/cailenfisher/SvelteBuilder/commit/23bace235634b0af84f3c65816db5ed8a09ffd02)]:
  - @sveltebuilder/coreui@1.0.0-rc.1
