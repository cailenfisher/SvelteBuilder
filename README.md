# SvelteBuilder

> Scaffolding for building enterprise-grade SvelteKit applications, fast.

SvelteBuilder aims to be an opinionated starter template and toolkit for SvelteKit projects that need to be production-ready from day one. It will ship with first-class localization, a clean set of common UI components, and strong established patterns for routing, data access, auth, and error handling — so you can skip the boilerplate and start building the parts that actually matter.

> ⚠️ **Status: Pre-POC.** This project is in active planning. Code, APIs, and architecture are subject to significant change. The roadmap below describes the intended direction, not a current feature list.

## Goals

- **Enterprise-ready defaults.** Semantic markup, accessibility, and structured error handling are baked in from the first commit — not retrofitted later.
- **Deployable on day one.** Configuration is driven by `.env` so any consumer of the scaffold can deploy to Vercel (or similar) and get a correctly customized application with minimal setup.
- **Localization from the ground up.** Multilingual content is a core concern, not an afterthought. The same patterns that handle UI strings also handle long-form, database-backed localized content.
- **Clear upgrade paths.** Start with batteries-included services (Supabase), graduate to provider-agnostic abstractions (Drizzle, Lucia-style auth) without rewriting your application.
- **Extractable libraries.** The UI components and i18n toolkit are designed to eventually live as standalone NPM packages, usable in projects that aren't based on SvelteBuilder.

## Planned Features

### Localization / i18n Toolkit

A content-first approach to multilingual applications, not just UI string translation.

- Typed content models (`LocalText`, `Locale`, `LocalTextLink`) with slug + scope addressing
- Load function that accepts either raw API data or a pre-merged dictionary and hydrates a shared rune
- A `<LocalText />` component with overloadable parameters:
  - `<LocalText slug="my_content" />` — global scope
  - `<LocalText slug="my_content" scope="moduleName" />` — scoped lookup
  - `<LocalText slug="my_content" scope="moduleName" contentId="13" />` — filter by ID for per-entity content
  - Wrappable for domain-specific sugar: `<BlogWelcomeText blog="42" />`
- Inline-output API for use outside components (exact shape TBD during POC — candidates include a store with a custom getter, `$lt.slug("...")`, or a function-wrapped rune, `localText("...")`)
- SvelteKit routes for content delivery, with a path toward plain-Svelte (client-side) compatibility in the library version

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
- Paraglide for UI-string i18n; custom toolkit for dynamic/DB-backed localized content
- `.env`-driven configuration; deployable to Vercel out of the box
- Initial UI component set
- First pass at the `<LocalText />` component and content API

### Phase 2 — Beta

- Harden APIs based on POC learnings
- Begin extracting the UI component library into its own package (still co-developed in the monorepo)
- Begin extracting the i18n toolkit, identifying which pieces must remain in the scaffold
- Expand UI component coverage and accessibility audits
- Evaluate Supabase Auth vs. Lucia migration timing

### Phase 3 — Release

- UI component library published as a standalone NPM package, consumable in any Svelte project
- i18n toolkit published as a standalone NPM package (with a thin SvelteKit integration layer remaining in the scaffold)
- Drizzle ORM as the default data layer, with a Supabase preset
- Lucia-patterned auth as the default, with a Supabase Auth adapter
- Documentation, examples, and migration guides

## Open Questions

These will be resolved during the POC phase:

- How much of the dynamic localization functionality can be cleanly extracted into a framework-agnostic (or at least SvelteKit-optional) library?
- Best API shape for inline localized text output — store-with-getter vs. function-wrapped rune.
- Whether to target Drizzle from the start of the content API, or defer until Phase 3.
- Whether Supabase Auth can carry us through Beta without constraining the eventual Lucia migration.

## Tech Stack (Current Plan)

- **Framework:** SvelteKit
- **Language:** TypeScript
- **Database (POC/Beta):** Supabase → **(Release):** Drizzle
- **Auth (POC/Beta):** Supabase Auth → **(Release):** Lucia-patterned, in-application
- **UI i18n:** Paraglide
- **Content i18n:** Custom toolkit (to be extracted as a library)

## Contributing

The project is in the planning stage and not yet accepting outside contributions. Questions, comments, and feature requests are welcome!

## License

TBD
