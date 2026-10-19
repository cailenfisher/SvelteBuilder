# CLAUDE.md

This project is a SvelteKit app scaffolded by SvelteBuilder from the **SuperPrototype** template:
Supabase Postgres reached only through the Supabase Data API (PostgREST), Supabase Auth for
sign-in, and SvelteBuilder's packages for UI (`@sveltebuilder/coreui`), localization
(`diglossia`), access control (`@sveltebuilder/access`), and any domain modules selected at
creation (`@sveltebuilder/content`, `@sveltebuilder/logistic`).

The rules here are the project's architecture, not style preferences. Code that breaks them
usually works in a demo and then fails on security, localization, or the first schema change.
Two areas have rules of their own in `.claude/rules/`, loaded when you open a matching file:

- `database.md`: the schema, RLS policies, RPCs, access-controlled tables and seeds. Loads for
  `src/lib/server/schema.ts`, `supabase/` and `.sveltebuilder/`.
- `component.md`: entity components, coreui, styling and accessibility. Loads for `.svelte` and
  `.css` files under `src/`.

When you plan a schema, a policy or a screen before opening any file, read the matching rule
first.

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

Local Studio (SQL editor, table browser) is at http://127.0.0.1:54323. Use whichever package
manager the project uses (check for a lockfile); examples here use pnpm.

---

## Non-Negotiable Rules

If a request seems to require breaking one, stop and say so instead of working around it.

1. **All database access goes through `event.locals.supabase`**, passed by a route or hook to
   the table's data module in `src/lib/server/`. Never open a direct Postgres connection, never
   add a `DATABASE_URL`, never import `drizzle-orm` at runtime, never use the service-role or
   secret key. A direct connection as `postgres` owns the tables and skips RLS entirely.
2. **Every table in `public` has RLS enabled and explicit policies**, written in
   `supabase/supplemental/`. A table without RLS is readable and writable by anyone holding the
   public key.
3. **Policies call the helpers** (`current_user_id()`, `current_user_admin()`,
   `current_user_can(scope, action)` and the generated `current_user_<entity>_ids(action)`),
   wrapped in `select`, and name their role with `to`. Never reference `auth.uid()` or
   `auth.jwt()` in a policy, and never test for a role by name: ask for a permission.
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
├── chrome.css               structural styles for .button, .input, .card (project-owned)
├── utilities.css            single-purpose classes such as .visually-hidden (utilities layer)
├── app.d.ts                 App.Locals: supabase, userAccountId, locale, defaultLocale
├── hooks.server.ts          per-request Supabase client → userAccountId → locale
├── lib/server/
│   ├── schema.ts            this project's tables (Drizzle; build-time only)
│   ├── supabase.ts          createSupabaseServerClient (do not create clients elsewhere)
│   ├── auth-resolver.ts     session → user_account.id via ensure_user_account()
│   ├── postgrest.ts         QueryResult, toOne(): what every data module shares
│   ├── locale.ts, local-text.ts, navigation-item.ts, user-account.ts
│   │                        data modules: one per table, every query the routes make
│   ├── <module>/            each installed module's data modules, one per table
│   └── scoped-copy.ts       loadScopedCopy(), loadEntityCopy()
└── routes/
    ├── +layout.server.ts    loads the global dictionary + locale list
    ├── +layout.svelte       setDictionary(), message bus, app shell
    ├── sign-in/ sign-out/ auth/callback/
    ├── (admin)/+layout.server.ts   admits administrators and anyone holding a role; filters the menu
    ├── (admin)/admin/require-access.ts   requireAdministrator(), requireScope() for loaders
    ├── (admin)/admin/…      admin screens (+ module screens under /admin/<module>/)
    └── api/                 /api/locale, /api/local-text
supabase/
├── config.toml              local Supabase config
├── supplemental/            RLS policies, functions, RPCs (hand-written, migrated by sync:supabase)
├── seeds/                   seed files, appended to seed.sql in filename order
├── migrations/              generated
└── seed.sql                 generated
.sveltebuilder/registry/     which Drizzle schemas make up the database, and their order
.claude/rules/            database.md and component.md: the rules for those areas
```

**Examples to copy from.** If a module was installed, its screens and SQL are the best
reference for every pattern in this file:

- `src/lib/server/<module>/*.ts`: data modules, one per table: queries, RPC calls, the camelCase boundary
- `src/routes/(admin)/admin/<module>/**/+page.server.ts`: loaders and form actions calling them, copy loading
- `src/routes/(admin)/admin/<module>/**/+page.svelte`: screens using coreui and scoped dictionaries
- `supabase/supplemental/05-<module>-*.sql`: RLS policies and RPCs
- `supabase/seeds/<module>.sql`: seed data with en/fr copy

The base admin screens (`/admin/local-text`, `/admin/locale`, `/admin/navigation-item`) and
`supabase/supplemental/0*.sql` are the reference when no module is installed.

---

## Data Access

`hooks.server.ts` builds `event.locals.supabase` from the request's own cookies using the
publishable key. Queries run through PostgREST as `anon` or `authenticated`, carrying the
visitor's JWT, so **RLS applies to every query without the code doing anything**. That is the
whole security model.

Components never query, and routes don't either. Load in `+page.server.ts` or
`+layout.server.ts`, mutate in form actions, and pass plain data to components. Every query lives
in the **data module** of the table it starts from: `src/lib/server/<table>.ts`, the table's name
in kebab case (`ticket.ts`, `ticket-comment.ts`), or `src/lib/server/<module>/<table>.ts` for an
installed module's tables. A route calls `listTicket(locals.supabase, …)`, never
`locals.supabase.from('ticket')`.

```ts
// src/lib/server/ticket.ts
export async function listTicket(supabase: SupabaseClient): Promise<QueryResult<Ticket[]>> {
  const { data, error } = await supabase
    .from('ticket')
    .select('id, status, assigned_user_account_id, created_at')
    .order('created_at', { ascending: false });
  if (error) return { data: null, error };
  return { data: data.map(toTicket), error: null };
}

const toTicket = (row: TicketRecord): Ticket => ({
  id: row.id,
  status: row.status,
  assignedUserAccountId: row.assigned_user_account_id,
  createdAt: row.created_at,
});
```

- Each function takes the `SupabaseClient` as its first argument, so RLS still applies, and
  returns `QueryResult<T>` from `$lib/server/postgrest`: supabase-js's own `{ data, error }`, with
  the data already converted to camelCase.
- A function that reads a parent with its children embedded belongs to the parent's file; one
  that writes only a child table belongs to the child's.
- **The database is `snake_case`, everything after the data module is `camelCase`.** Convert
  once, in the data module, and nothing downstream sees a snake_case key.
- The project does not generate Supabase database types, so every value from supabase-js is
  `any`. Make each data module function's and each loader's **return type** explicit so a
  mismatch fails `pnpm check` instead of rendering `undefined`. To name the row type a select
  produces, put the select in a small function and take
  `NonNullable<Awaited<ReturnType<typeof selectTicket>>['data']>[number]`, as the installed
  modules do, rather than writing the row type by hand.
- If the user asks for generated types, run `pnpm supabase gen types typescript --local >
  src/lib/database.types.ts`, then type the client in `supabase.ts` and `app.d.ts` as
  `SupabaseClient<Database>` in one change, and fix whatever `pnpm check` reports.
- supabase-js types every embedded relation as an array. Unwrap a to-one embed
  (`navigation_item → local_text_link`) with `toOne()`.
- `bigint` values returned from SQL functions can arrive as strings. Convert with `Number()` at
  the boundary (`getDictionaryPayload` in `local-text.ts` does this).
- Select the columns you need, not `*`.

### Errors

Check `error` on every Supabase result, every time.

- **In a load:** `throw error(500, 'Failed to load tickets.')` (from `@sveltejs/kit`), or
  `error(404, …)` when a single row is missing (`.maybeSingle()` returned null).
- **In a form action:** `return formError(4xx|500, 'ticket.error.title_required')` from
  `$lib/server/form-error`, validating input first with `formError(422, …)`. The error is a copy
  slug, never English: the screen shows it in the reader's language with `formErrorText` from
  `$lib/FormError/form-error`, and a slug with no copy shows "Something went wrong" in that
  language and logs the slug. Seed every slug you return in every locale. Map Postgres codes that
  are really user errors: `23505` (unique violation) and `23503` (foreign key) →
  `formError(409, …)`. Text the action cannot turn into a slug goes in the third argument,
  `detail`, shown as it is.
- **Redirect** after a successful create with `redirect(303, …)`.
- Log the underlying Supabase error with `console.error` before throwing a generic message. Never
  send raw database errors to the browser, and never return ad hoc error shapes from a load.

### Writes

| Write                                                                 | How                                                               |
| --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| One statement (insert, update, delete, upsert on a unique constraint) | Plain supabase-js call in the table's data module                 |
| Several statements that must succeed or fail together                 | `SECURITY INVOKER` function in `supabase/supplemental/`, `.rpc()` |
| Something RLS cannot express safely (rare)                            | `SECURITY DEFINER` function (`.claude/rules/database.md`)         |

Creating any entity with localized copy is always the second kind: the row, its
`local_text_link`, and its `local_text` are three statements, and a partial failure leaves an
entity that renders `[missing: name]`. Call the RPC from the data module of the table it writes
first (`createTicket` in `ticket.ts`).

---

## Auth and Authorization

- **`auth.users`** (Supabase-managed) is the identity: email, OAuth details. Don't add identity
  columns (email, display name, avatar) to `public` tables.
- **`public.user_account`** is the domain principal. Its `id` is what every foreign key, every
  policy and `locals.userAccountId` refer to. Link domain rows to `user_account_id`, never to
  the auth UUID.

On every request with a session, `auth-resolver.ts` verifies it with `getClaims()` (local JWT
verification, no network call) and calls the `ensure_user_account()` RPC, which creates the
principal on first sign-in. The result is `locals.userAccountId: number | null`. The first
principal ever created is the admin. Use `getUser()` only when you need a fresh `auth.users`
record (the admin layout reads the operator's email this way).

### Guarding routes

- Everything under `src/routes/(admin)/` passes through `(admin)/+layout.server.ts`: anonymous
  visitors are redirected to `/sign-in`, and anyone who is neither an administrator nor holds a
  role gets a 403. Staff get in, and see only the menu entries whose `permission_scope` they hold.
- So each admin screen says who it is for, first thing in its loader:
  `await requireAdministrator(parent)` for a screen only administrators use (roles, users,
  copy), or `await requireScope(parent, 'ticket')` for one staff with a `ticket` permission use.
  Both come from `(admin)/admin/require-access.ts`.
- For a signed-in area that is **not** admin-only, create a new route group with its own
  `+layout.server.ts` that redirects when `!locals.userAccountId`.
- Route guards give a good user experience. **RLS is the actual security boundary.** Every
  guard must have a matching policy, because the Data API is reachable directly with the public
  key. Never decide access in TypeScript: hiding a button is courtesy, the policy is the rule.

### Roles and permissions

`user_account.admin` is the owner's break-glass: an administrator can do everything. Everyone else
is authorized by **role**, which the administrator manages at `/admin/role`, `/admin/user-group`
and `/admin/user-account`. A role is a bundle of permissions; a permission is a scope (the table
name) plus an action: `read`, `create`, `update`, `delete`, `share`, or a verb of your own
(`close`, `assign`). A role is given to a user or a group, everywhere, on every row of one table,
or on one row. Grants only add; there is no deny. Never use JWT custom claims for authorization.

Making a table access-controlled is mostly SQL: declare it in the registry manifest, sync, write
the policies, seed default roles (`.claude/rules/database.md`). Then, on the screens:
`requireScope(parent, 'ticket')` in each loader; return the reader's `actions`
(`listCurrentUserAction(locals.supabase, 'ticket')` for the table, or
`current_user_ticket_actions(ids)` for its rows) and hide the controls they lack. For an entity
shared row by row, put `RoleAssignmentPanel` from `@sveltebuilder/access` on its detail screen,
with an add form posting to that route; content's article screens
(`/admin/content/article/[id]`) are the example. Give the menu entry a `permission_scope` of
`ticket` so staff see it. The full guide is
[ACCESS-CONTROL-USAGE.md](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/ACCESS-CONTROL-USAGE.md).

---

## Localization

All user-facing text comes from the database, in every supported locale. There are no
hard-coded strings in components or loaders, apart from error messages for developers in
`console.error`.

```
local_text_link (slug, scope, entity_id)   one row per piece of copy
local_text      (link, locale, content)    one row per translation
```

| Kind of copy                                 | `scope`                    | `entity_id` | Example                          |
| -------------------------------------------- | -------------------------- | ----------- | -------------------------------- |
| App-wide chrome (navigation, common actions) | `null`                     | `null`      | `navigation.home`, `action.save` |
| UI copy for one feature area                 | the feature or module name | `null`      | `ticket.list.title` / `ticket`   |
| Copy belonging to one row                    | the table name             | the row id  | `name` / `ticket` / `42`         |

Scope is implied by convention. It is never a column on a domain table and never a component
prop. Slugs are lowercase, dot-separated, and specific: `ticket.list.empty`, not `empty_text`.
Before adding a global slug, check whether one already exists (`action.save`, `action.cancel`,
`feedback.not_found`, `navigation.back` and about a hundred others are seeded); browse them at
`/admin/local-text`.

### Loading copy

- **Global copy** (scope `null`) is loaded once by the root `+layout.server.ts` and set as the
  dictionary in `+layout.svelte`. Any component reads it with `getDictionary()`.
- **Scoped and entity copy is not in the root dictionary.** The loader that needs it fetches it,
  in `Promise.all` alongside the main query, and returns it with the page data:

  ```ts
  // a whole scope: fine when the scope is small (UI copy, a few hundred entities at most)
  loadScopedCopy(locals.supabase, ['ticket'], locals.locale.code, locals.defaultLocale.code)

  // specific entities: use for anything unbounded, passing the ids the page will show
  loadEntityCopy(locals.supabase, [{ scope: 'ticket', ids }], locals.locale.code, locals.defaultLocale.code)
  ```

- The page builds a scoped instance from it, in `$derived` so it follows locale switches:

  ```svelte
  <script lang="ts">
    import { createDictionary } from 'diglossia';
    import { getDictionary } from 'diglossia/svelte';

    let { data } = $props();

    const dictionary = getDictionary();                    // global copy
    const scoped = $derived(createDictionary(data.copy));  // this page's copy
    const localText = (slug: string) => scoped.localText(slug, 'ticket');
  </script>
  ```

- Interpolation and plurals use MessageFormat 2 through `formatText`:
  `dictionary.formatText('ticket.count', { count })`, with the copy written as
  `.input {$count :number} .match $count one {{{$count} ticket}} * {{{$count} tickets}}`.
- Missing translations fall back to the default locale. A slug with no copy at all renders
  `[missing: slug]`. Treat that as a bug, not a placeholder.
- Set `dir` and `lang` from the locale (`data.locale.dir`) on layout containers. Never assume
  left-to-right.
- Never call `createDictionary()` inside `$effect` or at module level. Effects don't run during
  SSR, and a module-level instance leaks one visitor's locale into another's response.

## Routes and Components

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
- **View types:** define the shape a page receives as a type, and annotate the loader's return
  type with it (`Promise<TicketListView>`). Domain types mirror the table without copy fields and
  are named after the table in `PascalCase` (`src/lib/Ticket/ticket.ts`).

## Naming

One concept, one name, at every layer: `ticket` table → `Ticket` type → `TicketCard.svelte` →
`ticket` variable → `ticket/` route → `ticket` copy scope. A child concept keeps its parent's
name everywhere (`ticket_comment` → `TicketCommentList`, never `CommentList`).

| Layer                  | Convention                                     | Example                                 |
| ---------------------- | ---------------------------------------------- | --------------------------------------- |
| SQL table              | singular `snake_case`                          | `user_account`                          |
| SQL column             | `snake_case`                                   | `email_address`                         |
| SQL foreign key        | `<table>_id`                                   | `user_account_id`                       |
| SQL boolean            | state name, no `is_`/`has_`                    | `active`                                |
| SQL timestamp          | `_at` suffix                                   | `closed_at`                             |
| SQL index / policy     | prefixed, descriptive                          | `idx_ticket_status`, `ticket_admin_all` |
| SQL function parameter | `p_` prefix                                    | `p_locale_id`                           |
| TS type                | `PascalCase`, singular, no `I`/`T` prefix      | `UserAccount`                           |
| TS variable / function | `camelCase`; collections plural                | `tickets`, `loadTicket()`               |
| TS boolean             | state name                                     | `menuOpen`, not `isMenuOpen`            |
| TS constant            | `SCREAMING_SNAKE_CASE`, genuine constants only | `MAX_RETRY_COUNT`                       |
| Svelte component       | `PascalCase.svelte`                            | `TicketCard.svelte`                     |
| Other module           | `kebab-case.ts`                                | `format-date.ts`                        |
| Route directory        | `kebab-case`, singular                         | `user-account/[id]/`                    |
| REST endpoint          | singular `kebab-case`                          | `/api/user-account`                     |
| JSON key               | `camelCase`                                    | `emailAddress`                          |
| CSS class / property   | `kebab-case` / `--kebab-case`                  | `.ticket-card__title`                   |

No abbreviations: `configuration`, not `cfg`; `button`, not `btn`. `id`, `url`, `http` and `api`
are fine. Acronyms are capitalized as words: `getHttpUrl`, `HtmlParser`. The full reference is
the [naming conventions](https://github.com/cailenfisher/SvelteBuilder/wiki/Naming-Conventions).

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
8. **Data module** in `src/lib/server/<table>.ts`: the queries, the RPC calls and the
   camelCase boundary, each function returning `QueryResult<T>`.
9. **Loader and actions** in `+page.server.ts`, calling the data module, with the return type
   annotated, every error checked, and copy loaded with `loadScopedCopy` or `loadEntityCopy`.
10. **Page and components** using coreui, entity components resolving their own copy.
11. **Link it in:** an admin feature needs a navigation entry (`/admin/navigation-item`, or a
    seed row in `navigation_item` with menu `'admin'`).
12. **Verify** (below).

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
- [ ] A query in a `.svelte` file, or a `.from(` or `.rpc(` in a route file instead of a data module
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
- [ ] A `<style>` block, `:global`, or a bare element selector (`.x p`) in a stylesheet
- [ ] Raw hex colors or pixel spacing in stylesheets instead of tokens
- [ ] `<div onclick>` where a `<button>` or `<a>` belongs
- [ ] `isActive`/`hasAccess` naming, `I`/`T` type prefixes, abbreviations
- [ ] Hand edits to `supabase/migrations/*` or `supabase/seed.sql`

---

## Further Reading

- [SuperPrototype setup guide](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/superprototype-setup.md)
- [Access control usage](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/ACCESS-CONTROL-USAGE.md)
- [Theming coreui](https://github.com/cailenfisher/SvelteBuilder/blob/main/docs/coreui-theming.md)
- [Naming conventions](https://github.com/cailenfisher/SvelteBuilder/wiki/Naming-Conventions)
- [Why a custom i18n toolkit](https://github.com/cailenfisher/SvelteBuilder/wiki/Why-a-Custom-i18n-Toolkit)
- [diglossia](https://github.com/cailenfisher/diglossia)
- [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
