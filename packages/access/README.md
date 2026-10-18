# @sveltebuilder/access

Roles and permissions for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder). A role bundles permissions (`article.update`, `article.publish`) and is assigned to a user or a group everywhere, on every row of one kind, or on a single row. Postgres enforces it, in row level security.

## Install

Every project made with `npm create sveltebuilder` already depends on it: every module's policies call its functions, so it is never a selectable module.

## Usage

Import the stylesheet once, in your app's `app.css`, after coreui's and in the same layer. A
project made with `npm create sveltebuilder` already has this line.

```css
@import '@sveltebuilder/coreui/styles/components.css' layer(components);
@import '@sveltebuilder/access/styles/components.css' layer(components);
```

```ts
import { RoleAssignmentPanel, RolePermissionMatrix } from '@sveltebuilder/access';
import { role, roleAssignment, STANDARD_PERMISSION_ACTIONS } from '@sveltebuilder/access/schema';
import type { RoleAssignmentPanelView, RoleAssignmentRow } from '@sveltebuilder/access/views';
```

- **`@sveltebuilder/access`** — entity components, each resolving its copy through `getDictionary()` from `diglossia/svelte` or a `dictionary` prop: `RolePermissionMatrix` (a role's permissions as a scope × action grid, editable or read-only), `RoleAssignmentTable` (who holds which role, where, and until when), `RoleAssignmentPanel` (an entity's access, direct grants beside inherited ones, for its detail screen) and `UserGroupMemberTable`.
- **`@sveltebuilder/access/styles/components.css`** — the components' styles, for the `components` layer.

- **`@sveltebuilder/access/schema`** — Drizzle table definitions and inferred types for `permission`, `role`, `role_permission`, `user_group`, `user_group_member` and `role_assignment`, plus the standard permission actions. The per-entity assignment tables are generated as SQL by `sveltebuilder sync:supabase`, not declared here.
- **`@sveltebuilder/access/views`** — the view-model types a screen and its loader share.

The package ships no queries (guardrail 11) and no SQL. The functions, policies and RPCs that enforce access ship with the scaffold, in `supabase/supplemental/01-access.sql`.

How to use the system is in [`docs/ACCESS-CONTROL-USAGE.md`](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/ACCESS-CONTROL-USAGE.md); its design is in [`docs/ACCESS-CONTROL.md`](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/ACCESS-CONTROL.md).

## Part of the SvelteBuilder ecosystem

See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for the full architecture.
