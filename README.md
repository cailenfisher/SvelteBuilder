# SvelteBuilder

> Scaffolding for building enterprise-grade SvelteKit applications, fast.

SvelteBuilder is an opinionated scaffold and toolkit ecosystem for SvelteKit projects that need to be production-ready from day one. It ships with first-class localization, a clean set of common UI components, and strong established patterns for routing, data access, auth, and error handling — so you can skip the boilerplate and start building the parts that actually matter.

> [!NOTE]
> **Status: Beta in progress.** The foundational layer (`@sveltebuilder/hermes`, `@sveltebuilder/cli`, base scaffold template) is complete. The UI component library and first domain modules are actively being built. APIs are stabilizing but may still change.

## Goals

- **Enterprise-ready defaults.** Semantic markup, accessibility, and structured error handling are baked in from the first commit — not retrofitted later.
- **Deployable on day one.** Configuration is driven by `.env` so any consumer of the scaffold can deploy to Vercel (or similar) and get a correctly customized application with minimal setup.
- **Localization from the ground up.** Multilingual content is a core concern, not an afterthought. The same patterns handle both UI strings and long-form, database-backed entity content — one component, one admin UI, one mental model.
- **Clear upgrade paths.** Start with the batteries-included SuperPrototype (Supabase), or go with the Native scaffold (Drizzle, bring your own auth). Both are permanent, supported offerings — not a stepping stone and a destination.
- **Extractable libraries.** Every layer of the ecosystem is designed to live as a standalone NPM package, usable in projects that aren't based on SvelteBuilder.

## Ecosystem Overview

SvelteBuilder is structured as a layered ecosystem. Each layer is a separate package in the monorepo, published independently to NPM.

### Monorepo Structure

```
SvelteBuilder/
├── packages/
│   ├── hermes/        → @sveltebuilder/hermes
│   ├── coreui/        → @sveltebuilder/coreui
│   ├── blog/          → @sveltebuilder/blog
│   ├── commerce/      → @sveltebuilder/commerce
│   └── logistic/      → @sveltebuilder/logistic
├── tools/
│   ├── create/        → create-sveltebuilder
│   └── cli/           → @sveltebuilder/cli
└── apps/
    ├── dev-kitchen/
    └── docs/
```

---

### Foundational Layer

**`@sveltebuilder/hermes`** provides the i18n primitives used throughout the entire ecosystem: the `LocalText` type, `LocalTextLink`, the `Locale` type, the `<LocalText />` Svelte component, and the `localText(slug, scope, entityId)` function. It is the single source of these — no other package redeclares them.

> [!NOTE]
> **_Why a custom i18n toolkit?_** Paraglide (SvelteKit's official i18n) is build-time only, sveltekit-i18n doesn't solve the content model, and teams currently end up splitting UI strings and dynamic content across two unrelated systems — SvelteBuilder's toolkit unifies them. [Read the full rationale →](https://github.com/cailenfisher/SvelteBuilder/wiki/Why-a-Custom-i18n-Toolkit)

**`@sveltebuilder/coreui`** provides universal UI elements shared across all domain-specific modules. Application-level UI components (buttons, layout chrome, forms, navigation) are i18n-agnostic — they accept a plain `label: string` and ordinary child snippets, exactly like any normal Svelte component. Entity-aware display components receive an entity `id` and resolve localized copy themselves via `@sveltebuilder/hermes`.

> [!NOTE]
> **_Why a custom UI library?_** Off-the-shelf component libraries make assumptions about structure, styling, and accessibility that break down at the edges of real enterprise applications — especially across niche industries. SvelteBuilder's UI layer is built around the repeating problems found across years of production web development, with semantic HTML and WCAG compliance as non-negotiable defaults. [Read the full rationale →](https://github.com/cailenfisher/SvelteBuilder/wiki/Why-a-Custom-UI-Library)

---

### Domain-Specific Modules

Domain modules provide feature-complete, production-ready implementations for specific application domains. Each is published as a standalone NPM package. Installing a module does two things: it makes its components importable like any library, and it copies schema files and starter routes into the target project via the CLI.

```ts
import { PostCard, PostBody } from '@sveltebuilder/blog';
```

All domain modules consume `@sveltebuilder/coreui` components wherever possible. When overlap is identified across multiple modules, new additions are proposed to the core library rather than duplicated.

Planned modules:

- **`@sveltebuilder/blog`** — authoring, publishing, post/comment UI, RSS, sitemap
- **`@sveltebuilder/commerce`** — e-commerce workflows (complex; full production scope)
- **`@sveltebuilder/logistic`** — logistics and operations management (complex; full production scope)
- Additional domain modules to follow

---

### The CLI

**`create-sveltebuilder`** is the one-time project scaffolding tool, invoked via:

```sh
npm create sveltebuilder@latest
```

It prompts for scaffold template and module selection, copies all relevant files, writes schema manifest files, and runs `sveltebuilder sync` as a final step.

**`@sveltebuilder/cli`** handles ongoing project management:

```sh
sveltebuilder sync   # reads _registry manifests, topologically sorts schema, rewrites config.toml
sveltebuilder add <module>  # adds a domain module to an existing SvelteBuilder project
```

`create-sveltebuilder` depends on `@sveltebuilder/cli` internally — sync logic is never duplicated.

---

## Scaffold Templates

Every SvelteBuilder project starts from the **base** — the scaffold-agnostic foundation that all templates share. Base includes:

- Core application schema (`user_account`, `locale`, `local_text`, `local_text_link`)
- `hooks.server.ts` with auth and locale resolution wiring
- Root layout with dictionary loading and SSR hydration
- `/api/local-text` and `/api/locale` endpoint layers
- `LocaleSwitcher` component and app shell layout
- Seed data (locales + application dictionary)

On top of base, you choose a scaffold template:

### SvelteBuilder SuperPrototype

The batteries-included starting point. Everything is pre-wired to the Supabase ecosystem — no data layer configuration required. Designed for teams that want to go from zero to deployed in a day, and for projects that intend to stay on Supabase long-term. SuperPrototype is a permanent, fully-supported offering.

- **Database:** Supabase (Postgres, managed migrations via `supabase db diff`)
- **Auth:** Supabase Auth with `@supabase/ssr`
- **Schema management:** `sveltebuilder sync` rewrites `supabase/config.toml` `schema_paths` in dependency order

### SvelteBuilder Native

For teams that want full control over their data layer and auth. Brings the same SvelteBuilder base and module ecosystem, wired to Drizzle and your choice of auth provider.

- **Database:** Drizzle ORM (database-agnostic; bring your own driver)
- **Auth:** Provider-agnostic — configure your own

> Both scaffold templates produce **identical database schemas**. The schema is scaffold-agnostic; only the application code that talks to it differs. A project can be started on SuperPrototype and migrated to Native without touching a single migration file.

---

## Schema Architecture

Schema is organized in three tiers, applied in deterministic order:

1. **Base schema** — always present, regardless of scaffold or modules. `user_account`, `locale`, `local_text`, `local_text_link`. The load-bearing infrastructure of every SvelteBuilder project.
2. **Module schema** — each domain module's tables, which depend on base schema via foreign keys. Only present when the module is selected.
3. **Scaffold template** — contributes no schema of its own. It determines how the schema is queried and how auth/sessions are managed, nothing more.

Each package ships its own schema files and a `manifest.json` that declares ordering dependencies. `sveltebuilder sync` performs a topological sort across all installed module manifests and rewrites the schema path configuration so migrations always apply in the correct order.

---

## i18n Architecture

The localization model has a deliberate split of responsibility:

- **`@sveltebuilder/hermes`** owns the primitives and is the single import source for them.
- **The scaffold (base template)** owns locale resolution and dictionary loading — it queries the database, builds the payload, and passes it to `hermes`.
- **Feature modules** split internally: application-level UI components are i18n-agnostic (plain `label: string` props); entity-aware display components resolve localized copy themselves via `localText(slug, scope, entityId)`.

Domain schema carries no conventional copy columns (`name`, `title`, `label`, `description`, etc.). User-facing copy is linked to entities via `LocalTextLink`, keyed by scope + entity ID. Scope is implied by convention (the `product` model resolves under the `product` scope) and is never a schema field or a prop.

---

## Naming Conventions

Consistent naming is a first-class concern — the connective tissue between the database, the code, and the interface. One concept, one name, from the SQL column to the TypeScript type to the Svelte component to the label the user reads.

[Read the full naming conventions →](https://github.com/cailenfisher/SvelteBuilder/wiki/Naming-Conventions)

---

## Roadmap

### Phase 1 — POC ✓

- SvelteKit + TypeScript + Supabase + Supabase Auth baseline
- `@sveltebuilder/hermes` — complete and tested
- `@sveltebuilder/cli` with `sveltebuilder sync` — complete
- Base scaffold template (SuperPrototype) — complete
- Hermes DB schema with RLS policies — complete
- Monorepo structure — clean and correct

### Phase 2 — Beta (in progress)

- `@sveltebuilder/coreui` — design tokens, CSS reset, universal component set
- `apps/dev-kitchen` — full working SvelteKit app + `/dev` component explorer
- `@sveltebuilder/blog` — first domain module, full production scope
- `create-sveltebuilder` — complete prompt/copy/install flow
- Auth UI — sign in, sign up, sign out routes
- Admin UI for content management
- SSR-safe dictionary hydration (resolving first-render sentinel issue)
- Accessibility audit pass on all coreui components

### Phase 3 — Release

- `@sveltebuilder/hermes` published as standalone NPM package
- `@sveltebuilder/coreui` published as standalone NPM package
- `@sveltebuilder/blog` stable release
- `create-sveltebuilder` stable release with SuperPrototype and Native scaffold options
- `sveltebuilder add <module>` — post-install module addition command
- Documentation site (`apps/docs`)

### Phase 4 — Domain Modules

- `@sveltebuilder/commerce` — full production e-commerce scope
- `@sveltebuilder/logistic` — full production logistics/operations scope
- Additional domain modules based on community need

### Beyond Release

- Plain-Svelte (client-side only, non-SvelteKit) support for `@sveltebuilder/hermes`. The initial release is strictly SvelteKit with SSR; broader Svelte compatibility is a deliberate follow-up once the SSR-anchored patterns have stabilized.

---

## Tech Stack

| Concern           | SuperPrototype                            | Native                                    |
| ----------------- | ----------------------------------------- | ----------------------------------------- |
| Framework         | SvelteKit + TypeScript                    | ← same                                    |
| i18n primitives   | `@sveltebuilder/hermes`                   | ← same                                    |
| i18n formatting   | `intl-messageformat` (ICU MessageFormat)  | ← same                                    |
| UI components     | `@sveltebuilder/coreui`                   | ← same                                    |
| Database          | Supabase (Postgres)                       | Drizzle ORM (any driver)                  |
| Auth              | Supabase Auth + `@supabase/ssr`           | Provider-agnostic                         |
| Schema management | `supabase db diff` + `sveltebuilder sync` | Drizzle migrations + `sveltebuilder sync` |

---

## Contributing

Not yet accepting outside contributions. Questions, comments, and feature requests are welcome.

## License

TBD
