# DEV-KITCHEN.md — the in-repo component harness: what it is for, why the first one died, how the second is built

`apps/dev-kitchen` renders every component the workspace packages export, from source, inside the
scaffold's own chrome, and audits the result for accessibility in CI. The first version was removed
on 2026-09-30 after it rotted past repair; it was rebuilt on 2026-10-07 to the requirements this
document set out. Sections 1 and 2 are why it exists and why the first one died. Section 3 is the
design as built, section 4 what its first runs found, section 5 what it still does not cover.

How to run it and how to add a page are in [`apps/dev-kitchen/README.md`](../apps/dev-kitchen/README.md).
Companion reading: `docs/MODULE-ROUTES.md` (where route code lives and why), `docs/DEFERRED.md`
(what is deliberately not being done yet), and the Template Verification section of `CLAUDE.md`.

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

The first app's mechanism was a hand-written alias map plus an SSR escape hatch in `vite.config.ts`
(the rebuild uses `kit.alias`, which feeds Vite and the generated tsconfig from one list):

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

This job turned out to be load-bearing in a way nobody planned. Measured on 2026-10-07, before the
rebuild:

| Surface                   | Public components | Referenced by any template screen | Rendered by a package test |
| ------------------------- | ----------------- | --------------------------------- | -------------------------- |
| `@sveltebuilder/coreui`   | 65                | 32                                | 2 (`Select`, `SelectItem`) |
| `@sveltebuilder/content`  | 18                | 3                                 | 9                          |
| `@sveltebuilder/logistic` | 9                 | 6                                 | 0                          |

That left 33 coreui, 9 content and 3 logistic components with no verification of any kind — among
them every `Menu*` component, `Popover`, `Tooltip`, `Drawer`, `BlockEditor` and `DateTimePicker`.
The rebuilt app renders all 92, and its catalog makes an unshowcased export a `pnpm check` failure.

Something cheaper than any harness recovered part of this first: until 2026-10-07 no package had a
`check` script, because `svelte-package` compiles without type-checking cross-component prop usage.
Every package now runs `svelte-check` in CI. Its first run found 22 real errors, among them a
`Tooltip` whose `delay` had never taken effect, a `BlockEditorHost` that never reported an edit, and
an `ArticleWorkflowPanel` built against a `Drawer`/`Tabs` API that does not exist. No screen or test
rendered any of them. (Three `DataTable` snippet errors once listed alongside them were not
defects: they came from running a `svelte-check` installed outside the workspace, which loads a
second copy of Svelte.)

### Job 3 — a rendered surface to audit

The WCAG 2.2 AA audit named in `CLAUDE.md`'s Known Open Issues needs a page that renders every
component in every state. So does visual review of dark mode, RTL, and focus-visible rings across
the set. Nothing else in the repo produces that surface. The first app never did this job, and it
was the strongest argument for rebuilding: Bits UI supplies accessible primitives, which is an
argument about primitives, not about what this repo wrapped them in. Section 4 bears that out.

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

## 3. The design as built

Each requirement the removal set, and how the rebuild meets it.

### Requirement 1 — no hand-maintained scaffold wiring

The chrome — `hooks.server.ts`, the root `+layout.svelte` and `+error.svelte`, `app.d.ts`,
`app.html`, `app.css`, `chrome.css` — is copied from `tools/create/templates/base/` by
`sync-chrome.mjs` before every `dev`, `build`, `check` and `lint`, and is gitignored. Nobody edits
it here, so it cannot drift: change the template and the harness follows.

The shape is **generated, committed thin**, the option this section originally preferred. The open
question it raised — whether a generated app fights pnpm and turbo, which need a stable
`package.json` — is answered by committing the app's own `package.json`, configs, showcase routes
and fixtures, and generating only the chrome. The workspace sees an ordinary package.

The chrome comes from the **base** template, not SuperPrototype, because base's hooks make no
database call. The one thing base's root layout expects and does not ship — its data load — is a
committed `+layout.server.ts` that builds the dictionary and locale list from
`@sveltebuilder/local-text-schema`'s canonical `LOCALES` and `BASE_SLUGS`, the same data
`sync:supabase` writes into every seed. Base also ships no locale endpoint, so a small
`/api/locale` keeps SuperPrototype's contract. Those two files are the only plumbing the harness
owns.

### Requirement 2 — source resolution, deliberately divergent from `scaffold:check`

Packages resolve to source through `kit.alias`, so a save re-renders with no `svelte-package` step,
and svelte-check sees the same files Vite does. The consequences the requirement asked to be
written down are in the app's README: aliases bypass `exports` and `files` (only `scaffold:check`
catches that class), and a duplicate Svelte would turn every `Snippet` prop into a false error.
The workspace pins one svelte through `pnpm.overrides`, at the template's own floor, and the app
dedupes `svelte`, `diglossia` and `bits-ui`.

**Server rendering is on.** The old app's `ssr = false` rested on a claim that bits-ui could not run
in Vite's SSR pipeline from source. It can: the scaffold's own `ssr.noExternal` list
(`@sveltebuilder/*`, `bits-ui`, `runed`, `svelte-toolbelt`) is enough, and every page server-renders
and hydrates. The first server render found a template bug no client-only harness could have:
every scaffolded page shipped `<html lang="%sveltekit.lang%">` (section 4).

### Requirement 3 — a gate, or it rots again

The app is in CI from its first commit, with no `apps/*` exemption: `check` and `lint` run in the
Test workflow like any package, and the Accessibility workflow builds it and runs the audit. Its
only environment variable is `PUBLIC_DEFAULT_LOCALE`, which the sync script writes, so CI needs no
secrets and no database.

Coverage is a gate too. `src/lib/catalog.ts` lists each page's components, and a `*_COVERAGE`
constant per package type-checks only when every component the package exports is on some page.
Export a component without a showcase and `pnpm check` fails naming it.

### Requirement 4 — fixtures are a typed contract

Fixtures are declared against each package's exported types (`satisfies Article`, and
`ComponentProps<typeof X>` where a row type is private), so a removed or newly required prop is a
type error in the fixture. Entity copy arrives through a dictionary passed as a prop, built per page
the way a loader's payload is; module UI copy mirrors the seeds.

---

## 4. What the first runs found

Every item below shipped, and nothing else in the repo could have seen it. The harness found them
on its first server render, its first axe run, or its first keyboard walk.

**Every scaffold.**

- Pages declared their language as the literal `%sveltekit.lang%`, which is not a placeholder
  SvelteKit fills. Both templates' hooks now fill it (WCAG 3.1.1, level A).

**coreui.**

- The built-in triggers of `Dialog`, `Menu`, `Popover` and `Tooltip` were `display: contents`, which
  takes a button out of the focus order, so none of those overlays opened from the keyboard (2.1.1,
  level A).
- A `Select` in a `Field` was never associated with the Field's label. It is now a select-only
  combobox with a full name, description and `aria-controls`.
- 862 color-contrast failures came from a handful of token derivations. `-text` and `-fg` tokens
  now hold AA for any base color, links and focus rings use them, and the scaffold's light
  `#45b1e8` brand produces readable text without a palette change. See
  `docs/coreui-theming.md`.
- `data-color-scheme="light"` did nothing on a dark system.
- `Button`'s text picked up the form `Label`'s color through a shared `.label` class.
- `ToastRegion` and `BlockEditor` used ARIA attributes their roles do not permit.
- bits-ui 2.18.1 rendered `Menu` content without the id its trigger's `aria-controls` named, so the
  peer floor is now 2.19.5. A `MenuLabel` outside a group throws and empties the whole menu; that is
  now documented on the component.

**content and logistic.**

- Twelve slugs `NewsletterSignup` and `ArticleWorkflowPanel` render were never seeded. The
  screen-bundle suite now checks every module-scoped slug a module's components ask for.
- `PickTaskCard`, like `SectionFront` and `AuthorProfileView` before it, did not forward its
  dictionary to a child, so scoped copy rendered `[missing:]`.
- Raw `--brand`, `--danger` and `--success` as text colors, and opacity dimming on readable
  content, failed contrast in both modules.

---

## 5. What it still does not cover

- **The human half of the WCAG 2.2 AA audit.** axe and the focus walk find contrast, names, roles,
  ARIA misuse, target size and invisible focus. Screen-reader flow, reading order, whether an
  announcement makes sense, and zoom to 400% are still unreviewed, so the Known Open Issue in
  `CLAUDE.md` stays open.
- **Right-to-left beyond what axe can see.** Every page renders under `dir="rtl"` and passes, but
  `components.css` still has 15 physical `left`/`right` declarations against 5 logical ones. Mirroring
  is a visual review.
- **Chromium only.** The audit runs one browser.
- **The `.label` collision elsewhere.** Seven more coreui components (`Checkbox`, `RadioItem`,
  `Switch`, `Tag`, `MetricCard`, `TimelineItem`, `BarcodeInput`) use an internal `class="label"` and
  so inherit the form `Label`'s rules. None fails today; `Button`'s did.
- **Overlays inside module components**, such as `ArticleWorkflowPanel`'s drawer, are rendered
  closed; only coreui's own overlays are audited open.
- **Loaders and SQL.** The harness renders fixtures; screens against a database remain
  `scaffold:check`'s and `sql:check`'s job. Neither gate subsumes the other.

---

## 6. Removal record

The 82 tracked files of the first `apps/dev-kitchen` were removed in commit 4988ae6, together with
the `--filter='!./apps/*'` exemption that `.github/workflows/test.yml`, `scaffold-check.yml` and
`sql-check.yml` each carried. Any file from it can be recovered with
`git show 4988ae6^:apps/dev-kitchen/<path>`. The rebuild did not reuse its routes; their variants
were a reference, but their chrome and fixtures were the parts that failed.
