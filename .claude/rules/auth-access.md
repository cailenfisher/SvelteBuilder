---
paths:
  - "**/*.sql"
  - "**/supabase/**"
  - "scripts/sql-check/**"
  - "**/hooks.server.ts"
  - "**/auth-resolver.ts"
  - "**/require-access.ts"
  - "**/admin/**"
  - "packages/access/**"
  - "docs/ACCESS-CONTROL*.md"
---

## Auth Architecture

### Principal–identity split

`public.user_account` is the **domain principal** — the identity the rest of the system reasons about. Its `bigint` PK feeds `local_text_link.entity_id` (user display names via i18n), is carried on `event.locals.userAccountId`, and is what every RLS policy compares against.

The **auth identity** lives in Supabase's managed `auth.users` table. `user_account.auth_user_id uuid` links the domain principal to it, with an FK and a unique index. Identity columns (email, name, image) stay in `auth.users`; they are not in `user_account`.

### How RLS gets its user

Data access goes through `event.locals.supabase` — a per-request `@supabase/ssr` client built from the request's own cookies. Queries run through PostgREST as the `authenticated` (or `anon`) role, carrying the user's JWT, so **RLS applies to every query without the application doing anything**. There is no session variable, no transaction wrapper, and no direct Postgres connection anywhere in the app.

This matters: a direct connection as the `postgres` role owns every table, and Postgres skips RLS entirely for table owners and superusers. Any design that opens its own connection has to solve that; going through PostgREST means never having the problem.

### The two-function identity bridge

Policies never reference `auth.uid()` directly. Two SECURITY DEFINER helpers in `supabase/supplemental/00-auth-functions.sql` translate the auth identity into domain terms, and every policy calls one of them:

```sql
(select public.current_user_id())     -- bigint: the user_account.id, or null
(select public.current_user_admin())  -- boolean: is that principal an admin
```

Three rules for these, all load-bearing:

- **`SECURITY DEFINER` is mandatory.** Both read `public.user_account`, which is RLS-protected. As invoker they re-enter that table's policies — and `user_account`'s admin policy calls `current_user_admin()`, so a policy would consult a function that reads the table the policy is on. Postgres rejects that with `infinite recursion detected in policy for relation`.
- **`STABLE` is mandatory**, and always call them wrapped as `(select fn())`. The subselect lets the planner hoist the call into an InitPlan evaluated once per statement instead of once per row.
- **`set search_path = ''` is mandatory**, with every reference fully schema-qualified. Otherwise a definer function inherits the caller's search_path and can be tricked into running a shadowed object with elevated privileges.

### Compound writes use SECURITY INVOKER RPCs

PostgREST has no client-side transactions — two `supabase-js` calls are two transactions. Where a mutation spans more than one statement and a partial result would be garbage (an i18n link with no copy), it goes in a Postgres function called via `.rpc()`, defined in `supabase/supplemental/04-admin-write-rpc.sql`.

Those functions are **SECURITY INVOKER on purpose**: the body runs as the caller, so RLS still checks every statement inside. They buy atomicity, not privilege. Anything expressible as one statement — including upserts against a unique constraint — stays a plain `supabase-js` call in the route.

### Admin role

`user_account.admin boolean not null default false` is the application owner's break-glass (A5): an administrator holds every permission, and every access helper answers yes for one. Everyone else is authorized through roles; see [Access control](#access-control). No JWT role claims are used.

`anon` and `authenticated` hold no write privilege on `user_account` at all — `INSERT`, `UPDATE`, `DELETE` are revoked outright in `supabase/supplemental/05-user-account-hardening.sql`. An owner-update policy ("update your own row") lived here until 2026-10-03 and was a privilege escalation: RLS cannot restrict which *columns* an allowed `UPDATE` may touch, so "your own row" included `admin` and `auth_user_id`, and `PATCH /rest/v1/user_account?id=eq.<own id> {"admin": true}` returned 200. Promoting or demoting an administrator goes through the `admin_set_user_admin(user_account_id, admin)` RPC instead — `SECURITY DEFINER`, checks `current_user_admin()` on the caller itself, and refuses to demote the last remaining admin. Never reintroduce a self-update policy on this table; see the file for the full incident writeup.

### Access control

Everyone who is not an administrator is authorized by **role**. A role is a bundle of
permissions; a permission is a scope (the table name, the same word as the local-text scope) plus
an action (`read`, `create`, `update`, `delete`, `share`, or a module's own verb such as
`publish` or `pick`). A role is assigned to a user or a group, everywhere, on one scope, or on one
row of an access-controlled entity. Grants only add; there is no deny. The design is
`docs/ACCESS-CONTROL.md`, the decisions behind it `docs/ACCESS-CONTROL-DECISIONS.md`, and how to
use it `docs/ACCESS-CONTROL-USAGE.md`. Read the usage doc before touching a policy.

Where it lives:

- `@sveltebuilder/access`: the Drizzle tables (`permission`, `role`, `role_permission`,
  `role_assignment`, `user_group`, `user_group_member`), view types and the admin components.
- `tools/create/templates/base/supabase/supplemental/01-access.sql`: the helpers, the admin RPCs and
  the access tables' own RLS.
- `access-generated.sql`, written by `sveltebuilder sync:supabase` from each manifest's `access`
  key: the permission catalog, and for every `access.entity` its `<entity>_role_assignment`
  table, `current_user_<entity>_ids(action)`, `current_user_<entity>_actions(ids)` and sharing
  RPCs. Sync places it directly after `01-access.sql` (A21).

A policy asks about a **permission**, through a helper, hoisted:

```sql
using (
  (select public.current_user_can('article', 'read'))
  or id = any ((select public.current_user_article_ids('read'))::bigint[])
)
```

- **Ask for permissions, never roles.** A policy or screen that tests for `content_editor` breaks
  the moment an administrator builds a custom role holding the same permissions.
- **Wrap every helper call in `(select …)`, with literal arguments.** That is what lets Postgres
  evaluate it once per statement. The `::bigint[]` cast is required: without it Postgres reads
  `= any (select …)` as the subquery form and fails with `integer = integer[]`.
- **Child rows follow the parent's check** (A18): an `article_block` policy asks about `article`,
  and writing a child takes the parent's `update`.
- **A column a verb guards is not writable directly** (A19). Revoke `update` on the table, grant
  back the safe columns, and change the guarded one only in a definer RPC that checks the verb
  (`content_transition_article_status`, `logistic_record_picked_quantity`).
- **A definer function takes the actor from `current_user_id()`**, never from a parameter, and
  checks the permission itself before doing anything, since it bypasses RLS.

Screens mirror the database, they do not decide. A loader calls `requireScope(parent, scope)` or
`requireAdministrator(parent)` (`(admin)/admin/require-access.ts`) for the experience, and returns
the reader's `actions` so the screen can hide what will be refused. The `(admin)` layout admits
anyone holding a role and shows the menu entries whose `navigation_item.permission_scope` they
hold. RLS is what refuses.

### Provisioning the principal

`resolveAuthenticatedUserId(event)` in `src/lib/server/auth-resolver.ts` verifies the session with `getClaims()` — which checks the token signature locally against the cached JWKS rather than making a network call to the Auth server — then calls the `ensure_user_account()` RPC. It returns `number | null` (the `user_account.id`), which lands on `event.locals.userAccountId`.

Provisioning lives in SQL, not TypeScript, for two reasons that are easy to get wrong:

- The function derives the identity from `auth.uid()`, never a parameter, so a caller cannot provision or claim a principal for someone else's auth identity.
- The very first `user_account` row ever created is granted `admin = true`, since a freshly seeded database has no other route into the admin area. That emptiness check **must** run as definer: under RLS a brand-new user can see no `user_account` rows at all, so the same check written in application code reads "table is empty" for every new user and grants admin to all of them.

Promote or revoke admins after the first via the `admin_set_user_admin()` RPC (see [Admin role](#admin-role)); there is no invite UI.

Use `getUser()` instead of `getClaims()` only when something genuinely needs a freshly-read `auth.users` record — the admin layout does, to show the operator's email.

---
