# CLAUDE.md — SvelteBuilder Monorepo

The orientation for AI-assisted development in this repository, and the rules that apply
everywhere in it. Rules that apply to one area live beside that area and load when you work there:

| File | Covers | Loads when you touch |
| --- | --- | --- |
| `.claude/rules/screen-bundle.md` | Bundle layout, one data module per table, where a screen's components go | `tools/create/` |
| `.claude/rules/drizzle-schema.md` | No copy columns, primary keys, the polymorphic link, schema file layout | a package schema |
| `.claude/rules/seed.md` | Seed conventions, copy scope and slugs | a seed or a module template |
| `.claude/rules/auth-access.md` | Principal–identity split, RLS helpers, RPCs, admin role, access control | SQL, `supabase/`, hooks, admin routes, `packages/access` |
| `.claude/rules/css.md` | Layers, plain stylesheets, BEM, theme and Bits UI attributes | a `.css` or `.svelte` file |
| `packages/CLAUDE.md`, `packages/coreui/CLAUDE.md` | Library package rules; coreui's API and release rules | files in that directory |
| `apps/dev-kitchen/CLAUDE.md`, `tools/cli/CLAUDE.md` | The component harness; the registry and `sync:supabase` | files in that directory |
| `docs/` | Rationale, designs, history, and `docs/STATUS.md` | when a rule points there |

A path rule loads only once you open a matching file. When you plan work in one of those areas
before touching anything, read its rule file first.

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
│   ├── access/         @sveltebuilder/access         roles and permissions: schema, view types, admin components
│   ├── content/        @sveltebuilder/content        publisher/news domain module
│   ├── commerce/       @sveltebuilder/commerce
│   └── logistic/       @sveltebuilder/logistic
├── tools/
│   ├── create/         create-sveltebuilder      CLI installer (npm create); templates/ holds every scaffold
│   └── cli/            @sveltebuilder/cli        sveltebuilder sync:supabase, etc.
├── apps/
│   ├── dev-kitchen/    component harness: every package component, from source, audited for WCAG
│   └── docs/
├── scripts/            repo tooling — scaffold-check.mjs, css-check.mjs, sql-check/
└── [root config: pnpm workspaces, Turborepo, Changesets, ESLint, Prettier]
```

Package manager: **pnpm**. Task orchestration: **Turborepo**. Publishing: **Changesets**. The
workspace pins a single svelte through `pnpm.overrides` in the root `package.json`; bump svelte
there, not per package.

The i18n primitives package (`diglossia`, formerly `@sveltebuilder/hermes`) lives in its own repo
([github.com/cailenfisher/diglossia](https://github.com/cailenfisher/diglossia)) and is consumed
here as an external dependency rather than a workspace package.

---

## Verification

Run the gate that covers what you changed before calling the change finished. What each one
catches, and why the harnesses work the way they do, is in `docs/VERIFICATION.md`.

| Gate | Run after touching | What it proves |
| --- | --- | --- |
| `pnpm check` | any package source | Every package type-checks, including components no template screen renders; every exported component has a dev-kitchen showcase |
| `pnpm test` | anything | Unit suites, including template publishing, version pins, screen-bundle contracts and route data access |
| `pnpm css:check` | a stylesheet or component markup | The plain-stylesheet rules hold and no class is unused |
| `pnpm scaffold:check` | `tools/create/templates/`, or a package a template imports | Real scaffolds pass `svelte-check` and build. Vite does not typecheck, so the build alone proves nothing |
| `pnpm sql:check` | SQL, seeds, policies, schema | Migration and seed apply (seed twice) and RLS behaves as the routes assume, as admin, non-admin and anonymous. Nothing else runs SQL |
| Accessibility workflow (CI) | a component | axe WCAG 2.2 A/AA over dev-kitchen in light, dark and right-to-left |

---

## Tech Stack

- **Framework:** SvelteKit + TypeScript, Svelte 5 runes only.
- **Database:** PostgreSQL (Supabase-hosted), reached through the Supabase Data API (PostgREST) via
  `@supabase/ssr` — never a direct connection. Drizzle is the **build-time** schema source of truth
  for every package; `sveltebuilder sync:supabase` generates SQL migrations from it. Whether to keep
  Drizzle in that role is an open topic.
- **Auth:** SuperPrototype template: Supabase Auth. Native template (ON HOLD): Auth.js
  (`@auth/sveltekit`). See [Auth and Access Control](#auth-and-access-control).
- **i18n:** `diglossia` (schema: `@sveltebuilder/local-text-schema`); formatting is `messageformat`
  (Unicode MessageFormat 2), via `diglossia`'s `formatText()`.
- **UI components:** `@sveltebuilder/coreui` — Bits UI primitives where a component has real
  interaction, plain HTML elsewhere; see its README.

---

## i18n Architecture

This is the most critical design constraint in the codebase. The responsibility split is
deliberate and must never be violated.

### Responsibility split

**`diglossia`** is the single source of all i18n primitives, split into a framework-agnostic core
and a Svelte adapter:

- `diglossia` (core) — `createDictionary(payload, options?)`, returning a `DictionaryInstance`
  with `.localText(slug, scope?, entityId?)`, `.localeOf(slug, scope?, entityId?)`,
  `.formatText(slug, values?, scope?, entityId?)`, and `.merge(payload)`. Also every type:
  `Locale`, `LocalText`, `LocalTextLink`, `DictionaryPayload`, `DictionaryInstance`.
- `diglossia/svelte` — `setDictionary(instance)`, `getDictionary()`, and `<LocalText slug="..." />`.

No other package redeclares these. Never redeclare them — a type-only import
(`import type { Locale } from 'diglossia'`) is fine even in a component with no runtime
dependency on diglossia, since it's erased at build.

**The scaffold / consuming app** owns locale resolution. The root layout fetches the resolved
dictionary payload for the active locale (locale-priority resolution happens in SQL, in
`get_dictionary` — diglossia only flattens an already-resolved payload) and calls
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
Document any deviation at the entity definition. Infrastructure tables that address entities of
every type carry it, because that is their job: `local_text_link.scope`, `permission.scope`,
`role_assignment.scope`. A domain table never does.

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
  `Renderer`, `Figure`, `Bar`, `Path`, `Editor`, `Region`, `Matrix` (a grid of one control per
  row-and-column pair, such as `CheckboxMatrix`), and `Option` (a view-model type for one
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
  inline (`.claude/rules/screen-bundle.md`).
- **Mutations:** form actions in `+page.server.ts`, not ad hoc `fetch`, unless the interaction
  is genuinely client-only.
- **Errors / redirects:** throw `error()` and `redirect()` from `@sveltejs/kit`. Never return
  ad hoc error shapes. A form action reports failure with `formError(status, slug, detail?)`
  (`$lib/server/form-error`), returning a copy slug rather than English (`ScreenFormError`), and the
  screen shows it with `formErrorText` (`$lib/FormError/form-error`), which falls back to the
  global `feedback.error` when a slug has no copy. `tools/create/test/screen-bundle.test.ts` fails
  on an unseeded error slug or on English passed to `fail()`.
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
  (`.claude/rules/screen-bundle.md`).
- Schema is Drizzle-first and SQL is generated (`.claude/rules/drizzle-schema.md`, and
  `tools/cli/CLAUDE.md` for the pipeline). Seeds follow `.claude/rules/seed.md`.

---

## Auth and Access Control

`public.user_account` is the domain principal, linked to Supabase's `auth.users`. Every query
runs through `event.locals.supabase` as the signed-in user, so RLS applies with nothing for the
application to do. Policies never call `auth.uid()`; they ask through helpers, each wrapped as
`(select …)`: `current_user_id()`, `current_user_admin()`, `current_user_can(scope, action)` and
the generated `current_user_<entity>_ids(action)`. An administrator is the break-glass that holds
every permission; everyone else is authorized by roles. The full rules are in
`.claude/rules/auth-access.md`; read `docs/ACCESS-CONTROL-USAGE.md` before touching a policy.

---

## Architecture Guardrails

These rules are enforced by ESLint `no-restricted-imports` where possible. Violations are bugs.
Each names where its detail lives.

1. **Never import `diglossia` in application-level UI components** (`Button`, `Input`, layout
   chrome, form primitives); they take plain `string` props. `packages/CLAUDE.md`.
2. **Never add `name`/`title`/`label`/`description` columns to domain entity tables.** The
   `LocalTextLink` wiring is the model from day one. `.claude/rules/drizzle-schema.md`.
3. **`diglossia` contains no database calls, no fetch, no async.** Full stop.
4. **Domain modules do not reach past `@sveltebuilder/coreui` to Bits UI directly.** Propose the
   primitive for coreui instead. `packages/CLAUDE.md`.
5. **Domain entity primary keys default to `integer`, not UUID**; `bigint` is a per-case choice
   for extreme row counts. `.claude/rules/drizzle-schema.md`.
6. **Scope is implied, never stored as a column on a domain table or passed as a component prop.**
   See [Scope convention](#scope-convention).
7. **Styles are plain stylesheets, never Svelte `<style>` blocks, and never `:global`.**
   `pnpm css:check` enforces this. `.claude/rules/css.md`.
8. **Route code accesses the database only through `event.locals.supabase`.** Never open a
   direct Postgres connection from application code, and never introduce a `DATABASE_URL`.
   A direct connection runs as a table-owning role, which bypasses RLS entirely — every
   policy in the project silently stops applying. Drizzle is a build-time schema and type
   tool only (`drizzle-kit generate`); importing `drizzle-orm` at runtime is a bug.
9. **Bits UI state is communicated via data attributes, never via class toggling.**
   `.claude/rules/css.md`.
10. **Once it is a full screen, view, or page, it does not belong in a library package.** It lives
    in the template tree, and the generated app owns it once scaffolded. `packages/CLAUDE.md`,
    `docs/MODULE-ROUTES.md`.
11. **Module packages ship no data-access layer**: schema, components and view-model types, never
    queries. `packages/CLAUDE.md`.
12. **Policies and screens ask about permissions, never role names.** `.claude/rules/auth-access.md`.
13. **No access decision is made in TypeScript.** A loader may hide or redirect; a policy or a
    definer function's check refuses. `.claude/rules/auth-access.md`.
14. **Nothing writes the access tables directly**, only their SECURITY DEFINER RPCs (seeds
    excepted). `.claude/rules/auth-access.md`.

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

**`@sveltebuilder/commerce` v1 excludes:** marketplace/multi-vendor, subscriptions/recurring
billing, advanced B2B (customer groups, RFQ/PO, net terms), PIM, and a tax calculation engine.

**`@sveltebuilder/logistic` v1 excludes:** wave picking, cross-docking, yard management, labor
management, robotics integration, demand forecasting, and multi-warehouse advanced routing.

---

## Status

Known open issues and what is already built: `docs/STATUS.md`. Check it before starting work on
a module or claiming something is done.
