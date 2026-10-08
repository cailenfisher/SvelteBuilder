# DEV-KITCHEN.md — what the in-repo component harness was for, and what the next one must be

`apps/dev-kitchen` was removed from this repo on 2026-09-30. This document records what it was
supposed to do, the three jobs it actually did, why it died, and the design the replacement has to
satisfy. It is a design document, not a changelog: read it before rebuilding anything in `apps/`.

The measurements were retaken on 2026-10-07, after content's route port and the first package tests
landed. Sections 1, 3 and 4 carry the current numbers; section 2 describes the app as it was when
it was removed.

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

This job turned out to be load-bearing in a way nobody planned, because of a gap first measured
while deciding to purge, and re-measured on 2026-10-07:

| Surface                   | Public components | Referenced by any template screen | Rendered by a package test |
| ------------------------- | ----------------- | --------------------------------- | -------------------------- |
| `@sveltebuilder/coreui`   | 65                | 32                                | 2 (`Select`, `SelectItem`) |
| `@sveltebuilder/content`  | 18                | 3 (see note)                      | 9                          |
| `@sveltebuilder/logistic` | 9                 | 6                                 | 0                          |

At removal there were no `*.test.ts` files in `packages/` at all. There are now six: one in coreui
(`test/select.test.ts`) and five in content, all rendering components server-side with `render()`
from `svelte/server` under vitest. content's `no-missing-copy.test.ts` in particular gates the
`[missing: …]` class of bug — a Camp 2 child that never receives the `dictionary` prop — which
`svelte-check` cannot see because the prop is optional. logistic and commerce still have none.
Type-checking now happens per package (below), but nothing in the "dark" counts that follow renders
a component.

The content screen count is 3 (`ArticleView`, `ArticleCard`, `SectionLabel`) because the route port
carried over only the thirteen route files that existed. The live-coverage, front-curation,
author-profile, newsletter and media screens were never written, so the components they would
render have no screen at all (see `docs/DEFERRED.md`).

Something cheaper than any harness recovers most of Job 2's regression value, and it is now done.
Until 2026-10-07 no package had a `check` script: `build` (`svelte-package`) compiles without
type-checking cross-component prop usage, `lint` is ESLint only, and `test` was vacuous where no
tests existed. Every package now has `check` (`svelte-check`, or `tsc --noEmit` for
local-text-schema), `turbo.json` has a `check` task, and the Test workflow runs it on every PR. It
renders nothing, so it does not touch Jobs 1 and 3, but it changes how much the harness has to carry:
a fixture or a component that disagrees with a coreui prop is now a CI failure without any app.

Its first run found 22 errors, all real, and all fixed in the same change. coreui had 3. `Tooltip`
passed `openDelay` to bits-ui v2, which does not accept it, so its `delay` prop had never taken
effect. content had 19:
- `BlockEditorHost` mapped blocks with the wrong field names and listened for an event `BlockEditor`
  never emits, so no edit ever reached the parent.
- `ArticleWorkflowPanel` was written against a `Drawer`/`Tabs` API that does not exist, and its tabs
  never switched.
- `SectionFront` and `AuthorProfileView` omitted `ArticleCard`'s required `status`, the same
  mismatch the old dev-kitchen fixture had, and also failed to forward `dictionary`.
- `NewsletterSignup` passed `Button` a `label` prop it does not have.

The `DataTable` column-snippet errors that `docs/DEFERRED.md` once listed for `ArticleList`,
`AssignmentQueue` and `SubscriberList` were not defects. They were the duplicate-Svelte artifact
described under Requirement 2, from running a `svelte-check` installed outside the workspace, and
they disappear with the workspace's own.

No screen or test rendered any of those six components, which is how they survived.

Which leaves 33 coreui components, 9 content components (`ArticleList`, `ArticleWorkflowPanel`,
`AssignmentQueue`, `AuthorProfileView`, `BlockEditorHost`, `FrontCurationBoard`, `NewsletterSignup`,
`SectionFront`, `SubscriberList`), and 3 logistic components (`PickTaskCard`, `StockLevelBar`,
`StorageLocationPath`) that no screen and no test names. They have no verification of any kind: not
a test, not a scaffold type-check, and (since dev-kitchen broke) not a render either. Among the
coreui ones: every `Menu*` component, `Popover`, `Tooltip`, `Drawer`, `BlockEditor`,
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
fixture was the stale side. The harness found its own rot, not the library's. (`ArticleCard` has
since regained an optional `mediaAssets` prop for card pictures, so that half of the old fixture
type-checks again by coincidence; `status` is still required.)

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
checking what `scaffold:check` checks. Three consequences follow, and all three should be written
into whatever README the harness ships with:

- The harness can render a component that a published consumer could not import, because aliases
  bypass the `exports` map. Only `scaffold:check` catches that class of bug.
- A `Snippet`-prop type error seen in the harness may be a duplicate-Svelte artifact rather than a
  real defect. Svelte is pinned to one version workspace-wide through `pnpm.overrides` in the root
  `package.json` (since 2026-10-07; before that, content resolved 5.56.4 while coreui and logistic
  resolved 5.55.9). Keep that pin, and keep the alias list exhaustive.
- **Aliasing to source broke SSR, and the old harness gave up on it.** Both showcase trees shipped
  a `+layout.ts` containing `export const ssr = false`, the coreui one with the reason attached:
  "bits-ui uses `.svelte.js` rune files that Vite's SSR module runner cannot execute without the
  Svelte compiler." That is the cost of source resolution — the aliased package is inside the Vite
  pipeline for the browser build but the SSR module runner reaches the rune files on its own terms.

That last one matters more than it looks, and the replacement must decide it deliberately. A
client-only harness never executes a loader, never server-renders a component, and therefore cannot
observe the entire class of bug this repo has been most bitten by: dictionary construction that
works in the browser and yields `[missing: …]` under SSR, a message bus that leaks across
concurrent requests, a `getContext` call that throws only on the server. dev-kitchen's own root
layout had the `$effect` form of exactly that bug, and its showcase routes were structurally
incapable of showing it.

So either the harness solves SSR with aliased sources, or it is honest that it covers browser
rendering only, and the SSR path stays the business of `scaffold:check`, `sql:check` and the package
tests. What it must not do is set `ssr = false` quietly and let the gap be rediscovered.

The first option now has a known starting point. `packages/coreui/vitest.config.ts` and
`packages/content/vitest.config.ts` server-render bits-ui components under Vite's SSR pipeline, and
pass. The configuration that makes it work is `resolve.conditions: ['svelte']`, the same under
`ssr.resolve.conditions`, and `ssr.noExternal` listing `bits-ui`, `runed` and `svelte-toolbelt`
(plus `@sveltebuilder/coreui` when another package consumes it). Note that `runed` and
`svelte-toolbelt` are needed as well as `bits-ui`. This is vitest rendering built output, not a
SvelteKit dev server rendering aliased source, so it is strong evidence that the old comment is
obsolete rather than proof. Start the attempt from that config instead of from the old one.

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

The scaffold's own variables have changed since then, and they matter even to a fixtures-only
harness. SuperPrototype now reads `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`PUBLIC_DEFAULT_LOCALE` and `PUBLIC_SITE_URL`. There is no anon key, no secret key and deliberately
no database URL. All four come through `$env/static/public`, which is resolved at build time, so
`svelte-check` and `vite build` fail on chrome copied from the template unless the variables are
defined. A harness that takes its chrome from the template tree needs committed placeholder values
for them, even if no `/dev/**` route ever reaches Supabase.

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
3. **content, 18 components.** The precondition this item used to wait on is met: since 2026-10-01
   the route code ships as five screen bundles and `@sveltebuilder/content/views` exports the
   view-model types fixtures should satisfy. Nine of the 18 are already rendered by a package test,
   including the three that screens use, and those tests supply typed fixtures to borrow. The other
   9 come first.
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
  the harness gets smaller if the tests exist, so the ordering matters. The tests have started
  arriving first: coreui and content now server-render components under vitest, and the `Select`
  trigger bug fixed on 2026-10-05 (a closed trigger showing the raw value instead of the label) is
  guarded by a render test rather than by a gallery page.
- **Does the generated-chrome shape fight `turbo`?** A gitignored, generated `apps/dev-kitchen/` has
  no stable `package.json` for the workspace to discover until after the first sync, which affects
  `pnpm install` and the task graph. Needs a concrete answer before committing to shape one.
- **Which template flavour does the harness scaffold from?** SuperPrototype is the only active one,
  so that is the default. But a harness pinned to SuperPrototype inherits a Supabase dependency for
  booting, which cuts against Requirement 3's "runs off fixtures." Possibly the harness overlays
  only the base template plus stub locals. Either way it inherits the `$env/static/public`
  variables described under Requirement 3.
- **Does `pnpm scaffold:check` already cover enough?** It type-checks real projects and would catch
  a broken screen. It will never render a component, never exercise a variant no screen uses, and
  never tell you a focus ring is invisible. That is the gap the harness fills; it is worth
  re-measuring the numbers in section 1 before paying for it again, because if the template tree
  grows to reference most of coreui, the gap narrows on its own. Re-measured 2026-10-07: the coreui
  gap has not moved (still 33), while content's narrowed through tests rather than screens.

---

## 6. Removal record

The 82 tracked files of `apps/dev-kitchen` were removed in commit 4988ae6, together with the
`--filter='!./apps/*'` exemption that `.github/workflows/test.yml`, `scaffold-check.yml` and
`sql-check.yml` each carried. Recover any file from it with
`git show 4988ae6^:apps/dev-kitchen/<path>`; the 33 coreui showcase routes in particular are a
reasonable starting point for the rebuild, once their imports are migrated to
`diglossia/svelte` and `createMessageBus`.
