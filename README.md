# SvelteBuilder

> Scaffolding for building enterprise-grade SvelteKit applications, fast.

SvelteBuilder aims to be an opinionated starter template and toolkit for SvelteKit projects that need to be production-ready from day one. It will ship with first-class localization, a clean set of common UI components, and strong established patterns for routing, data access, auth, and error handling — so you can skip the boilerplate and start building the parts that actually matter.

> ⚠️ **Status: Pre-POC.** This project is in active planning. Code, APIs, and architecture are subject to significant change. The roadmap below describes the intended direction, not a current feature list.

## Goals

- **Enterprise-ready defaults.** Semantic markup, accessibility, and structured error handling are baked in from the first commit — not retrofitted later.
- **Deployable on day one.** Configuration is driven by `.env` so any consumer of the scaffold can deploy to Vercel (or similar) and get a correctly customized application with minimal setup.
- **Localization from the ground up.** Multilingual content is a core concern, not an afterthought. The same patterns handle both UI strings and long-form, database-backed content — one component, one admin UI, one mental model.
- **Clear upgrade paths.** Start with batteries-included services (Supabase), graduate to provider-agnostic abstractions (Drizzle, Lucia-style auth) without rewriting your application.
- **Extractable libraries.** The UI components and i18n toolkit are designed to eventually live as standalone NPM packages, usable in projects that aren't based on SvelteBuilder.

## Planned Features

### Localization / i18n Toolkit

A unified, runtime-first approach to multilingual applications. **All** translatable content — UI strings, navigation labels, long-form copy, per-entity content — flows through the same system, is edited in the same admin UI, and is rendered with the same component API.

Under the hood, message formatting (pluralization, interpolation, number/date/select rules) is handled by [intl-messageformat](https://formatjs.io/docs/intl-messageformat/), the standard ICU MessageFormat engine maintained by FormatJS. The toolkit builds the opinionated content model, loading, SSR hydration, and component layer on top — so you get locale-correct formatting for 200+ locales without the bundle weight or architectural assumptions of a full i18n framework.

- Typed content models (`LocalText`, `Locale`, `LocalTextLink`) with slug + scope addressing
- Load function that accepts either raw API data or a pre-merged dictionary and hydrates a shared rune
- A `<LocalText />` component with overloadable parameters:
  - `<LocalText slug="my_content" />` — global scope
  - `<LocalText slug="my_content" scope="moduleName" />` — scoped lookup
  - `<LocalText slug="my_content" scope="moduleName" contentId="13" />` — filter by ID for per-entity content
  - Wrappable for domain-specific sugar: `<BlogWelcomeText blog="42" />`
- Inline-output API for use outside components (exact shape TBD during POC — candidates include a store with a custom getter, `$lt.slug("...")`, or a function-wrapped rune, `localText("...")`)
- ICU MessageFormat support out of the box: pluralization, select/gender rules, number and date formatting via the industry-standard syntax translators already know
- SSR-first design: the active locale's dictionary is hydrated into the initial page payload, so there's no flash of untranslated content and no extra round trip before first paint
- Scope-partitioned dictionaries so routes only load the content they need
- Edge-cacheable locale payloads with tag-based invalidation on content updates
- SvelteKit routes for content delivery, with a path toward plain-Svelte (client-side) compatibility in a future release

### UI Component Library

The lowest common denominator of application UI — the components you end up rebuilding on every project.

- Navigation
- Action buttons
- Icons
- User / profile widgets
- Forms
- Post / comment widgets

All components target semantic HTML and WCAG compliance by default.

### Auth

- **POC / Beta:** Supabase Auth for fast setup and straightforward SSO.
- **Release:** Lucia-patterned in-application auth, with Supabase Auth remaining as a plug-in provider option for teams that want to keep using it.

### Database Access

- **POC / Beta:** Direct Supabase client access.
- **Release:** Drizzle ORM with database-agnostic patterns, plus a first-class preset for wiring Drizzle to Supabase (to preserve the fast-setup story).

### Error Handling

Structured, type-safe error management from the first commit, with safe integration into the localization layer so user-facing error messages are translatable without leaking implementation details.

## Why a Custom i18n Toolkit?

SvelteBuilder is strictly a SvelteKit (and eventually plain-Svelte) project. The comparisons below are scoped to that ecosystem.

The SvelteKit i18n landscape today is anchored by three kinds of tools, each good at what it's built for — but none of them, individually or in combination, gives enterprise applications a single coherent system for *all* translatable content.

**[Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)** is SvelteKit's officially recommended i18n library, and it's excellent at what it does. It's a compile-time, tree-shakable system that turns your message files into typed functions, with advertised bundle-size wins of up to 70% over runtime libraries. For UI strings that ship with your application, it's the strongest option in the ecosystem.

But Paraglide's own ecosystem documentation names the limit directly: it's a build-time system, so dynamic content — translations that live in a database or CMS and change without a redeploy — isn't something it can address. That's not a flaw; it's a scope decision. It just leaves a gap that every content-heavy application has to fill somewhere else.

**[sveltekit-i18n](https://github.com/sveltekit-i18n/lib)** is the closest existing tool to what SvelteBuilder's toolkit aims at. It's runtime, SSR-capable, supports custom data sources (including remote APIs), and does module-based loading so only the relevant translations load per route. If you're building a content-heavy SvelteKit application and don't want Paraglide's build-time constraint, this is the tool you'd reach for today.

It's a legitimate middle path. What it doesn't provide is an opinionated content model — there's no typed slug + scope + entity-ID addressing, no unified component API that treats UI labels and per-entity content identically, and no answer to the editor-experience question of *where does the content actually live and who manages it*. You get a solid runtime i18n engine; the content architecture is still yours to design.

**Older options** like [svelte-i18n](https://github.com/kaisermann/svelte-i18n) (whose own README notes it's awaiting rework "when I find the time and priority") and [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n) (actively maintained but with some known SvelteKit SSR friction) remain in use but aren't where new SvelteKit projects generally start.

### The gap this creates

In practice, SvelteKit teams building applications with substantial dynamic content usually end up with one of two architectures:

1. **Split the problem across two systems.** Use Paraglide for UI strings and a headless CMS — Sanity, Storyblok, Directus, DatoCMS, or similar — for content. This is common enough that [SveltyCMS](https://sveltycms.com/) lists it explicitly as a feature: *"Unique separation of UI language (Paraglide) and dynamic Content language."* It works, but it means developers context-switch between two i18n systems with different syntax and failure modes, and editors have to know which system owns which string.
2. **Use sveltekit-i18n or a hand-rolled `load`-function pattern** and build the content model, fallback logic, scope partitioning, SSR hydration, and component wrapping yourself — often reinventing the same patterns on each new project.

Neither approach gives you a single component API that works the same for `<LocalText slug="nav.home" />` and `<LocalText slug="blog.post.42.title" />`. Neither gives editors one place to manage all translatable content in the application.

### What SvelteBuilder does instead

SvelteBuilder's i18n toolkit treats *all* translatable content as runtime, database-backed content — UI labels included. This is a deliberate tradeoff: Paraglide's compile-time model is measurably faster on synthetic benchmarks, but for the authenticated, application-shaped workloads SvelteBuilder targets, the difference disappears into the noise of auth checks, data fetches, and dashboard bundles. What you get in exchange is substantial:

- **One component, one API, one mental model.** `<LocalText slug="nav.home" />` and `<LocalText slug="blog.post.42.title" />` are genuinely the same thing. Developers never have to decide which system a string belongs in.
- **One admin UI for editors.** Product copy, error messages, button labels, and blog posts all live in the same place. Changing a label is not a deploy.
- **Typed addressing with real semantics.** Slug + scope + optional entity ID is a first-class model, not a string-munging convention layered on top of a generic cache or a pair of unrelated systems.
- **Standards-based formatting, no reinvention.** ICU MessageFormat is the industry standard for pluralization, select/gender rules, and locale-correct number and date formatting. SvelteBuilder uses `intl-messageformat` for that layer rather than rolling its own — the same engine that underpins `svelte-i18n` and `@sveltekit-i18n/parser-icu`. Translators using Lokalise, Phrase, Crowdin, or Transifex get syntax they already know.
- **SSR-first, not SSR-compatible.** The active locale's dictionary is embedded in the initial HTML payload. First paint is fully translated, with no loading states and no flash of untranslated slugs.
- **Scope partitioning and edge caching** keep the runtime cost low. Routes declare the scopes they need; the global scope plus declared scopes are what gets shipped. Locale payloads are highly cacheable at the edge, with tag-based invalidation when editors publish changes.
- **Pluggable data sources.** The same component and load patterns work against Supabase today, Drizzle later, or a custom API — without changing anything in the component layer.

The goal isn't to compete with Paraglide on UI string benchmarks, and it isn't to duplicate sveltekit-i18n's runtime engine. It's to stop treating the dynamic-content side of i18n as a second-class problem that every SvelteKit team has to architect from scratch — and to give editors and developers a single, coherent system for everything translatable in the application.

### Why build on intl-messageformat rather than i18next?

[i18next](https://www.i18next.com/) is the dominant framework-agnostic runtime i18n library in the JavaScript ecosystem, and it's a reasonable candidate to build on. We chose `intl-messageformat` instead for three reasons:

1. **Shape fit.** i18next is a *framework* — it wants to own the dictionary, the loading, the caching, the detection, and the namespacing. That model is excellent when your content is static JSON files in a repo; it's an impedance mismatch when your content is database-backed with entity-scoped rows. `intl-messageformat` is a *primitive* — it takes a message and returns a formatted string, nothing more. The opinionated layers above it are the whole point of SvelteBuilder's toolkit, so owning them directly is the right tradeoff.
2. **Bundle weight.** i18next core runs around 15 kB gzipped before plugins. `intl-messageformat` is tree-shakeable with `sideEffects: false` and lands closer to 20–30 kB gzipped in a realistic build — but that's the only formatting dependency. With i18next you'd pay its cost *and* still need most of the same content-layer code on top.
3. **Extractable library.** The toolkit is meant to ship as a standalone NPM package by Phase 3. A thin ICU-formatter dependency is a cleaner base than a full i18n framework when other projects want to adopt just the content model.

## Roadmap

### Phase 1 — POC

A single SvelteKit project that contains the scaffold, the UI component library, and the i18n toolkit all in one place. This phase doubles as an exploration platform for open questions — particularly how much of the localization system can live in a reusable library versus how much must stay in the scaffold.

- SvelteKit + TypeScript + Supabase + Supabase Auth
- Runtime i18n toolkit built on `intl-messageformat`, with SSR-first dictionary hydration
- `.env`-driven configuration; deployable to Vercel out of the box
- Initial UI component set
- First pass at the `<LocalText />` component and content API

### Phase 2 — Beta

- Harden APIs based on POC learnings
- Begin extracting the UI component library into its own package (still co-developed in the monorepo)
- Begin extracting the i18n toolkit, identifying which pieces must remain in the scaffold
- Expand UI component coverage and accessibility audits
- Evaluate Supabase Auth vs. Lucia migration timing
- Admin UI for content management (or an integration pattern with a chosen headless CMS)

### Phase 3 — Release

- UI component library published as a standalone NPM package, consumable in any Svelte project
- i18n toolkit published as a standalone NPM package (with a thin SvelteKit integration layer remaining in the scaffold)
- Drizzle ORM as the default data layer, with a Supabase preset
- Lucia-patterned auth as the default, with a Supabase Auth adapter
- Documentation, examples, and migration guides

### Beyond Release

- Plain-Svelte (client-side only, non-SvelteKit) support for the i18n toolkit. The initial release is strictly SvelteKit with SSR; broader Svelte compatibility is a deliberate follow-up once the SSR-anchored patterns have stabilized.

## Open Questions

These will be resolved during the POC phase:

- How much of the runtime localization functionality can be cleanly extracted into a framework-agnostic (or at least SvelteKit-optional) library, given that the initial release leans heavily on SSR?
- Best API shape for inline localized text output — store-with-getter vs. function-wrapped rune.
- Whether to target Drizzle from the start of the content API, or defer until Phase 3.
- Whether Supabase Auth can carry us through Beta without constraining the eventual Lucia migration.
- Cache invalidation strategy: tag-based CDN invalidation on publish vs. shorter TTLs vs. a hybrid.

## Tech Stack (Current Plan)

- **Framework:** SvelteKit
- **Language:** TypeScript
- **Database (POC/Beta):** Supabase → **(Release):** Drizzle
- **Auth (POC/Beta):** Supabase Auth → **(Release):** Lucia-patterned, in-application
- **i18n formatting engine:** `intl-messageformat` (FormatJS) for ICU MessageFormat support
- **i18n content layer:** SvelteBuilder i18n toolkit (runtime, SSR-first; to be extracted as a standalone library)

## Contributing

The project is in the planning stage and not yet accepting outside contributions. Questions, comments, and feature requests are welcome!

## License

TBD
