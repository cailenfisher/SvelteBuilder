# SvelteBuilder

> Scaffolding for building enterprise-grade SvelteKit applications, fast.

SvelteBuilder aims to be an opinionated starter template and toolkit for SvelteKit projects that need to be production-ready from day one. It will ship with first-class localization, a clean set of common UI components, and strong established patterns for routing, data access, auth, and error handling — so you can skip the boilerplate and start building the parts that actually matter.

> [!WARNING]
> **Status: Pre-POC.** This project is in active planning. Code, APIs, and architecture are subject to significant change. The roadmap below describes the intended direction, not a current feature list.

## Goals

- **Enterprise-ready defaults.** Semantic markup, accessibility, and structured error handling are baked in from the first commit — not retrofitted later.
- **Deployable on day one.** Configuration is driven by `.env` so any consumer of the scaffold can deploy to Vercel (or similar) and get a correctly customized application with minimal setup.
- **Localization from the ground up.** Multilingual content is a core concern, not an afterthought. The same patterns handle both UI strings and long-form, database-backed content — one component, one admin UI, one mental model.
- **Clear upgrade paths.** Start with batteries-included services (Supabase), graduate to provider-agnostic abstractions (Drizzle, Lucia-style auth) without rewriting your application.
- **Extractable libraries.** The UI components and i18n toolkit are designed to eventually live as standalone NPM packages, usable in projects that aren't based on SvelteBuilder.

## Planned Features

### Localization / i18n Toolkit

> [!NOTE]
> ***Why a custom i18n toolkit?*** Paraglide (SvelteKit's official i18n) is build-time only, sveltekit-i18n doesn't solve the content model, and teams currently end up splitting UI strings and dynamic content across two unrelated systems — SvelteBuilder's toolkit unifies them. [Read the full rationale →](https://github.com/cailenfisher/SvelteBuilder/wiki/Why-a-Custom-i18n-Toolkit)

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
