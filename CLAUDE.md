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
│   ├── access/         @sveltebuilder/access         roles and permissions: schema, view types, admin components
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

### Verification gates

Which gate covers what, and when to run each: `docs/VERIFICATION.md`. Read it before
calling any change finished.

### Screen bundles

How module route code ships (bundle layout, data modules, extracted components, screen-contract
types): `.claude/rules/screen-bundle.md`, loaded when you touch `tools/create/`.

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

No copy columns, integer primary keys, the polymorphic link and the core i18n schema:
`.claude/rules/drizzle-schema.md`, loaded when you touch a package schema.

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
  inline (see _Screen bundles_).
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
  (see _Screen bundles_).

Schema file layout: `.claude/rules/drizzle-schema.md`. Registry manifests and the
`sync:supabase` pipeline: `tools/cli/CLAUDE.md`. Seed conventions: `.claude/rules/seed.md`,
loaded when you touch a seed, a screen bundle or the local-text seed data.

---

## Auth Architecture

Principal–identity split, the identity-bridge functions, compound-write RPCs, the admin role,
access control and provisioning: `.claude/rules/auth-access.md`, loaded when you touch SQL,
hooks, admin routes or the access package. Read it before designing anything that touches
who can see or change what.

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

6. **Scope is implied, never stored as a column on a domain table or passed as a component prop.**
   Infrastructure tables that address entities of every type carry it, because that is their job:
   `local_text_link.scope`, `permission.scope`, `role_assignment.scope`. A domain table never does.

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

12. **Policies and screens ask about permissions, never role names.** `current_user_can(scope,
    action)` and the generated `current_user_<entity>_ids(action)`, not `role.slug =
    'content_editor'`. A role is data an administrator can copy and change; a permission is the
    contract.

13. **No access decision is made in TypeScript.** A loader may hide a control or turn someone away
    for a better experience, but every rule it applies must already be a policy or a definer
    function's check, because the Data API is reachable directly with the public key.

14. **Nothing writes the access tables directly.** `role`, `role_permission`, `role_assignment`,
    `user_group`, `user_group_member` and the generated `<entity>_role_assignment` tables are
    written only through their SECURITY DEFINER RPCs (A12); `anon` and `authenticated` hold no
    `insert`, `update` or `delete` on them. Seeds are the exception: they run as the owner.

---

## CSS Style System

Layer cascade, plain stylesheets, BEM, `--_` private tokens, theme attributes and Bits UI
data-attribute wiring: `.claude/rules/css.md`, loaded when you touch a `.css` or `.svelte` file.

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

## Status

Known open issues and the completed-foundation record: `docs/STATUS.md`. Check it before
starting work on a module or claiming something is done.
