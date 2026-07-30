# DataTable Remediation & Admin-Layer Extraction — Plan

> **Status:** Draft plan. Not implemented. No source files were modified to
> produce this document (a local pnpm-store staleness issue, described in
> §1.0, was patched to get a trustworthy typecheck signal — that patch touches
> only `node_modules` and is disposable, not part of this deliverable).

**Scope of this document:** audit `packages/coreui/src/lib/DataTable.svelte`
and its three `packages/content` consumers plus four `packages/logistic`
(template) consumers, following commit `3ff58e2` ("merge in logistic-tweaks,
yolo"), which merged `5685553`'s DataTable design over a stale rewrite from a
`logistic-tweaks` branch. The rewritten design (server-owned state, `cell`
snippet over the raw entity) is accepted. This plan addresses lost additive
features and a real layering question it exposed.

---

## 1. Audit findings

### 1.0 Tooling: `pnpm check` does not exist

There is no `check` script at the workspace root, and none in
`packages/coreui`, `packages/content`, or `packages/logistic`
(`package.json` in each declares only `build`/`dev`/`lint`/`test`). Running
`pnpm check` fails immediately:

```
$ pnpm check
undefined
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "check" not found
```

Only `packages/hermes`, `apps/dev-kitchen`, and
`tools/create/templates/base` define `check` (`svelte-kit sync && svelte-check
--tsconfig ./tsconfig.json`). I used the closest available proxies instead:

**`pnpm --filter dev-kitchen check`** — real output, 6 pre-existing errors, all
in `content-fixtures.ts` (a dictionary-payload type mismatch) and
`article-card/+page.svelte` (`mediaAssets` prop mismatch). Nothing references
`DataTable`, `ArticleList`, `AssignmentQueue`, `SubscriberList`, or any
`Table*` component — dev-kitchen does not showcase the DataTable consumers at
all (confirmed by directory search: only `dev/content/article-card` and
`dev/content/article-view` exist under `apps/dev-kitchen/src/routes/dev/content/`).

**`svelte-check` run directly against each library package's own
`tsconfig.json`** (not wired to any script, invoked directly against the
`svelte-check` binary in the pnpm store) — this surfaced a real problem: the
`.pnpm` store's cached copy of `@sveltebuilder/coreui` that `packages/content`
and `packages/logistic` resolve against was stale — built before `DataTable`,
`Drawer`, and `BlockEditor` existed in coreui's `index.ts` (its
`dist/index.d.ts` had zero occurrences of any of the three; `packages/coreui`'s
own live `dist/` has all three). This is a pnpm workspace hard-link snapshot
that goes stale whenever `svelte-package` regenerates coreui's `dist/` without
a following `pnpm install`. **It is unrelated to the merge under audit** — it
predates it and would affect any coreui export, not just `DataTable`.

I attempted `pnpm install` to refresh it; the workspace uses a local package
registry (`localhost:4873`) that isn't reachable in this environment, so the
install hung on unrelated tarballs and I aborted it. I then manually refreshed
the three stale `.pnpm` store copies of `@sveltebuilder/coreui`'s `dist/` and
`styles/` from the live `packages/coreui/dist`, and repaired two symlinks
(`packages/content/node_modules/@sveltebuilder/coreui`,
`packages/logistic/node_modules/@sveltebuilder/coreui`) the interrupted
install had left dangling. **This is a local-environment patch only** — it
touches nothing under version control and should be treated as disposable; a
real `pnpm install` (with registry access) is still recommended before any
phase of this plan lands, and is item 1 on the verification checklist (§8).

With that patch in place, real, clean-ish signal:

- **`packages/coreui`**: 3 pre-existing errors (`Button.svelte` `disabled`
  prop, `Tooltip.svelte` `openDelay`, `BlockEditor.svelte` `mediaAssetId`).
  None in `DataTable.svelte` or any `Table*.svelte`.
- **`packages/content`**: after the patch, the `DataTable`/`DataTableColumn`
  "no exported member" errors disappeared, confirming they were staleness
  artifacts, not real. Remaining real, pre-existing errors are all unrelated
  to DataTable: `FrontCurationBoard.svelte` (bad `Badge` variant),
  `ArticleBlockRenderer.svelte`/`ArticleView.svelte` (number-vs-bigint),
  `ArticleWorkflowPanel.svelte` (stale Tabs/Switch prop shapes),
  `AuthorProfileView.svelte`/`SectionFront.svelte` (`mediaAssets` prop),
  `NewsletterSignup.svelte` (`label` prop), `BlockEditorHost.svelte`
  (`EditorBlock` shape mismatch). None touch `ArticleList`, `AssignmentQueue`,
  or `SubscriberList`'s table usage. (A residual `@sveltejs/vite-plugin-svelte`
  module-resolution error also appeared, caused by the aborted `pnpm install`
  itself, not the source — noted for transparency, irrelevant to the audit.)
- **`packages/logistic`**: no DataTable-related errors in the package's own
  component library (none of its components import `DataTable` — see §1.5).
  One unrelated pre-existing error (`@sveltebuilder/hermes-schema/schema`
  module not found).

**Structural gap, not a false signal:** none of this reaches the actual
DataTable call sites in `tools/create/templates/modules/logistic/routes/` —
that directory has no `package.json`/`tsconfig.json` of its own (it's a raw
template overlay applied by the CLI installer at project-creation time), and
`packages/content/tsconfig.json` explicitly excludes
`src/lib/templates/**` (line 8: `"exclude": ["src/lib/templates/**"]`) because
those files import SvelteKit's generated `./$types`, which don't exist outside
a real app. **Every real DataTable call site in this repo — all 3 content
routes-that-exist-in-spirit and all 4 logistic routes — sits outside any
automated type-checking today.** This is pre-existing and not something this
plan is scoped to fix, but it means "the typecheck is clean" cannot be trusted
as evidence that the call sites themselves are correct. §1.6 below is a direct
consequence: I found a real, live bug in the one call site that does exist,
that no tool in this repo would have caught.

### 1.1 Regression 1 — Sorting: **confirmed**

Pre-merge (`5685553`), `ArticleList`/`AssignmentQueue`/`SubscriberList` all
declared `sortable: true` on some columns and passed data through a
per-row-shape `Column<Row>[]` with `render` snippets. Post-merge, no column
declares `sortable`, no component passes `onSortChange`, and
`TableHeader`'s sort-button/`aria-sort` machinery
(`packages/coreui/src/lib/TableHeader.svelte:59-69`) is fully present and
keyboard-accessible but unreachable from any current caller. Confirmed as
described.

### 1.2 Regression 2 — Loading state: **confirmed**

Pre-merge `DataTable` accepted `loading` and rendered `perPage` `Skeleton`
rows (`5685553` diff, lines with `{#each { length: perPage } ...}`). The
current `DataTable` (`packages/coreui/src/lib/DataTable.svelte`) has no
`loading` prop, and none of the three content components accept one either.
Confirmed.

### 1.3 Regression 3 — `aria-live` region: **confirmed**

Pre-merge wrapper: `<div class="data-table-wrap" role="region"
aria-label="Data table" aria-live="polite">`. Current `DataTable` wrapper
(`packages/coreui/src/lib/DataTable.svelte:75`) is a bare `<div class={classes}>`
with no ARIA attributes at all. Confirmed gone; agree with the brief's
"decided" rationale not to restore it as-was (a table-wide polite region
re-announces the entire table's text content on every row change — this is a
well-documented anti-pattern, not a nitpick).

### 1.4 Regression 4 — Horizontal scroll container: **refuted**

`overflow-x: auto` is present — but it never lived in `DataTable`'s own
markup in either version; it's on `.table-wrap`
(`packages/coreui/styles/components.css:1664-1669`), the wrapper div rendered
unconditionally by `Table.svelte` itself
(`packages/coreui/src/lib/Table.svelte:25`). Since `DataTable` always renders
through `<Table>`, every `DataTable` instance — and every bare `<Table>`
instance, including the three plain tables in the logistic dashboard
(`tools/create/.../admin/logistic/+page.svelte:82-111`, receipts/pick-tasks/
returns) — already gets a scrollable wrapper. **Wide tables do not currently
overflow on narrow viewports.** This is not a regression.

What *is* true, in both the old and new versions, and predates this merge
entirely: that wrapper has never had `tabindex="0"` or an accessible name, so
it fails to be a keyboard-operable scroll region per WCAG 1.4.10 / the ARIA
APG scrolling-region pattern (see §7). This is a genuine, pre-existing gap —
correctly caught by the brief's instinct, wrongly attributed to the merge. I
address it in Phase 1 (§5) because it belongs to `Table.svelte`, which
benefits every consumer, not just DataTable.

### 1.5 Layering premise: confirmed, with corrections

Every real DataTable consumer is indeed an admin/warehouse screen — 3 in
`packages/content/src/lib/templates/routes/admin/content/article/` (only
`ArticleList` has a route; see §1.7) and 4 in
`tools/create/templates/modules/logistic/routes/(admin)/admin/logistic/`
(dashboard, `shipment`, `cycle-count`, `stock`). Two corrections to the
brief's framing:

- **`packages/logistic`'s own component library never imports `DataTable`.**
  Its components (`SupplierCard`, `ShipmentStatusBadge`, etc.) are cards and
  badges, not tables. The four DataTable call sites are all in the CLI
  template-overlay directory, not the package.
- **Logistic's admin routes don't live under `packages/logistic`** the way
  content's do (`src/lib/templates/routes/`) — they live under
  `tools/create/templates/modules/logistic/routes/`. This is a pre-existing
  inconsistency between how the two modules structure their route templates;
  out of scope here, but it's why a naive `grep -r DataTable packages/logistic`
  finds nothing and could mislead someone auditing this later.

### 1.6 A live, pre-existing bug directly upstream of the one real content route

`packages/content/src/lib/templates/routes/admin/content/article/+page.server.ts`
calls:

```ts
const result = await locals.db.withUser(async (tx) => {
  return getAdminArticles(tx, { locale: locale.code, defaultLocale: defaultLocale.code, page, perPage });
});
```

`getAdminArticles`'s actual signature
(`packages/content/src/lib/server/queries.ts:1109`) is
`(supabase: SupabaseClient, locale: string, options?: {...})` — three
positional parameters, the second a locale **string**. The route passes two
arguments, the second an **object**. This is a compile error (never caught —
see §1.0, `templates/**` is excluded from typechecking) and, more seriously, a
runtime one: `getAdminArticles`'s body calls Supabase-client methods
(`supabase.from('article').select('*', {count:'exact'}).range(from,to)`,
confirmed at `queries.ts:1125-1130`) against `tx`, which is a **Drizzle
transaction object** from `withUser`, not a `SupabaseClient`. `tx.from(
'article' )` is not a Drizzle call shape. I did not execute this route, but
the shapes are incompatible enough that I'd expect a throw, not silently wrong
data.

Cross-checking the sibling public route confirms this is systemic, not a
typo: `(content)/article/[slug]/+page.server.ts` correctly calls
`getPublishedArticleBySlug(locals.supabase, ...)` — the raw Supabase client,
matching `queries.ts`'s pattern everywhere else in the file. **The content
module's query layer was never migrated to the Drizzle/`withUser` pattern**
that `CLAUDE.md`'s Auth Architecture section mandates for route code; only the
admin article-list route's glue code was written as if it had been.

This is **out of scope for this plan** — it's a content-module/query-layer
bug, not a DataTable defect, and fixing query infrastructure isn't what was
asked. But it directly affects sequencing: any phase that wires sorting into
`ArticleList`'s live route (§5, Phase 5) has no working baseline to verify
against until this is fixed separately. I've called this out as a blocking
prerequisite in that phase rather than silently working around it or folding
a query-layer migration into a DataTable plan.

### 1.7 `AssignmentQueue` and `SubscriberList` have zero consumers

Neither component is referenced by any route, anywhere in the repo — not
under `packages/content/src/lib/templates/routes/`, not in
`apps/dev-kitchen` (which showcases `ArticleCard`/`ArticleView` only, not
these two). `AssignmentQueue`'s `assigneeName` field
(`packages/content/src/lib/components/AssignmentQueue.svelte:10`) is not
populated by any function in `queries.ts` — `getArticleAssignments`
(`queries.ts:1020`) returns bare `ArticleAssignment[]`, with no
`assigneeName`. There is no `getAdminAssignments`-equivalent at all.

This matters for scope: the sortability and pagination decisions for these
two components (§6) are necessarily prospective — recommendations for
whoever eventually builds the backing routes, not fixes to something
currently broken in production. I've kept them in the plan because the brief
asked for a classification, but treat them as lower priority than
`ArticleList` and the four live logistic routes.

### 1.8 Badge "regression": refuted — it was never wired

`AssignmentQueue.svelte` pre-merge imported `{ DataTable, Badge }` from
coreui, but nothing in the pre-merge render logic ever called `<Badge>` — the
`status` column had no `render` snippet and fell through to the generic
`row[col.key] ?? ''` text fallback. I checked the full git history of the
file (`git log -p --follow`): the `Badge` import appears exactly once, at the
file's creation, and is never referenced in a template anywhere in its
history. **This is dead code the merge correctly dropped, not a working
feature it broke.** I've reframed this in the plan as new work — adding a
`StatusBadge` treatment to `AssignmentQueue`'s status cell for the first time
(§5, Phase 6) — not a restoration.

### 1.9 `align: 'right'` and `stickyHeader`: confirmed handled

Both fully wired: `.table .align-right { text-align: right; }`
(`components.css:1791-1793`) and
`.table.sticky-header thead th { position: sticky; top: 0; z-index:
var(--z-sticky); }` (`components.css:1690-1694`, with `--z-sticky: 200`
defined in `_internal.css:131`). `DataTable` forwards both correctly
(`align` → `class="align-right"` on header and cell; `stickyHeader` → `<Table
{stickyHeader}>`). Logistic's dashboard and stock page both use
`align: 'right'` on quantity columns today and render correctly. No fix
needed here; the brief's suspicion doesn't hold.

### 1.10 Shadow-row remnants: confirmed fully gone

No `_article`/`_assignment` escape-hatch fields, no `Column<Row>` generic
row-shadowing type, anywhere in `packages/content/src/lib/`. Grepped the
whole package; clean.

### 1.11 New finding: no DataTable instance currently has an accessible name

Zero of the 7 real call sites (3 content-shaped, 4 logistic) pass a `caption`
to `DataTable`. Combined with the bare (no `role`, no `aria-label`) wrapper
div (§1.3), **every table in the repo today has no accessible name at all** —
not even the imperfect pre-merge `aria-label="Data table"`. This is worse
than what the brief described and is a live WCAG failure right now,
independent of the `role="region"` wrapper question. This raises the
stakes on making `caption` effectively required (§7).

### 1.12 New finding: pagination is offset-based everywhere, not keyset

Contradicts the brief's stated premise — see §2, first item. Documented in
full there since it's a challenge to the brief, not just an observation.

---

## 2. Challenges to this brief

**1. The keyset/cursor pagination premise is factually wrong for this
codebase.** I searched both query layers:

- `packages/content/src/lib/server/queries.ts` — `getAdminArticles`
  (line 1130), `getSubscribers` (line 936), and a third paginated query
  (line 604) all call Supabase-js's `.range(from, to)`, where `from = (page -
  1) * perPage`. That's `OFFSET`/`LIMIT` under the hood — PostgREST's `Range`
  header compiles directly to it.
- `packages/logistic/src/lib/server/queries.ts` — five call sites
  (lines 493, 679, 860, 978, 1118) use Drizzle's `.limit(perPage).offset((page
  - 1) * perPage)`. Same thing, different client.

**There is no keyset/cursor pagination anywhere in this repository.**
`coreui`'s `Pagination.svelte` wraps Bits UI's `Pagination.Root`, which
renders numbered page buttons and calls `onPageChange(page: number)` — a
page-number API that is structurally page-based, not cursor-based (you can't
jump to "page 7" with a cursor token; cursors only support next/previous).
This isn't a minor inaccuracy — it inverts the risk the brief asked me to
treat with suspicion. There's no cursor strategy to break by adding a sort
key. The actual risk with offset pagination is different and, I found, already
present: `getAdminArticles`'s query
(`queries.ts:1125-1130`) orders by `created_at` alone, with no tiebreaker
column. Postgres does not guarantee a stable row order for ties without a
fully-determining `ORDER BY`, so two articles with the same `created_at`
(easily possible — `defaultNow()`, no sub-second uniqueness guarantee) can
already appear duplicated or skipped across a page boundary today, with zero
relationship to sorting. I've folded "every sortable `ORDER BY` gets a
deterministic `id` tiebreaker" into §6 as a blanket rule, and flagged the
pre-existing gap as worth a follow-up regardless of this plan.

**2. "The logistic admin/warehouse routes that consume DataTable" undersells
where they live and overstates `packages/logistic`'s own involvement.** See
§1.5. I'd rewrite this constraint as: touch
`tools/create/templates/modules/logistic/routes/(admin)/admin/logistic/{+page,shipment/+page,cycle-count/+page,stock/+page}.svelte`
only for import-path updates forced by the package move (§4), never for
sorting/loading/behavior changes — none of those are asked for or justified
by anything in this brief.

**3. Sortability tiering: confirmed, with one correction.** `assignee` — the
brief flagged uncertainty here and asked me to check. Per `CLAUDE.md`'s Auth
Architecture section, individual names are **not** LocalText-resolved
copy — they live on `auth.user.name` (Auth.js/Supabase auth identity table,
explicitly *not* subject to the "no copy columns" rule, which governs
`public.*` domain entities only). `assigneeName` would be sourced via
`article_assignment.user_account_id → user_account.auth_user_id →
auth.user.name`, a plain join, not a `local_text`/`local_text_link` lookup.
**Reclassifying `assignee` as column-backed and sortable**, not copy-backed —
the opposite of what "resolved copy value" would suggest. Caveat: since no
query populates `assigneeName` today (§1.7), this is a recommendation for
whoever builds it, not a verified-working path. Full table in §6.

**4. Badge and horizontal-scroll are not regressions** — see §1.4 and §1.8.
I'd drop "regression" framing for both in any follow-up communication; they're
"new work" and "a pre-existing, unrelated a11y gap" respectively.

**5. `align`/`stickyHeader` don't need fixing** — see §1.9. No action items
here beyond what §5 already covers for other reasons.

**6. The admin-layer split is sound, and the existing `MODULE_DEPS`
mechanism in the CLI installer already models exactly this kind of package.**
`tools/create/src/index.ts:17-19` declares:

```ts
const MODULE_DEPS: Record<string, string[]> = {
  content:  ['@sveltebuilder/content', '@sveltebuilder/coreui'],
  logistic: ['@sveltebuilder/logistic', '@sveltebuilder/coreui'],
};
```

and the module `multiselect` prompt (`index.ts:117-127`) only ever offers
`content`/`logistic` as choices — `coreui` is never itself selectable; it's
pulled in automatically as a transitive dependency of any domain module. This
is the exact shape a new `@sveltebuilder/admin` package should take (§3) —
this isn't a new pattern I'm inventing, it's the one already in place for
coreui.

**7. One thing the brief didn't ask about, that I think belongs in the same
conversation:** `packages/coreui/src/lib/index.ts` groups `LocaleEdit`,
`LocalTextLinkEdit`, and `LocalTextEdit` under a comment header "LocalText
admin components" (`index.ts:115-120`). These are exactly the same shape of
problem as `DataTable` — admin-only, opinionated, never touched by a public
surface — sitting in coreui today for the same reason DataTable did. The
brief explicitly told me not to expand into LocalText admin UI, so I'm not
proposing moving them now, but the new `@sveltebuilder/admin` package's ADR
(§3) should say explicitly that it's the eventual home for this class of
component, so nobody re-litigates the boundary question from scratch next
time. Flagging, not building.

---

## 3. Layering recommendation

### Package name and shape

**Recommendation: a new package, `@sveltebuilder/admin`**, structured exactly
like `coreui` (svelte-package build, its own `styles/components.css`,
published, versioned) and wired into `MODULE_DEPS` for `content` and
`logistic` (and `commerce` once it exists) rather than exposed as its own
entry in the CLI's module `multiselect` prompt. Every domain module with an
admin surface needs it; no one picks it independently the way they pick
"Content" or "Logistic" — same relationship coreui already has to the domain
modules.

Rejected alternatives:

- **A `coreui/admin` subpath export.** `coreui`'s `package.json` `exports`
  field today has exactly one JS entry point (`"."`) plus CSS file paths — no
  subpath precedent exists to extend. More importantly, it re-mixes exactly
  the two things this extraction is trying to separate: components with *no*
  opinion (Camp 1, reusable anywhere) and components with a specific,
  server-driven, URL-param-aware opinion. Folder-level separation inside one
  package doesn't stop that opinion from leaking into coreui's dependency
  graph and versioning story.
- **A narrower, feature-specific package name** (e.g.
  `@sveltebuilder/admin-table`). Rejected because of finding §2.7 — the
  LocalText admin components are already waiting for the same kind of home.
  A table-specific name would need renaming the moment a second component
  joins it. `admin` describes the boundary (audience/opinion), not the
  contents, so it doesn't need to change as the package grows.

Cost acknowledged: a new package means new `package.json`/`tsconfig.json`/
build config, a Changesets entry once publishing is wired up (`CLAUDE.md`'s
Known Open Issues notes Changesets isn't configured yet — this package
inherits that same unpublishable-for-now state as every other package), and
one new line in `MODULE_DEPS`. No new CLI prompt.

### What moves and what stays

| Item | Home | Reasoning |
| --- | --- | --- |
| `DataTable.svelte`, `DataTableColumn` type | **moves** → `@sveltebuilder/admin` | Server-controlled state, URL-param sort/page orchestration — an admin opinion, not a primitive. |
| `Table`, `TableHead`, `TableBody`, `TableFoot`, `TableRow`, `TableCell` | **stays** in coreui | Genuinely unopinionated; already reused directly (not through DataTable) by the logistic dashboard's receipts/pick-tasks/returns lists (`tools/create/.../admin/logistic/+page.svelte:82-181`). Proven primitive, not hypothetical. |
| `TableHeader` (incl. `onSort`/`sorted`/`aria-sort`) | **stays** in coreui | Confirming the brief's position: a keyboard-accessible sort *trigger* with correct `aria-sort` is a primitive any table might want. What's admin-specific is *driving* `onSort` from a URL param and a validated column allow-list — that orchestration lives in `@sveltebuilder/admin`'s `DataTable`, which will keep calling `TableHeader`'s existing `onSort`/`sorted` props exactly as it does today. No change needed to `TableHeader` itself. |
| `Pagination.svelte` | **stays** in coreui | Thin Bits UI wrapper; has no server/URL opinion of its own — `DataTable` (wherever it lives) decides what `onPageChange` does. |
| `Skeleton.svelte`, `Badge.svelte`, `StatusBadge.svelte` | **stays** in coreui | Generic, already used outside any table context. |
| `.table*`, `.table-header*`, `.pagination*` CSS rules | **stays** in `coreui/styles/components.css` | Styles the primitives that stay. |
| `.data-table*` CSS rules (`components.css:1796-1815`) | **moves** → `@sveltebuilder/admin/styles/components.css` (new file, same pattern as coreui's) | Styles the thing that moves. Scaffold `app.css` needs one new `@import` into the `components` layer, same mechanism as the existing coreui import. |
| New: table-results status region (§5 Phase 3) | **new, in coreui** | Takes plain formatted-number/string props (`from`, `to`, `total`, an already-localized `sortDescription?` string) — Camp 1, no server/URL awareness required to render it. Useful to any paginated list, not just DataTable's. |
| `LocaleEdit`, `LocalTextLinkEdit`, `LocalTextEdit` | **stays in coreui for now** | Same shape of problem as DataTable (§2.7), but explicitly out of scope for this plan. Flagged in the ADR as `@sveltebuilder/admin`'s next likely intake, not touched here. |

### What the coreui table is called

**Recommendation: nothing new is built in coreui.** The brief frames this as
"DataTable is arguably the better name for the simple one" — but there is no
current consumer-facing use case asking for an all-in-one simple table. The
brief's own audit trigger says it plainly: "Public newspaper surfaces —
article pages, section fronts, live coverage — do not use it." Building a
new `SimpleTable`/`DataGrid`/whatever now would be exactly the "flexibility
for its own sake" `CLAUDE.md`'s Development Philosophy rejects, and would
violate "every prop defended against a real domain need." coreui already has
what a consumer-facing tabular need would be built from —
`Table`/`TableHead`/`TableBody`/`TableRow`/`TableCell`/`TableHeader` — used
directly, the way the logistic dashboard already does for its three
non-paginated lists. If and when a real consumer-facing list shows up
(a comments table, a related-articles grid), name and build it against that
need, not speculatively here.

This also sidesteps the "one concept, one name" collision the brief was
worried about: with no second component, `DataTable` unambiguously means
"the admin one," permanently, in `@sveltebuilder/admin`.

### Sequencing

**Recommendation: fix what's package-agnostic first, move second, build
sort-orchestration third — not a strict "fix everything, then move," and not
"move everything, then fix."**

Reasoning: the accessibility fixes in Phase 1 (`Table.svelte`'s scroll
region), the results-status component in Phase 3, and the loading-state
pattern in Phase 2 are all coreui-primitive-level or route-level work that is
identical regardless of which package `DataTable.svelte` ends up in — there's
no rework risk in landing them before the move. Sort-orchestration (URL-param
reading, allow-list validation, wiring `onSortChange`) is different: the brief
itself assigns it to the admin layer, so building it against `DataTable` while
it's still sitting in coreui, then re-landing it after the move, is exactly
the double-review-effort the brief warned against. That work waits for the
package to exist. The move itself (Phase 4) is mechanical — file relocation,
import updates, CSS relocation — and should be its own small, low-risk,
easily-reviewed PR sandwiched between the two.

### Draft ADR

*(Content only — not published, per instructions.)*

```markdown
# ADR: Extract admin-only table (and future admin surfaces) into @sveltebuilder/admin

## Status
Proposed

## Context
`packages/coreui`'s `DataTable` component is server-state-controlled: the
caller owns sort state, page state, and passes both back through URL params
in every current usage. Every current consumer is an admin or warehouse
back-office screen; no public-facing surface uses it, and none is expected
to, since `DataTable`'s contract (external pagination/sort ownership,
`onPageChange`/`onSortChange` callbacks) is specifically shaped for
authenticated, operator-facing CRUD lists — not for the public surfaces
`@sveltebuilder/content` and future consumer modules serve.

coreui's stated purpose is universal, Camp-1, opinion-free UI. `DataTable`
does not meet that bar today, and forcing an opinion-free simple table into
the same file/prop surface to serve both audiences was rejected as
unnecessary speculative flexibility.

## Decision
1. Create `@sveltebuilder/admin`, structured like `@sveltebuilder/coreui`
   (svelte-package build, own `styles/components.css`, own CSS layer import
   in the scaffold's `app.css`).
2. Move `DataTable.svelte` and the `DataTableColumn` type there unchanged in
   contract; move the `.data-table*` CSS rules with it.
3. `Table`/`TableHead`/`TableBody`/`TableFoot`/`TableRow`/`TableCell`/
   `TableHeader`/`Pagination`/`Skeleton`/`Badge`/`StatusBadge` all stay in
   coreui — they carry no server/URL opinion and are already reused directly
   outside DataTable.
4. `@sveltebuilder/admin` is wired into `MODULE_DEPS` for `content` and
   `logistic` in `tools/create/src/index.ts`, not exposed as its own CLI
   module-selection entry — matching how `coreui` itself is already an
   automatic transitive dependency, never a user-facing choice.
5. No new "simple" table component is built in coreui. If a public-facing
   tabular need arises later, it gets named and built against that need,
   using the `Table`/`TableHead`/etc. primitives that already exist.

## Consequences
- 7 existing call sites (`ArticleList`, `AssignmentQueue`, `SubscriberList`,
  and 4 logistic admin routes) update one import line each, from
  `@sveltebuilder/coreui` to `@sveltebuilder/admin`.
- A new publishable package enters the monorepo: new `package.json`,
  `tsconfig.json`, build wiring, and (once Changesets is configured — it
  isn't yet, repo-wide) a versioning/publishing story.
- `@sveltebuilder/admin` is the intended eventual home for coreui's existing
  "LocalText admin components" (`LocaleEdit`, `LocalTextLinkEdit`,
  `LocalTextEdit`) — same shape of problem, explicitly deferred, not part of
  this change.
- coreui's public surface shrinks by one component; its "universal, no
  policy" claim becomes strictly true instead of true-with-one-exception.
```

*(A corresponding wiki "Naming Conventions" entry would document
`@sveltebuilder/admin` as the fourth package tier — infra packages a domain
module depends on automatically, alongside `hermes` and `coreui` — but I
don't have write access to the wiki and haven't drafted that page here since
it's a thin restatement of the ADR's Decision section.)*

---

## 4. Open questions

These need a call from you before Phase 4/5 can be scoped precisely:

1. **Does building `getAdminAssignments` (backing `AssignmentQueue`) belong
   in this effort at all?** The component and its sortability tier are
   currently hypothetical (§1.7). I'd default to "no, out of scope" unless
   there's a near-term product need for the assignment queue screen.
2. **Is the content-module Supabase-vs-Drizzle mismatch (§1.6) already
   tracked somewhere?** If not, it needs its own bug/plan — it blocks
   verifying Phase 5's sort work against `ArticleList`'s live route with any
   confidence, since that route doesn't currently function.
3. **Status-region announcement mechanism** (§5 Phase 3, §7): I'm
   recommending a local `role="status"` region colocated with the table over
   routing through the existing `messageBus`/`MessageAriaLive` polite channel
   (`packages/coreui/src/lib/MessageAriaLive.svelte:4`, whose own comment
   states these are "the only two live regions in the app"). My reasoning:
   `messageBus` has a documented SSR bug (module-level `$state` shared across
   requests — `CLAUDE.md` Known Open Issues) that a table-result announcement
   would inherit for free, and semantically a persistent "N of M results"
   status isn't a toast/banner. But this does add a third live-region
   mechanism to the app, in tension with that comment's intent. I'd like
   explicit sign-off before Phase 3, not just my own read of the tension.
4. **`subscriber.locale` and `subscriber.created_at` indexes** (§6): worth
   adding proactively in Phase 5, or defer until subscriber-list scale
   actually warrants it? Subscriber tables are typically much larger than
   article tables long-term, but I have no volume numbers to judge against.
5. **Loading-state visual treatment** (§5 Phase 2): I'm proposing a
   route-level `{#if navigating}` overlay using a new coreui utility class,
   not a full skeleton-row replacement (since rows are the caller's own
   markup via the `cell` snippet, coreui can't generate placeholder rows for
   an unknown row shape the way the old per-column `render` design could). Is
   an overlay/dimming treatment acceptable, or is skeleton-row parity a hard
   requirement worth the larger design (e.g. an admin-layer `skeletonRows`
   count prop that renders empty `<TableCell><Skeleton/></TableCell>` rows
   irrespective of the real row shape)?

---

## 5. Phased plan

Ordered so coreui/admin-layer changes land before call-site changes that
depend on them.

### Phase 1 — coreui: keyboard-reachable scroll region (accessibility, no API change)

**Files:** `packages/coreui/src/lib/Table.svelte`,
`packages/coreui/styles/components.css`.

**Change:** give `.table-wrap` `tabindex="0"`, `role="region"`, and
`aria-labelledby` pointing at the `<caption>` (generate an id via Svelte 5's
`$props.id()` when `caption` is set); add a visible `:focus-visible` ring on
`.table-wrap` in `components.css`. Applies unconditionally — harmless when a
table doesn't overflow, necessary when it does (§7, WCAG 1.4.10 / 2.1.1).

**Why:** benefits every `Table` consumer today, not just `DataTable` — lands
cleanly regardless of the Phase 4 package move. Addresses the real (if
mis-attributed) part of "Regression 4" (§1.4).

**Could break:** nothing functionally; a new tab stop appears on every table.
Worth a note in release notes since it's a keyboard-navigation-visible change.

### Phase 2 — Loading-state pattern via `navigating` (documentation + one applied example)

**Files:** new short section in a coreui or docs README (pattern
documentation), `components.css` (new `.table-loading` overlay utility class),
`packages/content/src/lib/templates/routes/admin/content/article/+page.svelte`
(applies the pattern once, as a worked example).

**Change:** document (and apply once) `{#if $navigating}` driving a CSS
overlay/dim treatment on the table region during page and sort transitions,
using SvelteKit's `navigating` store — not a `loading` prop on `DataTable`.
Open question 5 (§4) affects the exact shape here.

**Why:** the brief's own reasoning — a table fed by a load function has no
business owning a loading flag — plus SvelteKit's `navigating` already covers
both page-change and (once wired) sort-change navigation, since both are URL
changes.

**Could break:** nothing; purely additive CSS + one route using it.

### Phase 3 — coreui: table-results status region (new component)

**Files:** new `packages/coreui/src/lib/TableStatus.svelte` (name
provisional), `packages/coreui/src/lib/index.ts` (export),
`packages/coreui/styles/components.css` (visually-hidden-by-default or
visible treatment, per design call).

**Change:** new Camp 1 component taking `{ from: number, to: number, total:
number, sortDescription?: string }` — all pre-formatted, pre-localized
values supplied by the caller — rendering `<p role="status">`. No hermes
import; no locale formatting inside the component (`Intl.NumberFormat`/plural
rules stay the caller's problem, consistent with every other Camp 1 number
formatting in this codebase — e.g. `ArticleList.svelte`'s own
`formatDate`). Open question 3 (§4) needs resolving before this lands.

**Why:** replaces the table-wide `aria-live="polite"` region (§1.3) with a
scoped one announcing only the result, not the whole table — per the brief's
decision, and per WCAG 4.1.3 (§7).

**Could break:** nothing; new opt-in component, not wired into `DataTable`
until Phase 5.

### Phase 4 — Extract `@sveltebuilder/admin`, move `DataTable`

**Files:**
- New: `packages/admin/package.json`, `tsconfig.json`, `svelte.config.js`
  (mirroring `packages/coreui`), `src/lib/DataTable.svelte` (moved, contract
  unchanged), `src/lib/index.ts`, `styles/components.css` (moved
  `.data-table*` rules).
- `packages/coreui/src/lib/index.ts` — remove `DataTable`/`DataTableColumn`
  export.
- `packages/coreui/styles/components.css` — remove `.data-table*` rules
  (§3 table).
- `tools/create/src/index.ts` — add `@sveltebuilder/admin` to `MODULE_DEPS`
  for `content` and `logistic`.
- `tools/create/templates/base/src/app.css` (or wherever the scaffold's
  layer-import chain lives) — add `@import
  '@sveltebuilder/admin/styles/components.css' layer(components);`.
- 3 content components (`ArticleList.svelte`, `AssignmentQueue.svelte`,
  `SubscriberList.svelte`) — change `import { DataTable, type DataTableColumn
  } from '@sveltebuilder/coreui'` to `'@sveltebuilder/admin'`. No other
  change.
- 4 logistic routes (`+page.svelte`, `shipment/+page.svelte`,
  `cycle-count/+page.svelte`, `stock/+page.svelte` under
  `tools/create/templates/modules/logistic/routes/(admin)/admin/logistic/`)
  — same one-line import change. `Badge`/`StatusBadge`/`Table`/etc. imports
  in these files stay pointed at `@sveltebuilder/coreui` (unchanged).
- `packages/content/package.json`, `packages/logistic/package.json` — add
  `@sveltebuilder/admin` dependency.
- Commit the ADR (§3) into `docs/adr/` (or wherever this repo's ADR
  convention lives — none exists yet; this would be the first, worth
  confirming the directory before landing).

**Why:** mechanical relocation; no behavior change. Isolating it as its own
PR keeps the sort-orchestration work (Phase 5) reviewable independent of
"did the move break anything."

**Could break:** any missed import site would be a hard compile error, not a
silent bug — low risk, high blast-radius-if-missed. The verification
checklist (§8) includes an exhaustive re-grep for `DataTable` imports across
the repo before merging this phase.

### Phase 5 — URL-param sort orchestration inside `@sveltebuilder/admin`

**Blocking prerequisite:** the content query-layer bug (§1.6) must be fixed
first, separately, or this phase's `ArticleList` work cannot be verified
end-to-end.

**Files:**
- `packages/admin/src/lib/DataTable.svelte` — no contract change needed
  (`sortKey`/`sortDirection`/`onSortChange` already exist on the pre-merge
  design and can be reintroduced against the *current* row-agnostic `cell`
  snippet API, since sort state lives outside row shape entirely).
- New: a small per-entity sortable-column allow-list helper (e.g.
  `packages/content/src/lib/server/sort.ts`, one per module) — maps a
  validated `sortKey` string to an actual SQL column reference; rejects/
  ignores anything not on the list. Never interpolates a raw search param
  into `ORDER BY`.
- `packages/content/src/lib/server/queries.ts` — `getAdminArticles` (and,
  once built, an assignment/subscriber equivalent) accepts a validated
  `{ sortKey, sortDirection }` and appends it to the query, with an `id`
  tiebreaker always appended after the requested sort column (closes the
  gap found in §1.12).
- 3 content components — reintroduce `sortable: true` on the column-backed
  columns from §6, wire `onPageChange`/`onSortChange` through to URL params
  (`?sort=publishedAt&dir=desc`), matching the pre-merge pattern for reading
  them back on load.
- Logistic routes — same pattern, only for columns actually marked sortable
  once someone decides logistic wants sorting (brief doesn't ask for this
  now; logistic currently has zero sortable columns in any version,
  pre- or post-merge, so there's no regression to fix here — only an
  extension, out of scope unless requested).

**Why:** this is the one piece of work the brief explicitly assigns to the
admin layer (URL-param-driven sort is an opinion, not a primitive) — building
it after Phase 4 means writing and reviewing it exactly once.

**Could break:** `ArticleList`'s route, if the §1.6 prerequisite isn't
actually fixed first — flagged loudly here and in §4 open question 2.

### Phase 6 — `AssignmentQueue` status-cell visual polish

**Files:** `packages/content/src/lib/components/AssignmentQueue.svelte`.

**Change:** wire `StatusBadge` (or `Badge`) into the `status` column's cell
snippet, following the same `statusVariant(status): Variant` mapping pattern
already established in
`tools/create/.../admin/logistic/cycle-count/+page.svelte:12-17` — for
consistency with the one place in the repo that already solves this problem
well.

**Why:** addressed as new work, not a revert (§1.8) — improves a component
that currently renders bare status text with no visual distinction.

**Could break:** nothing; `AssignmentQueue` has no live route (§1.7), so
there's no runtime surface to regress. Low priority; sequenced last
deliberately.

---

## 6. Per-column sort decision table

**Tier legend:** *Column* = plain SQL column, sortable in v1. *Copy* =
resolved through `local_text`/`local_text_link`, not sortable in v1 (no
locale-collated sort infrastructure exists; an in-memory sort of one page is
explicitly rejected as a correctness bug, not a shortcut).

Every "Column" row below gets a deterministic `id` tiebreaker appended to its
`ORDER BY` — closing the gap found in §1.12, independent of whether keyset
pagination is ever adopted.

### `ArticleList` (backs `article` + resolved copy; query: `getAdminArticles`, currently Supabase-js `.range()` — see §1.6/§2 for the pending query-layer question)

| Column | Tier | Sortable v1 | Executes | Index | Rationale |
| --- | --- | --- | --- | --- | --- |
| `headline` | Copy (`article` scope) | No | — | — | Resolved via `resolveEntityText`; no locale-collated sort exists. |
| `bylines` (Author) | Copy, multi-valued | No | — | — | Not sortable pre-merge either (array via `article_byline` junction) — not a regression, just confirming the classification the brief didn't ask about. |
| `section` | Copy, multi-valued | No | — | — | `SectionWithCopy.name` (copy) *and* a first-of-many projection over `article_section` — even a hypothetical column-backed version wouldn't be meaningfully single-column sortable. |
| `status` | Copy (`status.label`) | No | — | — | **Nuance worth flagging, not building:** `article_status.ordinal` is a plain, already-indexed column (`idx_article_status_ordinal`) that could sort by *workflow order* — a different, feasible sort distinct from sorting by the localized label. Not proposing it for v1 since the column key `status` currently means "the label"; noting the option exists if workflow-order sort is ever wanted. |
| `publishedAt` | Column (`article.published_at`) | **Yes** | SQL `ORDER BY published_at [asc\|desc], id [asc\|desc]` | **Needed** — no index exists on `published_at` today (only `idx_article_status`, `idx_article_canonical_slug`, `idx_article_embargo`). Add `idx_article_published_at`. | Plain timestamp column, no copy involved. |

### `AssignmentQueue` (backs `article_assignment`; **no backing query exists** — §1.7, all rows below are prospective)

| Column | Tier | Sortable v1 | Executes | Index | Rationale |
| --- | --- | --- | --- | --- | --- |
| `headline` (assignment.article.headline) | Copy | No | — | — | Same as `ArticleList.headline`. |
| `role` | Column (`article_assignment.role`, enum) | **Yes**, with care | SQL `ORDER BY` a `CASE`-mapped ordinal, not the raw enum, `, id` | Not required at expected scale (4 distinct values) | Raw enum alpha order (`author, copy, editor, photo`) doesn't match the display order (`Author, Editor, Photo, Copy`, per `ROLE_LABEL` in `AssignmentQueue.svelte:33-38`); a `CASE WHEN role = ... THEN n` ordinal is needed to sort by display intent. |
| `assignee` (assigneeName) | **Column** — corrected from an implied copy classification (§2, item 3) | **Yes**, once built | SQL `ORDER BY` on a joined `auth.user.name`, `, id` | New — no query exists yet to index against | Sourced from `auth.user.name` per `CLAUDE.md`'s Auth Architecture, not `local_text`. Entirely prospective — no `getAdminAssignments` exists (§1.7). |
| `status` (assignment.article.status.label) | Copy | No | — | — | Same as `ArticleList.status`. |
| `dueAt` | Column (`article_assignment.due_at`) | **Yes** | SQL `ORDER BY due_at [asc\|desc], id` | **Needed** — no index exists (`uq_article_assignment`, `idx_article_assignment_article`, `idx_article_assignment_user` exist; none cover `due_at`). Add `idx_article_assignment_due_at`. | Plain timestamp column. |

### `SubscriberList` (backs `subscriber`; query: `getSubscribers`, `queries.ts:936`, Supabase-js `.range()`; **no route consumes this component** — §1.7)

| Column | Tier | Sortable v1 | Executes | Index | Rationale |
| --- | --- | --- | --- | --- | --- |
| `emailAddress` | Column, PII/data (documented scope deviation, `schema/index.ts:241`) | **Yes** | SQL `ORDER BY email_address [asc\|desc], id` | Exists — `idx_subscriber_email` (and a unique constraint) | Not copy; never translated by design. |
| `subscriberLocale` (`locale`) | Column (`subscriber.locale`, plain text) | **Yes** | SQL `ORDER BY locale [asc\|desc], id` | Missing — worth adding only if scale warrants (§4, open question 4) | Plain text column, not a LocalText lookup. |
| `confirmedAt` | Column | **Yes** | SQL `ORDER BY confirmed_at [asc\|desc], id` | Exists — `idx_subscriber_confirmed` | Plain timestamp column. |
| `joinedAt` (`createdAt`) | Column | **Yes** | SQL `ORDER BY created_at [asc\|desc], id` | Missing — same open question as `locale` | Plain timestamp column. |

### Logistic (4 live routes; **zero sortable columns in any version, pre- or post-merge** — extension, not a regression; included only because the brief asked for the tier classification)

| Column (route) | Tier | Notes |
| --- | --- | --- |
| `sku` (dashboard, stock) | Column (`stock_level.sku`, plain text) | Indexed already (`idx_stock_level_sku`). |
| `location` (dashboard, stock) | Copy (`storageLocation.name` resolved via `localText('name', 'storage_location', id)`, confirmed at `cycle-count/+page.svelte:68`) | Not sortable, same reasoning as `section`/`headline` above. |
| `onHand` / `reserved` / `reorderPoint` (stock) | Column (plain `integer`) | Sortable in principle; no index needed at expected stock-table scale. |
| `available` (dashboard, stock) | **Computed**, not stored (`on_hand - reserved`) | Sortable only via a SQL expression (`ORDER BY (on_hand - reserved)`) or a generated column; no index without adding one. Flagging the distinction since it's not a plain column like its siblings. |

---

## 7. Accessibility decisions

| Decision | Citation |
| --- | --- |
| Do not restore table-wide `aria-live="polite"`; replace with a scoped result-status region instead. | WCAG 2.2 SC 4.1.3 (Status Messages, AA) — status messages must be programmatically determinable without receiving focus, but the SC does not require (and the ARIA APG explicitly warns against) wrapping large, frequently-changing regions like an entire table in a live region, since AT re-announces the full accessible-text delta on every mutation. |
| `.table-wrap` becomes a keyboard-reachable scroll region (`tabindex="0"`, `role="region"`, `aria-labelledby` → caption). | WCAG 2.2 SC 2.1.1 (Keyboard, A) and SC 1.4.10 (Reflow, AA, for content that requires 2D scrolling at narrow widths) — a scrollable region reachable only by pointer/trackpad locks out keyboard users from content beyond the visible width. The `role="region"` + accessible-name requirement (not a bare `tabindex`) follows the ARIA APG scrolling-region pattern and is the pattern documented by Adrian Roselli's writing on accessible/responsive tables. |
| `caption` becomes effectively required on `DataTable` (enforced by convention/lint, not a hard TS requirement given some tables are genuinely self-describing from an adjacent `<h1>`/`<h2>` — see below). | WCAG 2.2 SC 1.3.1 (Info and Relationships, A) and SC 4.1.2 (Name, Role, Value, A) — a `<table>` (and the `role="region"` wrapper from the row above) needs a programmatically-associated accessible name; today none of the 7 real call sites provide one (§1.11), which is a *worse* state than the pre-merge `aria-label="Data table"` this plan is nominally replacing. A `<caption>` is preferred over a generic `aria-label` because it's visible to sighted users too and serves screen-reader users navigating table-to-table (e.g., NVDA/JAWS "table list"), not just page-heading navigation — this is true even when an adjacent `<h1>`/`<h2>` already exists, contra an assumption that heading proximity makes a caption redundant. |
| `TableHeader`'s sort trigger keeps `aria-sort` on the `<th>` (not the inner `<button>`) and an accessible name via visible text plus icon marked `aria-hidden`. | ARIA APG "Sortable Table" pattern (`aria-sort` on the header cell, not the interactive control inside it) and WCAG 2.2 SC 4.1.2 — matches `TableHeader.svelte`'s current implementation (`aria-sort` on `<th>` at `TableHeader.svelte:59`, icon at `aria-hidden="true"` at line 41/47/52) exactly; no change needed here, only confirming it's correct as the brief asked. |
| `aria-sort` is emitted on the active header only; all others omit the attribute rather than setting `aria-sort="none"`. | ARIA spec — `aria-sort="none"` and omitting the attribute are treated equivalently by most AT, but omitting on non-active headers is the APG-recommended default and avoids implying every column is sortable when only some are (relevant once `role`/`assignee`/`publishedAt`/etc. become the only sortable columns in a 5-column table, §6). `TableHeader.svelte:33-35`'s `ariaSort` derivation already does this correctly (`undefined` when not sorted). |
| Status region role: `role="status"` on a small `<p>`/`<div>` sibling to the table, not a table-wide `aria-live` attribute. | Same WCAG 4.1.3 citation as row 1; `role="status"` carries an implicit `aria-live="polite"`/`aria-atomic="true"` per the ARIA spec, which is the correct assertiveness level for a non-urgent result-count update (contrast with `role="alert"`/`aria-live="assertive"`, wrong here — nothing about "12 of 340 results, sorted by date" is urgent). This is the open question in §4 item 3 — the role choice itself isn't in question, only whether it should be a *third* live-region mechanism alongside the app's existing two (§1's `MessageAriaLive.svelte`). |

---

## 8. Verification checklist

Not just "typechecks pass" — none of the automated checks in this repo
currently cover the real call sites (§1.0), so verification here leans more
on manual/exploratory passes than usual.

- [ ] Run a real `pnpm install` with registry access (this session's
      environment couldn't reach `localhost:4873`) to eliminate the
      pnpm-store-staleness class of false signal entirely, before trusting
      any subsequent typecheck run.
- [ ] `pnpm --filter dev-kitchen check`, `pnpm --filter coreui/content/logistic` via `svelte-check` directly (still no `check` script — either add one per package as a small drive-by, or keep invoking the binary directly) — confirm zero *new* errors beyond the pre-existing, unrelated ones catalogued in §1.0.
- [ ] `pnpm lint` (turbo → eslint per package) across all touched packages.
- [ ] Grep the whole repo for `from '@sveltebuilder/coreui'` importing
      `DataTable` or `DataTableColumn` after Phase 4 — must return zero
      matches outside `@sveltebuilder/admin`'s own source.
- [ ] Manually exercise `ArticleList`'s live route
      (`/admin/content/article`) end-to-end *after* the §1.6 prerequisite fix
      lands — this route has apparently never worked; first real verification
      it has ever received.
- [ ] Keyboard-only pass: tab to a table with a horizontally-scrolled column
      set on a narrow viewport; confirm the scroll region receives focus and
      arrow/shift+tab reach it; confirm every sortable header's button is
      reachable and actionable via Enter/Space; confirm focus order is
      table → sort buttons → pagination, with no traps.
- [ ] Screen-reader pass (NVDA or VoiceOver, at least one): confirm the
      status region announces on sort-change and page-change without
      re-reading table contents; confirm each sortable header announces
      current sort state (e.g. "Published, column header, sorted descending,
      button"); confirm the table's accessible name (via caption) is
      announced when navigating table-to-table.
- [ ] Visual regression check on the 7 real call sites (screenshot diff or
      manual) after Phase 1's focus-ring addition and Phase 4's CSS-layer
      move — confirm no unstyled-flash or missing rules from the
      `.data-table*` relocation.
- [ ] Confirm `align: 'right'` and `stickyHeader` still render correctly
      post-move (already working today — regression check only, §1.9).
- [ ] Confirm no sort param can reach `ORDER BY` unvalidated: attempt
      `?sort=1;DROP TABLE article--` (or any non-allow-listed value) against
      each sortable route in Phase 5 and confirm silent fallback to default
      sort, not an error or unsanitized query.

---

## 9. Explicitly out of scope

- Locale-collated sorting for any copy-backed column (`headline`, `section`,
  `status.label`, `assignee` if it were ever copy-backed, role display
  labels). No in-memory single-page sort as a workaround, per the brief.
- Fixing the content-module Supabase-vs-Drizzle query-layer mismatch (§1.6) —
  flagged as a blocking prerequisite for Phase 5, not undertaken here.
- Building `getAdminAssignments` or any other backing query for
  `AssignmentQueue`/`SubscriberList` — both remain library components with
  no live route unless separately prioritized (§4, open question 1).
- Moving `LocaleEdit`/`LocalTextLinkEdit`/`LocalTextEdit` into
  `@sveltebuilder/admin` — flagged in the ADR as the package's likely next
  intake, not touched (§2.7).
- Any LocalText admin UI, analytics, RTL support, or plural-form
  infrastructure — the count/plural strings in `SubscriberList` ("{n}
  subscribers") and the new status-region announcement both need plural
  handling this project has not solved anywhere (confirmed: no
  `Intl.PluralRules` or ICU plural syntax exists in `packages/hermes` or
  elsewhere). Both are left as single hardcoded English strings passed as
  Camp 1 props, same as today, with the gap flagged rather than a
  one-off mechanism invented here.
- A new simple/public-facing coreui table component (§3) — not built without
  a real consumer.
- Any sorting/pagination/loading-state work in `packages/logistic` beyond
  the one-line import-path update forced by Phase 4 — logistic has zero
  sortable columns in any version of `DataTable` it has ever used, so there
  is no regression there to fix, and the brief did not ask for the feature
  to be extended to it.
- Adding indexes on `subscriber.locale`/`subscriber.created_at` — deferred
  to a scale-driven decision (§4, open question 4), not assumed necessary
  now.
- Changesets/publishing setup for the new `@sveltebuilder/admin` package —
  inherits the same not-yet-configured state as every other package
  (`CLAUDE.md` Known Open Issues).
