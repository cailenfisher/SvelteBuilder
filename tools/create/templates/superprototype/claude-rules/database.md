---
paths:
  - "supabase/**"
  - ".sveltebuilder/**"
  - "src/lib/server/schema.ts"
---

# The database: schema, RLS, RPCs, access control and seeds

Everything under `supabase/supplemental/` and `supabase/seeds/` is hand-written and applied by
`pnpm sveltebuilder sync:supabase`; `supabase/migrations/` and `supabase/seed.sql` are generated.
The project's own files are working examples: `00-auth-functions.sql` (helpers),
`03-base-rls.sql` (policies), `04-admin-write-rpc.sql` (invoker RPCs),
`05-user-account-hardening.sql` (a definer RPC and column grants), and `supabase/seeds/` (roles
and copy).

## Schema

This project's tables go in `src/lib/server/schema.ts`, as Drizzle definitions. It is
registered in `.sveltebuilder/registry/`, and `sync:supabase` generates SQL migrations from it.
Drizzle is **build-time only**: it describes the schema and is never imported by route code.
Module tables come from their packages (`@sveltebuilder/<module>/schema`). Don't edit them; add
your own tables that reference them if you need more.

```ts
export const ticket = pgTable(
  'ticket',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull().unique(),
    status: text('status').notNull().default('open'),
    priority: integer('priority').notNull().default(0),
    assignedUserAccountId: bigint('assigned_user_account_id', { mode: 'number' })
      .references(() => userAccount.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (table) => [index('idx_ticket_assigned_user_account_id').on(table.assignedUserAccountId)],
);
```

- **Table names are singular `snake_case`.** The primary key is always `id`.
- **Primary keys are `integer generated always as identity`.** Use `bigint` only for tables
  expected to reach extreme row counts (event logs, telemetry, scans), and say why in a comment.
  Never use UUIDs as keys. `user_account.id` is already `bigint`, so foreign keys to it are
  `bigint(…, { mode: 'number' })`.
- **Foreign keys are `<table>_id`**, and every foreign key gets an index.
- **Booleans name the state**: `active`, `archived`, not `is_active`.
- **Timestamps end in `_at`** and use `withTimezone: true`.
- **No copy columns** (rule 4 in `CLAUDE.md`). The display name of a ticket is localized copy:
  slug `name`, scope `ticket`, entity ID = the ticket's id.
- **Give seeded or URL-addressed entities a unique `slug` column.** It's a stable machine
  identifier, never shown to users as a name, and it lets seeds and code find a row without
  hard-coding generated IDs.
- **Enumerations** are `text` with a `check` constraint added in supplemental SQL, or a lookup
  table when the values need localized labels (each value then gets copy under that table's scope).

After editing the schema: `pnpm sveltebuilder sync:supabase`, then read the new file in
`supabase/migrations/` to confirm it does what you intended, then `pnpm db:reset`. Every new
table gets its RLS file in the same change.

## Row Level Security

Supabase grants `anon` and `authenticated` full table privileges in `public` by default. **RLS is
the only thing restricting them.** Every new table gets a supplemental file in the same change
that creates the table:

```sql
-- supabase/supplemental/10-ticket.sql
--
-- ticket: signed-in users read tickets assigned to them; admins read and write everything.
-- Anonymous visitors have no access.

alter table public.ticket enable row level security;

drop policy if exists "ticket_assignee_read" on public.ticket;
create policy "ticket_assignee_read"
  on public.ticket for select
  to authenticated
  using (assigned_user_account_id = (select public.current_user_id()));

drop policy if exists "ticket_admin_all" on public.ticket;
create policy "ticket_admin_all"
  on public.ticket for all
  to authenticated
  using ((select public.current_user_admin()))
  with check ((select public.current_user_admin()));
```

- **Start a file's header comment with who can do what**, in plain words. Then write the
  policies to match it.
- **Name policies** `<table>_<who>_<action>` and make every `create policy` re-runnable with
  `drop policy if exists`.
- **Every policy names its role with `to`.** `to anon, authenticated` only for data that is
  genuinely public.
- **Always wrap the helpers in `(select …)`.** That lets Postgres evaluate them once per
  statement rather than once per row.
- **`using` decides which existing rows are visible or affected. `with check` decides which new
  or updated rows are allowed.** Insert and update policies need `with check`, or users can
  write rows they then cannot see, or move rows to another owner.
- **RLS cannot restrict columns.** An update policy permits changing *every* column of a row it
  matches, including ownership and role columns. When users may edit only some columns of their
  own row, revoke `update` on the table from `authenticated` and grant it back on just the safe
  columns (`grant update (status) on public.ticket to authenticated`), or route the write through
  an RPC. This is exactly how `user_account` was once exploitable.
- **Don't write `exists (select … from same_table)` inside a policy on that table.** Postgres
  rejects it with infinite recursion. Put the lookup in a definer helper.
- **Prefix supplemental files** with a number above the scaffold's (`10-`, `20-`), so they run
  after the auth helpers they call.

After adding policies, **test as a non-admin.** Sign in with a second Google account in another
browser profile. A policy that admits nobody, or everybody, looks identical to a correct one when
you are the admin. You can also check in the Studio SQL editor:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '<auth.users id>', 'role', 'authenticated')::text, true);
select * from public.ticket;   -- what that user can see
rollback;
```

## Access-controlled tables

1. **Declare it** in the `access` key of `.sveltebuilder/registry/@sveltebuilder-superprototype.json`,
   the manifest that lists your schema:

   ```json
   "access": {
     "permission": { "ticket": ["read", "create", "update", "delete", "share", "close"] },
     "entity": ["ticket"]
   }
   ```

   List a table under `entity` only if people need access to single rows, granted from the row's
   own screen. It must then have `share`.

2. **Run `pnpm sveltebuilder sync:supabase`.** It writes `supabase/supplemental/access-generated.sql`:
   the permission rows, and for each entity a `ticket_role_assignment` table and the
   `current_user_ticket_ids(action)`, `current_user_ticket_actions(ids)`, `list_ticket_access`,
   `list_ticket_principal`, `create_ticket_role_assignment` and
   `delete_ticket_role_assignment` functions. Never edit it; change the manifest and sync again.

3. **Write the policies**, one per command, in this shape:

   ```sql
   create policy "ticket_update"
     on public.ticket for update
     to authenticated
     using (
       (select public.current_user_can('ticket', 'update'))
       or id = any ((select public.current_user_ticket_ids('update'))::bigint[])
     )
     with check (
       (select public.current_user_can('ticket', 'update'))
       or id = any ((select public.current_user_ticket_ids('update'))::bigint[])
     );
   ```

   - Pass **literal** arguments, and keep the `::bigint[]` cast, or the policy fails to create.
   - An insert policy uses `current_user_can('ticket', 'create')` alone: there is no row to have
     been granted yet.
   - A table without `entity` uses only the `current_user_can` line.
   - **Child rows follow the parent**: `ticket_comment` checks `ticket`, against `ticket_id`.
     Writing a child takes the parent's `update`.
   - **Relationships are predicates**, not grants: `or assigned_user_account_id = (select
     public.current_user_id())`. Gate writes to whatever column hands out that access as strictly
     as a grant.
   - **A column a verb guards** (`status`, guarded by `close`) is not writable directly: revoke
     `update` on the table, grant it back on the other columns by name, and change the guarded
     column in a `security definer` RPC that calls `current_user_can` (and the entity helper for
     one row) before it writes.

4. **Seed a role or two**, if the feature needs a sensible default: insert into `role` with a
   `slug`, its `role_permission` rows resolved by `(scope, action)`, and en and fr copy for the
   role (`name`, scope `role`) and for every new scope and verb (`access.permission_scope.ticket`,
   `access.permission_action.close`). A role with a slug cannot be edited from the screens, so a
   re-run seed never undoes an administrator's change; they clone it to customize. Copy an
   installed module's `supabase/seeds/<module>.sql` for the exact statements.

**Never** write to `role`, `role_assignment`, `user_group` or the other access tables directly
from the app: every write goes through its RPC. Prove the policies by signing in as a user holding
only the role in question, as well as one holding none. The screen side, and the full guide, are
in `CLAUDE.md` under _Roles and permissions_.

## Writing an RPC

```sql
-- supabase/supplemental/10-ticket.sql (continued)

create or replace function public.create_ticket(
  p_slug      text,
  p_name      text,
  p_locale_id bigint,
  p_priority  integer default 0
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_ticket_id integer;
  v_link_id   bigint;
begin
  if p_slug is null or btrim(p_slug) = '' then
    raise exception 'slug is required';
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception 'name is required';
  end if;

  insert into public.ticket (slug, priority)
  values (btrim(p_slug), p_priority)
  returning id into v_ticket_id;

  insert into public.local_text_link (slug, scope, entity_id)
  values ('name', 'ticket', v_ticket_id)
  returning id into v_link_id;

  insert into public.local_text (link, locale, content)
  values (v_link_id, p_locale_id, btrim(p_name));

  return v_ticket_id;
end;
$$;

grant execute on function public.create_ticket(text, text, bigint, integer) to authenticated;
```

- **`security invoker`** so RLS still checks every statement inside. The function adds
  atomicity, not privilege.
- **`set search_path = ''`** and fully qualify every name (`public.ticket`).
- **Validate inputs** and `raise exception` with a clear message.
- **Grant `execute` explicitly** to the roles that call it. Don't rely on the default grant to
  `public`.
- Changing a function's parameters creates a new overload. `drop function if exists` the old
  signature first.
- Call it from the data module of the table it writes first (`createTicket` in
  `src/lib/server/ticket.ts`), and call that from the action:
  `await createTicket(locals.supabase, { slug, name, localeId: locals.locale.id })`.

`SECURITY DEFINER` is for the rare case where the caller must not have the privilege directly
(see `admin_set_user_admin()` in `05-user-account-hardening.sql`). A definer function must check
authorization itself, take no caller-supplied identity, `set search_path = ''`, and have a
comment explaining why invoker was not enough.

A new helper like `current_user_id()` must be `stable`, `security definer`,
`set search_path = ''`, fully schema-qualify every reference, and take **no** caller-supplied
identity: derive it from `auth.uid()` inside. Definer is required because these helpers read
RLS-protected tables that policies themselves call; as invoker they recurse infinitely.

## Seeds

Every slug a screen uses must be seeded, in **at least `en` and `fr`**, plus any other locales
the project supports. Seed files go in `supabase/seeds/` with a numeric prefix (`10-ticket.sql`)
and are appended to `seed.sql` after the base seed.

```sql
-- supabase/seeds/10-ticket.sql

-- UI copy for the ticket screens
insert into public.local_text_link (slug, scope, entity_id)
select v.slug, 'ticket', null
from (values ('ticket.list.title'), ('ticket.list.empty')) as v(slug)
on conflict do nothing;

insert into public.local_text (link, locale, content)
select l.id, (select id from public.locale where code = v.locale_code), v.content
from (values
  ('ticket.list.title', 'en', 'Tickets'),
  ('ticket.list.title', 'fr', 'Tickets'),
  ('ticket.list.empty', 'en', 'No tickets yet'),
  ('ticket.list.empty', 'fr', 'Aucun ticket pour l''instant')
) as v(slug, locale_code, content)
join public.local_text_link l
  on l.slug = v.slug and l.scope = 'ticket' and l.entity_id is null
on conflict (link, locale) do nothing;

-- Sample entities: find rows by slug, never by a hard-coded id
insert into public.ticket (slug, priority)
values ('printer-jam', 1), ('vpn-access', 2)
on conflict (slug) do nothing;
```

- **Never write IDs.** Let identity columns assign them. Find rows by `slug`, and locales by
  `(select id from public.locale where code = 'en')`.
- **Make every statement re-runnable:** `on conflict do nothing` (bare) for `local_text_link`,
  `on conflict (link, locale) do nothing` for `local_text`. Run `pnpm db:reset` twice if in doubt.
- Use `do update` only when the file's purpose is to overwrite a default (for example renaming
  `app.name`), and say so in a comment.
- Seed sample data only if the user wants a demo. Never seed fake data the app depends on to
  render.
