# dev-kitchen

A SvelteKit app that renders every component the workspace packages export, from their source,
inside the scaffold's own chrome. It is where you develop a component without scaffolding a
project, see the variants no screen uses, and audit the set for accessibility.

The design and the history behind it are in [`docs/DEV-KITCHEN.md`](../../docs/DEV-KITCHEN.md).

```sh
pnpm --filter dev-kitchen dev        # http://localhost:5173
pnpm --filter dev-kitchen check      # svelte-check, including showcase coverage
pnpm --filter dev-kitchen test:a11y  # the accessibility audit (needs `playwright install chromium` once)
```

No database, no Supabase, and no `.env` to write: `sync-chrome.mjs` creates the one variable the
chrome needs.

## What is generated and what is not

The chrome — `hooks.server.ts`, the root `+layout.svelte` and `+error.svelte`, `app.d.ts`,
`app.html`, `app.css`, `chrome.css` — is copied from `tools/create/templates/base/` by
`sync-chrome.mjs` before every `dev`, `build`, `check` and `lint`, and is gitignored. **Never edit
those files here**; change the template, and the harness follows on its next run. The app this
replaced kept a hand-written copy of that wiring, and it rotted until it could not build.

Everything else is committed and owned here:

| Path                                | Purpose                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `src/routes/+layout.server.ts`      | The root load the base chrome expects, built from the canonical seed instead of SQL    |
| `src/routes/api/locale/+server.ts`  | Where `LocaleSwitcher` posts; the base template ships no locale endpoint               |
| `src/lib/catalog.ts`                | Every showcase page and the components it renders — and the coverage gate             |
| `src/routes/dev/<package>/<page>/`  | The showcase pages                                                                    |
| `svelte.config.js`, `vite.config.ts`| Source aliases and SSR settings                                                       |

## Coverage is enforced

`src/lib/catalog.ts` lists the components each page renders. For every package it declares a
`*_COVERAGE` constant whose type is `true` only when every component the package exports appears
on some page. Export a new component without adding it to a page, and `pnpm check` fails naming it:

```
Type 'boolean' is not assignable to type '{ uncovered: "Tooltip"; }'.
```

Add the component to a page's `components` list and render it on that page.

## Writing a showcase page

- One `+page.svelte` under `src/routes/dev/<package>/<slug>/`, matching an entry in the catalog.
  The layout renders the heading, the component list and the page title from the catalog entry.
- Wrap each variant in `$lib/Example.svelte` with a short title.
- Type fixtures against the package's exported types (`satisfies Article`, the module's `/views`
  types), never as untyped literals. A prop removed from a component should be a type error in
  the fixture, not a silent lie — that is how the last harness's fixtures drifted.
- Entity components take their copy from a `dictionary` prop built from a fixture payload. A
  `[missing: …]` sentinel anywhere on a page is a bug, and the accessibility run fails on it.

## The accessibility audit

`tests/` runs against a production build (`vite build` then `vite preview`), in CI as the
Accessibility workflow:

- **`a11y.spec.ts`** loads every catalog page, the index and `/dev/theme` in light, dark and
  right-to-left (Arabic, through the real locale cookie). Each must return 200, hydrate with no
  runtime error, declare its `lang`, show no `[missing: …]`, and pass axe-core's WCAG 2.2 A and AA
  rules.
- **`overlay.spec.ts`** opens each kind of overlay from the keyboard and checks that focus moves
  in, axe passes on the open state, and Escape closes it with focus back on the trigger.
- **`focus.spec.ts`** tabs through `/dev/theme` and fails on any stop without a visible focus
  indicator, which axe cannot check because focus styles exist only while focused.

`tests/axe.ts` applies one exemption, and only one: WCAG 1.4.3 does not require contrast for an
inactive control's text, which axe recognises for a native `disabled` element but not for a Bits UI
checkbox or switch. Everything else is reported.

This is the automated half of a WCAG 2.2 AA audit. Screen-reader flow, reading order, and whether
a page makes sense without sight still need a person.

## What this does not check

The workspace packages resolve to **source** through `kit.alias` in `svelte.config.js`, so a save
re-renders through HMR with no `svelte-package` step. That is the point of the app, and it means:

- **It can render a component no published consumer could import.** The alias bypasses each
  package's `exports` map and `files` array. Only `pnpm scaffold:check`, which installs packed
  tarballs, catches that class of bug.
- **A `Snippet` prop type error may be a duplicate-Svelte artifact** rather than a defect, if two
  copies of svelte are ever installed. The workspace pins one through `pnpm.overrides`, and
  `vite.config.ts` dedupes `svelte`, `diglossia` and `bits-ui`; keep both.
- **Server rendering is on.** Every page is rendered on the server and hydrated, as in a scaffold,
  so a context read that throws only on the server, or a dictionary built in `$effect`, fails here
  too. It does not exercise loaders against a database; that is `pnpm sql:check`'s job.

Harness-only copy (page headings, example titles) is hard-coded English. Nothing here ships.
