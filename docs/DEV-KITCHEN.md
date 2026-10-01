# DEV-KITCHEN.md — what the in-repo component harness was for, and what the next one must be

`apps/dev-kitchen` was removed from this repo on 2026-09-30. This document records what it was
supposed to do, the three jobs it actually did, why it died, and the design the replacement has to
satisfy. It is a design document, not a changelog: read it before rebuilding anything in `apps/`.

Companion reading: `docs/MODULE-ROUTES.md` (where route code lives and why), `docs/DEFERRED.md`
(what is deliberately not being done yet), and the Template Verification section of `CLAUDE.md`
(the three gates that exist today).

---

## 1. The three jobs

dev-kitchen was described in `CLAUDE.md` as an "internal SvelteKit test app," which undersells it.
It did three distinguishable jobs, and they have different value and different failure modes. The
replacement should be designed against the list, not against the description.

### Job 1 — develop a component from inside the repo, with no scaffolded project

This was the day-to-day job, and the one that justified the app existing at all. Editing
`packages/coreui/src/lib/Select.svelte` and seeing the result in a browser required _some_ SvelteKit
app to mount it in. dev-kitchen was that app, and it resolved the workspace packages **to their
source**, not to their build output, so a save re-rendered through HMR with no `svelte-package` step
in between.

That is the job no other gate in this repo does, and it is the reason the alternative — `npm create
sveltebuilder` into a temp directory — is not a substitute. A scaffolded project consumes packed
tarballs. Changing a component then means rebuild, repack, reinstall, reload. The feedback loop goes
from under a second to tens of seconds, which is the difference between iterating on a focus ring
and not bothering.

The mechanism was a hand-written alias map plus an SSR escape hatch in `vite.config.ts`:

```ts
resolve: {
  alias: [
    { find: '@sveltebuilder/coreui/styles', replacement: resolve('../../packages/coreui/styles') },
    { find: '@sveltebuilder/coreui',        replacement: resolve('../../packages/coreui/src/lib/index.ts') },
    { find: '@sveltebuilder/content',       replacement: resolve('../../packages/content/src/lib/index.ts') },
    // …
  ]
},
ssr: { noExternal: ['@sveltebuilder/content', '@sveltebuilder/coreui', 'bits-ui'] }
```

`noExternal` was not optional. Without it Vite externalises the workspace packages for SSR and loads
them through Node's resolver, which reads `exports` and lands on `dist/` — the thing the aliases
exist to avoid — and a Svelte component imported from outside the Vite pipeline is not compiled at
all. This pair of settings is the whole trick, and it is worth keeping even if nothing else survives.

### Job 2 — exercise components that no scaffolded screen happens to use

The `/dev/coreui/*` and `/dev/content/*` routes were a kitchen sink: one page per component,
rendering each variant beside the others. 33 coreui showcase routes and 7 content ones existed.

This job turned out to be load-bearing in a way nobody planned, because of a gap measured while
deciding to purge:

| Surface                   | Public components | Referenced by any template screen | Covered by a unit test |
| ------------------------- | ----------------- | --------------------------------- | ---------------------- |
| `@sveltebuilder/coreui`   | 65                | 32                                | 0                      |
| `@sveltebuilder/content`  | 18                | 0 (see note)                      | 0                      |
| `@sveltebuilder/logistic` | 9                 | 6                                 | 0                      |

There are **zero** `*.test.ts` files anywhere in `packages/`. The only unit test in the repo is
`tools/create/test/screen-bundle.test.ts`. So the only thing that type-checks a component today is
`pnpm scaffold:check` running `svelte-check` over a scaffolded project — which reaches a component
only if some screen in the template tree actually renders it.

The content row reads 0 rather than 5 because every content-component reference in the template tree
is inside `tools/create/templates/modules/content/screens/_unsorted/`, and a `_`-prefixed directory
is never copied by the create CLI and therefore never type-checked by anything.

Which leaves 33 coreui components, all 18 content components, and 3 logistic components with no
verification of any kind — not a test, not a scaffold type-check, and (once dev-kitchen broke) not a
render either. Among them: every `Menu*` component, `Popover`, `Tooltip`, `Drawer`, `BlockEditor`,
`DateTimePicker`, `Timeline`, `RadioGroup`, `Accordion`, `Alert`, `Banner`, `Toast`.

### Job 3 — a rendered surface to audit

The WCAG 2.2 AA audit named in `CLAUDE.md`'s Known Open Issues needs a page that renders every
component in every state. So does visual review of dark mode, RTL, and focus-visible rings across
the set. Nothing else in the repo produces that surface. This job never actually happened, but it is
the strongest argument for rebuilding: Bits UI supplies accessible primitives, and that is an
argument about primitives, not about what this repo wrapped them in.

---

## 2. Why it died

Not neglect in the abstract. A specific, diagnosable sequence.

### It was a hand-maintained second copy of the scaffold

dev-kitchen carried its own `hooks.server.ts`, its own `src/lib/components/LocaleSwitcher.svelte`,
its own `/api/local-text/*` and `/api/locale` endpoints, its own `app.d.ts`, and its own root layout
— all of them near-duplicates of what `tools/create/templates/` ships. Nothing compared the two
copies. Every change to the scaffold's wiring silently obligated a matching edit in dev-kitchen,
and that obligation was invisible, unenforced, and routinely missed.

By the end the divergence was total: coreui had started exporting `LocaleSwitcher` itself, the base
template had grown real `(admin)` CRUD routes for `LocaleEdit`/`LocalTextEdit`/`LocalTextLinkEdit`
that made three dev-kitchen showcase routes redundant, and dev-kitchen's own copies of all of it
sat untouched.

The alias map rotted the same way and more quietly: it still aliased `@sveltebuilder/hermes` to
`../../packages/hermes/src/lib/index.ts`, a directory deleted when the i18n primitives were
extracted to the standalone `diglossia` repo.

### The diglossia 0.1.0 split finished it

diglossia 0.1.0 replaced a module-level singleton (`load()`, `localText()`) with per-request
instances (`createDictionary()`, `setDictionary`/`getDictionary` from `diglossia/svelte`). The base
template was migrated. dev-kitchen was not. The same release split coreui's `messageBus` singleton
into `createMessageBus`/`setMessageBus`/`getMessageBus` for the same reason — a module-level store
leaks one visitor's state into another's response on the server — and dev-kitchen was not migrated
for that either.

State at the time of removal, measured rather than assumed:

- `vite build` fails on the first file it reaches: `"localText" is not exported by diglossia/dist/index.js`.
- `svelte-check` reports **35 errors across 17 files**.
- Every route 500s even where the imports resolve, because the root layout mounts
  `<MessageAriaLive />`, `<Banner />` and `<ToastRegion />`, all three of which call
  `getMessageBus()` unconditionally at init, and dev-kitchen never called `setMessageBus`. The
  failure is in the root layout, so there was no working page left in the app.
- Its root layout built the dictionary inside `$effect` — precisely the mistake `CLAUDE.md`
  documents, since effects do not run during SSR, so every server-rendered page would have shown
  `[missing: …]` sentinels even after the imports were fixed.

Worth stating plainly, because it cuts against the case for the app: those 35 errors were
dev-kitchen's own drift, not package defects it caught. Where a fixture and a component disagreed —
`ArticleCard` receiving a long-removed `mediaAssets` prop and omitting a now-required `status` — the
fixture was the stale side. The harness found its own rot, not the library's.

### The breakage became load-bearing in CI

Rather than fix it, three workflows were taught to route around it. `test.yml`, `scaffold-check.yml`
and `sql-check.yml` each carried `--filter='!./apps/*'` with a comment explaining that dev-kitchen's
build was expected to fail. That filter is removed in the same commit as the app, which is a small
but real gain: `apps/*` is no longer a quarantine zone, so the next thing added under `apps/` is
covered by CI by default instead of inheriting an exemption written for something else.

---

## 3. What the replacement must do differently

### Requirement 1 — it must not hand-maintain scaffold wiring

This is the root cause and the one non-negotiable change. The harness must get its chrome —
`hooks.server.ts`, root layout, dictionary and message-bus wiring, locale endpoints, `app.d.ts` —
from the template tree rather than from a parallel copy a human keeps in sync.

Two shapes achieve that:

- **Generated, committed thin.** A script (`pnpm kitchen:sync`, say) runs the create CLI into
  `apps/dev-kitchen/`, then overlays a committed `src/routes/dev/**` tree plus a `vite.config.ts`
  that re-points the packages at source. Only the overlay is tracked; the generated chrome is
  gitignored, and regenerating is how you update it. Drift becomes impossible because the chrome is
  not an artifact anyone edits.
- **Generated on demand into a temp directory.** Same overlay, nothing committed under `apps/`,
  the harness materialised by `pnpm kitchen` and thrown away. Lighter, but gives up the stable path
  and makes editing a showcase route awkward.

The first is the better trade for Job 1, since the point is a long-lived dev server you keep open.
Either way the overlay must stay small enough to read in one sitting: showcase routes, fixtures,
and the Vite resolution config. Nothing else.

### Requirement 2 — source resolution, deliberately divergent from `scaffold:check`

There is a real tension here, and the replacement should resolve it explicitly rather than
discover it. `scripts/scaffold-check.mjs` deliberately **packs the workspace packages and installs
the tarballs**, for a reason recorded in `CLAUDE.md`: a linked package brings its own
`node_modules/svelte`, and two copies of Svelte make every cross-package `Snippet` prop a type
error with no bug behind it. Packing also verifies the `files` array and `exports` map.

The harness wants the opposite — source, aliased, HMR — and must therefore accept that it is _not_
checking what `scaffold:check` checks. Two consequences follow, and both should be written into
whatever README the harness ships with:

- The harness can render a component that a published consumer could not import, because aliases
  bypass the `exports` map. Only `scaffold:check` catches that class of bug.
- A `Snippet`-prop type error seen in the harness may be a duplicate-Svelte artifact rather than a
  real defect. Pin Svelte at the workspace root and keep the alias list exhaustive.

Neither gate subsumes the other. Say so in the doc rather than letting someone rediscover it.

### Requirement 3 — a gate, or it rots again

The app must be in CI from its first commit. Minimum: `svelte-check` over the harness on every PR,
in a job with no `apps/*` exemption. If `svelte-check` on the harness is green, the fixtures agree
with the component props, which is exactly the drift class that killed the last one.

The gate also has to be cheap enough to keep. A harness that requires a live Supabase connection to
boot is not — dev-kitchen needed `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL` and `PUBLIC_DEFAULT_LOCALE`, which is partly why its build
was never verified in CI. Prefer a harness whose `/dev/**` routes run entirely off committed
fixtures, with the database path exercised by `pnpm sql:check` where it belongs.

### Requirement 4 — fixtures are a typed contract, not a literal

Every one of dev-kitchen's content fixtures was an untyped object literal, which is how
`ArticleCard` ended up receiving props that had not existed for months. Fixtures must be declared
against the package's exported types — `satisfies Article`, and the module's
`@sveltebuilder/<module>/views` view-model types where a screen-shaped component is involved — so a
removed prop is a type error in the fixture file rather than a silent lie.

This also means the harness should be rebuilt _after_ a module settles its view types, not before.

---

## 4. Scope when it comes back

Ordered by value per unit of effort, from the measurements in section 1.

1. **coreui, all 65 exports.** The 33 with no coverage first. coreui is complete and stable, so its
   fixtures will not be rewritten underneath the work. This alone justifies the harness.
2. **A theming and a11y surface.** One page rendering the full set under `data-color-scheme="dark"`,
   under `dir="rtl"`, and with focus-visible walked by keyboard. This is the Job 3 payoff and the
   entry point for the WCAG 2.2 AA audit.
3. **content, 18 components.** Only after its route code is bundled out of `screens/_unsorted/` and
   it exports view-model types; doing it earlier means writing the fixtures twice.
4. **logistic, 9 components.** Listed as outstanding in `docs/DEFERRED.md`. Cheapest of the three —
   6 of 9 already appear in shipped screen bundles, so only 3 are dark.

Explicitly out of scope: reproducing the scaffold's `(admin)` CRUD routes. The base template
exercises `LocaleEdit`, `LocalTextEdit` and `LocalTextLinkEdit` against a real database, and
`scaffold:check` type-checks them. Three of the old showcase routes existed only because that was
not yet true.

---

## 5. Open questions

- **Is a SvelteKit app the right container at all?** Job 2 and Job 3 want a component gallery;
  Job 1 wants a dev server with the repo's packages wired to source. A vitest +
  `@testing-library/svelte` suite per package would cover Job 2's regression value more cheaply and
  more precisely, and is already an open issue for both logistic and content. It would not cover Job
  1 or Job 3. The honest answer is probably both — tests for assertions, a harness for eyes — but
  the harness gets smaller if the tests exist, so the ordering matters.
- **Does the generated-chrome shape fight `turbo`?** A gitignored, generated `apps/dev-kitchen/` has
  no stable `package.json` for the workspace to discover until after the first sync, which affects
  `pnpm install` and the task graph. Needs a concrete answer before committing to shape one.
- **Which template flavour does the harness scaffold from?** SuperPrototype is the only active one,
  so that is the default. But a harness pinned to SuperPrototype inherits a Supabase dependency for
  booting, which cuts against Requirement 3's "runs off fixtures." Possibly the harness overlays
  only the base template plus stub locals.
- **Does `pnpm scaffold:check` already cover enough?** It type-checks real projects and would catch
  a broken screen. It will never render a component, never exercise a variant no screen uses, and
  never tell you a focus ring is invisible. That is the gap the harness fills; it is worth
  re-measuring the numbers in section 1 before paying for it again, because if the template tree
  grows to reference most of coreui, the gap narrows on its own.

---

## 6. Removal record

The 82 tracked files of `apps/dev-kitchen` were removed in the commit recorded in
`docs/DEFERRED.md` under "dev-kitchen — removed." Recover any of it with
`git show <sha>^:apps/dev-kitchen/<path>`; the 33 coreui showcase routes in particular are a
reasonable starting point for the rebuild, once their imports are migrated to
`diglossia/svelte` and `createMessageBus`.
