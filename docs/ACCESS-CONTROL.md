# Access Control — Design

> [!NOTE]
> Status: approved design, not yet built. Decisions and their reasons are in `docs/ACCESS-CONTROL-DECISIONS.md` (referenced here as A1–A22, E1–E3, O1–O6). The build order is `docs/ACCESS-CONTROL-PLAN.md`. How developers and admins use it is `docs/ACCESS-CONTROL-USAGE.md`.
> Every name in §8 is approved. Module role slugs (§7) are proposals until that module adopts.

This is the shape of roles and permissions in SvelteBuilder.
It covers the data model, the SQL that enforces it, what the sync generator produces, the admin UI, and how a module adopts it.

---

## 1. The model in one paragraph

A **permission** is a scope plus an action (`article.update`).
A **role** is a named bundle of permissions.
A **role assignment** gives a role to a **principal** (a user, or a group) at a **target**: everything, every row of one scope, or one row.
A user can do an action on a row if they are an admin, or if any unexpired assignment, theirs or one of their groups', covers that row with a role holding that permission.
Relationships already in the data (authorship, article assignment, a carrier on a shipment) add access through policy predicates, not through grants.
Rows that belong to an entity (an article's blocks) follow the entity's check, and a column a module verb guards (an article's status) changes only through that module's RPC.
Postgres decides all of it, in RLS and in definer functions that check the same helpers.

---

## 2. Tables

Every table's own `id` is `integer generated always as identity`, TypeScript `number` (guardrail 5).
A foreign key takes the type of the key it references: `user_account.id` and the content and logistic entity keys are `bigint`, so those columns are `bigint`.
None of these tables carries copy (A16).

### 2.1 Static tables (in `@sveltebuilder/access`)

```sql
-- One row per (scope, action). Written by sync's generated supplemental SQL (A11); never by the app.
permission (
  id      integer PK,
  scope   text NOT NULL,          -- entity table name: 'article'
  action  text NOT NULL,          -- 'read' | 'create' | 'update' | 'delete' | 'share' | module verb
  UNIQUE (scope, action)
)

role (
  id          integer PK,
  slug        text NULL UNIQUE,   -- non-null = seeded by a module, permissions locked (O6)
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz
)

role_permission (
  role_id        integer NOT NULL REFERENCES role ON DELETE CASCADE,
  permission_id  integer NOT NULL REFERENCES permission ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
)

user_group (
  id          integer PK,
  external    boolean NOT NULL DEFAULT false,   -- A10
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz
)

user_group_member (
  user_group_id    integer NOT NULL REFERENCES user_group ON DELETE CASCADE,
  user_account_id  bigint NOT NULL REFERENCES user_account ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_group_id, user_account_id)
)

-- Global (scope null) and scope-level assignments.
role_assignment (
  id               integer PK,
  role_id          integer NOT NULL REFERENCES role ON DELETE CASCADE,
  user_account_id  bigint NULL REFERENCES user_account ON DELETE CASCADE,
  user_group_id    integer NULL REFERENCES user_group ON DELETE CASCADE,
  scope            text NULL,     -- null = global (A8)
  granted_by       bigint NULL REFERENCES user_account ON DELETE SET NULL,
  granted_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NULL,
  CHECK (num_nonnulls(user_account_id, user_group_id) = 1),
  UNIQUE NULLS NOT DISTINCT (role_id, scope, user_account_id, user_group_id)
)
```

`UNIQUE NULLS NOT DISTINCT` is required, not cosmetic, for the reason `CLAUDE.md` gives under _Seed file conventions_: a global user assignment has two nulls in the key.

Two triggers on `role_assignment`:

- `scope` must name a scope present in `permission`. A typo would otherwise grant nothing, silently.
- A row whose `user_group_id` is an external group is refused (A10).

### 2.2 Generated tables (one per access-controlled scope)

For each scope a manifest lists under `access.entity` (§4), sync generates:

```sql
article_role_assignment (
  id               integer PK,
  article_id       bigint NOT NULL REFERENCES article ON DELETE CASCADE,  -- type of article.id
  role_id          integer NOT NULL REFERENCES role ON DELETE CASCADE,
  user_account_id  bigint NULL REFERENCES user_account ON DELETE CASCADE,
  user_group_id    integer NULL REFERENCES user_group ON DELETE CASCADE,
  granted_by       bigint NULL REFERENCES user_account ON DELETE SET NULL,
  granted_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NULL,
  CHECK (num_nonnulls(user_account_id, user_group_id) = 1),
  UNIQUE NULLS NOT DISTINCT (article_id, role_id, user_account_id, user_group_id)
)
-- idx_article_role_assignment_user_account_id, idx_article_role_assignment_user_group_id
```

The FK column follows the naming rule `<singular_table>_id`.
The generator reads the entity's primary key type from the database shape it is generating against, not from an assumption.

RLS on the generated table: an admin, the grantee (directly or through a group), and a holder of `article.share` on that article may select. Nobody writes it except through the §3.2 RPCs.

---

## 3. Functions

All are `STABLE` (except the RPCs), `SECURITY DEFINER`, `set search_path = ''`, every reference schema-qualified (A14).
They are `SECURITY DEFINER` because the access tables are not readable by ordinary users: you can see your own grants through the RPCs below, not by selecting the tables.

### 3.1 Core (static, in base supplemental SQL)

| Function | Returns | Meaning |
| --- | --- | --- |
| `current_user_group_ids()` | `integer[]` | Groups the current user belongs to. Empty for anon. |
| `current_user_can(p_scope text, p_action text)` | `boolean` | Admin, or an unexpired global or `p_scope` assignment (user's or a group's) whose role holds `(p_scope, p_action)`. |

`current_user_can` answers the broad question only. It never looks at entity tables.

### 3.2 Generated, per access-controlled scope

| Function | Returns | Meaning |
| --- | --- | --- |
| `current_user_article_ids(p_action text)` | `bigint[]` (the entity key's type) | Article IDs with an unexpired entity assignment (user's or a group's) whose role holds `('article', p_action)`. |
| `current_user_article_actions(p_article_ids bigint[])` | `table (article_id bigint, action text)` | Every action the user holds on each given article, from every target width. For the UI only (§6.1). |
| `create_article_role_assignment(p_article_id, p_role_id, p_user_account_id, p_user_group_id, p_expires_at)` | `bigint` | Volatile. Enforces A12's escalation rule. Sets `granted_by`. |
| `delete_article_role_assignment(p_id integer)` | `void` | Volatile. The caller needs `article.share` on that article (see E1). |
| `list_article_access(p_article_id bigint)` | `table (…)` | The panel's rows (A17): direct grants on the article, plus every unexpired global or `article` scope assignment whose role holds an `article` permission. Each row carries principal (with email), role, target width, group, `granted_by`, `expires_at`, and whether it is direct. For an admin or a holder of `article.share` on it. |
| `list_article_principal(p_article_id bigint)` | `table (…)` | Every user (id, email) and group (id, `external`) a sharer may pick. For an admin or a holder of `article.share` on it. Its privacy cost is A20. |

### 3.3 Admin RPCs (static)

Each checks `current_user_admin()` itself, like `admin_set_user_admin`:

- `create_role`, `delete_role`, `set_role_permissions` — refuses a role with a non-null `slug` (O6).
- `create_role_assignment`, `delete_role_assignment` — global and scope targets.
- `create_user_group`, `delete_user_group`, `add_user_group_member`, `remove_user_group_member`.

`explain_access()` is excluded from v1; see the exclusions table in DECISIONS.

Copy for `create_role` and `create_user_group` goes through the link-plus-copy pattern in `04-admin-write-rpc.sql`, in the same transaction.

### 3.4 The policy shape

Every module policy on an access-controlled table takes this form:

```sql
drop policy if exists "article_update" on public.article;
create policy "article_update"
  on public.article for update
  to authenticated
  using (
    (select public.current_user_can('article', 'update'))
    or id = any ((select public.current_user_article_ids('update'))::bigint[])
    or exists (                                   -- relationship predicate (A13)
      select 1 from public.article_assignment aa
      where aa.article_id = article.id
        and aa.user_account_id = (select public.current_user_id())
        and aa.role in ('author', 'editor')
    )
  )
  with check ( … same … );
```

Insert policies use `current_user_can(scope, 'create')` alone.
A scope with no entity-level table uses only the first line.

A table whose rows belong to an access-controlled entity checks the parent, with the parent's permissions (A18):

```sql
create policy "article_block_update"
  on public.article_block for update
  to authenticated
  using (
    (select public.current_user_can('article', 'update'))
    or article_id = any ((select public.current_user_article_ids('update'))::bigint[])
  )
  with check ( … same … );
```

### 3.5 Columns a module verb guards

A column whose change a verb other than `update` governs is written only by its module's RPC (A19):

```sql
revoke update on public.article from anon, authenticated;
grant update (canonical_slug, embargo_expires_at, comment_allowed, lead_media_asset_id, …)
  on public.article to authenticated;     -- every column except article_status_id and published_at
```

The transition RPC is `SECURITY DEFINER`, `set search_path = ''`, and checks the caller with the same helpers as the policy, for the specific row:

```sql
if not (
  (select public.current_user_can('article', v_required_action))
  or p_article_id = any ((select public.current_user_article_ids(v_required_action))::bigint[])
) then
  raise exception 'not permitted' using errcode = '42501';
end if;
```

`v_required_action` is `publish` when the article moves to or from `published`, and `update` otherwise.

An insert needs no column grant, because its `with check` sees the whole new row:

```sql
create policy "article_insert"
  on public.article for insert
  to authenticated
  with check (
    (select public.current_user_can('article', 'create'))
    and (
      (select public.current_user_can('article', 'publish'))
      or (
        published_at is null
        and article_status_id <> (select id from public.article_status where slug = 'published')
      )
    )
  );
```
Because it runs as definer, the RPC must also apply whatever row conditions the update policy would have, such as `deleted_at is null`.

> [!WARNING]
> Never call a helper bare, or with an argument that references the row.
> `current_user_can(scope_column, 'update')` is not hoisted and runs once per row.
> Arguments are always literals.

---

## 4. The manifest declaration

A module's registry manifest gains `access` (A11):

```json
{
  "package": "@sveltebuilder/content",
  "schema": "@sveltebuilder/content/schema",
  "after": ["@sveltebuilder/local-text-schema", "@sveltebuilder/superprototype"],
  "access": {
    "permission": {
      "article": ["read", "create", "update", "update_own", "delete", "share", "publish"],
      "section": ["read", "create", "update", "delete"],
      "media_asset": ["read", "create", "update", "delete"]
    },
    "entity": ["article"]
  }
}
```

- `access.permission` is the permission catalog. Sync writes one `permission` row per pair into the generated supplemental file, as `insert … on conflict do nothing`, not into the seed (A11).
- `access.entity` lists the scopes that get §2.2 tables and §3.2 functions. Every scope here must also appear in `access.permission` with `share`, or sync fails.
- Keys are singular, per the JSON rule in `CLAUDE.md`.

Sync writes everything generated into one supplemental file (`access-generated.sql`).
That file must be re-runnable (`create table if not exists`, `create or replace function`, `drop policy if exists`), because sync carries an edited supplemental file forward in full into a new migration.

Sync orders that file itself, directly after the core `01-access.sql`, rather than by its name (A21).

Removing a scope from `access.entity`, or a pair from `access.permission`, removes nothing from the database: sync stops generating the objects, and a deleted supplemental file undoes nothing. Write the `drop` in a supplemental file, as for any other supplemental object.

A shape change to a generated table after it exists (a new column) needs an `alter`, which `create table if not exists` will not perform.
The generator emits idempotent `alter table … add column if not exists` for every column, so a regenerated file upgrades an older database.

---

## 5. TypeScript

### 5.1 Package `@sveltebuilder/access` (O1)

```
packages/access/
└── src/lib/
    ├── schema/            Drizzle tables of §2.1, one per file, plus index.ts
    ├── views.ts           view-model types (§6)
    ├── Role/              RolePermissionMatrix.svelte, role.css
    ├── RoleAssignment/    RoleAssignmentPanel.svelte, RoleAssignmentTable.svelte, role-assignment.css
    └── UserGroup/         UserGroupMemberTable.svelte, user-group.css
```

The static tables are Drizzle definitions, like every other package, until Drizzle's role is settled (`CLAUDE.md` Tech Stack).
The generated tables are SQL only. The scaffold does not generate Supabase types, and every read of an access table goes through an RPC, so each RPC's result row type is declared at its data module, as `article-preview-token.ts` does for content's preview RPCs. The view types those rows convert to live in `views.ts`.

The package ships no queries (guardrail 11).

### 5.2 Scaffold data modules

One file per table in the flavour's `src/lib/server/`, per the data-module rule:

- `role.ts`, `role-assignment.ts`, `user-group.ts`, `user-group-member.ts`, `permission.ts` — admin screens.
- Each module's overlay gains `<entity>-role-assignment.ts` for the generated tables, exporting `list<Entity>Access`, `list<Entity>Principal`, `create…`, `delete…`, and `list<Entity>Action`: one function per §3.2 RPC.

### 5.3 Actions in view models

A loader that renders controls for a row asks once, for all rows on the page, and puts the answer in the view model:

```ts
type ArticleAdminRowView = {
  id: number;
  // …
  actions: PermissionAction[];   // from current_user_article_actions
};
```

The screen shows the edit button when `actions.includes('update')`.
This is cosmetic. If the screen is wrong, RLS still refuses the write, and the form action reports it with `formError`.

Until `2.0.0` leaves pre mode, `actions` is optional on any view type a module already exports (O4), so an existing project's loaders still typecheck.

---

## 6. UI

### 6.1 coreui addition: `CheckboxMatrix`

A grid of checkboxes with row and column headers, built as a real `<table>` with one labelled checkbox per cell.
Each cell is one of: checked, unchecked, or inherited (checked, read-only, with a description naming the source).
It takes plain string labels and a `labels` prop, and imports nothing from diglossia, so it is Camp 1.

It belongs in coreui because more than one module needs it: role permissions here, notification preferences, and per-channel settings in content and commerce.
`Matrix` is a new role suffix, approved 2026-10-17: a grid of one control per row-and-column pair.

Accessibility requirements: every checkbox has an accessible name combining its row and column headers; inherited cells are `aria-disabled` with `aria-describedby` pointing at the source text, not merely greyed; the table has a caption.

### 6.2 `@sveltebuilder/access` components (Camp 2)

| Component | Shows |
| --- | --- |
| `RolePermissionMatrix` | A role's permissions: scopes as rows, actions as columns, on `CheckboxMatrix`. Read-only for a module-managed role. |
| `RoleAssignmentTable` | Global and scope assignments: principal, role, target, expiry. |
| `RoleAssignmentPanel` | One entity's access, from `list_<entity>_access`: direct grants (removable), inherited access with its source and any group it arrives through (not removable), and a slot for the host page's add form. |
| `UserGroupMemberTable` | A group's members. |

They resolve role, permission and group copy through `getDictionary()`, with the usual `dictionary?` prop override.
They are presentational: forms post to the host route's actions, passed in as snippets.

### 6.3 Base admin screens

In the base template tree beside `locale` and `navigation-item`:

- `/admin/role` and `/admin/role/[id]` — list, create, clone a module-managed role, edit permissions.
- `/admin/user-group` and `/admin/user-group/[id]` — groups, members, `external`.
- `/admin/user-account` and `/admin/user-account/[id]` — users, their global and scope assignments, groups, and admin flag (through `admin_set_user_admin`).

Module admin detail screens for an `access.entity` scope add `RoleAssignmentPanel`. Content's article admin detail is the first.

---

## 7. Module adoption

A module adopts access control by:

1. Declaring `access` in its manifest (§4).
2. Seeding its roles in `seed.sql`, with a `slug`, their `role_permission` rows resolved by `(scope, action)`, and EN and FR copy for every role and permission.
3. Rewriting its admin-gated policies to the §3.4 shape. Admins keep identical access (A5), so this changes nothing for an existing deployment until someone assigns a role.
4. Adding relationship predicates where the data already says who is related (A13).
5. Adding `RoleAssignmentPanel` to the admin detail screen of each `access.entity` scope.

### Content (first adopter, for David)

- `access.entity`: `article`.
- Child tables (A18): `article_block`, `article_byline`, `article_section`, `article_topic`, `article_tag`, `article_checklist_state`, `live_coverage`, and `live_update` through its coverage. Phase 0's worklist confirms the list.
- Status (A19): `content_transition_article_status` becomes `SECURITY DEFINER` and the only writer of `article_status_id` and `published_at`; `publish` governs moves to or from `published`. The insert policy refuses a new article that is already published unless the caller holds `article.publish`.
- Relationship predicates: `article_assignment` (assigned author or editor may update), author ownership if the schema carries it.
- `article_assignment` writes are gated as grants (A13): insert, update and delete need `article.share` and `article.update` on that article. One statement each, so this is plain RLS, not an RPC.
- Seeded roles (proposed slugs): `content_editor`, `content_writer`, `content_contributor`. Final set comes from the newsroom's actual workflow, settled at the start of that phase.
- Public-read policies on published content are unchanged.

### Logistic

- Scope-level only in v1. No `access.entity` unless a real per-record case appears.
- Seeded roles (proposed): `logistic_manager`, `logistic_operator`.
- No external-group predicates in v1. Logistic has no outside-party concept on its tables, and this work does not invent one.
- Reads, `worker_update` and the five stock functions are all gated on permissions (A22). The definer stock functions take the actor from `current_user_id()`, not a parameter.

### Commerce

Not started. It adopts the same shape when it is built.

---

## 8. Names (approved 2026-10-17)

| Kind | Name |
| --- | --- |
| Package | `@sveltebuilder/access` |
| Tables | `permission`, `role`, `role_permission`, `role_assignment`, `user_group`, `user_group_member`, `<entity>_role_assignment` |
| Columns | `scope`, `action`, `slug`, `external`, `granted_by`, `granted_at`, `expires_at` |
| Functions | `current_user_group_ids`, `current_user_can`, `current_user_<entity>_ids`, `current_user_<entity>_actions`, `list_<entity>_access`, `list_<entity>_principal`, `create_/delete_` RPCs as in §3 |
| Supplemental files | `01-access.sql` (core), `access-generated.sql` (sync output) |
| Standard actions | `read`, `create`, `update`, `delete`, `share`; `update_own` for the ownership pattern |
| Manifest | `access.permission`, `access.entity` |
| coreui | `CheckboxMatrix` |
| Components | `RolePermissionMatrix`, `RoleAssignmentTable`, `RoleAssignmentPanel`, `UserGroupMemberTable` |
| Role suffix | `Matrix` |
| Assertion file | `scripts/sql-check/25-assert-access.sql` |
| Added in Phase 2 (review in the PR) | Internal SQL functions, not executable by `anon` or `authenticated`: `role_assignment_check_target()` (trigger function, and the trigger's name), `access_require_admin()` (the admin check every admin RPC starts with), `access_delete_entity_copy(scope, entity_id)` (removes a deleted role's or group's copy) |
| Added in Phase 1 (approved 2026-10-17) | `STANDARD_PERMISSION_ACTIONS` and `StandardPermissionAction` (the five standard actions, declared once; `PermissionAction` admits module verbs beside them); view types `RoleAssignmentRow`, `UserGroupMemberRow`, `UserAccountOption`, `UserGroupOption`, following logistic's `…Row` and `…Option` pattern |
| TS types | `Permission`, `PermissionAction`, `Role`, `RoleAssignment`, `UserGroup`, `UserGroupMember`, plus `…View` types in `views.ts` |
| Local-text scopes | `role`, `permission`, `user_group` (entity copy); `access` (module UI copy, slugs `access.<concept>.<key>`) |
| Routes | `/admin/role`, `/admin/user-group`, `/admin/user-account` |

> [!NOTE]
> Content already has `article_assignment.role` (`author`, `editor`, `photo`, `copy`), typed by the enum `article_assignment_role`.
> That is a workflow concept, not an access role, and its qualified enum name keeps them apart.
> Phase 0 decides whether the bare column name `role` on `article_assignment` should become `article_assignment_role` to stop the two reading alike in a policy.

---

## 9. What proves it works

`pnpm sql:check` is the gate that matters. Nothing else runs a policy.
A new assertion file (`25-assert-access.sql`) impersonates principals and asserts, at minimum:

- A user with no assignment cannot read a non-public row, update, or delete.
- A scope-level grant admits every row of that scope and no other scope.
- An entity-level grant admits that row only.
- A grant through a group works; removing the member removes the access.
- An expired assignment admits nothing.
- A global assignment of a role spanning two scopes admits both; the same role at an entity target admits only the matching scope.
- An external group cannot receive a global or scope assignment.
- `share` without holding a permission cannot grant it (escalation refused).
- A non-admin cannot call any admin RPC, and direct DML on every access table is refused.
- Deleting an entity deletes its entity-level assignments.
- A module-managed role's permissions cannot be changed.
- Admins keep access with no assignments at all.
- An entity-level `update` grant admits that article's child rows (A18) and no other article's.
- A user holding `article.create` but not `article.publish` cannot insert an article that is already published.
- A user holding `article.update` but not `article.publish` cannot change `article_status_id` directly, cannot move an article to or from `published` through the RPC, and can make other transitions.
- The `article` column grant names every column except the guarded ones (A19), so a newly added column fails the gate until it is granted.
- Writing an `article_assignment` row needs `article.share` and `article.update` on that article (A13).
- `list_<entity>_access` and `list_<entity>_principal` refuse a caller without `share` on that entity, and a sharer cannot read another entity's grants.
- The `permission` catalog is present after the migration alone, before any seed runs (A11).
- Every policy calling an access helper calls it as `(select …)` with literal arguments (extends the existing policy-pattern assertion).
