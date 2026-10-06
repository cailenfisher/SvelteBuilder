# CLAUDE.md

This project is a SvelteKit app scaffolded by SvelteBuilder from the **SuperPrototype** template:
Supabase Postgres reached only through the Supabase Data API (PostgREST), Supabase Auth for
sign-in, and SvelteBuilder's packages for UI (`@sveltebuilder/coreui`), localization
(`diglossia`), and any domain modules selected at creation (`@sveltebuilder/content`,
`@sveltebuilder/logistic`).

Read this whole file before writing code. The rules here are the project's architecture, not
style preferences. Code that breaks them usually works in a demo and then fails on security,
localization, or the first schema change.

---

## This Project

<!--
  Replace this comment with a description of what you are building. Claude reads this first.
  Good things to include:
  - What the product is and who uses it (roles: who can see and change what)
  - The core entities and how they relate
  - Locales you must support beyond en and fr
  - What is explicitly out of scope for v1
-->

If this section is still a comment, ask the user what they are building, who uses it, and which
roles can see or change what, before designing any schema.

---

## Commands

| Command                            | When                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm dev`                         | Run the app at http://localhost:5173                                                       |
| `pnpm check`                       | svelte-check. **Run after every change to routes, types or schema.** Vite does not typecheck. |
| `pnpm sveltebuilder sync:supabase` | After changing `src/lib/server/schema.ts`, `supabase/supplemental/*` or `supabase/seeds/*` |
| `pnpm db:reset`                    | Rebuild the local database from migrations + seed. Proves both apply cleanly from empty.   |
| `pnpm db:start` / `pnpm db:stop`   | Start or stop local Supabase (Docker)                                                      |
| `pnpm supabase db push`            | Apply new migrations to the linked hosted project (`--include-seed` to rerun the seed)     |

Local Studio (SQL editor, table browser) is at http://127.0.0.1:54323.

Use whichever package manager the project uses (check for a lockfile). Examples here use pnpm.

---

## Non-Negotiable Rules

Each of these has a reason further down. If a request seems to require breaking one, stop and
say so instead of working around it.

1. **All database access goes through `event.locals.supabase`**, in `+page.server.ts`,
   `+layout.server.ts`, `+server.ts` or `hooks.server.ts`. Never open a direct Postgres
   connection, never add a `DATABASE_URL`, never import `drizzle-orm` at runtime, never use
   the service-role or secret key.
2. **Every table in `public` has RLS enabled and explicit policies**, written in
   `supabase/supplemental/`. A table without RLS is readable and writable by anyone holding the
   public key.
3. **Policies call `(select public.current_user_id())` and `(select public.current_user_admin())`**,
   wrapped in `select`, and name their role with `to`. Never reference `auth.uid()` or
   `auth.jwt()` in a policy.
4. **No user-facing text columns.** No `name`, `title`, `label`, `description`, `summary` or
   similar on any domain table. Copy lives in `local_text`, linked by slug, scope and entity ID.
5. **A write spanning more than one statement goes in a `SECURITY INVOKER` Postgres function**
   called with `.rpc()`. Two supabase-js calls are two transactions.
6. **Never grant `anon` or `authenticated` `INSERT`, `UPDATE` or `DELETE` on `user_account`**, and
   never add an update policy to it. Admin changes go through `admin_set_user_admin()`.
7. **Never hand-edit `supabase/migrations/*` or `supabase/seed.sql`.** They are generated.
8. **The dictionary is never created inside `$effect`** or at module level.
9. **Svelte 5 runes only.** `$props`, `$state`, `$derived`, `$effect`, snippets. No
   `export let`, no `$:`, no `<slot>`, no `createEventDispatcher`.
10. **Use coreui before building UI.** Don't add another component library or reach past coreui
    to Bits UI.

---

## Project Map

```
src/
├── app.css                  CSS layer order + design token overrides
├── chrome.css               structural styles for .btn, .input, .card (project-owned)
├── app.d.ts                 App.Locals: supabase, userAccountId, locale, defaultLocale
├── hooks.server.ts          per-request Supabase client → userAccountId → locale
├── lib/server/
│   ├── schema.ts            this project's tables (Drizzle; build-time only)
│   ├── supabase.ts          createSupabaseServerClient (do not create clients elsewhere)
│   ├── auth-resolver.ts     session → user_account.id via ensure_user_account()
│   ├── postgrest.ts         toOne(), toLocale(), LOCALE_COLUMNS, toDictionaryPayload()
│   └── scoped-copy.ts       loadScopedCopy(), loadEntityCopy()
└── routes/
    ├── +layout.server.ts    loads the global dictionary + locale list
    ├── +layout.svelte       setDictionary(), message bus, app shell
    ├── sign-in/ sign-out/ auth/callback/
    ├── (admin)/+layout.server.ts   auth + admin guard for everything under /admin
    ├── (admin)/admin/…      admin screens (+ module screens under /admin/<module>/)
    └── api/                 /api/locale, /api/local-text
supabase/
├── config.toml              local Supabase config
├── supplemental/            RLS policies, functions, RPCs (hand-written, appended to migration)
├── seeds/                   seed files, appended to seed.sql in filename order
├── migrations/              generated
└── seed.sql                 generated
.sveltebuilder/registry/     which Drizzle schemas make up the database, and their order
```

**Examples to copy from.** If a module was installed, its screens and SQL are the best
reference for every pattern in this file:

- `src/routes/(admin)/admin/<module>/**/+page.server.ts`: loaders, form actions, RPC calls, copy loading
- `src/routes/(admin)/admin/<module>/**/+page.svelte`: screens using coreui and scoped dictionaries
- `supabase/supplemental/05-<module>-*.sql`: RLS policies and RPCs
- `supabase/seeds/<module>.sql`: seed data with en/fr copy

The base admin screens (`/admin/local-text`, `/admin/locale`, `/admin/navigation-item`) and
`supabase/supplemental/0*.sql` are the reference when no module is installed.

---

## Data Access

### One client, per request

`hooks.server.ts` builds `event.locals.supabase` from the request's own cookies using the
publishable key. Queries run through PostgREST as `anon` or `authenticated`, carrying the
visitor's JWT, so **RLS applies to every query without the code doing anything**. That is the
whole security model. A direct connection as `postgres` owns the tables and skips RLS entirely,
which is why rule 1 exists.

Components never query. Load in `+page.server.ts` or `+layout.server.ts`, mutate in form
actions, and pass plain data to components.

### The serialization boundary

The database is `snake_case`, and everything after the loader is `camelCase`. Convert once, in
the loader, and nothing downstream sees a snake_case key:

```ts
const tickets: Ticket[] = (result.data ?? []).map((row) => ({
  id: row.id,
  status: row.status,
  assignedUserAccountId: row.assigned_user_account_id,
  createdAt: row.created_at,
}));
```

- The project does not generate Supabase database types, so query results are untyped. Make
  the loader's **return type** explicit (a view type, see below) so a mismatch fails
  `pnpm check` instead of rendering `undefined`.
- supabase-js types every embedded relation as an array. For a to-one embed
  (`navigation_item → local_text_link`), unwrap it with `toOne()` from `$lib/server/postgrest`.
  To-many embeds really are arrays.
- `bigint` values returned from SQL functions can arrive as strings. Convert with `Number()` at
  the boundary (`toDictionaryPayload` does this for dictionary rows).
- Select the columns you need, not `*`.
- Put a query used by more than one route in a typed helper in `src/lib/server/<entity>.ts`
  that takes the `SupabaseClient` as an argument. Don't copy query strings between routes.

If the user asks for generated types, run `pnpm supabase gen types typescript --local >
src/lib/database.types.ts`, then type the client in `supabase.ts` and `app.d.ts` as
`SupabaseClient<Database>` in one change, and fix whatever `pnpm check` reports. Don't introduce
them in only some places.

### Errors

Check `error` on every Supabase result, every time.

- **In a load:** `throw error(500, 'Failed to load tickets.')` (from `@sveltejs/kit`). Use
  `error(404, …)` when a single row is missing (`.maybeSingle()` returned null).
- **In a form action:** `return fail(4xx|500, { error: '…' })`, validating input first with
  `fail(422, …)`. Map Postgres codes that are really user errors: `23505` (unique violation)
  → `fail(409, …)`, `23503` (foreign key) → `fail(409, …)`.
- **Redirect** after a successful create with `redirect(303, …)`.
- Log the underlying Supabase error with `console.error` before throwing a generic message.
  Never send raw database errors to the browser.
- Never return ad hoc error shapes from a load.

### Writes

| Write                                                                 | How                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| One statement (insert, update, delete, upsert on a unique constraint) | Plain supabase-js call in the form action                           |
| Several statements that must succeed or fail together                 | `SECURITY INVOKER` function in `supabase/supplemental/`, `.rpc()`   |
| Something RLS cannot express safely (rare)                            | `SECURITY DEFINER` function, following the rules under Auth below   |

Creating any entity with localized copy is always the second kind: the row, its
`local_text_link`, and its `local_text` are three statements, and a partial failure leaves an
entity that renders `[missing: name]`. See [Writing an RPC](#writing-an-rpc).

---

## Auth and Authorization

### Identity versus principal

- **`auth.users`** (Supabase-managed) is the identity: email, OAuth details. Don't add identity
  columns (email, display name, avatar) to `public` tables.
- **`public.user_account`** is the domain principal. Its `id` is what every foreign key, every
  policy and `locals.userAccountId` refer to. Link domain rows to `user_account_id`, never to
  the auth UUID.

On every request with a session, `auth-resolver.ts` verifies it with `getClaims()` (local JWT
verification, no network call) and calls the `ensure_user_account()` RPC, which creates the
principal on first sign-in. The result is `locals.userAccountId: number | null`. The first
principal ever created is the admin.

### Guarding routes

- Everything under `src/routes/(admin)/` is already guarded by `(admin)/+layout.server.ts`:
  anonymous visitors are redirected to `/sign-in`, non-admins get a 403. Don't repeat that
  check in each admin route.
- For a signed-in area that is **not** admin-only, create a new route group with its own
  `+layout.server.ts` that redirects when `!locals.userAccountId`.
- Route guards give a good user experience. **RLS is the actual security boundary.** Every
  guard must have a matching policy, because the Data API is reachable directly with the public
  key.
- Use `getClaims()` for "who is this". Use `getUser()` only when you need a fresh `auth.users`
  record (the admin layout reads the operator's email this way).

### The helper functions

Defined in `supabase/supplemental/00-auth-functions.sql`:

```sql
(select public.current_user_id())     -- bigint user_account.id, or null when anonymous
(select public.current_user_admin())  -- boolean
```

Always wrap them in `(select …)`. That lets Postgres evaluate them once per statement rather
than once per row.

If you need a new helper (for example `current_user_role()` once roles exist), it must be
`stable`, `security definer`, `set search_path = ''`, fully schema-qualify every reference, and
take **no** caller-supplied identity. Derive the identity from `auth.uid()` inside it. Definer is
required because these helpers read RLS-protected tables that policies themselves call; as
invoker they recurse infinitely.

### Roles beyond admin

The scaffold has one role flag, `user_account.admin`. When the product needs more (dispatcher,
editor, member of an organization), model it as data: a table such as `user_account_role` or a
membership table, a definer helper that reads it, and policies that call that helper. Never use
JWT custom claims for authorization.

---

## Schema

### Where tables live

This project's tables go in `src/lib/server/schema.ts`, as Drizzle definitions. It is
registered in `.sveltebuilder/registry/`, and `sync:supabase` generates SQL migrations from it.
Drizzle is **build-time only**: it describes the schema and is never imported by route code.

Module tables come from their packages (`@sveltebuilder/<module>/schema`). Don't edit them; add
your own tables that reference them if you need more.

### Table rules

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
- **No copy columns** (rule 4). The display name of a ticket is localized copy:
  slug `name`, scope `ticket`, entity ID = the ticket's id.
- **Give seeded or URL-addressed entities a unique `slug` column.** It's a stable machine
  identifier, never shown to users as a name, and it lets seeds and code find a row without
  hard-coding generated IDs.
- **Enumerations** are `text` with a `check` constraint added in supplemental SQL, or a lookup
  table when the values need localized labels (each value then gets copy under that table's scope).

After editing the schema: `pnpm sveltebuilder sync:supabase`, then read the new file in
`supabase/migrations/` to confirm it does what you intended, then `pnpm db:reset`.

---

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

Rules:

- **Start a file's header comment with who can do what**, in plain words. Then write the
  policies to match it.
- **Name policies** `<table>_<who>_<action>` and make every `create policy` re-runnable with
  `drop policy if exists`.
- **Every policy names its role with `to`.** `to anon, authenticated` only for data that is
  genuinely public.
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

---

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
- Call it from the action:
  `await locals.supabase.rpc('create_ticket', { p_slug, p_name, p_locale_id: locals.locale.id })`.

`SECURITY DEFINER` is for the rare case where the caller must not have the privilege directly
(see `admin_set_user_admin()` in `05-user-account-hardening.sql`). A definer function must check
authorization itself, take no caller-supplied identity, `set search_path = ''`, and have a
comment explaining why invoker was not enough.

---

## Localization

All user-facing text comes from the database, in every supported locale. There are no
hard-coded strings in components or loaders, apart from error messages for developers in
`console.error`.

### The model

```
local_text_link (slug, scope, entity_id)   one row per piece of copy
local_text      (link, locale, content)    one row per translation
```

| Kind of copy                                  | `scope`                            | `entity_id` | Example                          |
| --------------------------------------------- | ---------------------------------- | ----------- | -------------------------------- |
| App-wide chrome (nav, common actions)         | `null`                             | `null`      | `nav.home`, `action.save`        |
| UI copy for one feature area                  | the feature or module name         | `null`      | `ticket.list.title` / `ticket`   |
| Copy belonging to one row                     | the table name                     | the row id  | `name` / `ticket` / `42`         |

Scope is implied by convention. It is never a column on a domain table and never a component
prop. Slugs are lowercase, dot-separated, and specific: `ticket.list.empty`, not `empty_text`.

Before adding a global slug, check whether one already exists (`action.save`, `action.cancel`,
`feedback.not_found`, `nav.back` and about a hundred others are seeded). Browse them at
`/admin/local-text`.

### Loading copy

- **Global copy** (scope `null`) is loaded once by the root `+layout.server.ts` and set as the
  dictionary in `+layout.svelte`. Any component reads it with `getDictionary()`.
- **Scoped and entity copy is not in the root dictionary.** The loader that needs it fetches it
  and returns it with the page data:

  ```ts
  // a whole scope: fine when the scope is small (UI copy, a few hundred entities at most)
  loadScopedCopy(locals.supabase, ['ticket'], locals.locale.code, locals.defaultLocale.code)

  // specific entities: use for anything unbounded, passing the ids the page will show
  loadEntityCopy(locals.supabase, [{ scope: 'ticket', ids }], locals.locale.code, locals.defaultLocale.code)
  ```

  Run it in `Promise.all` alongside the main query.
- The page builds a scoped instance from it, in `$derived` so it follows locale switches:

  ```svelte
  <script lang="ts">
    import { createDictionary } from 'diglossia';
    import { getDictionary } from 'diglossia/svelte';

    let { data } = $props();

    const dictionary = getDictionary();                    // global copy
    const scoped = $derived(createDictionary(data.copy));  // this page's copy
    const t = (slug: string) => scoped.localText(slug, 'ticket');
  </script>
  ```

- Interpolation and plurals use MessageFormat 2 through `formatText`:
  `dictionary.formatText('ticket.count', { count })`, with the copy written as
  `.input {$count :number} .match $count one {{{$count} ticket}} * {{{$count} tickets}}`.
- Locale fallback is automatic: missing translations fall back to the default locale. A slug with
  no copy at all renders `[missing: slug]`. Treat that as a bug, not a placeholder.
- Set `dir` and `lang` from the locale (`data.locale.dir`) on layout containers. Never assume
  left-to-right.

### Two kinds of component

| Kind                                                      | i18n                                                         | Props                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **Application UI** (buttons, fields, layout, coreui)      | Never imports `diglossia`                                    | Plain `label: string` props and snippets; the caller passes resolved text |
| **Entity components** (`TicketCard`, `TicketRow`)         | `const dictionary = dictionaryProp ?? getDictionary();`      | The entity (no copy fields) plus optional `dictionary?: DictionaryInstance` |

An entity component resolves its own copy with
`dictionary.localText('name', 'ticket', ticket.id)`. When an entity component renders another
entity component, **pass `dictionary` down**, or the child falls back to the global dictionary,
which doesn't contain scoped copy, and renders `[missing:]`.

Never call `createDictionary()` inside `$effect` or at module level. Effects don't run during SSR,
and a module-level instance leaks one visitor's locale into another's response.

---

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

---

## Routes and Components

### Svelte and SvelteKit

- Runes only: `let { data, form } = $props()`, `$state` for local UI state, and `$derived` for
  anything computed. Use `$effect` only for real side effects (DOM APIs, subscriptions), never
  to copy one state into another.
- Callback props (`onSelect`) instead of dispatched events. Snippets (`{#snippet}`,
  `{@render}`) instead of slots.
- Loaders in `+page.server.ts`, mutations in form actions (`<form method="POST"
  action="?/create">`) so pages work without JavaScript. Use `use:enhance` for progressive
  enhancement. Client-side `fetch` is only for genuinely client-only interactions.
- `+server.ts` endpoints only for non-page consumers (feeds, webhooks, JSON for other clients).
- `PUBLIC_*` config comes from `$env/static/public`; server secrets from `$env/static/private`
  or `$env/dynamic/private`, imported only in server files.
- Code shared by a few routes goes in a plain module next to them in the routes tree. `$lib` is
  for code shared across the app.

### View types

Define the shape a page receives as a type, and annotate the loader's return type with it:

```ts
// src/lib/types/ticket.ts
export type Ticket = { id: number; slug: string; status: string; createdAt: string };
export type TicketListView = { tickets: Ticket[]; copy: DictionaryPayload };

// +page.server.ts
export const load: PageServerLoad = async ({ locals }): Promise<TicketListView> => { … };
```

Domain types mirror the table without copy fields. Name them after the table in `PascalCase`.

### coreui

Check `@sveltebuilder/coreui` before building any UI. It exports:

- **Layout and display:** Card, Divider, Badge, Tag, Avatar, Alert, ProgressBar, Skeleton,
  Spinner, MetricCard, StatusBadge, Timeline/TimelineItem
- **Forms:** Field, Label, Input, Textarea, Checkbox, RadioGroup/RadioItem, Switch,
  Select/SelectItem, DateTimePicker, BarcodeInput, BlockEditor, Button
- **Disclosure and overlays:** Accordion/AccordionItem, Tabs (List, Trigger, Content), Dialog,
  Drawer, Popover, Tooltip, Menu (with Item, Separator, Label, Group, CheckboxItem, RadioGroup,
  RadioItem, Sub), ConfirmDialog
- **Data:** Table (Head, Body, Foot, Row, Header, Cell), DataTable, Pagination
- **Messages:** Toast/ToastRegion, Banner, InlineNotification, MessageAriaLive, and
  `getMessageBus()` for raising them from code
- **Localization admin:** LocaleSwitcher, LocaleEdit, LocalTextLinkEdit, LocalTextEdit

Read the component's props in `node_modules/@sveltebuilder/coreui` rather than guessing them.
Wrap form controls in `Field` (which wires up the label, `hint` and `error` with the right `aria-describedby`). Use
`InlineNotification` for a form error and the message bus for toasts. If something reusable is
missing, build it in `src/lib/components/` with the same conventions, and tell the user it
might belong in coreui.

### Styling

- Theme through the 11 tokens in the `:root` block of `src/app.css`: `--brand`, `--chrome`,
  `--danger`, `--warning`, `--success`, `--info`, `--font`, `--font-mono`, `--font-size-base`,
  `--leading-base`, `--radius`. Never assign the derived tokens (`--brand-hover`,
  `--surface-raised`, …).
- In component styles, use tokens (`var(--space-4)`, `var(--text-soft)`, `var(--radius)`) rather
  than raw colors and pixel values, so dark mode and re-theming keep working.
- Global overrides of coreui components are unlayered rules at the bottom of `app.css`,
  targeting coreui's classes and data attributes. No `!important`.
- Interactive state is expressed in data attributes (`[data-state='open']`, `[data-disabled]`),
  never toggled classes. Dark mode is `data-color-scheme` on `<html>`.
- CSS classes are `kebab-case` BEM: `.ticket-list__header`.

### Accessibility (WCAG 2.2 AA)

- Semantic elements first: `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`,
  `<table>` for tabular data, headings in order. ARIA only when HTML can't express it.
- Every input has a visible label (`Field` does this). Errors are announced and tied to the field.
- Everything works by keyboard, with a visible focus indicator. Don't remove outlines.
- Color is never the only signal. Pair status color with text or an icon (`StatusBadge` does this).
- Images have meaningful `alt`, or `alt=""` when decorative.
- Each page sets a localized `<title>` in `<svelte:head>`.
- When you change `--brand` or a status color, check its contrast.

---

## Naming

One concept, one name, at every layer: `ticket` table → `Ticket` type → `TicketCard.svelte` →
`ticket` variable → `ticket/` route → `ticket` copy scope.

| Layer                  | Convention                                     | Example                              |
| ---------------------- | ---------------------------------------------- | ------------------------------------ |
| SQL table              | singular `snake_case`                          | `user_account`                       |
| SQL column             | `snake_case`                                   | `email_address`                      |
| SQL foreign key        | `<table>_id`                                   | `user_account_id`                    |
| SQL boolean            | state name, no `is_`/`has_`                    | `active`                             |
| SQL timestamp          | `_at` suffix                                   | `closed_at`                          |
| SQL index / policy     | prefixed, descriptive                          | `idx_ticket_status`, `ticket_admin_all` |
| SQL function parameter | `p_` prefix                                    | `p_locale_id`                        |
| TS type                | `PascalCase`, singular, no `I`/`T` prefix      | `UserAccount`                        |
| TS variable / function | `camelCase`; collections plural                | `tickets`, `loadTicket()`            |
| TS boolean             | state name                                     | `menuOpen`, not `isMenuOpen`         |
| TS constant            | `SCREAMING_SNAKE_CASE`, genuine constants only | `MAX_RETRY_COUNT`                    |
| Svelte component       | `PascalCase.svelte`                            | `TicketCard.svelte`                  |
| Other module           | `kebab-case.ts`                                | `format-date.ts`                     |
| Route directory        | `kebab-case`, singular                         | `user-account/[id]/`                 |
| REST endpoint          | plural `kebab-case` (the only plural)          | `/api/user-accounts`                 |
| JSON key               | `camelCase`                                    | `emailAddress`                       |
| CSS class / property   | `kebab-case` / `--kebab-case`                  | `.ticket-card__title`                |

No abbreviations: `configuration`, not `cfg`; `button`, not `btn` in new names (`.btn` is
coreui's existing class). `id`, `url`, `http` and `api` are fine. Acronyms are capitalized as
words: `getHttpUrl`, `HtmlParser`.

TypeScript is `strict`. No `any` (use `unknown` and narrow), and no non-null assertions (`!`).
Narrow so the failure path is real code.

---

## Building a Feature: the Order That Works

Work in vertical slices. Take one entity or feature all the way to a working page before
starting the next.

1. **Clarify access first.** Who can read it, who can create, update or delete it, and is any of
   it public? Write that down as the RLS file's header comment.
2. **Schema** in `src/lib/server/schema.ts`. No copy columns. Integer PK, indexed FKs.
3. **RLS policies** in `supabase/supplemental/NN-<feature>.sql`, matching step 1.
4. **RPCs** in the same file, for any write with more than one statement (always including
   "create an entity that has a name").
5. **Seed** UI copy (en + fr minimum) and, only if wanted, sample rows in `supabase/seeds/`.
6. **Generate and apply:** `pnpm sveltebuilder sync:supabase` → read the generated migration →
   `pnpm db:reset`.
7. **Types:** the domain type and view type.
8. **Loader and actions** in `+page.server.ts`, with the return type annotated, the boundary
   mapped to camelCase, every error checked, and copy loaded with `loadScopedCopy` or
   `loadEntityCopy`.
9. **Page and components** using coreui, entity components resolving their own copy.
10. **Link it in:** an admin feature needs a navigation entry (`/admin/navigation-item`, or a
    seed row in `navigation_item` with scope `'admin'`).
11. **Verify** (below).

Show the user the schema and the policies (steps 1 to 3) before building UI on top of them when
the access rules are not obvious. They are the most expensive part to change later.

---

## Definition of Done

Don't call a change finished until:

- [ ] `pnpm check` passes with no errors.
- [ ] `pnpm sveltebuilder sync:supabase` and `pnpm db:reset` succeed, if schema, SQL or seeds
      changed, and the generated migration contains what you intended.
- [ ] Every new table has RLS enabled and at least one policy, and the policies were thought
      through for anonymous, non-admin and admin users.
- [ ] Every slug the change renders is seeded in en and fr. Nothing shows `[missing: …]`.
- [ ] The page works with JavaScript disabled for its core action (form actions).
- [ ] Interactive elements are keyboard-reachable and labeled.
- [ ] You told the user what you could not verify (for example, behavior as a non-admin if you
      could not sign in as one).

---

## Review Checklist: Fix These on Sight

- [ ] `DATABASE_URL`, `postgres(…)`, `drizzle(…)`, or `drizzle-orm` imported outside `schema.ts`
- [ ] A Supabase client created anywhere but `src/lib/server/supabase.ts`, or the service-role key in use
- [ ] A query in a `.svelte` file
- [ ] A Supabase result used without checking `error`
- [ ] A new table without `enable row level security`, or a policy without `to <role>`
- [ ] `auth.uid()` in a policy, or a helper called without `(select …)`
- [ ] An insert or update policy without `with check`
- [ ] A self-update policy on a table holding ownership or role columns
- [ ] Two dependent supabase-js writes in one action, instead of an RPC
- [ ] A function without `set search_path = ''`, or `security definer` without a stated reason
- [ ] `name`/`title`/`label`/`description` on a domain table or domain type
- [ ] A hard-coded user-facing string in a component or loader
- [ ] `createDictionary()` inside `$effect` or at module level
- [ ] `diglossia` imported in an application UI component
- [ ] An entity component rendering another without forwarding `dictionary`
- [ ] `scope` as a column on a domain table or as a component prop
- [ ] A seed with literal IDs, or without `on conflict`
- [ ] A slug seeded in only one locale
- [ ] `export let`, `$:`, `<slot>`, `createEventDispatcher`
- [ ] `$effect` that writes `$state` that could have been `$derived`
- [ ] A hand-built component that duplicates one in coreui
- [ ] Raw hex colors or pixel spacing in component styles instead of tokens
- [ ] `<div onclick>` where a `<button>` or `<a>` belongs
- [ ] `isActive`/`hasAccess` naming, `I`/`T` type prefixes, abbreviations
- [ ] Hand edits to `supabase/migrations/*` or `supabase/seed.sql`

---

## Further Reading

- [SuperPrototype setup guide](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/superprototype-setup.md)
- [Theming coreui](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/coreui-theming.md)
- [Naming conventions](https://github.com/cailenfisher/SvelteBuilder/wiki/Naming-Conventions)
- [Why a custom i18n toolkit](https://github.com/cailenfisher/SvelteBuilder/wiki/Why-a-Custom-i18n-Toolkit)
- [diglossia](https://github.com/cailenfisher/diglossia)
- [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
