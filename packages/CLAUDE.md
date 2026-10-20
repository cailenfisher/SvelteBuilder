# CLAUDE.md — packages/

Library packages export three things: a Drizzle schema (build time only), components, and
view-model types. Never screens, never queries. Schema rules load from
`.claude/rules/drizzle-schema.md`, stylesheet rules from `.claude/rules/css.md`.

## Components

- **Application-level UI never imports `diglossia`** (guardrail 1). `Button`, `Input`, layout
  chrome and form primitives take plain `string` props. If you find yourself reaching for
  `localText` inside a coreui component that has no entity context, stop and reconsider the
  component boundary. Entity/domain components resolve the dictionary from context, with an
  optional `dictionary` prop (the root CLAUDE.md's i18n section).
- **Domain modules do not reach past `@sveltebuilder/coreui` to Bits UI directly** (guardrail 4).
  The coreui contract is the dependency boundary. If a domain module needs a primitive not in
  coreui, propose adding it to coreui first.
- **A component used by a screen is presentational here**: props in, markup out. One bound to its
  route (posting to that page's form actions, or building that route's hrefs) stays in the screen
  bundle instead.
- **Every exported component has a dev-kitchen showcase.** `apps/dev-kitchen/src/lib/catalog.ts`
  makes a missing one a `pnpm check` failure; see `apps/dev-kitchen/CLAUDE.md`.

## No screens, no queries

- **Once it is a full screen, view, or page, it does not belong in a library package**
  (guardrail 10). Components may compose other components freely — that is what they are for. But
  a `+page.svelte`, or a composed view whose reason to exist is _being_ a page, lives in the
  template tree under `tools/create/templates/`, never in `packages/*`. Screens are scaffolded once
  and owned by the generated app thereafter; they are not a dependency it tracks. See
  `docs/MODULE-ROUTES.md`.
- **Module packages ship no data-access layer** (guardrail 11). A module exports its Drizzle schema
  (build-time), its components, and its view-model types — never queries. Route loaders live in the
  scaffold and reach the database through `event.locals.supabase`, so the module never needs to
  know how a row was fetched. A module's `./server` export reintroducing a query layer is a bug;
  this is what guardrail 8 forbids, stated at the package boundary.
- **View-model types are the contract with screens** (`@sveltebuilder/<module>/views`). Nothing
  typechecks across that boundary until a project exists, so `pnpm scaffold:check` is the gate for
  any change to them.

## Tests

The package suites (`packages/coreui/test/`, `packages/content/test/`) render components
server-side with `svelte/server`. Their `vitest.config.ts` carries the `svelte` export condition
and `ssr.noExternal` settings that make bits-ui render under SSR; copy both into any new suite.
