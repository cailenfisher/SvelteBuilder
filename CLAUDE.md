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
│   ├── hermes/        @sveltebuilder/hermes     i18n primitives
│   ├── coreui/        @sveltebuilder/coreui     universal UI components
│   ├── blog/          @sveltebuilder/blog
│   ├── commerce/      @sveltebuilder/commerce
│   └── logistic/      @sveltebuilder/logistic
├── tools/
│   ├── create/        create-sveltebuilder      CLI installer (npm create)
│   └── cli/           @sveltebuilder/cli        sveltebuilder sync, etc.
├── apps/
│   ├── dev-kitchen/   internal SvelteKit test app
│   └── docs/
└── [root config: pnpm workspaces, Turborepo, Changesets, ESLint, Prettier]
```

Package manager: **pnpm**. Task orchestration: **Turborepo**. Publishing: **Changesets**.

---

## Tech Stack

| Concern         | Current                                         | Target release                          |
| --------------- | ----------------------------------------------- | --------------------------------------- |
| Framework       | SvelteKit + TypeScript                          | ← same                                  |
| Svelte API      | Svelte 5 runes only                             | ← same                                  |
| Database        | Supabase (PostgreSQL)                           | Drizzle ORM (Supabase preset available) |
| Auth            | Supabase Auth                                   | Lucia-patterned in-application auth     |
| i18n formatting | `intl-messageformat` (FormatJS / ICU)           | ← same                                  |
| i18n layer      | `@sveltebuilder/hermes`                         | ← same                                  |
| UI components   | `@sveltebuilder/coreui` (on Bits UI primitives) | ← same                                  |

---

## i18n Architecture

This is the most critical design constraint in the codebase. The responsibility split is
deliberate and must never be violated.

### Responsibility split

**`@sveltebuilder/hermes`** is the single source of all i18n primitives. It owns:

- Types: `Locale`, `LocalText`, `LocalTextLink`, `Dictionary`, `DictionaryPayload`
- Store functions: `load(payload, userLocaleCode, fallbackLocaleCode)`, `merge(...)`
- Lookup function: `localText(slug, scope?, entityId?)`
- Component: `<LocalText slug="..." />`

No other package redeclares these. Never redeclare them.

**The scaffold / consuming app** owns locale resolution. It loads the full dictionary for the
active locale from the database at the root layout, then calls `hermes.load()`.

**Feature module packages split internally:**

| Component kind                                          | i18n dependency         | Receives                              |
| ------------------------------------------------------- | ----------------------- | ------------------------------------- |
| Application-level UI (`Button`, `Input`, layout chrome) | None — no hermes import | `label: string`, child snippets       |
| Entity/domain (`ProductCard`, `TaskItem`)               | Imports hermes          | The domain entity (only carries `id`) |

`Button.svelte` and `ProductCard.svelte` behave differently within the same package. That is
correct.

### The absolute rule: hermes never touches the database

`@sveltebuilder/hermes` contains no database calls, no `fetch`, no async of any kind. It is a
pure in-memory store. It only accepts typed JavaScript payloads. The consuming SvelteKit app
handles all database communication and passes the result to hermes.

### Dictionary key format (internal to hermes)

The internal `buildKey(slug, scope?, entityId?)` function builds:

| Arguments                          | Key                        |
| ---------------------------------- | -------------------------- |
| `('app.title')`                    | `app.title`                |
| `('buy_label', 'product')`         | `product:buy_label`        |
| `('product.title', 'product', 42)` | `product:product.title:42` |

`scope = null` / omitted = global/application-level content. `localText('app.title')` with no
scope is intentional and idiomatic — preferred for application chrome.

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

All domain entity primary keys must be `bigint generated by default as identity`.

This is non-negotiable. `local_text_link.entity_id` is a single `bigint` column that holds
IDs from any domain table polymorphically. UUID primary keys are incompatible with this design.

### The polymorphic link

`local_text_link.entity_id` has no enforced foreign key. It points at rows across many domain
tables (`product`, `order`, `warehouse_location`, etc.). There is no FK constraint because one
column cannot reference multiple tables. This is accepted and intentional — referential integrity
is enforced by convention and tooling, not a DB constraint. Do not attempt to add a FK here.

### Core i18n schema

```sql
-- All IDs: bigint generated by default as identity

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

```
packages/<module>/
└── supabase/
    ├── schemas/
    │   ├── _registry/
    │   │   └── manifest.json   ← topological sort metadata for @sveltebuilder/cli
    │   ├── 010_<entity>.sql
    │   └── 020_<entity>.sql
    └── seed/
        └── seed.sql
```

`manifest.json` shape:

```json
{
  "package": "@sveltebuilder/commerce",
  "schemas": ["schemas/010_product.sql", "schemas/020_order.sql"],
  "after": ["@sveltebuilder/hermes"]
}
```

`@sveltebuilder/cli` runs `sveltebuilder sync` to topologically sort and merge module schemas
into the scaffold's `supabase/migrations/` directory. Numeric file prefixes handle intra-module
ordering. All hermes schema files sort first (priority band 0–99); coreui 100–199; domain
modules 200+.

---

## Architecture Guardrails

These rules are enforced by ESLint `no-restricted-imports` where possible. Violations are bugs.

1. **Never import `@sveltebuilder/hermes` in application-level UI components.** `Button`,
   `Input`, layout chrome, form primitives — these take plain `string` props. If you find
   yourself reaching for `localText` inside a coreui component that has no entity context,
   stop and reconsider the component boundary.

2. **Never add `name`/`title`/`label`/`description` columns to domain entity tables.** The
   `LocalTextLink` wiring is the model from day one.

3. **`@sveltebuilder/hermes` contains no database calls, no fetch, no async.** Full stop.

4. **Domain modules do not reach past `@sveltebuilder/coreui` to Bits UI directly.** The
   coreui contract is the dependency boundary. If a domain module needs a primitive not in
   coreui, propose adding it to coreui first.

5. **All domain entity primary keys are `bigint`, not UUID.** The polymorphic `entity_id`
   column on `local_text_link` requires integer IDs across the entire ecosystem.

6. **Scope is implied, never stored as a schema column or passed as a component prop.**

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

| Issue                   | Notes                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSR title flicker       | `localText('app.title')` in `<svelte:head>` renders the missing sentinel on first server render — `$effect` hasn't run yet. Needs SSR-safe dictionary hydration strategy. |
| `create-sveltebuilder`  | Prompt/copy/install flow is stubbed, not fully implemented.                                                                                                               |
| `@sveltebuilder/coreui` | Foundation not yet built: design tokens, CSS reset, `Button`, `Icon`, layout primitives.                                                                                  |
| `apps/dev-kitchen`      | Not yet wired as a working SvelteKit app.                                                                                                                                 |
| Auth UI                 | Sign in / sign up / sign out routes do not exist.                                                                                                                         |

---

## Completed Foundation

| Item                    | Status                                                                                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@sveltebuilder/hermes` | Complete and tested — types, store, `load`, `merge`, `localText`, `<LocalText />`, full test suite                                                                                                  |
| `@sveltebuilder/cli`    | Complete — `sveltebuilder sync` working (manifest discovery, topological sort, `config.toml` rewrite)                                                                                               |
| Hermes DB schema        | Finalized with RLS — `locale`, `local_text_link`, `local_text`, `get_dictionary` SQL function                                                                                                       |
| Base scaffold template  | Supabase client, `hooks.server.ts` (auth + locale resolution), root layout load, `/api/local-text` endpoints, `/api/locale` GET + POST, `LocaleSwitcher`, seed data (8 locales, EN + FR dictionary) |
| Monorepo structure      | Clean, all workspace references correct                                                                                                                                                             |
