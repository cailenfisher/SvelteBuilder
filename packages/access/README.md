# @sveltebuilder/access

Roles and permissions for [SvelteBuilder](https://github.com/cailenfisher/SvelteBuilder). A role bundles permissions (`article.update`, `article.publish`) and is assigned to a user or a group everywhere, on every row of one kind, or on a single row. Postgres enforces it, in row level security.

## Install

Every project made with `npm create sveltebuilder` already depends on it: every module's policies call its functions, so it is never a selectable module.

## Usage

```ts
import { role, roleAssignment, STANDARD_PERMISSION_ACTIONS } from '@sveltebuilder/access/schema';
import type { RoleAssignmentRow } from '@sveltebuilder/access/views';
```

- **`@sveltebuilder/access/schema`** — Drizzle table definitions and inferred types for `permission`, `role`, `role_permission`, `user_group`, `user_group_member` and `role_assignment`, plus the standard permission actions. The per-entity assignment tables are generated as SQL by `sveltebuilder sync:supabase`, not declared here.
- **`@sveltebuilder/access/views`** — the view-model types a screen and its loader share.

The package ships no queries (guardrail 11) and no SQL. The functions, policies and RPCs that enforce access ship with the scaffold, in `supabase/supplemental/01-access.sql`.

How to use the system is in [`docs/ACCESS-CONTROL-USAGE.md`](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/ACCESS-CONTROL-USAGE.md); its design is in [`docs/ACCESS-CONTROL.md`](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/ACCESS-CONTROL.md).

## Part of the SvelteBuilder ecosystem

See the [SvelteBuilder README](https://github.com/cailenfisher/SvelteBuilder) for the full architecture.
