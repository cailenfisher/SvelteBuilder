# Access Control — Usage

> [!NOTE]
> Status: not yet built. This describes how the access system is meant to be used, and is the target the build is checked against (Phase 10 of `docs/ACCESS-CONTROL-PLAN.md`).
> The data model, SQL and generator are specified in `docs/ACCESS-CONTROL.md` (the design, cited here as DESIGN §n). The reasons behind each rule are in `docs/ACCESS-CONTROL-DECISIONS.md` (A1–A21, E1–E3).

The first half is for developers building on a SvelteBuilder scaffold. The second describes what admins, and the people they give access to, see and can do.

---

## The model in brief

- A **permission** is a scope plus an action: `article.update`, `article.publish`.
- A **role** is a named bundle of permissions: "Content editor".
- A **role assignment** gives a role to a user or a group, at one of three widths: **everywhere**, **every row of one kind** (all articles), or **one row** (article 42).
- **Admins** (`user_account.admin`) can do everything, with or without assignments.
- Grants only add. There is no deny.

Postgres enforces all of it in RLS, so a request through the Data API is checked the same way as a request through your app's routes.

---

## For developers

### Check permissions in policies, never in TypeScript

Every decision about access is made by a policy or a definer function in SQL (A1).
A check in a loader protects only the routes that remember to call it, and the Data API is reachable directly with the publishable key.

Write each check through the helpers, wrapped in `(select …)`, with literal arguments:

```sql
create policy "article_update"
  on public.article for update
  to authenticated
  using (
    (select public.current_user_can('article', 'update'))
    or id = any ((select public.current_user_article_ids('update')))
  )
  with check ( … same … );
```

The wrapping lets Postgres run each helper once per statement instead of once per row (A14).
`pnpm sql:check` fails a policy that calls a helper bare or passes it a column.

> [!IMPORTANT]
> Check permissions, never roles. `role.slug = 'editor'` in a policy changes meaning the moment an admin edits that role (A3).

### Make an entity access-controlled

1. Declare it in the `access` key of the registry manifest that lists its schema (DESIGN §4):

   ```json
   "access": {
     "permission": { "project": ["read", "create", "update", "delete", "share"] },
     "entity": ["project"]
   }
   ```

   `permission` is the catalog of actions on that scope. Use the standard five, and add verbs for domain actions (`publish`, `receive`).
   List a scope under `entity` only when admins or sharers need to grant access to single rows. It must have `share`.

2. Run `sveltebuilder sync:supabase`. It writes `supabase/supplemental/access-generated.sql` with the permission rows, the `project_role_assignment` table, and the `current_user_project_ids()`, sharing and listing functions (DESIGN §3.2). Do not edit that file; change the manifest and re-run sync.

3. Write the table's policies in the shape above, in a supplemental file that sorts after `01-access.sql` (`02-` or later).
   A scope with no `entity` entry uses only the `current_user_can(…)` line.
   Insert policies use `current_user_can('project', 'create')` alone: there is no row to grant on before it exists.

4. Add `RoleAssignmentPanel` to the entity's admin detail screen, with an add form posting to your route's action (DESIGN §6.2).

Removing a scope from the manifest drops nothing. Write the `drop` in a supplemental file.

### Child rows follow their parent

A table whose rows belong to an access-controlled entity (an article's blocks, a project's tasks) checks the parent's permission, against its foreign key (A18):

```sql
using (
  (select public.current_user_can('article', 'update'))
  or article_id = any ((select public.current_user_article_ids('update')))
)
```

Do not give a child its own permissions or its own entity table. A grant on an article that does not reach its body grants nothing useful.

### Use the data for relationships, and gate the data

"Edit your own article" and "the assigned editor may edit" are predicates on columns your tables already have, not grants (A13):

```sql
or user_account_id = (select public.current_user_id())     -- with its own action, e.g. update_own
```

Do not create an assignment row per author or per owner. The data already says who is related, and a copy drifts.

> [!WARNING]
> A table a predicate reads hands out access. Gate its writes as strictly as a grant: the writer must hold `<scope>.share` on that row and every permission the relationship confers.
> Content's `article_assignment` needs `article.share` and `article.update` (DESIGN §7).

### Put guarded columns behind an RPC

RLS cannot see which columns an update changes (A19). If an action other than `update` governs a column, as `publish` governs `article_status_id`, then:

1. Revoke table-level `UPDATE` and grant `UPDATE` on every other column by name (DESIGN §3.5).
2. Make one `SECURITY DEFINER` RPC the only writer of that column, and have it check the caller with the same helpers.

When you add a column to such a table later, add it to the grant. `pnpm sql:check` fails until you do, rather than letting users find out.

### Definer functions check for themselves

A `SECURITY DEFINER` function bypasses RLS, so it must call `current_user_can()` (and the entity helper, for one row) before it writes. Logistic's stock functions are the example.

### Show or hide controls from the same answer

A loader asks once for every row on the page and puts the answer in the view model (DESIGN §5.3):

```ts
type ProjectAdminRowView = { id: number; actions?: PermissionAction[] };
```

Show a control when `actions.includes('update')`. This is cosmetic: if the screen gets it wrong, RLS still refuses the write and the form action reports it with `formError`.

### Seed module roles

A module seeds its roles in `seed.sql` with a `slug`, their permissions resolved by `(scope, action)`, and EN and FR copy (DESIGN §7).
A role with a slug is module-managed: nobody can change its permissions, so re-running the seed never undoes an admin's edit. Admins clone it to customize it (O6).

### Never

- Write directly to an access table. Every write goes through its RPC (A12).
- Add a deny rule (A6).
- Give an external group a scope or global assignment. A trigger refuses it (A10).
- Authorize from JWT role claims. `user_account.admin` and role assignments are the only sources.

### Prove it

Assert access in `pnpm sql:check`, by impersonating the principals involved. It is the only gate that runs a policy. `scripts/sql-check/25-assert-access.sql` covers the core; add assertions for your own entities beside the module's.

---

## For admins and sharers

These are the screens a SvelteBuilder app ships with, under `/admin`. They exist in every scaffold.

### Administrators

An administrator can do everything, everywhere, whether or not they hold any role.
The admin flag is the way back in when roles go wrong, which is why it is not a role. You promote and demote administrators on a user's page, and you cannot demote the last one.

Only administrators manage roles, groups, and access to everything or to every row of one kind.

### Roles (`/admin/role`)

A role is a list of permissions, shown as a grid: kinds of thing down the side (articles, sections), actions across the top (read, update, publish).

- **Create** a role and tick its permissions.
- Roles a module ships with (marked as such) cannot be edited, because the module may update them. **Clone** one to make a version you can change.
- Editing a role changes it for everyone who holds it, wherever it was assigned (see _Things to know_).

### Groups (`/admin/user-group`)

A group lets you give access to several people at once. Members hold everything the group holds.

- **Internal groups** (a desk, a shift) can be given roles at any width.
- **External groups** represent an outside organization (a carrier, a partner newsroom). They can only be given access to individual records, never to everything of a kind.

Groups do not contain other groups.

### Users (`/admin/user-account`)

A user's page shows their admin flag, their groups, and the roles they hold everywhere or on every row of a kind.
Access to individual records is managed on the record itself.

### A record's access panel

An access-controlled record (an article) has an access panel on its admin page, listing everyone who can act on it:

- **Direct access**, given on this record. You can remove it here.
- **Inherited access**, from a role held everywhere or on every article, possibly through a group. The panel names where it comes from. You cannot remove it here; change it on the user's or group's page.

To give someone access, pick a user or group, a role, and optionally an end date.
You do not have to be an administrator: anyone with the record's **share** permission can use the panel. You can only give a role whose permissions on that record you hold yourself.

> [!WARNING]
> Anyone who can share a record sees the full list of users, with email addresses, when choosing whom to share with. That includes members of external groups (A20).

### Things to know

- **Access adds up.** Someone holds whatever any of their assignments, or their groups' assignments, gives them. Removing a direct grant does not remove access they also hold another way. The panel shows the other way.
- **Assignments can expire.** An assignment past its end date gives nothing, with no clean-up needed.
- **Publishing is its own permission.** Editing an article does not let you publish it, or take it down.
- **Anyone who can share a record can remove any direct grant on it**, including ones they could not have given (E1).
- **Editing a role widens or narrows every grant of it**, including grants someone else made when the role was narrower (E2).
- **Grants stay when the person who made them loses access** (E3).
- **Warehouse staff need a role.** A signed-in user with no role sees nothing in the logistic screens.
- **Published content stays public.** Roles govern drafts and editing, not what readers already see.

Not in this version: deny rules, nested groups, access to everything in a section, per-field permissions, and an access history (DECISIONS, _Decided exclusions_).
