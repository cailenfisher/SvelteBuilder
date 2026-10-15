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

## Template Status — read before touching scaffold code

**SuperPrototype is the only active scaffold template. The Native template is ON HOLD as of
2026-09-29 and is not accessible through `npm create sveltebuilder`.**

Work SuperPrototype as a first-class Supabase application: use Supabase's own client, patterns,
and tooling rather than provider-neutral abstractions that work against them. Where a choice
exists between "the Supabase way" and "the portable way," SuperPrototype takes the Supabase way.

Native is on hold, not cancelled. So:

- **Shared surfaces stay provider-neutral in shape.** The base template, `@sveltebuilder/coreui`,
  the domain module packages, and the local-text/i18n schema must not acquire hard Supabase
  dependencies. Keep the seam where it already is; do not widen it.
- **SuperPrototype-only surfaces may be fully Supabase-coupled.** Anything under
  `tools/create/templates/superprototype/` is free to import `@supabase/*` and assume PostgREST,
  Supabase Auth, and the Supabase CLI.
- **Do not invest in Native.** Do not add features, migrate it to new patterns, or fix its drift.
  Record what it will need in `docs/DEFERRED.md` instead.

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
│   ├── dev-kitchen/    component harness: every package component, from source, audited for WCAG
│   └── docs/
├── scripts/            repo tooling — scaffold-check.mjs (see Template Verification)
└── [root config: pnpm workspaces, Turborepo, Changesets, ESLint, Prettier]
```

### Template Verification

`pnpm scaffold:check` scaffolds real projects from `tools/create/templates/` and checks that each
one typechecks and builds. Run it after touching anything under `templates/`, and note that
`svelte-check` is the step that matters — Vite does not typecheck, so a build can pass over a
loader referencing a field that no longer exists.

Templates are the one part of this repo that no package test can reach: they are inert text until
the create CLI copies them into a project. That gap is how the Logistic module came to ship a
scaffold that could not typecheck, from the day SuperPrototype moved to PostgREST until someone
tried it by hand.

Two things the harness does deliberately. It **packs the workspace packages and installs the
tarballs** instead of taking them from npm, because templates are written against the packages in
this repo and those are usually ahead of what is published — verifying against the registry would
mean the gate can never check an unreleased change. (Packing rather than `link:`, because a linked
package brings its own `node_modules/svelte`, and two copies of svelte make every cross-package
`Snippet` prop a type error with no bug behind it. Packing also checks that the `files` array and
`exports` map ship what the templates import.) And it drives the CLI **by flags** (`--template`,
`--pm`, `--modules`, `--screens`), never by feeding keystrokes to its prompts.

`pnpm sql:check` is the companion gate: it applies a scaffolded project's migration and seed to
Postgres in Docker, applies the seed twice to prove it is re-runnable, then asserts the database
behaves as the routes assume — impersonating an admin, a non-admin and an anonymous visitor via
`set role` plus a JWT subject, which is the only way RLS is exercised at all. Assertions live in
`scripts/sql-check/`. Neither `scaffold:check` nor `svelte-check` runs a line of SQL, so a
malformed seed or a policy admitting nobody ships green past them.

`pnpm test` runs the unit suites. `tools/create/test/screen-bundle.test.ts` checks the half of a
screen bundle's contract that types cannot express — that a manifest matches its files, that every
slug a screen renders is seeded, and that each has both required locales. The package suites
(`packages/coreui/test/`, `packages/content/test/`) render components server-side with
`svelte/server`. Their `vitest.config.ts` carries the `svelte` export condition and `ssr.noExternal`
settings that make bits-ui render under SSR.

`pnpm check` type-checks every package's own source (`svelte-check`, or `tsc --noEmit` for
local-text-schema) and runs in the Test workflow. It is the only gate that type-checks a component no
template screen renders.

`apps/dev-kitchen` renders every component the packages export, from source, inside chrome copied
from the base template, and the Accessibility workflow audits it with axe-core (WCAG 2.2 A and AA)
in light, dark and right-to-left, plus overlays opened from the keyboard and a focus-visibility
walk. Its catalog makes an exported component with no showcase page a `pnpm check` failure. It is
where to look at, develop and audit a component; never edit its generated chrome. Rationale in
`docs/DEV-KITCHEN.md`; usage in its README.

The workspace pins a single svelte through `pnpm.overrides` in the root `package.json`, for the same
two-copies reason given above. Bump svelte there, not per package.

### Screen bundles

A module's route code lives in the create CLI's template tree, never in the package — see
guardrail 10. Each selectable bundle is:

```
tools/create/templates/modules/<module>/screens/<screen-id>/
├── manifest.json            id, label, hint, routes, requires, actions, copySlugs
├── ui/                      +page.svelte — provider-neutral, imports its view types
└── server.superprototype/   +page.server.ts — loaders and form actions for that flavour
```

Both halves merge into `src/routes/` at scaffold time. The contract between them is the module's
exported view-model types (`@sveltebuilder/<module>/views`), because nothing typechecks across that
boundary until a project exists. A directory starting with `_` is a holding area for route code not
yet ported into a bundle: never selectable, never copied. Full rationale in `docs/MODULE-ROUTES.md`.

A bundle is a **coherent feature**, not a route file — its list, its detail, and any layout they
share. `requires` names sibling bundles it links to, and selection expands through it, because a
screen that hardcodes an href to a sibling renders a dead link without it. Where the links are dense
enough that no subset makes sense, the feature is one bundle: logistic's warehouse app ships its
shell and its pick-task, inbound-receipt and cycle-count screens together for exactly that reason.

`routes` means "has a page". A bundle shipping `+server.ts` endpoints declares them separately under
`endpoints` — content's feed bundle is three of them and no pages. Code that several routes in one
bundle share goes in an ordinary module beside them in the routes tree (SvelteKit treats only `+page`,
`+layout`, `+server` and `+error` as special), not in `$lib`, which a scaffold without that module
would also receive.

**Data access goes through one data module per table.** A module's template directory carries a
module-level `server.<flavour>/` overlay, which the create CLI copies to `src/lib/server/<module>/`
whenever the module is selected, with or without any of its screens. It holds one file per table,
named like that table's schema file, and each function lives in the file of the table its query
starts from: `inbound-receipt.ts` exports `listInboundReceipt` and `getInboundReceipt` (which embeds
the lines), while `inbound-receipt-line.ts` exports `addInboundReceiptLine`. The scaffold's own
tables follow the same rule in the flavour's `src/lib/server/` (`locale.ts`, `navigation-item.ts`).

Each function takes the request's `supabase` client as its first argument, so every query still
runs through `event.locals.supabase` (guardrail 8) with RLS applied. It owns the table, the columns,
the embeds and the `snake_case` → `camelCase` conversion, and returns supabase-js's own
`{ data, error }` shape (`QueryResult<T>`) with the data already converted. The route checks `error`
where it calls and decides what a failure means to the person on the other end: a 500, a form
error, or a logged fallback. Route files never call `.from(` or `.rpc(` themselves, which
`tools/create/test/data-module.test.ts` enforces. Helpers every data module needs (`toOne`,
`QueryResult`) live once in the flavour's `src/lib/server/postgrest.ts`.

**Where a screen's extracted components go.** A sub-block of a screen that names a concept becomes
its own component. If it is presentational (props in, markup out), it goes in the module package's
concept folder, with a dev-kitchen showcase. If it is bound to its route (posts to that page's form
actions, or builds that route's hrefs), it stays in the bundle, beside the `+page.svelte` that uses
it.

**Shared screen-contract types are declared once.** `ScreenCopy`, `ScreenLocale`, `ScreenPage` and
`ScreenFormResult` are type-only exports of `@sveltebuilder/coreui`, and every module's `views.ts`
imports them. A module declares only the screen types particular to it.

Package manager: **pnpm**. Task orchestration: **Turborepo**. Publishing: **Changesets**.

The i18n primitives package (`diglossia`, formerly `@sveltebuilder/hermes`) has been extracted to
its own repo ([github.com/cailenfisher/diglossia](https://github.com/cailenfisher/diglossia)) and
is consumed here as an external dependency rather than a workspace package. See
[i18n Architecture](#i18n-architecture).

---

## Tech Stack

| Concern         | Implementation                                                                                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | SvelteKit + TypeScript                                                                                                                                                                                                                                                                                                          |
| Svelte API      | Svelte 5 runes only                                                                                                                                                                                                                                                                                                             |
| Database        | PostgreSQL (Supabase-hosted), reached through the Supabase Data API (PostgREST) via `@supabase/ssr` — never a direct connection. Drizzle is the **build-time** schema source of truth for every package; `sveltebuilder sync:supabase` generates SQL migrations from it. Whether to keep Drizzle in that role is an open topic. |
| Auth            | SuperPrototype template: Supabase Auth. Native template (ON HOLD): Auth.js (`@auth/sveltekit`). See [Auth Architecture](#auth-architecture).                                                                                                                                                                                    |
| i18n formatting | `messageformat` (Unicode MessageFormat 2), via `diglossia`'s `formatText()`                                                                                                                                                                                                                                                     |
| i18n layer      | `diglossia` (external dependency, schema: `@sveltebuilder/local-text-schema`)                                                                                                                                                                                                                                                   |
| UI components   | `@sveltebuilder/coreui` — Bits UI primitives where a component has real interaction, plain HTML elsewhere; see its README                                                                                                                                                                                                       |

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

**Feature module packages hold two kinds of component:**

| Component kind                                          | i18n dependency                                 | Receives                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Application-level UI (`Button`, `Input`, layout chrome) | None — no diglossia import                      | `label: string`, child snippets                                                               |
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
For UI copy not bound to an entity, use a logical grouping (`navigation`, `auth`, `checkout`).
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

Default domain entity primary keys to `integer generated always as identity` / TypeScript
`number`. `bigint` is reserved for entities expected to reach extreme row counts (event logs,
telemetry, tracking scans, per-impression records) — a deliberate, per-case choice made when the
entity is introduced, not the general pattern. Existing `bigint` PK columns (`user_account.id`,
and anything the polymorphic `entity_id` below already points at) are left as-is; this is not a
retrofit.

UUID primary keys are not used anywhere in the ecosystem. `local_text_link.entity_id` is a single
`bigint` column that holds IDs from any domain table polymorphically — an `integer` PK fits inside
it without conversion, which is why defaulting to `integer` doesn't strain that design.

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
  UNIQUE NULLS NOT DISTINCT (slug, scope, entity_id)
  -- NULLS NOT DISTINCT is required, not cosmetic: global copy has scope and
  -- entity_id both NULL, and a plain UNIQUE treats NULLs as distinct, so it would
  -- not constrain those rows at all. See the note under Seed file conventions.
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
| REST path                  | singular `kebab-case`                                | `/user-account`                 |
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

### Concepts, roles and folders

- **Never drop the parent concept**, in any layer: `inbound_receipt` is `InboundReceiptCard`,
  `/admin/logistic/inbound-receipt`, `logistic.inbound_receipt.title`, and "Inbound receipts" in
  the UI. Qualifiers come after the parent: `ArticleAdminListView`, screen id `article-admin`.
- **UI labels use the full concept name** in headings, navigation and page titles. A short verb is
  fine on a button or a worker's action menu ("Receive", "Pick"), because it names an action, not
  the concept.
- **Every concept gets a folder** in every component library and app: `Article/ArticleCard.svelte`,
  `Article/ArticleBlock/ArticleBlockRenderer.svelte`, `Menu/MenuItem.svelte`. A folder's primary
  component shares its name. No flat component directories. Non-component modules sit beside the
  component they serve.
- **Role suffixes** are the global list (`Form`, `List`, `Table`, `Row`, `Card`, `Detail`,
  `Summary`, `Drawer`, `Modal`, `Header`, `Footer`, `Search`, `Filter`, `Picker`, `Field`, `Badge`,
  `Link`, `Empty`, `Skeleton`) plus, in this repo: `Fieldset`, `Queue`, `Board`, `Panel`,
  `Renderer`, `Figure`, `Bar`, `Path`, `Editor`, `Region`, and `Option` (a view-model type for one
  `<Select>` option).
- **Inputs are `Field`s and `Fieldset`s; only a component that owns the `<form>` is a `Form`.** A
  `…Form` renders the `<form>` element itself, with its action and submit button, and is the clear
  parent of everything inside it. A component holding one input with its label is a `…Field`. One
  grouping several related inputs, to be placed inside a form someone else owns, is a
  `…Fieldset` and renders a real `<fieldset>`, with an optional `<legend>` when nothing around it
  already names the group. So `LocaleFieldset` sits inside the locale page's form, while
  `NewsletterSubscriptionForm` posts its own.
- **`View` means a view-model type**, never a component: `InboundReceiptDetailView` is the type a
  loader returns; the component showing one is `…Detail`.
- **`Item`** is allowed where the domain itself uses the word (`navigation_item`,
  `publish_checklist_item`) and for coreui primitives that are items of a parent (`MenuItem`,
  `AccordionItem`, `SelectItem`). Never as a stand-alone generic name.

### Shared vocabulary

One word per idea, across every module:

| Idea | Word | Not |
| --- | --- | --- |
| A finished lifecycle state | `completed` | `complete`, `done` |
| A time something stops applying | `<thing>_expires_at` | `<thing>_until` |
| Manual ordering of sibling rows | `position` | `ordinal`, `sort_order` |
| Severity of something gone wrong | `danger` | `error` |

---

## Svelte 5 / Framework Conventions

- **Runes only.** Use `$state`, `$derived`, `$effect`, `$props()`. No Svelte 4 patterns
  (`export let`, top-level `$:` reactivity).
- **Props:** destructure once — `let { label, onClick } = $props()`.
- **Derive, don't sync.** Prefer `$derived` over an `$effect` that writes to `$state`.
  Use `$effect` only for genuine side effects (DOM mutations, subscriptions, external logging).
- **Component communication:** callback props (`onSessionSelect`) over `createEventDispatcher`.
- **Callback names:** `on<Event>` in camelCase (`onRemove`, `onDismiss`). Every bindable value has
  an `on<Value>Change` callback beside it (`onCheckedChange`, `onValueChange`, `onOpenChange`), so
  a caller can react to a change without an `$effect` watching the bound value.
- **Text props:** a `string` where the value names something (an accessible name, a title, a
  label, an attribute); a snippet where it is content. An overlay's opener is always a `trigger`
  snippet.
- **No English defaults.** No user-facing string prop on a coreui component has a default, and every
  one that is an accessible name is required. A default would ship English to screen-reader users in
  every other locale, and nothing would warn the caller. Optional text (a placeholder) renders
  nothing when omitted. A component with many strings takes one typed `labels` prop.
- **Snippets** (`{#snippet}` / `{@render}`) replace slots in all new code.
- **Data loading:** `+page.server.ts` / `+layout.server.ts` load functions. Keep components
  presentational. Loaders and actions call the table's data module rather than building queries
  inline (see _Screen bundles_).
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
- Single-letter parameters are fine in a one-line lambda (`rows.map((r) => r.id)`), nowhere else.
  A screen's copy lookup is `localText`, not `t`.
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
- One data module per table holds that table's queries; loaders never build queries inline
  (see _Screen bundles_).

### Schema file layout (per module)

Schema is **Drizzle-first**: each package exports its tables as TypeScript. SQL is a generated
artifact — never hand-authored for a domain module.

```
packages/<module>/
└── src/lib/
    └── schema/
        ├── index.ts          ← barrel, exported as `<pkg>/schema`
        ├── <concept>.ts      ← one table, its pgEnums and its inferred types
        └── <enum>.ts         ← one enum's values, with no drizzle-orm import (see below)
```

For example, `inbound-receipt.ts` holds the `inbound_receipt` table, and
`inbound-receipt-status.ts` exports `INBOUND_RECEIPT_STATUSES` and the `InboundReceiptStatus` type.
An enum is a concept of its own in the layer map, so its file is named after it.

Each concept's types are **inferred** from its table (`typeof inboundReceipt.$inferSelect`), never
hand-written beside it. Composite types (`InboundReceiptWithCopy`) are intersections of inferred
types.

**Enum values are declared once**, as a plain `as const` array in the enum's own module, which does
not import `drizzle-orm` (guardrail 8 bans runtime `drizzle-orm`, and screens need the values at runtime for
filters and validation). The `pgEnum` and the type union are both built from that array. A second
hand-written list of the same values is a bug.

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

**`local_text_link` conflicts.** Use `on conflict do nothing` for all link inserts. The single
`UNIQUE NULLS NOT DISTINCT (slug, scope, entity_id)` constraint produces the conflict this clause
resolves, for entity-bound copy, scoped UI copy, and global copy alike.

That constraint is what makes seeds re-runnable, so do not "simplify" it to a plain `UNIQUE`.
Without `NULLS NOT DISTINCT`, global rows (`scope` and `entity_id` both null) raise no conflict —
Postgres treats NULLs as distinct in a unique index — so `on conflict do nothing` becomes a silent
no-op and re-running a seed duplicates every global link. `get_dictionary`'s `distinct on` masks
the damage at read time, so the first symptom is a doubled admin list, not a failure. Use the bare
clause rather than naming a conflict target: one constraint now covers every case, and the bare
form keeps working if that ever changes.

**Language coverage.** Every module seed must provide English (`en`) and French (`fr`)
translations at minimum — both entity-bound names and UI application-level copy. Follow the
`select … join local_text_link … on conflict (link, locale) do nothing` pattern used by
`tools/cli/src/lib/generate-seed-sql.ts` (base local-text seed) and each module's own
`seed/seed.sql` template (e.g. `tools/create/templates/modules/logistic/seed/seed.sql`).

**UI copy scope.** Application-level copy within a module uses `scope = '<module-name>'` and
`entity_id = null`. Entity-bound copy uses `scope = '<table_name>'` and
`entity_id = <entity>.id`.

**UI copy slugs.** A module's application-level slug always starts with the module name, even
though its scope already says it: `logistic.inbound_receipt.title` in scope `logistic`. The second
segment is the full, singular concept name (`inbound_receipt`, never `receipt` or `receipts`).
Screens, components, manifests and seeds all use the same full slug.

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

`user_account.admin boolean not null default false` is the source of truth. Policies gate writes with `(select public.current_user_admin())`. No JWT role claims are used.

`anon` and `authenticated` hold no write privilege on `user_account` at all — `INSERT`, `UPDATE`, `DELETE` are revoked outright in `supabase/supplemental/05-user-account-hardening.sql`. An owner-update policy ("update your own row") lived here until 2026-10-03 and was a privilege escalation: RLS cannot restrict which *columns* an allowed `UPDATE` may touch, so "your own row" included `admin` and `auth_user_id`, and `PATCH /rest/v1/user_account?id=eq.<own id> {"admin": true}` returned 200. Promoting or demoting an administrator goes through the `admin_set_user_admin(user_account_id, admin)` RPC instead — `SECURITY DEFINER`, checks `current_user_admin()` on the caller itself, and refuses to demote the last remaining admin. Never reintroduce a self-update policy on this table; see the file for the full incident writeup.

### Provisioning the principal

`resolveAuthenticatedUserId(event)` in `src/lib/server/auth-resolver.ts` verifies the session with `getClaims()` — which checks the token signature locally against the cached JWKS rather than making a network call to the Auth server — then calls the `ensure_user_account()` RPC. It returns `number | null` (the `user_account.id`), which lands on `event.locals.userAccountId`.

Provisioning lives in SQL, not TypeScript, for two reasons that are easy to get wrong:

- The function derives the identity from `auth.uid()`, never a parameter, so a caller cannot provision or claim a principal for someone else's auth identity.
- The very first `user_account` row ever created is granted `admin = true`, since a freshly seeded database has no other route into the admin area. That emptiness check **must** run as definer: under RLS a brand-new user can see no `user_account` rows at all, so the same check written in application code reads "table is empty" for every new user and grants admin to all of them.

Promote or revoke admins after the first via the `admin_set_user_admin()` RPC (see [Admin role](#admin-role)); there is no invite UI.

Use `getUser()` instead of `getClaims()` only when something genuinely needs a freshly-read `auth.users` record — the admin layout does, to show the operator's email.

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

5. **Domain entity primary keys default to `integer`, not UUID.** `bigint` is reserved for
   entities expected to reach extreme row counts — a per-case choice, not the default. The
   polymorphic `entity_id` column on `local_text_link` is `bigint` and holds integer-PK values
   across the ecosystem without conversion, so this doesn't constrain the choice either way.

6. **Scope is implied, never stored as a schema column or passed as a component prop.**

7. **Styles are plain stylesheets, never Svelte `<style>` blocks, and never `:global`.** Every
   rule lives in a `.css` file named after its block, beside the component or route that renders
   it (see [Plain stylesheets](#plain-stylesheets)). `pnpm css:check` enforces this.

8. **Route code accesses the database only through `event.locals.supabase`.** Never open a
   direct Postgres connection from application code, and never introduce a `DATABASE_URL`.
   A direct connection runs as a table-owning role, which bypasses RLS entirely — every
   policy in the project silently stops applying. Drizzle is a build-time schema and type
   tool only (`drizzle-kit generate`); importing `drizzle-orm` at runtime is a bug.

9. **Bits UI state is communicated via data attributes, never via class toggling.** Target
   `[data-state='open']`, `[data-highlighted]`, `[data-disabled]`, etc. in CSS. Use a CSS custom
   property bridge when the data attribute on a parent must affect a non-Bits child element.

10. **Once it is a full screen, view, or page, it does not belong in a library package.** Components
    may compose other components freely — that is what they are for. But a `+page.svelte`, or a
    composed view whose reason to exist is _being_ a page, lives in the template tree under
    `tools/create/templates/`, never in `packages/*`. Screens are scaffolded once and owned by the
    generated app thereafter; they are not a dependency it tracks. See `docs/MODULE-ROUTES.md`.

11. **Module packages ship no data-access layer.** A module exports its Drizzle schema (build-time),
    its components, and its view-model types — never queries. Route loaders live in the scaffold and
    reach the database through `event.locals.supabase`, so the module never needs to know how a row
    was fetched. A module's `./server` export reintroducing a query layer is a bug; this is what
    guardrail 8 forbids, stated at the package boundary.

---

## CSS Style System

### The scaffold is the integrator

`@sveltebuilder/coreui` and every domain module ship stylesheets but never self-apply them. The
scaffold `app.css` imports each package's stylesheet into the correct layer position. This is
intentional: the scaffold controls the cascade; the libraries supply the rules.

### Layer cascade

All styles in a SvelteBuilder application flow through named CSS cascade layers in this order:

```
base  →  chrome  →  components  →  utilities  →  unlayered (developer)
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

@import '@sveltebuilder/coreui/styles/tokens.css'; /* not layered — tokens are a base */
@import '@sveltebuilder/coreui/styles/base.css' layer(base);
@import './chrome.css' layer(chrome);
@import '@sveltebuilder/coreui/styles/components.css' layer(components);
@import '@sveltebuilder/logistic/styles/components.css' layer(components); /* one per module */
@import './utilities.css' layer(utilities);

/* developer overrides below — unlayered, always wins */
```

The create CLI writes each selected module's line after coreui's, so a module rule that styles a
coreui part wins a tie by order. `reset` is a reserved layer slot; no file targets it yet.

### What each layer owns

| Layer        | File(s)                                 | Owns                                                                                                    |
| ------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| _(none)_     | `packages/coreui/styles/tokens.css`     | CSS custom properties (design tokens) — not layered                                                     |
| `base`       | `packages/coreui/styles/base.css`       | Box-sizing reset, `html` typography defaults, global `:focus-visible` ring, `prefers-reduced-motion`    |
| `chrome`     | `src/chrome.css` (scaffold)             | Structural base for element classes (`.input`, `.button`, `.card`, etc.) plus all interactive field states |
| `components` | each package's `styles/components.css`  | Every coreui and domain-module component's styles, coreui first                                         |
| `utilities`  | `src/utilities.css` (scaffold)          | Single-purpose classes such as `.visually-hidden`                                                       |
| _(none)_     | the app's screens, layouts and components, and `app.css` | Each screen's and app component's own stylesheet, theme overrides                      |

**Why `chrome` owns field interaction states:** focus, error, disabled, and read-only rules
modify the same `.input`/`.textarea` classes that `chrome` establishes. Keeping them together
in one layer and one file removes the ordering dependency that made `state` a separate layer.

### Plain stylesheets

BEM class names scope every rule, which is what BEM was designed for, so no component uses Svelte's
compiled scoping: no `<style>` blocks and no `:global`, anywhere. Styles are plain CSS files the page
links.

- **One stylesheet per concept folder**, named after the folder in kebab case and placed in it:
  `Table/table.css` holds `.table`, `.table-row`, `.table-cell` and the rest of the folder's
  blocks; a nested concept has its own (`Article/ArticleBlock/article-block.css`). A route
  directory works the same way, its stylesheet named after its root block.
- **A package's stylesheets are listed in its `src/lib/components.css`**, exported as
  `<package>/styles/components.css` and layered by the app (above). Its order is the cascade
  order within the layer.
- **An app's own stylesheets are imported by the component that renders the block**
  (`import './supplier-list-screen.css';`) and stay unlayered, like the rest of the developer's CSS.
- **Every selector names its own block, and every element it reaches is named by a class.** A
  rule in a plain stylesheet applies to the whole app, so `.article-card__dek p` would also hit
  the paragraphs of every child component; give the element a class (`__dek-text`). A rule may
  reach into a child component only through that child's public classes
  (`.article-card__media .media-asset-figure__img`).
- **A screen's root block is its view-model type, with `View` replaced by `Screen`**:
  `InboundReceiptWarehouseQueueView` renders `.inbound-receipt-warehouse-queue-screen`. The
  suffix keeps it from colliding with the component the screen renders (`.article-detail`). A
  base-template screen with no view type is named after its concept and role
  (`.locale-admin-list-screen`); a layout after its route group (`.admin-layout`).
- **Visual rules are overridable.** A coreui stylesheet may hold anything; there is no separate
  place for structural rules any more.

`pnpm css:check` (`scripts/css-check.mjs`, also in the Test workflow) enforces all of this, and
reports a class no component mentions, which replaces svelte-check's unused-selector warning.

**Class names are BEM, and they are public API.** A component's root class is its name in kebab
case (`.date-time-picker`). Every styled element inside it is `<root>__<part>`, and every variant,
size or class-expressed state is `<root>--<modifier>`. Never give an internal element a bare
generic class (`.icon`, `.body`, `.label`): bare names collide with other components' roots and
with application CSS. The full list, and what changing it costs, is in
`docs/COREUI-COMPATIBILITY.md`.

```css
.alert__icon { … }
.card__body  { … }
.toast__close:hover { … }
.button--primary { … }
```

**CSS custom property bridge for inherited state.** When a Bits UI data-attribute on a parent
element needs to affect a non-Bits child element, use a CSS custom property as the bridge:

```css
/* declare on the state-carrying parent — --_ prefix marks it private */
.accordion-item__trigger {
  --_icon-rotate: 0deg;
}
.accordion-item__trigger[data-state='open'] {
  --_icon-rotate: 180deg;
}

/* consume via inheritance in the child */
.accordion-item__chevron {
  transform: rotate(var(--_icon-rotate, 0deg));
}
```

This keeps a parent's state reaching a child through inheritance rather than a selector that
depends on the parent's markup.

**Private component tokens (`--_` prefix).** When a component needs an internal CSS variable
that is not part of the public theming surface — to share a value between two selectors within
one component's ruleset in its stylesheet — name it with a `--_` prefix:

```css
/* private: consumers must not reference this */
.accordion-item__trigger {
  --_icon-rotate: 0deg;
}
.accordion-item__trigger[data-state='open'] {
  --_icon-rotate: 180deg;
}
.accordion-item__chevron {
  transform: rotate(var(--_icon-rotate, 0deg));
}
```

The `--_` prefix signals "internal implementation detail." Do not advertise these in docs or
override them from application CSS. If a value needs to be themeable, it should chain to a
public semantic token instead.

### Theme and color scheme via `data-*`

Dark mode and theme variants are driven by `data-*` attributes on ancestor elements, never by
CSS class toggles. The token overrides in `@sveltebuilder/coreui/styles/_internal.css` respond
to these attributes:

| Attribute                   | Effect                                           |
| --------------------------- | ------------------------------------------------ |
| `data-color-scheme="dark"`  | Force dark mode regardless of system preference  |
| `data-color-scheme="light"` | Force light mode regardless of system preference |
| _(attribute absent)_        | Follow `prefers-color-scheme` system preference  |

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
module package. Common candidates: `DataTable`, `Timeline`, `Money`, `Address`.
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

| Issue                                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Native template (ON HOLD)                 | Frozen 2026-09-29 — not accessible from `npm create sveltebuilder`, not being maintained. Its `withUser`/Drizzle data layer is the pattern SuperPrototype is moving away from, so expect it to fall further behind. Keep shared surfaces provider-neutral in shape; do not spend effort on Native itself.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `@sveltebuilder/commerce`                 | Not started — single placeholder `index.ts`. The product's remaining domain differentiator gap.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `@sveltebuilder/content` RLS was absent   | Fixed 2026-10-01, recorded because the shape of the mistake is worth remembering: all 27 of the module's tables shipped with row level security **disabled**, and Supabase's bootstrap grants give anon and authenticated full privileges on everything in `public` — so the publishable key could read and write `subscriber`, `comment` and the rest. Verified exploitable before the fix. Nothing could have caught it: a table with no policies is valid SQL, typechecks nowhere, and behaves correctly in any test that runs as an owner. `pnpm sql:check` now asserts that every table in `public` has RLS and that every RLS-enabled table has at least one policy.                                                           |
| `@sveltebuilder/logistic` remaining gaps | The route port is complete (8 screen bundles, `screens/_unported/` is gone) and the RLS policy-pattern pass is done as of 2026-10-01 — all 40 policies now call the helpers as `(select …)` and gate admin through `public.current_user_admin()`, and `pnpm sql:check` asserts both properties for every policy in `public`. Still missing: a vitest suite for the package. |
| `user_account` self-promotion             | Fixed 2026-10-03, recorded because the shape of the mistake is worth remembering: the base template's `user_account_owner_update` policy let any authenticated principal `PATCH` its own row's `admin` column to `true` — RLS cannot restrict which columns an allowed `UPDATE` may touch, so "update your own row" necessarily included `admin` and `auth_user_id`. Verified exploitable before the fix (an account-takeover primitive via `auth_user_id`, not just privilege escalation via `admin`). Fix is `supabase/supplemental/05-user-account-hardening.sql`: `UPDATE`/`INSERT`/`DELETE` revoked from `anon`/`authenticated` on `user_account` outright, admin promote/demote moved to the `admin_set_user_admin()` SECURITY DEFINER RPC with a last-administrator guard. `pnpm sql:check` now asserts the grant is revoked and that a non-admin calling the RPC is refused. |
| WCAG 2.2 AA audit                         | Half done. The automated half runs in CI over every component (`apps/dev-kitchen`, Accessibility workflow), and its first run found keyboard-unreachable overlays, an unlabeled `Select` and 862 contrast failures, all fixed 2026-10-07. The human half — screen-reader flow, reading order, 400% zoom, RTL mirroring — has not been done. Required before any module is marked production-ready. See `docs/DEV-KITCHEN.md` §5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `apps/docs`                               | Placeholder only — no content, no structure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Changesets peer cascade                   | A **minor** coreui changeset bumps `content` and `logistic` a **major**: their `workspace:^` peer on 0.x coreui excludes the next minor, and Changesets treats widening a peer range as breaking. Until fixed (coreui 1.0, or wider peer ranges), write coreui changesets as `patch` wherever defensible and check `pnpm changeset status --verbose` before merging. See `docs/DEFERRED.md`. |

---

## Completed Foundation

| Item                               | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `diglossia` 0.1.0                  | Complete and tested — split into a framework-agnostic core (`createDictionary`, per-request `DictionaryInstance`, `formatText` MF2 interpolation/pluralization) and a Svelte adapter (`diglossia/svelte`: `setDictionary`/`getDictionary`/`<LocalText />`); full test suite; extracted from this repo (formerly `@sveltebuilder/hermes`) into its own repo/npm package, consumed here as an external dependency                                                                                                                                                                                                                                     |
| `@sveltebuilder/local-text-schema` | Complete — pure TS + Drizzle package (no Svelte), renamed from `@sveltebuilder/hermes-schema`; exports `./schema` (locale/local_text_link/local_text Drizzle tables) and `./seed` (canonical `LOCALES`/`BASE_SLUGS` data consumed by `sveltebuilder sync:supabase`)                                                                                                                                                                                                                                                                                                                                                                                 |
| `@sveltebuilder/coreui`            | Complete — 28+ components (Accordion, Alert, Avatar, Badge, Banner, Button, Card, Checkbox, ConfirmDialog, DataTable, Dialog, Divider, Drawer, Field, Input, InlineNotification, Label, LocalePicker, Menu, MessageLiveRegion, Pagination, Popover, ProgressBar, RadioGroup, Select, Skeleton, Spinner, Switch, Table, Tabs, Tag, Textarea, Toast/ToastRegion, Tooltip, plus `DateTimePicker` added for content, `MetricCard`/`Timeline` added for logistic; the article block editor, `BarcodeInput` and the locale admin editors have since moved to content, logistic and the base template, and `StatusBadge` was removed in favour of `Badge`); styles in one plain stylesheet per component folder, listed by `styles/components.css` and imported `layer(components)`; Bits UI data-attribute wiring throughout; builds cleanly |
| `@sveltebuilder/content`           | Complete (replaces the retired `@sveltebuilder/blog`) — 14-entity publisher/news schema (structured `article_block` body, live coverage, front curation, newsletters, media assets, author profiles, article workflow), 13 Camp 2 components, RSS feed, news + standard sitemaps, NewsArticle JSON-LD + OG/hreflang meta tags, EN+FR seed data; Camp 1/2 diglossia boundary respected. Route port to screen bundles is complete as of 2026-10-01 (article, section, feed, article-preview, article-admin; `screens/_unsorted/` is gone) — see `docs/MODULE-ROUTES.md`. Vitest suite in `packages/content/test/` renders 9 of its 18 components server-side, including the no-`[missing:]` gate.                  |
| `@sveltebuilder/logistic`          | Schema, components and SQL complete — suppliers, storage locations, stock levels, inbound receiving, pick tasks, shipments, returns, cycle counts; SECURITY DEFINER SQL for concurrency-sensitive stock mutations; README with v1-scope statement. Its Drizzle query layer is removed (guardrail 11) and its route port to screen bundles is complete as of 2026-09-30 (8 bundles: supplier, stock-level, inbound-receipt, shipment, return-authorization, cycle-count, warehouse, dashboard; `screens/_unported/` is gone). See Known Open Issues and `docs/MODULE-ROUTES.md`.                                                                                                                                                        |
| `@sveltebuilder/cli`               | Complete — `sveltebuilder sync:supabase` working (`.sveltebuilder/registry/` manifest discovery, topological sort, Drizzle schema barrel + `drizzle-kit generate`, supplemental SQL append, seed.sql generation); bare `sync` kept as a deprecated alias; the dead `sync:drizzle` stub was removed                                                                                                                                                                                                                                                                                                                                                  |
| `create-sveltebuilder`             | Complete — interactive CLI with project name, scaffold template, package manager, and module selection prompts; overlays templates, runs `sveltebuilder sync:supabase`, installs dependencies                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Local-text DB schema               | Finalized with RLS — `locale`, `local_text_link`, `local_text`, `get_dictionary` SQL function (`security invoker`, explicit predicate parens); schema of record is the Drizzle defs in `@sveltebuilder/local-text-schema`, SQL is generated; RLS + `get_dictionary` now ship from `tools/create/templates/base/supabase/supplemental/`, applying to every scaffold flavor                                                                                                                                                                                                                                                                           |
| Auth architecture                  | Principal–identity split; `current_user_id()` + `current_user_admin()` SECURITY DEFINER helpers resolving `auth.uid()` → `user_account.id`; `ensure_user_account()` JIT provisioning in SQL; all policies call the helpers as `(select fn())` and name their role with `to`                                                                                                                                                                                                                                                                                                                                                                         |
| SuperPrototype template            | Supabase-native — all admin + API routes query through `event.locals.supabase` (PostgREST), so RLS applies to every request with no session variable or transaction wrapper. `getClaims()` for guards, publishable key, SECURITY INVOKER RPCs for compound writes. No direct Postgres connection; no `DATABASE_URL`. Sign-in/out remain Supabase OAuth.                                                                                                                                                                                                                                                                                             |
| Native template                    | **ON HOLD 2026-09-29** — built but frozen and unreachable from the create CLI. Auth.js (`@auth/sveltekit`) with Entra/Google/GitHub; Drizzle adapter tables in `auth` schema; `events.createUser` provisions `user_account`; same `hooks.server.ts` shape as SuperPrototype; full `withUser` DB pattern. Will diverge from SuperPrototype from here; see `docs/DEFERRED.md`.                                                                                                                                                                                                                                                                        |
| Base scaffold template             | Supabase client, `hooks.server.ts` (auth + locale resolution), root layout load, `/api/local-text` endpoints, `/api/locale` GET + POST, `LocalePicker`, seed data (8 locales, EN + FR dictionary) generated via `sync:supabase`; CSS layer cascade established (`base`, `chrome`, `components` layers; explicit `@layer` declaration; `state.css` absorbed into `chrome.css`)                                                                                                                                                                                                                                                                     |
| Messaging system                   | Universal message surface in coreui — `createMessageBus`/`setMessageBus`/`getMessageBus` (context-provided, same shape as diglossia's dictionary, replacing a module-level `$state` singleton), `Toast`/`ToastRegion`, `Banner`, `InlineNotification`, `ConfirmDialog`, `MessageLiveRegion`; wired into the base scaffold template's root layout.                                                                                                                                                                                                                                                                                                     |
| Component harness                  | `apps/dev-kitchen`, rebuilt 2026-10-07 after the first rotted (see `docs/DEV-KITCHEN.md`) — renders all 92 components of coreui, content and logistic from source in base-template chrome copied at sync time, server-rendered and hydrated; typed fixtures; `*_COVERAGE` types fail `pnpm check` on an unshowcased export; `/dev/theme` shows the set in forced light, forced dark and RTL; the Accessibility workflow runs axe (WCAG 2.2 A/AA) on every page in three modes, overlays opened by keyboard, and a focus-visibility walk |
| Publishing pipeline                | `.changeset/` configured (GitHub changelog, public npm access) — packages are versioned independently (e.g. `coreui@0.1.0`, `logistic@0.0.10`) via Changesets                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Monorepo structure                 | Clean — pnpm workspaces, Turborepo task graph, all workspace references correct                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
