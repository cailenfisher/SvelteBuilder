# Access Control — Decision Record

> [!NOTE]
> Status: design approved in conversation on 2026-10-17; review findings settled the same day (A18–A21, the sharing edges, and the `explain_access()` exclusion). O1–O6 and every name in `docs/ACCESS-CONTROL.md` §8 were approved on 2026-10-17. The design itself is `docs/ACCESS-CONTROL.md`; how to use it is `docs/ACCESS-CONTROL-USAGE.md`.

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
It is the same shape as `local_text_link`, whose polymorphic design is under review.
Moving copy to per-entity join tables is being considered, not decided.
Grants need none of the polymorphic design's flexibility and have no existing rows, so they start on per-entity tables whatever that review concludes.
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

The permission rows go in that file, not in `seed.sql`.
The `role_assignment` triggers and every seeded role depend on them, and `supabase db push` does not run the seed, so a hosted database that was never seeded would refuse every assignment.
The catalog describes what the schema can enforce, which makes it schema, not sample data.

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

The rule is checked when the grant is made, and only then. What that leaves open is recorded under _Known edges in sharing_.

### A13. Ownership and assignment are predicates, not grants.

"Edit your own article" is `user_account_id = (select public.current_user_id())` in the policy, with its own action (for example `update_own`).
"The assigned editor can edit this article" is an `exists` against `article_assignment`.
"A carrier sees its shipments" is `carrier_user_group_id = any ((select public.current_user_group_ids())::integer[])`.

You must not create a role assignment row per author, per assignment, or per record an outside party owns.
The data already says who is related. Copying it into grants creates two sources of truth that drift.

> [!IMPORTANT]
> A relationship that confers access is a grant in everything but name.
> Writing an `article_assignment` row gives its user `update` on that article as surely as an `article_role_assignment` row does.
> So writes to any table a predicate reads must be gated at least as strictly as `create_<entity>_role_assignment`: the writer holds `<scope>.share` on that entity, and holds every permission the relationship confers.
> Without that gate the predicate reopens the escalation A12 closes, with no `granted_by` and no `expires_at` to show for it.

### A14. Policies call the helpers so Postgres evaluates them once per statement.

Every check is wrapped as `(select …)` with constant arguments, so the planner hoists it into an InitPlan:

```sql
using (
  (select public.current_user_can('article', 'update'))
  or id = any ((select public.current_user_article_ids('update'))::bigint[])
)
```

The cast is required, not decoration. Without it, `= any ((select …))` is the subquery form of `ANY`, which compares the column with the whole array and fails with `operator does not exist: integer = integer[]`. With it, the parenthesised subselect is a scalar, still hoisted into an InitPlan (found in Phase 2, checked with `explain`).

The scope-level check is one boolean per statement.
The entity-level check is one array per statement: the IDs this user holds that action on.
Per-user entity grants are few, so the array stays small, and listing 10,000 articles costs one lookup, not 10,000.

The helpers are `STABLE`, `SECURITY DEFINER`, `set search_path = ''`, for the reasons written at the top of `00-auth-functions.sql`.

### A15. Assignments can expire.

Every assignment carries a nullable `expires_at`. An expired assignment grants nothing.
It costs one column and one predicate, and it covers contractors, embargoed collaborators, and temporary cover without a cleanup job.

### A16. Role, permission and group copy is localized like any other entity.

`role`, `permission` and `user_group` carry no `name` or `description`.
A role's and a group's names are entity copy (`name` under the `role` or `user_group` scope, by id).
Admin-created roles and groups get theirs through the RPC that creates them, in the same transaction.

A permission's label is built from two pieces of `access` UI copy rather than copy of its own: its scope's label, `access.permission_scope.<scope>`, and its action's, `access.permission_action.<action>` (amended 2026-10-17, Phase 6).
The permission grid needs exactly those two, one per row and one per column; a label per (scope, action) row could fill neither, and the scope labels had no home at all.
The access seed labels the standard actions; a module seeds its own scopes and verbs under the same scope.

That makes the components that render them Camp 2.

### A17. The entity access panel shows inheritance.

An entity's access panel lists everyone who can act on it: direct entity grants (removable there) and access via a scope or global grant (shown, marked with where it comes from, not removable there).
Each row names its role, its target width, the group it arrives through (if any), and its expiry.

This is what makes broad and narrow grants intuitive together.
Without it, an admin who removes someone from an article and sees them keep access has no way to find out why.

A per-user `explain_access()` function was designed and then excluded from v1. See the exclusions table.

### A18. Rows that belong to an access-controlled entity follow that entity's check.

An article's body is its `article_block` rows, its bylines, its taxonomy links and its live coverage.
Their policies check the parent, with the parent's permissions:

```sql
using (
  (select public.current_user_can('article', 'update'))
  or article_id = any ((select public.current_user_article_ids('update'))::bigint[])
)
```

You must not give a child table its own permissions or its own entity-assignment table.
"Editor on article 42" that cannot edit article 42's body grants nothing useful, and a separate grant for the body is a second thing to keep in step with the first.

Comparing the row's `article_id` with the hoisted array is the A14 shape. The helper's argument is still a literal.

### A19. A state change that a module verb guards goes through an RPC. The column is not writable directly.

RLS sees a row, not the columns an `UPDATE` changes (the same limit A12 rests on).
So when a verb is really a column transition, such as `publish` setting `article.article_status_id`, `update` and `publish` are indistinguishable to a policy.
Anyone who can update the row could publish it.

For each such column:

- Revoke table-level `UPDATE` from `anon` and `authenticated`, and grant `UPDATE` on an explicit list of every other column. Postgres cannot revoke one column from a table-level grant, so the grant has to be rebuilt per column.
- The module's transition RPC becomes the only writer of that column. It is `SECURITY DEFINER`, because it writes a column the caller cannot, and so it checks the caller itself, with the same helpers a policy uses.

Content already has the RPC: `content_transition_article_status` enforces the publish checklist.
Today it is `SECURITY INVOKER`, and an admin can `PATCH article_status_id` directly and skip the checklist, despite the data module's comment that it cannot be bypassed.
Under A19 it becomes the only path: moving an article to or from `published` needs `article.publish` on it, and any other transition needs `article.update`.
Unpublishing needs `publish` too (confirmed 2026-10-17): taking a story down is as much an editorial decision as putting it up.

The explicit column list has a cost. A column added to the table later is not updatable until it is added to the grant. `pnpm sql:check` asserts the list matches the table, so the omission fails a gate instead of failing a user.

Inserts need no column grant. An insert's `with check` sees the whole new row, so the policy itself constrains the guarded columns (adopted 2026-10-17, Phase 0 proposal P1).
For `article`: a new row must have an unpublished status and a null `published_at`, unless the caller holds `article.publish`.
Without it, anyone holding `article.create` could insert an article already published, skipping both `publish` and the checklist.

Logistic's verbs (`receive`, `pick`) are already `SECURITY DEFINER` functions, which Phase 9 makes check `current_user_can()` themselves.

### A20. Anyone who can share an entity can see every user's email.

To share an article, you pick a principal.
The access tables and `auth.users` are unreadable to ordinary users, so a generated, definer RPC (`list_<entity>_principal`) returns every user, with their email, and every group, to a caller holding `<scope>.share` on that entity.

> [!WARNING]
> Known privacy cost, accepted for v1: a contributor given `share` on one article can read the whole user directory, including every email address.
> That includes a member of an external group (A10), which is the sharpest form of it: an outside partner trusted with one record sees every internal user.
> SvelteBuilder apps are single-tenant teams at the core, which is why this is acceptable for now.
>
> Decided 2026-10-17, with the external-group case explicitly considered: accepted for v1, external members included. Revisit before any deployment admits outside parties it does not trust with the internal directory.

Options when it is not:

- Return internal users only to external callers, or only the members of groups the caller shares.
- Return display names (the `user_account` copy) and require an exact email to add someone not already listed.
- Add a `discoverable` flag to `user_account`, so a user can be left out of the picker.

### A21. Sync places the generated access SQL itself, not by filename.

The generated file must apply after the core access SQL it calls and before every module file that calls it.
A filename prefix can only guarantee that by luck: `02-access-generated.sql` sorts before `02-content-rls.sql` only because `a` sorts before `c`.

So:

- The core access SQL ships as `01-access.sql`. It needs only `current_user_id()` and `current_user_admin()`, and `01-` sorts it after `00-auth-functions.sql`. A `00-` name would not: `00-access` sorts before `00-auth`.
- Sync writes the generated SQL to `supabase/supplemental/access-generated.sql`, and orders it directly after `01-access.sql`, whatever its name. The file still lives in `supplemental/`, so the existing carry-forward-by-content rule applies to it unchanged.

Ordering every supplemental file by filename prefix is itself under question. A replacement is recorded in `docs/DEFERRED.md`, under _Supplemental SQL ordering_.

### A22. Logistic reads and warehouse work require a permission.

Today any signed-in user reads every logistic table and may update receipts, picks, returns and counts within their status windows (`using (true)` and the `worker_update` policies).
Adoption gates all of it on permissions, as the model requires, so an existing non-admin worker holds nothing until someone assigns them a role (adopted 2026-10-17, Phase 0 proposal P2).

Leaving reads open was rejected: the whole warehouse would stay readable by anyone who can sign in, including future external-group members.
A built-in "every signed-in user" principal was rejected: a second kind of principal for a one-time transition.

The upgrade note tells operators to assign `logistic_operator` to existing staff before they upgrade.
No deployment depends on SvelteBuilder yet, so a behaviour change like this is acceptable where it is the right design.

### A23. Content's roles, and what an assignment means (settled 2026-10-18, Phase 8).

Content seeds three module-managed roles:

| Role | Holds | Meant for |
| --- | --- | --- |
| Editor (`content_editor`) | every content permission: articles including publish and share, sections, topics, tags, fronts, media, newsletters, comment moderation | editors-in-chief and desk editors |
| Writer (`content_writer`) | `article.read`, `article.create`, `media_asset.read`, `.create`, `.update` | staff writers |
| Contributor (`content_contributor`) | `article.read`, `article.update` | a freelancer or guest, given on single articles from the article's access panel |

Being assigned to an article (`article_assignment`, any assignment role) lets you read and edit it and its body, without publishing, deleting or sharing it. That is the newsroom's own record of who works on what, read as a predicate (A13), so assigning someone takes `article.share` and `article.update` on the article.

Creating an article makes its creator its author, in the same transaction (`content_create_article`). That is what lets a Writer, who may create articles but not edit every one, keep editing what they wrote, without being able to change each other's drafts.

The column `article_assignment.role` is renamed `article_assignment_role`, so it never reads like an access role in a policy.

The permission catalog covers the editorial tables: `article` (per row as well), `section`, `topic`, `tag`, `front` (its slots follow it), `media_asset` (its rights and source follow it), `newsletter` and `comment` (with the verb `moderate`). `article_status`, author and publisher profiles, the publish checklist's items, subscribers and subscriptions stay administrator-only: chrome, configuration and reader PII.

### A24. Staff reach the admin area; each screen decides for itself (settled 2026-10-18, Phase 8).

The `(admin)` layout admits administrators and staff: anyone holding at least one role, broadly or on a single row, through `current_user_scopes()`. Everyone else gets a 403 there.

Screens the base template ships for administration (roles, groups, users, locales, copy, navigation) call `requireAdministrator()` first in their loaders. A module's screen admits staff holding its scope (`requireArticleScope()` for content's article screens). RLS refuses whatever a screen lets through regardless: these are the experience, not the guard.

The menu shows an administrator every entry, and staff the entries whose `navigation_item.permission_scope` they hold anything in. An entry naming no scope is for administrators only, which is what every entry an administrator adds is until the navigation screens can set one.

Rejected: a separate staff area beside `/admin`, which would move content's screens and duplicate the admin chrome.


You must not build these in v1. Each is excluded for a reason, and each fits the model later without a redesign.

| Excluded | Why | How it fits later |
| --- | --- | --- |
| Deny rules | A6 | Not planned. |
| Nested groups | A9 | A `user_group_member` row whose member is a group, flattened by `current_user_group_ids()`. |
| Field-level permissions | RLS cannot see columns; column privileges are per role, not per user. | RPCs per guarded field, as `admin_set_user_admin` does. |
| Container targets ("everything in the Sports section") | See O5. | A fourth target width, driven by a declared parent relation the generator follows. |
| Conditions beyond expiry (time windows, IP, attributes) | Complexity without a v1 user. | Extra predicates in `current_user_can()`. |
| `explain_access()`: why one user holds an action, across every scope | The entity access panel (A17) already shows every grant on an entity and its source. Answering per user, for any scope, needs either dynamic dispatch over the entity tables or a generated branch per scope, plus a screen of its own, to answer a question the panel and the user's own assignments page answer between them. | A generated function with one static branch per `access.entity` scope, so no dynamic SQL, reading the same tables the panel reads. Revisit when an admin cannot answer "why can they still?" from those two screens. |
| An access audit log | `granted_by` and `granted_at` cover "who granted this". Revocation history is lost on delete. | A future audit or analytics module subscribing to the RPCs. |
| Invitations and self-service sign-up into groups | Product flow, not authorization. | RPCs on top of `user_group_member`. |
| JWT role claims | `CLAUDE.md` already forbids them for `admin`; the same reason applies. | Not planned. |

---

## Known edges in sharing

These follow from A12 checking a grant only when it is made. Each is accepted for v1, with the option to take when it stops being acceptable.

### E1. Any sharer can revoke any direct grant on that entity.

`delete_article_role_assignment` asks only that the caller holds `article.share` on the article.
So a sharer can remove a grant they could never have made, such as an admin's grant of a broader role.

Accepted for v1 because `share` is already a statement of trust in that entity, the panel shows `granted_by`, and the admin can restore the grant.

**Best option later:** apply the grant check to revoking. You may revoke a grant only if you could have made it, which reuses the A12 rule unchanged and keeps it symmetrical.
Restricting revocation to the original granter or an admin is the alternative, and worse: grants outlive their granter's involvement, so it strands them.

### E2. Editing a custom role widens grants that non-admins made.

When an admin adds a permission to an admin-created role, every entity grant of that role widens with it, including grants a non-admin made when the role was narrower.
The granter may not hold the new permission, so the escalation check would now refuse the same grant.

Accepted for v1 because only an admin can edit a role, and an admin already holds every permission (A5).
Module-managed roles cannot change at all (O6).

**Best option later:** the role edit screen lists the entity grants of that role made by non-admins, and asks for confirmation before saving.
That needs no model change.
Copying a role's permissions onto each grant was rejected: it makes the grant row a second source of truth for the role.
Silently dropping grants whose granter no longer qualifies was also rejected: access would vanish as a side effect of an unrelated edit.

### E3. A grant outlives its granter's right to make it.

If the granter later loses `share`, or the permission they passed on, their grants stay.
Accepted for v1, because a grant is a fact about the grantee, not a live delegation from the granter, and that is what an admin expects to see in the panel.

**Best option later:** the panel marks a grant whose granter could no longer make it, so an admin can review it. No automatic removal, for the reason given in E2.

---

## Settled on 2026-10-17

These were open questions for Phase 0. Each was answered with its recommendation.

| # | Question | Decision |
| --- | --- | --- |
| O1 | Package name for the schema, views and Camp 2 components. | `@sveltebuilder/access`. It ships in every scaffold, never as a selectable module, because every module's policies call its functions. |
| O2 | Where the core SQL lives. | `tools/create/templates/base/supabase/supplemental/`. It depends only on the `current_user_id()` / `current_user_admin()` contract that `00-local-text-rls.sql` already relies on, so it stays provider-neutral. |
| O3 | Table, function, component and manifest names. | The names in `docs/ACCESS-CONTROL.md` §8, all approved. Module role slugs are not among them: they are settled when each module adopts (Phases 8 and 9). |
| O4 | Release train. The repo is in Changesets pre mode (`rc`). Landing during the RC window ships access in content and logistic `2.0.0`. | Hold this branch until `2.0.0` exits pre mode, then release as minors (`2.1.0`). Confirmed: hold. The RC window is for stabilization, and A5 keeps every existing admin's access identical, so nothing here needs to be a major. A 2.1 release obliges every package change to be additive: in particular the `actions` field that DESIGN §5.3 adds to module view types must be optional, or the loaders of existing projects stop typechecking. |
| O5 | Container targets in v1. David's newsroom will want "editor of the Sports section", and `article_section` is many-to-many. | Exclude from v1 core. Plan it as Phase 11, run only on your go-ahead, after content adoption shows how far scope and entity grants plus assignment predicates get. |
| O6 | Seeded roles are module-managed. Can an admin edit their permissions? | No. A role with a non-null `slug` is module-managed: its permissions are read-only in the UI and refused by the RPC. A re-run seed would otherwise silently re-add what an admin removed. Admins clone a seeded role to customize it. |
