# Access Control — Decision Record

> [!NOTE]
> Status: design approved in conversation on 2026-10-17. Names marked **pending** are proposals, approved or replaced in Phase 0 of `docs/ACCESS-CONTROL-PLAN.md`. The design itself is `docs/ACCESS-CONTROL.md`.

Every decision has a reason beside it.
If you want to reverse one, argue with the reason, not the rule.

---

## Decided

### A1. Authorization is enforced in Postgres, by RLS. Nowhere else.

You must not decide access in TypeScript, in a policy engine, or in an external authorization service.

The app reaches the database only through PostgREST with the user's JWT (guardrail 8).
RLS is therefore the one place every query passes through.
A check anywhere else protects only the code paths that remember to call it, and the Data API is reachable directly with the publishable key.
That is how both the `user_account` self-promotion and the content RLS incident were proven exploitable.

Zanzibar-style services (OpenFGA, SpiceDB, Permify) and policy engines (Cedar, OPA, Casbin) were considered and rejected.
They decide outside the database, so RLS cannot use their answer, and they add a service and a dual-write consistency problem to every deployment.

The UI also asks "can I?", to show or hide controls.
That answer comes from the same SQL functions and is cosmetic.

### A2. One primitive: a role, assigned to a principal, at a target.

There is one way to grant access. Broad and narrow grants are the same row with a different target.

| Target | Meaning | Example |
| --- | --- | --- |
| global | every scope the role's permissions name | "Content editor, everywhere" |
| scope | every row of one entity type | "Content editor on all articles" |
| entity | one row | "Content editor on article 42" |

You must not build a second mechanism (per-entity ACL flags, per-user permission overrides) beside it.
Two mechanisms means two mental models for admins and two code paths to merge in every check.

### A3. A role is a bundle of permissions. A permission is a scope plus an action.

`article.update` is the permission `(scope 'article', action 'update')`.
Code checks permissions, never roles.

You must not write `if role === 'editor'` or `role.slug = 'editor'` in a policy.
Roles are admin-editable data. A check against a role name silently changes meaning when an admin edits the role.

At an entity target, only the role's permissions whose scope matches the entity apply.
Assigning "Content editor" (which holds `article.update` and `media_asset.update`) on article 42 grants `article.update` on article 42 and nothing on media.

### A4. Standard actions are `read`, `create`, `update`, `delete`, `share`. Modules add their own verbs.

`share` is the right to grant access to an entity to someone else.
Module verbs name domain actions: `publish`, `receive`, `pick`.
Actions are `text`, not an enum, because every module extends the list.

`create` is meaningful only at global or scope targets. There is no entity to target before it exists.

`read` governs rows that are not already public.
A module's public-read policy (published articles, a storefront) stays as it is.

### A5. `user_account.admin` stays, as the application owner's break-glass.

An admin holds every permission, everywhere, by definition: `current_user_can()` returns true for an admin before it looks at any assignment.

Admin is not replaced by a seeded "Administrator" role.
A role can be edited or unassigned, so the last person able to manage roles could remove their own ability to do it.
The boolean, guarded by `admin_set_user_admin()`'s last-administrator check, cannot be lost that way.

Managing roles, groups, and global or scope-level assignments is admin-only in v1.

### A6. Grants are additive. There is no deny.

You must not add a deny or exclusion rule.
With denies, the answer depends on evaluation order and precedence, and an admin looking at a screen of grants can no longer tell what someone can do.
Narrow the grant instead.

### A7. Entity-level assignments live in one generated table per access-controlled entity.

`article_role_assignment` holds assignments targeting articles, with a real foreign key to `article` and `on delete cascade`.

A single polymorphic table (`role_assignment.entity_id` pointing at any table) was rejected.
It is the same shape as `local_text_link`, which the ecosystem is already planning to leave for per-entity join tables.
Grants are greenfield, so they start on the pattern copy is moving to.
Per-entity tables give you:

- No orphaned grants. Deleting an article deletes its grants.
- A real foreign key, with no `bigint` constraint forced across the ecosystem.
- A small, indexed table for each entity's RLS policy to consult.

You do not hand-write these tables. `sveltebuilder sync:supabase` generates them from the module manifest (A11).

### A8. Global and scope-level assignments live in one `role_assignment` table.

Its `scope` column is null for a global assignment.

> [!IMPORTANT]
> This is not a breach of guardrail 6 ("scope is never a schema column").
> Guardrail 6 forbids a **domain entity** from carrying its own scope.
> Infrastructure tables that address entities across types already carry it: `local_text_link.scope`.
> `permission.scope` and `role_assignment.scope` are that kind of table.
> Phase 10 restates guardrail 6 in `CLAUDE.md` to say so explicitly.

It is named `scope` because it is the same concept: the entity type's table name, which is already the local-text scope.
One concept, one name.

### A9. Principals are users and groups. Groups do not nest.

A role assignment names exactly one principal: a `user_account` or a `user_group`.
A user holds everything their groups hold.

Nested groups are excluded from v1.
They turn every check into a recursive walk and make "why does this person have access?" hard to answer.

### A10. External groups are second-class.

A `user_group` with `external = true` represents an outside organization (a carrier, a supplier, a partner newsroom).

An external group can be assigned roles **at entity targets only**.
A trigger refuses a global or scope-level assignment to an external group.
Beyond that, external members reach data through relationship predicates in module policies (A13), never through broad grants.

This matches how SvelteBuilder apps are shaped: single-tenant at the core, with outside parties admitted to specific records.

> [!NOTE]
> Known cost: an outside auditor who should read every shipment cannot be modeled as an external group.
> Model them as an internal group, or revisit A10 when a real case arrives.

### A11. Modules declare what is access-controlled in their registry manifest.

A module's `.sveltebuilder/registry/<module>.json` gains an `access` key.
It lists the permission catalog (scope → actions) and which scopes get entity-level assignment tables.
`sync:supabase` reads it and generates the permission rows, the per-entity tables, their policies, and their helper functions into one supplemental file.

The manifest is the single source because both Drizzle-era and post-Drizzle sync can read JSON.
The declaration survives Drizzle's removal unchanged.

The module's own `seed.sql` still supplies EN and FR copy for its permissions and seeded roles, as it does for every other entity.

### A12. Every write to access tables goes through SECURITY DEFINER RPCs. Direct DML is revoked.

You must revoke `insert`, `update`, `delete` on every access table from `anon` and `authenticated`, exactly as `05-user-account-hardening.sql` does for `user_account`.

RLS cannot see which columns an allowed `UPDATE` touches, and it cannot express "the granted role must not exceed the granter's own rights".
Both rules need code, and code a route can skip is no rule (see the `user_account` incident in `CLAUDE.md`).

The entity sharing RPC enforces the escalation rule:

- The caller holds `<scope>.share` on that entity, at any target width.
- Every permission in the granted role, for that scope, is one the caller holds on that entity.

### A13. Ownership and assignment are predicates, not grants.

"Edit your own article" is `user_account_id = (select public.current_user_id())` in the policy, with its own action (for example `update_own`).
"The assigned editor can edit this article" is an `exists` against `article_assignment`.
"A carrier sees its shipments" is `carrier_user_group_id = any ((select public.current_user_group_ids()))`.

You must not create a role assignment row per author, per assignment, or per record an outside party owns.
The data already says who is related. Copying it into grants creates two sources of truth that drift.

### A14. Policies call the helpers so Postgres evaluates them once per statement.

Every check is wrapped as `(select …)` with constant arguments, so the planner hoists it into an InitPlan:

```sql
using (
  (select public.current_user_can('article', 'update'))
  or id = any ((select public.current_user_article_ids('update')))
)
```

The scope-level check is one boolean per statement.
The entity-level check is one array per statement: the IDs this user holds that action on.
Per-user entity grants are few, so the array stays small, and listing 10,000 articles costs one lookup, not 10,000.

The helpers are `STABLE`, `SECURITY DEFINER`, `set search_path = ''`, for the reasons written at the top of `00-auth-functions.sql`.

### A15. Assignments can expire.

Every assignment carries a nullable `expires_at`. An expired assignment grants nothing.
It costs one column and one predicate, and it covers contractors, embargoed collaborators, and temporary cover without a cleanup job.

### A16. Role, permission and group copy is localized like any other entity.

`role`, `permission` and `user_group` carry no `name` or `description`.
Their labels resolve through diglossia under the `role`, `permission` and `user_group` scopes.
Admin-created roles get their copy through the same atomic link-plus-copy RPC pattern as `04-admin-write-rpc.sql`.

That makes the components that render them Camp 2.

### A17. The admin UI shows inheritance, and can explain any answer.

An entity's access panel lists everyone who can act on it: direct entity grants (removable there) and access via a scope or global grant (shown, marked with where it comes from, not removable there).
An admin-only `explain_access()` function returns the chain behind any answer: which role, which target, through which group, until when.

This is what makes broad and narrow grants intuitive together.
Without it, an admin who removes someone from an article and sees them keep access has no way to find out why.

---

## Decided exclusions for v1

You must not build these in v1. Each is excluded for a reason, and each fits the model later without a redesign.

| Excluded | Why | How it fits later |
| --- | --- | --- |
| Deny rules | A6 | Not planned. |
| Nested groups | A9 | A `user_group_member` row whose member is a group, flattened by `current_user_group_ids()`. |
| Field-level permissions | RLS cannot see columns; column privileges are per role, not per user. | RPCs per guarded field, as `admin_set_user_admin` does. |
| Container targets ("everything in the Sports section") | See O5. | A fourth target width, driven by a declared parent relation the generator follows. |
| Conditions beyond expiry (time windows, IP, attributes) | Complexity without a v1 user. | Extra predicates in `current_user_can()`. |
| An access audit log | `granted_by` and `granted_at` cover "who granted this". Revocation history is lost on delete. | A future audit or analytics module subscribing to the RPCs. |
| Invitations and self-service sign-up into groups | Product flow, not authorization. | RPCs on top of `user_group_member`. |
| JWT role claims | `CLAUDE.md` already forbids them for `admin`; the same reason applies. | Not planned. |

---

## Open — settle in Phase 0

| # | Question | Recommendation |
| --- | --- | --- |
| O1 | Package name for the schema, views and Camp 2 components. | `@sveltebuilder/access` (**pending**). It ships in every scaffold, never as a selectable module, because every module's policies call its functions. |
| O2 | Where the core SQL lives. | `tools/create/templates/base/supabase/supplemental/`. It depends only on the `current_user_id()` / `current_user_admin()` contract that `00-local-text-rls.sql` already relies on, so it stays provider-neutral. |
| O3 | Table, function, component and manifest names. | The **pending** names in `docs/ACCESS-CONTROL.md` §Names. |
| O4 | Release train. The repo is in Changesets pre mode (`rc`). Landing during the RC window ships access in content and logistic `2.0.0`. | Hold this branch until `2.0.0` exits pre mode, then release as minors (`2.1.0`). The RC window is for stabilization, and A5 keeps every existing admin's access identical, so nothing here needs to be a major. |
| O5 | Container targets in v1. David's newsroom will want "editor of the Sports section", and `article_section` is many-to-many. | Exclude from v1 core. Plan it as Phase 11, run only on your go-ahead, after content adoption shows how far scope and entity grants plus assignment predicates get. |
| O6 | Seeded roles are module-managed. Can an admin edit their permissions? | No. A role with a non-null `slug` is module-managed: its permissions are read-only in the UI and refused by the RPC. A re-run seed would otherwise silently re-add what an admin removed. Admins clone a seeded role to customize it. |
