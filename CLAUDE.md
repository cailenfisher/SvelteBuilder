# CLAUDE.md — SvelteBuilder Monorepo

This file is the authoritative context document for AI-assisted development in this repository.
Read it completely before writing any code, generating any prompt, or making any architectural decision.

---

## Project Purpose

SvelteBuilder is a production-ready scaffold and toolkit ecosystem for SvelteKit. It targets the
"domain-shaped application" gap: the logistics console, the commerce back office, the niche
vertical tool — applications that teams currently rebuild from scratch every time. The
differentiator is opinionated, production-grade domain modules that share one foundation, with
full i18n/l10n and WCAG 2.2 AA accessibility as structural requirements, not retrofits.

The end-user deliverable is a CLI installer (`npm create sveltebuilder`) where options primarily
select which domain modules to include.

---

## Monorepo Layout

```
SvelteBuilder/
├── packages/
│   ├── local-text-schema/  @sveltebuilder/local-text-schema  Drizzle schema + canonical seed data for the i18n tables
│   ├── coreui/         @sveltebuilder/coreui         universal UI components
│   ├── content/        @sveltebuilder/content        publisher/news domain module
│   ├── commerce/       @sveltebuilder/commerce
│   └── logistic/       @sveltebuilder/logistic
├── tools/
│   ├── create/         create-sveltebuilder      CLI installer (npm create)
│   └── cli/            @sveltebuilder/cli        sveltebuilder sync:supabase, etc.
├── apps/
│   ├── dev-kitchen/    internal SvelteKit test app
│   └── docs/
└── [root config: pnpm workspaces, Turborepo, Changesets, ESLint, Prettier]
```

Package manager: **pnpm**. Task orchestration: **Turborepo**. Publishing: **Changesets**.

The i18n primitives package (`diglossia`, formerly `@sveltebuilder/hermes`) has been extracted to
its own repo ([github.com/cailenfisher/diglossia](https://github.com/cailenfisher/diglossia)) and
is consumed here as an external dependency rather than a workspace package. See
[i18n Architecture](#i18n-architecture).

---

## Tech Stack

| Concern         | Implementation                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Framework       | SvelteKit + TypeScript                                                                                                  |
| Svelte API      | Svelte 5 runes only                                                                                                     |
| Database        | PostgreSQL (Supabase-hosted). Drizzle is the schema source of truth for every package; `sveltebuilder sync:supabase` generates SQL migrations from it. |
| Auth            | SuperPrototype template: Supabase Auth. Native template: Auth.js (`@auth/sveltekit`) with a Drizzle adapter. See [Auth Architecture](#auth-architecture). |
| i18n formatting | `messageformat` (Unicode MessageFormat 2), via `diglossia`'s `formatText()`                                              |
| i18n layer      | `diglossia` (external dependency, schema: `@sveltebuilder/local-text-schema`)                                            |
| UI components   | `@sveltebuilder/coreui` (on Bits UI primitives)                                                                         |

---

## i18n Architecture

This is the most critical design constraint in the codebase. The responsibility split is
deliberate and must never be violated.

### Responsibility split

**`diglossia`** (an external npm package — see [Monorepo Layout](#monorepo-layout)) is the single
source of all i18n primitives, split into a framework-agnostic core and a Svelte adapter:

- `diglossia` (core) — `createDictionary(payload, options?)`, returning a `DictionaryInstance`
  with `.localText(slug, scope?, entityId?)`, `.localeOf(slug, scope?, entityId?)`,
  `.formatText(slug, values?, scope?, entityId?)`, and `.merge(payload)`. Also every type:
  `Locale`, `LocalText`, `LocalTextLink`, `DictionaryPayload`, `DictionaryInstance`.
- `diglossia/svelte` — `setDictionary(instance)`, `getDictionary()`, and `<LocalText slug="..." />`.

No other package redeclares these. Never redeclare them — a type-only import
(`import type { Locale } from 'diglossia'`) is fine even in a component with no runtime
dependency on diglossia, since it's erased at build.

**The scaffold / consuming app** owns locale resolution. The root layout fetches the resolved
dictionary payload for the active locale (locale-priority resolution happens in SQL — see
`get_dictionary` below — diglossia only flattens an already-resolved payload) and calls
`setDictionary(createDictionary(data.dictionary))` once, in its `<script>` body.

**Dictionary construction never happens in `$effect`.** Effects don't run during server-side
rendering, so a dictionary built in one is never populated on the server and every
server-rendered page falls back to `[missing: …]` sentinels. A module-level dictionary has the
opposite failure mode: it's shared across concurrent requests on the server, leaking one
visitor's locale into another's response. `createDictionary()` returns a fresh, request-scoped
instance each call — call it in the component's `<script>` body, not inside an effect.

**Feature module packages split internally (Camp 1 / Camp 2):**

| Component kind                                          | i18n dependency                         | Receives                                                             |
| ------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| Application-level UI (`Button`, `Input`, layout chrome) | None — no diglossia import              | `label: string`, child snippets                                      |
| Entity/domain (`ProductCard`, `TaskItem`)               | Imports `getDictionary` from `diglossia/svelte` | The domain entity, plus an optional `dictionary?: DictionaryInstance` prop overriding context |

Entity/domain components resolve context by default (`const dictionary = dictionaryProp ??
getDictionary();`) so app code relies on context while library consumers and unit tests can pass
an instance explicitly. `Button.svelte` and `ProductCard.svelte` behave differently within the
same package. That is correct.

### The absolute rule: diglossia never touches the database

`diglossia` contains no database calls, no `fetch`, no async of any kind. It is a
pure in-memory store. It only accepts typed JavaScript payloads, already resolved to one row per
key. The consuming SvelteKit app handles all database communication and locale-priority
resolution, and passes the result to `createDictionary()`.

### Dictionary key format (internal to diglossia)

The internal `buildKey(slug, scope?, entityId?)` function builds:

| Arguments                          | Key                        |
| ---------------------------------- | -------------------------- |
| `('app.title')`                    | `app.title`                |
| `('buy_label', 'product')`         | `product:buy_label`        |
| `('product.title', 'product', 42)` | `product:product.title:42` |

`scope = null` / omitted = global/application-level content. `dictionary.localText('app.title')`
with no scope is intentional and idiomatic — preferred for application chrome. `buildKey` throws
on an empty-string scope, and when an `entityId` is given with no scope.

### Scope convention

Scope matches the table/model name for entity-bound copy (`product` model → `product` scope).
For UI copy not bound to an entity, use a logical grouping (`nav`, `auth`, `checkout`).
Scope is open-ended — `store` instead of `commerce` is valid if more idiomatic for a module.

**Scope is never a schema column, never a component prop.** It is implied by convention.
Document any deviation at the entity definition.

---

## Domain Schema Rules

### No conventional copy fields — ever

Domain models never carry `name`, `title`, `label`, `description`, or any equivalent
user-facing text column. Copy is linked via `LocalTextLink`, keyed by scope + entityId.
The schema carries only `id` and structural/relational columns.

Do not add a bare text column intending to localize it later. The `LocalTextLink` wiring
is the model from the start.

### Integer primary keys — not UUIDs

All domain entity primary keys must be `bigint generated always as identity`.

This is non-negotiable. `local_text_link.entity_id` is a single `bigint` column that holds
IDs from any domain table polymorphically. UUID primary keys are incompatible with this design.

### The polymorphic link

`local_text_link.entity_id` has no enforced foreign key. It points at rows across many domain
tables (`product`, `order`, `warehouse_location`, etc.). There is no FK constraint because one
column cannot reference multiple tables. This is accepted and intentional — referential integrity
is enforced by convention and tooling, not a DB constraint. Do not attempt to add a FK here.

### Core i18n schema

```sql
-- All IDs: bigint generated always as identity

local_text_link (
  id         bigint PK,
  slug       text NOT NULL,
  scope      text NULL,       -- null = global/application-level
  entity_id  bigint NULL,     -- polymorphic, no FK constraint
  UNIQUE (slug, scope, entity_id)
  -- partial index required for null entity_id: UNIQUE (slug, scope) WHERE entity_id IS NULL
)

local_text (
  id       bigint PK,
  link     bigint NOT NULL REFERENCES local_text_link(id),
  locale   bigint NOT NULL REFERENCES locale(id),
  content  text NOT NULL,
  UNIQUE (link, locale)
)

locale (
  id           bigint PK,
  code         text NOT NULL UNIQUE,  -- BCP-47: 'en', 'fr', 'pt-BR'
  name         text NOT NULL,
  native_name  text NOT NULL,
  dir          text NOT NULL DEFAULT 'ltr'  -- 'ltr' | 'rtl'
)
```

---

## Naming Conventions

The cross-cutting rule: **one concept, one name, every layer** — from the SQL column to the
TypeScript type to the Svelte component to the label the user reads.

Full reference: https://github.com/cailenfisher/SvelteBuilder/wiki/Naming-Conventions

### Quick reference

| Layer                      | Convention                                           | Example                         |
| -------------------------- | ---------------------------------------------------- | ------------------------------- |
| SQL table                  | singular `snake_case`                                | `user_account`                  |
| SQL column                 | `snake_case`                                         | `email_address`                 |
| SQL primary key            | always `id`                                          | `id`                            |
| SQL foreign key            | `<singular_table>_id`                                | `user_account_id`               |
| SQL boolean                | state name, no `is_`/`has_` prefix                   | `active`, `email_verified`      |
| SQL timestamp              | `_at` suffix                                         | `created_at`, `published_at`    |
| SQL index/constraint       | prefixed, descriptive                                | `idx_user_account_email`        |
| REST path                  | plural `kebab-case` (only plural exception)          | `/user-accounts`                |
| JSON key                   | `camelCase`, singular unless collection              | `emailAddress`, `eventSessions` |
| TS type / interface / enum | `PascalCase`, singular, no `I`/`T` prefix            | `UserAccount`, `Locale`         |
| TS variable / function     | `camelCase`                                          | `userAccount`, `loadUser()`     |
| TS boolean                 | state name, no `is`/`has` prefix                     | `active`, `menuOpen`            |
| TS constant                | `SCREAMING_SNAKE_CASE` for genuine constants only    | `MAX_RETRY_COUNT`               |
| TS generic                 | single capital or plain `PascalCase` — never `TData` | `T`, `Data`                     |
| Svelte component           | `PascalCase.svelte`                                  | `UserCard.svelte`               |
| Svelte route dir           | `kebab-case`, singular                               | `user-account/[id]/`            |
| Non-component module       | `kebab-case.ts`                                      | `format-date.ts`                |
| HTML attribute / `data-*`  | `kebab-case`                                         | `data-user-id`                  |
| CSS class                  | `kebab-case`, BEM for structure                      | `.event-session-card__title`    |
| CSS custom property        | `--kebab-case`, namespaced by category               | `--color-primary`               |

**No abbreviations.** Spell every word out. `ID` is the only sanctioned exception. Universal
tokens (`url`, `http`, `api`) are acceptable. Never invent shortenings (`cfg`, `usr`, `btn`).

**Acronyms** follow Google JS Style Guide — capitalize first letter only: `getHttpUrl`,
`HtmlParser`, never `getHTTPURL`.

---

## Svelte 5 / Framework Conventions

- **Runes only.** Use `$state`, `$derived`, `$effect`, `$props()`. No Svelte 4 patterns
  (`export let`, top-level `$:` reactivity).
- **Props:** destructure once — `let { label, onClick } = $props()`.
- **Derive, don't sync.** Prefer `$derived` over an `$effect` that writes to `$state`.
  Use `$effect` only for genuine side effects (DOM mutations, subscriptions, external logging).
- **Component communication:** callback props (`onSessionSelect`) over `createEventDispatcher`.
- **Snippets** (`{#snippet}` / `{@render}`) replace slots in all new code.
- **Data loading:** `+page.server.ts` / `+layout.server.ts` load functions. Keep components
  presentational.
- **Mutations:** form actions in `+page.server.ts`, not ad hoc `fetch`, unless the interaction
  is genuinely client-only.
- **Errors / redirects:** throw `error()` and `redirect()` from `@sveltejs/kit`. Never return
  ad hoc error shapes.
- **Secrets:** `$env/static/private` or `$env/dynamic/private` for server-only values. Public
  config uses the `PUBLIC_` prefix.

---

## TypeScript Conventions

- `strict` is on. No implicit `any`. Use `unknown` and narrow explicitly.
- Prefer `type` aliases for object shapes and unions. Reserve `interface` for declaration merging.
- No non-null assertions (`!`). Narrow so the failure path is real code.
- Export types from a colocated `types.ts` (or the dominant `PascalCase.ts` module).
- Collections: the type is singular; pluralize the variable —
  `const userAccounts: UserAccount[]`.

---

## Database Conventions

- The database is the source of truth for shape. Import generated Supabase types; do not
  hand-write row types.
- RLS is enabled on all tables that hold user-facing data. Every new table needs an explicit
  RLS policy noted in the migration file.
- The service-role key is used only in server code (`+page.server.ts`, `+server.ts`,
  `hooks.server.ts`). The browser client uses the anon key.
- `snake_case` → `camelCase` conversion happens once, at the serialization boundary. DB code
  stays `snake_case` end to end. Nothing downstream of the boundary sees `snake_case`.
- Prefer a single typed query helper per entity over inline queries scattered across loaders.

### Schema file layout (per module)

Schema is **Drizzle-first**: each package exports its tables as TypeScript. SQL is a generated
artifact — never hand-authored for a domain module.

```
packages/<module>/
└── src/lib/
    └── schema.ts             ← Drizzle table defs, exported as `<pkg>/schema`
```

A scaffolded project registers every module's schema in `.sveltebuilder/registry/*.json`:

```json
{
  "package": "@sveltebuilder/commerce",
  "schema": "@sveltebuilder/commerce/schema",
  "after": ["@sveltebuilder/local-text-schema"]
}
```

`schema` is an ESM module specifier — either an npm export (`@pkg/schema`) or a
project-root-relative path (`./src/lib/server/schema.ts`) for the scaffold's own tables.
`after` controls topological ordering across modules; `@sveltebuilder/local-text-schema` sorts first.

`sveltebuilder sync:supabase` (in `@sveltebuilder/cli`):
1. Discovers manifests from `.sveltebuilder/registry/*.json` and resolves `after`-order.
2. Writes a barrel file (`.sveltebuilder/schema.ts`) re-exporting every module's Drizzle schema.
3. Runs `drizzle-kit generate` against that barrel to produce `supabase/migrations/*.sql`.
4. Appends `supabase/supplemental/*.sql` (RLS, functions — anything Drizzle can't express) to
   the latest generated migration.
5. Regenerates `supabase/seed.sql` from `@sveltebuilder/local-text-schema`'s canonical locale/slug
   data plus any `supabase/seeds/*.sql` files, appended in alphabetical order.

`sveltebuilder sync` is a deprecated alias for `sync:supabase`. There is no `sync:drizzle` —
the Native template has no Supabase migrations step and has not yet defined its own sync path.

### Seed file conventions

**Never use manual IDs.** All `INSERT` statements omit the `id` column; sequences assign IDs
automatically. This applies to every table including `local_text_link` and `local_text`.

**Resolve entity IDs by slug.** When a seed record needs a foreign key to a just-inserted
entity, join on the entity's `slug` column — never copy-paste a generated integer ID.

**Resolve locale IDs by code.** Use `(select id from locale where code = 'en')` as an inline
subquery — never assume a locale has a specific integer ID.

**`local_text_link` conflicts.** Use `on conflict do nothing` for all link inserts. The partial
index on `(slug, scope) where entity_id is null` and the regular unique index on
`(slug, scope, entity_id)` both produce conflicts PostgreSQL resolves with this clause.

**Language coverage.** Every module seed must provide English (`en`) and French (`fr`)
translations at minimum — both entity-bound names and UI application-level copy. Follow the
`select … join local_text_link … on conflict (link, locale) do nothing` pattern used by
`tools/cli/src/lib/generate-seed-sql.ts` (base local-text seed) and each module's own
`seed/seed.sql` template (e.g. `tools/create/templates/modules/logistic/seed/seed.sql`).

**UI copy scope.** Application-level copy within a module uses `scope = '<module-name>'` and
`entity_id = null`. Entity-bound copy uses `scope = '<table_name>'` and
`entity_id = <entity>.id`.

---

## Auth Architecture

### Principal–identity split

`public.user_account` is the **domain principal** — the identity the rest of the system reasons about. Its `bigint` PK feeds `local_text_link.entity_id` (user display names via i18n), is carried on `event.locals.userAccountId`, and is what every RLS policy compares against.

The **auth identity** lives in `auth.user` (managed by Auth.js in Native, by Supabase in SuperPrototype). `user_account.auth_user_id text` links the domain principal to the provider identity. Auth.js columns (email, name, image) stay in `auth.user`; they are not in `user_account`.

### Session variable convention

All RLS policies read the current user via `public.current_user_id()`:

```sql
create or replace function public.current_user_id()
returns bigint language sql stable as $$
  select nullif(current_setting('app.current_user_id', true), '')::bigint;
$$;
```

**`STABLE` is mandatory.** Postgres evaluates STABLE functions once per transaction rather than once per row, making RLS fast. Never use `VOLATILE` here.

The variable is set inside the `withUser` wrapper in TypeScript before any query runs. `auth.uid()` and `auth.jwt()` claims are no longer referenced by any RLS policy.

### `withUser` database access pattern

Every DB call that should be subject to RLS goes through `event.locals.db.withUser(fn)`:

```ts
const result = await event.locals.db.withUser(async (tx) => {
  return tx.select(...).from(table).where(...);
});
```

The wrapper opens a transaction, calls `set_config('app.current_user_id', ...)`, runs the callback, and commits. **Do not include external API calls, file I/O, or other non-DB work inside a `withUser` callback** — that extends the transaction unnecessarily. If a handler needs DB → external API → DB, use two separate `withUser` calls.

The raw `db` client (in `src/lib/server/db/client.ts`) must NOT be imported by route code. Three deliberate exceptions:
- `auth-resolver.ts` — bootstrap lookup before user context exists
- `hooks.server.ts` — locale query (public data, no RLS needed)
- Migration scripts and seed runners (no request context)

### Admin role

`user_account.admin boolean not null default false` is the source of truth for admin access. RLS policies gate write access with:

```sql
exists (select 1 from public.user_account where id = public.current_user_id() and admin)
```

No JWT role claims are used. Promote a user to admin by setting `admin = true` directly.

### Template seam

`resolveAuthenticatedUserId(event)` in `src/lib/server/auth-resolver.ts` is the **only line that differs between templates**. It returns `bigint | null` (the `user_account.id`). Both templates' `hooks.server.ts` are otherwise identical.

- **SuperPrototype:** calls `event.locals.supabase.auth.getUser()` then looks up `user_account` by `auth_user_id`.
- **Native:** calls `event.locals.auth()` (Auth.js session) then looks up `user_account` by `auth_user_id`.

---

## Architecture Guardrails

These rules are enforced by ESLint `no-restricted-imports` where possible. Violations are bugs.

1. **Never import `diglossia` in application-level UI components.** `Button`,
   `Input`, layout chrome, form primitives — these take plain `string` props. If you find
   yourself reaching for `localText` inside a coreui component that has no entity context,
   stop and reconsider the component boundary.

2. **Never add `name`/`title`/`label`/`description` columns to domain entity tables.** The
   `LocalTextLink` wiring is the model from day one.

3. **`diglossia` contains no database calls, no fetch, no async.** Full stop.

4. **Domain modules do not reach past `@sveltebuilder/coreui` to Bits UI directly.** The
   coreui contract is the dependency boundary. If a domain module needs a primitive not in
   coreui, propose adding it to coreui first.

5. **All domain entity primary keys are `bigint`, not UUID.** The polymorphic `entity_id`
   column on `local_text_link` requires integer IDs across the entire ecosystem.

6. **Scope is implied, never stored as a schema column or passed as a component prop.**

7. **Visual styles for coreui components live in `packages/coreui/styles/components.css`, not in
   Svelte `<style>` blocks.** A component `<style>` block may only contain private structural
   wrapper rules (layout/sizing with no visual properties). Any color, border, background, shadow,
   radius, padding, or transition that a developer should be able to override belongs in
   `components.css` under `@layer components`.

8. **Route code accesses the database only through `event.locals.db.withUser(...)`.**
   The raw `db` client is intentionally not re-exported for route use. Deliberate exceptions
   (auth-resolver bootstrap, locale hook, migrations) must be documented with a comment.

9. **Bits UI state is communicated via data attributes, never via class toggling.** Target
   `[data-state='open']`, `[data-highlighted]`, `[data-disabled]`, etc. in CSS. Use a CSS custom
   property bridge when the data attribute on a parent must affect a non-Bits child element.

---

## CSS Style System

### The scaffold is the integrator

`@sveltebuilder/coreui` ships style files but never self-applies them. The scaffold `app.css`
is responsible for importing each coreui stylesheet into the correct layer position. This is
intentional: the scaffold controls the cascade; the library supplies the rules.

### Layer cascade

All styles in a SvelteBuilder application flow through named CSS cascade layers in this order:

```
base  →  chrome  →  components  →  unlayered (developer)
```

The layer order is declared explicitly at the top of `app.css` before any imports — this
fixes the priority order regardless of import sequencing:

```css
@layer reset, tokens, base, chrome, components, utilities;
```

Unlayered CSS always wins over every `@layer` block regardless of specificity. This is the
mechanism that makes the entire visual system overridable by a developer after install — no
`!important`, no specificity fights.

The scaffold `app.css` wires everything together:

```css
@layer reset, tokens, base, chrome, components, utilities;

@import '@sveltebuilder/coreui/styles/tokens.css';          /* not layered — tokens are a base */
@import '@sveltebuilder/coreui/styles/base.css' layer(base);
@import './chrome.css' layer(chrome);
@import '@sveltebuilder/coreui/styles/components.css' layer(components);

/* developer overrides below — unlayered, always wins */
```

`reset` and `utilities` are reserved layer slots. No files target them yet.

### What each layer owns

| Layer        | File(s)                                          | Owns                                                                                                           |
| ------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| *(none)*     | `packages/coreui/styles/tokens.css`              | CSS custom properties (design tokens) — not layered                                                            |
| `base`       | `packages/coreui/styles/base.css`                | Box-sizing reset, `html` typography defaults, global `:focus-visible` ring, `prefers-reduced-motion`           |
| `chrome`     | `src/chrome.css` (scaffold)                      | Structural base for element classes (`.input`, `.btn`, `.card`, etc.) plus all interactive field states        |
| `components` | `packages/coreui/styles/components.css`          | All coreui component visual styles                                                                             |
| *(none)*     | developer CSS / app-specific files               | Theme overrides and project-specific styles                                                                     |

**Why `chrome` owns field interaction states:** focus, error, disabled, and read-only rules
modify the same `.input`/`.textarea` classes that `chrome` establishes. Keeping them together
in one layer and one file removes the ordering dependency that made `state` a separate layer.

### coreui component style rules

**Visual styles belong in `packages/coreui/styles/components.css`.** A coreui Svelte component's
`<style>` block may only contain private structural wrappers — `display: flex`, `width: 100%`,
`position: relative` on an internal `div.wrap` — with no visual properties (color, border,
background, shadow, radius, font, padding, transition).

If you are adding a visual rule to a coreui `<style>` block, stop and put it in
`components.css` instead.

**Internal sub-elements** that have no public BEM class are namespaced under their parent in
`components.css`:

```css
/* correct: parent context scopes the internal element */
.alert .icon { … }
.card .body  { … }
.toast .close:hover { … }
```

**CSS custom property bridge for inherited state.** When a Bits UI data-attribute on a parent
element needs to affect a non-Bits child element, use a CSS custom property as the bridge:

```css
/* declare on the state-carrying parent — --_ prefix marks it private */
.accordion-trigger              { --_icon-rotate: 0deg; }
.accordion-trigger[data-state='open'] { --_icon-rotate: 180deg; }

/* consume via inheritance in the child */
.accordion-trigger .chevron { transform: rotate(var(--_icon-rotate, 0deg)); }
```

This avoids mixed `:global(parent) .svelte-scoped-child` selectors that cannot be moved to a
global file.

**Private component tokens (`--_` prefix).** When a component needs an internal CSS variable
that is not part of the public theming surface — to share a value between two selectors within
one component's ruleset in `components.css` — name it with a `--_` prefix:

```css
/* private: consumers must not reference this */
.accordion-trigger { --_icon-rotate: 0deg; }
.accordion-trigger[data-state='open'] { --_icon-rotate: 180deg; }
.accordion-trigger .chevron { transform: rotate(var(--_icon-rotate, 0deg)); }
```

The `--_` prefix signals "internal implementation detail." Do not advertise these in docs or
override them from application CSS. If a value needs to be themeable, it should chain to a
public semantic token instead.

### Theme and color scheme via `data-*`

Dark mode and theme variants are driven by `data-*` attributes on ancestor elements, never by
CSS class toggles. The token overrides in `@sveltebuilder/coreui/styles/_internal.css` respond
to these attributes:

| Attribute                        | Effect                                          |
| -------------------------------- | ----------------------------------------------- |
| `data-color-scheme="dark"`       | Force dark mode regardless of system preference |
| `data-color-scheme="light"`      | Force light mode regardless of system preference|
| *(attribute absent)*             | Follow `prefers-color-scheme` system preference |

Set `data-color-scheme` on `<html>` or the root layout element. Read and persist the user's
preference with JavaScript, then toggle the attribute.

```ts
// force dark
document.documentElement.setAttribute('data-color-scheme', 'dark');

// follow system
document.documentElement.removeAttribute('data-color-scheme');
```

### Bits UI data-attribute wiring

All interactive state for Bits UI components **must** use data attributes, not class toggles.
Bits UI sets these automatically; style rules target them directly:

```css
[data-state='open']       { … }   /* open/closed */
[data-state='checked']    { … }   /* checkbox, radio */
[data-highlighted]        { … }   /* menu items, listbox options */
[data-disabled]           { … }   /* disabled state */
[data-selected]           { … }   /* select options */
[data-placeholder]        { … }   /* select value placeholder */
```

**Never** use a Svelte snippet child to read Bits UI state and apply a class manually when the
data attribute already carries that state. Pseudo-elements driven by data-attribute selectors
are the correct pattern for visual indicators (e.g., radio dot via `::after`).

---

## coreui Promotion Rule

When building a feature for a domain module, check whether the UI element could be useful in
at least one other domain module. If yes, it belongs in `@sveltebuilder/coreui`, not in the
module package. Common candidates: `DataTable`, `StatusBadge`, `Timeline`, `Money`, `Address`.
Propose coreui additions in comments when you identify overlap; do not build them in a module
silently.

---

## Development Philosophy

- **Convention over configuration.** Decisions that can be standardized are. Deviations require
  a deliberate reason, documented where the entity or component is defined.
- **Simple and direct.** Avoid over-engineering. Every prop added to a coreui component must be
  defended against a real domain need — flexibility for its own sake is rejected.
- **Scope v1s tightly.** Name what is out of scope. The complexity-without-value trap is the
  named enemy. A scoped v1 ships; a comprehensive v0 does not.
- **Production-ready bar.** No placeholders, no mocked data paths, no shipped `TODO`s. The bar
  is ready for real use.
- **No repeated information.** Do not restate what the types, schema, or other docs already say.
  `CLAUDE.md` is orientation, not a second copy of the codebase.

---

## Module v1 Scope Boundaries

Keep these in mind to avoid scope creep during implementation.

**`@sveltebuilder/commerce` v1 excludes:** marketplace/multi-vendor, subscriptions/recurring
billing, advanced B2B (customer groups, RFQ/PO, net terms), PIM, and a tax calculation engine.

**`@sveltebuilder/logistic` v1 excludes:** wave picking, cross-docking, yard management, labor
management, robotics integration, demand forecasting, and multi-warehouse advanced routing.

---

## Known Open Issues

| Issue                              | Notes                                                                                                                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/dev-kitchen`                 | Stagnant — not migrated to the diglossia 0.1.0 core/svelte split, the `withUser` auth pattern, or any other change made since. Do not fix or update it; it will keep diverging from scaffold templates over time. Known defects tracked in `docs/DEFERRED.md`. |
| `@sveltebuilder/commerce`          | Not started — single placeholder `index.ts`. The product's remaining domain differentiator gap.                                                                                                                |
| `@sveltebuilder/logistic` polish   | Core module is built (see Completed Foundation), but has no vitest suite (no test file in the package — `diglossia`, extracted from this repo, is the only i18n primitives code with a test suite) and no dev-kitchen showcase routes.    |
| WCAG 2.2 AA audit                  | Bits UI provides accessible primitives but no accessibility audit has been run. Required before any module is marked production-ready.                                                                          |
| `apps/docs`                        | Placeholder only — no content, no structure.                                                                                                                                                                   |

---

## Completed Foundation

| Item                        | Status                                                                                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `diglossia` 0.1.0            | Complete and tested — split into a framework-agnostic core (`createDictionary`, per-request `DictionaryInstance`, `formatText` MF2 interpolation/pluralization) and a Svelte adapter (`diglossia/svelte`: `setDictionary`/`getDictionary`/`<LocalText />`); full test suite; extracted from this repo (formerly `@sveltebuilder/hermes`) into its own repo/npm package, consumed here as an external dependency |
| `@sveltebuilder/local-text-schema` | Complete — pure TS + Drizzle package (no Svelte), renamed from `@sveltebuilder/hermes-schema`; exports `./schema` (locale/local_text_link/local_text Drizzle tables) and `./seed` (canonical `LOCALES`/`BASE_SLUGS` data consumed by `sveltebuilder sync:supabase`)                       |
| `@sveltebuilder/coreui`     | Complete — 28+ components (Accordion, Alert, Avatar, Badge, Banner, Button, Card, Checkbox, ConfirmDialog, DataTable, Dialog, Divider, Drawer, Field, Input, InlineNotification, Label, LocaleSwitcher, Menu, MessageAriaLive, Pagination, Popover, ProgressBar, RadioGroup, Select, Skeleton, Spinner, Switch, Table, Tabs, Tag, Textarea, Toast/ToastRegion, Tooltip, plus `BlockEditor`/`DateTimePicker` added for content, `BarcodeInput`/`MetricCard`/`StatusBadge`/`Timeline` added for logistic); all visual styles extracted to `styles/components.css` under `@layer components`; Bits UI data-attribute wiring throughout; builds cleanly |
| `@sveltebuilder/content`    | Complete (replaces the retired `@sveltebuilder/blog`) — 14-entity publisher/news schema (structured `article_block` body, live coverage, front curation, newsletters, media assets, author profiles, article workflow), 13 Camp 2 components, RSS feed, news + standard sitemaps, NewsArticle JSON-LD + OG/hreflang meta tags, EN+FR seed data, scaffold template routes; Camp 1/2 diglossia boundary respected. No unit tests yet. |
| `@sveltebuilder/logistic`   | Complete — suppliers, storage locations, stock levels, inbound receiving, pick tasks, shipments, returns, cycle counts; Drizzle + `withUser` query layer, SECURITY DEFINER SQL for concurrency-sensitive stock mutations, full admin + worker route surface, README with v1-scope statement. Gaps: no vitest suite, no dev-kitchen showcase routes (tracked in Known Open Issues). |
| `@sveltebuilder/cli`        | Complete — `sveltebuilder sync:supabase` working (`.sveltebuilder/registry/` manifest discovery, topological sort, Drizzle schema barrel + `drizzle-kit generate`, supplemental SQL append, seed.sql generation); bare `sync` kept as a deprecated alias; the dead `sync:drizzle` stub was removed |
| `create-sveltebuilder`      | Complete — interactive CLI with project name, scaffold template, package manager, and module selection prompts; overlays templates, runs `sveltebuilder sync:supabase`, installs dependencies                |
| Local-text DB schema        | Finalized with RLS — `locale`, `local_text_link`, `local_text`, `get_dictionary` SQL function (`security invoker`, explicit predicate parens); schema of record is the Drizzle defs in `@sveltebuilder/local-text-schema`, SQL is generated; RLS + `get_dictionary` now ship from `tools/create/templates/base/supabase/supplemental/`, applying to every scaffold flavor |
| Auth architecture           | Principal–identity split, `public.current_user_id()` STABLE function, `withUser` transaction wrapper, unified `hooks.server.ts` shape, `resolveAuthenticatedUserId` seam between templates; all RLS policies migrated from `auth.uid()`/`auth.jwt()` to `current_user_id()` + `user_account.admin`       |
| SuperPrototype template     | Full Drizzle + `withUser` migration complete — all admin + API routes use Drizzle queries through `event.locals.db.withUser`. Auth.js-ready `auth-resolver.ts` seam in place. `user_account` now has bigint PK + `auth_user_id text` + `admin bool`. Sign-in/out remain Supabase OAuth.                   |
| Native template             | New — Auth.js (`@auth/sveltekit`) with Entra/Google/GitHub; Drizzle adapter tables in `auth` schema; `events.createUser` provisions `user_account`; same `hooks.server.ts` shape as SuperPrototype; full `withUser` DB pattern.                                                                            |
| Base scaffold template      | Supabase client, `hooks.server.ts` (auth + locale resolution), root layout load, `/api/local-text` endpoints, `/api/locale` GET + POST, `LocaleSwitcher`, seed data (8 locales, EN + FR dictionary) generated via `sync:supabase`; CSS layer cascade established (`base`, `chrome`, `components` layers; explicit `@layer` declaration; `state.css` absorbed into `chrome.css`) |
| Messaging system            | Universal message surface in coreui — `createMessageBus`/`setMessageBus`/`getMessageBus` (context-provided, same shape as diglossia's dictionary, replacing a module-level `$state` singleton), `Toast`/`ToastRegion`, `Banner`, `InlineNotification`, `ConfirmDialog`, `MessageAriaLive`; wired into the base scaffold template's root layout. |
| Publishing pipeline         | `.changeset/` configured (GitHub changelog, public npm access) — packages are versioned independently (e.g. `coreui@0.0.15`, `logistic@0.0.9`) via Changesets                                       |
| `apps/dev-kitchen`          | Working SvelteKit app — component showcase routes for coreui and content, diglossia i18n integration, live Supabase connection. No logistic or commerce showcase yet.                                  |
| Monorepo structure          | Clean — pnpm workspaces, Turborepo task graph, all workspace references correct                                                                                                                     |
