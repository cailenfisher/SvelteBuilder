# SvelteBuilder

> Scaffolding + component ecosystem for building quality SvelteKit applications, fast.

SvelteBuilder is an opinionated scaffold and toolkit ecosystem for SvelteKit projects that need to be production-ready quickly. It ships with first-class localization, baked in accessibility tooling, a clean set of common UI components, and strong established patterns for schema, routing, data access, auth, and error handling.

> [!NOTE]
> **Status: Beta in progress.** The foundational layer (`diglossia`, `@sveltebuilder/cli`, base scaffold template) is complete. The UI component library and first domain modules are actively being built. APIs are stabilizing but may still change.

## Ecosystem Overview

SvelteBuilder is structured as a layered ecosystem. Each layer is a separate package in the monorepo, published independently to NPM.

### Monorepo Structure

```
SvelteBuilder/
├── packages/
│   ├── local-text-schema/  → @sveltebuilder/local-text-schema
│   ├── coreui/             → @sveltebuilder/coreui
│   ├── content/            → @sveltebuilder/content
│   ├── commerce/           → @sveltebuilder/commerce
│   └── logistic/           → @sveltebuilder/logistic
├── tools/
│   ├── create/             → create-sveltebuilder
│   └── cli/                → @sveltebuilder/cli
└── apps/
    └── docs/
```

`diglossia`, the i18n primitives package (formerly `@sveltebuilder/hermes`), has been extracted
to [its own repo](https://github.com/cailenfisher/diglossia) and is consumed here as an external
dependency rather than a workspace package.

---

## About

The opinionated architectural patterns are arguably the biggest value proposition. If it all lands right, it solves for a massive, high level anti-pattern that is all too common: You build out a POC based on the very specific features the product calls from. This naturally leads to focusing heavily on UI, with minimal back-end tooling or even mocks. You almost certainly aren't fully solving high level concepts like well designed models and workflows, let alone building out the chore work that is so critical - real auth, permissions, data integrity rules, types, etc. 

In an ideal world, once the POC hits all goals, you take a step back and start from scratch planning proper application architecture, producing artifacts and phases and then build everything correctly from the ground up, ingesting specific POC features only when the time is right for each one. In real life, what actually happens is frequently that the POC is hammered into being the real product because developers get excited or worse, stakeholders see a demo that looks "almost complete" and want delivery *immediately*. You then spend more development hours chasing bugs than you would have building it right. 

Similar scenarios are common even when not building on an overly convincing POC. It's easy for teams to undersell "solved problems" like auth, UI libraries, a11y, i18n, and other common domains; only for fundamental friction against your custom code patterns to bite during the last mile. Even when you get it right, you end up with inconsistent patterns at the interface of each area - no truly unified shapes and models. Bypassing abstract tasks like well formed mental models and naming is a similar story. 

Solving all of this (and more) in a scaffold is a heady task, but I believe it to be possible and worthwhile. Time (and hopefully user feedback) will tell! This necessarily requires enforcing strong opinions, firmly. These opinions are hard-earned, and generally track with what has evolved over time as best practices - but I am very open to qualified input, especially during these early stages. 

The domain specific module libraries might be overly ambitious, and I am open to backing away from that portion if the scaffold proves to have value but modules are getting stuck in the mud. It's a big lift, but I have strong hands on experience in each planned domain, and I really like the idea of providing a truly valuable ecosystem of extendable components that work in real world domains. This would keep code patterns unified, and solve for the standard friction that comes from stitching together third party component libraries and your actual application. 

### Foundational Layer

**`diglossia`** provides the i18n primitives used throughout the entire ecosystem: the `LocalText` type, `LocalTextLink`, the `Locale` type, `createDictionary()`, the `<LocalText />` Svelte component (from `diglossia/svelte`), and the `DictionaryInstance.localText(slug, scope, entityId)` method. It is the single source of these — no other package redeclares them.

> [!NOTE]
> **_Why a custom i18n toolkit?_** Paraglide (SvelteKit's official i18n) is build-time only, sveltekit-i18n doesn't solve the content model, and teams currently end up splitting UI strings and dynamic content across two unrelated systems — SvelteBuilder's toolkit unifies them. [Read the full rationale →](https://github.com/cailenfisher/SvelteBuilder/wiki/Why-a-Custom-i18n-Toolkit)

**`@sveltebuilder/coreui`** provides universal UI elements shared across all domain-specific modules. Application-level UI components (buttons, layout chrome, forms, navigation) are i18n-agnostic — they accept a plain `label: string` and ordinary child snippets, exactly like any normal Svelte component. Entity-aware display components receive an entity `id` and resolve localized copy themselves via `diglossia`.

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

### SvelteBuilder Native — on hold

> **Status: on hold as of 2026-09-29.** Native is not selectable in `npm create sveltebuilder` and
> is not currently being developed. SuperPrototype is the only active template. Native remains a
> planned offering, so shared layers (base template, coreui, domain modules, i18n schema) stay
> free of hard Supabase dependencies — but the Native scaffold itself is frozen.

The intent: for teams that want full control over their data layer and auth, bringing the same SvelteBuilder base and module ecosystem with a provider-agnostic data layer.

- **Database:** Postgres (the supported target; SvelteBuilder is Postgres-only by decision)
- **Auth:** Provider-agnostic — configure your own

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

- **`diglossia`** owns the primitives and is the single import source for them.
- **The scaffold (base template)** owns locale resolution and dictionary loading — it queries the database, builds the payload, and passes it to `createDictionary()`, then `setDictionary()`s the instance in the root layout's `<script>` body (never inside `$effect` — effects don't run during SSR).
- **Feature modules** split internally: application-level UI components are i18n-agnostic (plain `label: string` props); entity-aware display components resolve localized copy themselves via `getDictionary().localText(slug, scope, entityId)`.

Domain schema carries no conventional copy columns (`name`, `title`, `label`, `description`, etc.). User-facing copy is linked to entities via `LocalTextLink`, keyed by scope + entity ID. Scope is implied by convention (the `product` model resolves under the `product` scope) and is never a schema field or a prop.

---

## Naming Conventions

Consistent naming is a first-class concern — the connective tissue between the database, the code, and the interface. One concept, one name, from the SQL column to the TypeScript type to the Svelte component to the label the user reads.

[Read the full naming conventions →](https://github.com/cailenfisher/SvelteBuilder/wiki/Naming-Conventions)

---

## Roadmap

### Phase 1 — POC ✓

- SvelteKit + TypeScript + Supabase + Supabase Auth baseline
- `diglossia` — complete and tested
- `@sveltebuilder/cli` with `sveltebuilder sync` — complete
- Base scaffold template (SuperPrototype) — complete
- Local-text DB schema with RLS policies — complete
- Monorepo structure — clean and correct

### Phase 2 — Beta (in progress)

- `@sveltebuilder/coreui` — design tokens, CSS reset, universal component set
- `@sveltebuilder/content` — first domain module, full production scope
- `create-sveltebuilder` — complete prompt/copy/install flow
- Auth UI — sign in, sign up, sign out routes
- Admin UI for content management
- SSR-safe dictionary construction — complete (`createDictionary`/`setDictionary` called in the root layout's `<script>` body, not `$effect`)
- Accessibility audit pass on all coreui components

### Phase 3 — Release

- `diglossia` published as standalone NPM package
- `@sveltebuilder/coreui` published as standalone NPM package
- `@sveltebuilder/content` stable release
- `create-sveltebuilder` stable release with SuperPrototype and Native scaffold options
- `sveltebuilder add <module>` — post-install module addition command
- Documentation site (`apps/docs`)

### Phase 4 — Domain Modules

- `@sveltebuilder/commerce` — full production e-commerce scope
- `@sveltebuilder/logistic` — full production logistics/operations scope
- Additional domain modules based on community need

### Beyond Release

- Plain-Svelte (client-side only, non-SvelteKit) support for `diglossia`'s core. The initial release is strictly SvelteKit with SSR; broader Svelte compatibility is a deliberate follow-up once the SSR-anchored patterns have stabilized.

---

## Tech Stack

| Concern           | SuperPrototype                            | Native                                    |
| ----------------- | ----------------------------------------- | ----------------------------------------- |
| Framework         | SvelteKit + TypeScript                    | ← same                                    |
| i18n primitives   | `diglossia`                               | ← same                                    |
| i18n formatting   | `messageformat` (Unicode MessageFormat 2) | ← same                                    |
| UI components     | `@sveltebuilder/coreui`                   | ← same                                    |
| Database          | Supabase (Postgres)                       | Drizzle ORM (any driver)                  |
| Auth              | Supabase Auth + `@supabase/ssr`           | Provider-agnostic                         |
| Schema management | `supabase db diff` + `sveltebuilder sync` | Drizzle migrations + `sveltebuilder sync` |

---

## Contributing

Not yet accepting outside contributions. Questions, comments, and feature requests are welcome.

## License

TBD
