# @sveltebuilder/logistic

## 1.0.1

### Patch Changes

- [#32](https://github.com/cailenfisher/SvelteBuilder/pull/32) [`c31704e`](https://github.com/cailenfisher/SvelteBuilder/commit/c31704e944d3e5c6a2138d1db66b8aab67c6b0c4) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Bump diglossia to ^0.2.0. The `diglossia` peer range on content and logistic moves from `^0.1.0` to `^0.2.0`. 0.2.0 only adds to the API (`subscribe()`/`getVersion()` on `DictionaryInstance`, reactive `merge()` on the instance passed to `setDictionary()`, and a `formatText` that no longer throws on malformed MF2), so no consumer code changes.

- Updated dependencies [[`c31704e`](https://github.com/cailenfisher/SvelteBuilder/commit/c31704e944d3e5c6a2138d1db66b8aab67c6b0c4)]:
  - @sveltebuilder/coreui@0.2.2

## 1.0.0

### Patch Changes

- Updated dependencies [[`ca21505`](https://github.com/cailenfisher/SvelteBuilder/commit/ca215055910fc83c8e509f80af791ca3e68cca5d)]:
  - @sveltebuilder/coreui@0.2.0
  - @sveltebuilder/local-text-schema@0.2.1

## 0.1.0

### Minor Changes

- [#13](https://github.com/cailenfisher/SvelteBuilder/pull/13) [`22f761e`](https://github.com/cailenfisher/SvelteBuilder/commit/22f761e50b2c6b626701ab687f91ed2c93c54e99) Thanks [@cailenfisher](https://github.com/cailenfisher)! - The Logistic route port is complete: all of its route code now ships as eight selectable screen
  bundles.

  **Bundles.** supplier, stock, receipt, shipment, return, cycle-count, warehouse, dashboard.
  `screens/_unported/` is gone. Every loader queries `event.locals.supabase` rather than the Drizzle
  handle SuperPrototype dropped, every screen is internationalised — the originals were hardcoded
  English down to their table headers — and each bundle's contract with its loader is stated as types
  the module exports from `@sveltebuilder/logistic/views`.

  The warehouse app is one bundle rather than four. Its shell nav and home screen link to picking,
  receiving and counting, so no subset of those is installable without dead links. The dashboard is the
  opposite shape: it links to everything, so it `requires` everything and selection expands through it.

  **Seven new RPCs**, all SECURITY INVOKER so RLS still checks each statement inside, for the
  operations that span statements and whose partial results are garbage: creating a supplier (whose
  name is an i18n link plus copy, not a column), creating a shipment, a return authorization or a cycle
  count with their lines, receiving a receipt line, grading a returned line, and recording or completing
  a pick. They share one rule — the RLS-governed update goes first and its row count is checked —
  because under RLS a forbidden UPDATE affects zero rows rather than raising, so ordering it first means
  a refusal aborts before any stock has moved.

  **A security fix.** All five of the module's existing SECURITY DEFINER stock functions were missing
  `set search_path`, which lets a definer function inherit the caller's search_path and be made to run a
  shadowed object with the owner's privileges. All are now schema-qualified with an empty search_path
  and explicit grants. A new `pnpm sql:check` asserts the property for every definer function.

  **Defects fixed in passing**, all of which existed because template code had never been typechecked
  or executed: a "Add supplier" button linking to a route that does not exist; props coreui never
  defined (`Tabs`/`TabsTrigger` with `href` and `aria-label`, `Select` with `required`, `StatusBadge`
  with `status`); a location picker rendering a raw database slug to users; return condition and
  disposition values hardcoded as English markup; a restock with no location silently dropping the
  goods; the shipment status filter omitting `packed`; and a receiving queue whose two lists were both
  capped by a single fifty-row fetch.

  **New gate.** `pnpm sql:check` applies a scaffolded project's migration and seed to Postgres in
  Docker, applies the seed twice to prove it is re-runnable, and asserts the database behaves as the
  routes assume — impersonating an admin, a non-admin and an anonymous visitor through `set role` plus
  a JWT subject, which is the only way RLS is exercised at all. `pnpm test` gains a suite checking the
  half of a screen bundle's contract types cannot express: that a manifest matches its files, that every
  slug a screen renders is seeded, and that each has both required locales.

- [#13](https://github.com/cailenfisher/SvelteBuilder/pull/13) [`d4ab34b`](https://github.com/cailenfisher/SvelteBuilder/commit/d4ab34b087a962041b92774df2171c77b9d169c4) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Modules no longer ship a data-access layer.

  Both packages exported `./server`, a Drizzle query layer importing `drizzle-orm` at runtime. Guardrail 8
  forbids exactly that: runtime Drizzle means a direct Postgres connection, which runs as a role that owns
  the tables, which makes Postgres skip every RLS policy in the project. Since SuperPrototype moved to
  PostgREST the export was also simply unusable — the route templates calling it could not even be
  scaffolded. A module now ships its schema, its components, and (for content) its pure publishing
  utilities. Queries belong to the app, which reaches the database through `event.locals.supabase`.
  - **logistic**: `./server` removed. It contained only `queries.ts`.
  - **content**: `./server` removed and replaced by **`./publishing`**. Its query layer is gone, but the
    four modules that lived beside it — `generateRssFeed`, the sitemap builders, the JSON-LD and meta-tag
    builders, and `validateArticleForPublish` — are pure functions over already-fetched entities, with
    type-only imports and no database access. Those are domain knowledge rather than data access, so they
    stay under a name that does not imply otherwise.

  Content's 13 in-package route templates move out to the create CLI's template tree. They had been
  compiled into `dist/templates/` and published, while the CLI never copied them into a scaffolded
  project — so they were unreachable build output rather than usable screens. They will return as
  selectable screen bundles.

  Also fixed while here: the `diglossia` peer range was `^0.0.1`, which excludes the 0.1.x actually
  shipping, so installing either module beside diglossia produced a peer conflict. Now `^0.1.0`.

  **Breaking:** `SectionFront` drops its required `sections` prop. It was never read — the derived map
  that used it had been dead since the component was written — so every caller was fetching and passing
  section rows for nothing.

- [#13](https://github.com/cailenfisher/SvelteBuilder/pull/13) [`d9cf0f7`](https://github.com/cailenfisher/SvelteBuilder/commit/d9cf0f7d1fb3da3da2cac9ffb4945879849e8942) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Screens are delivered as selectable bundles, with the module's view types as the contract.

  `create-sveltebuilder` gains a **screen selection** prompt after module selection. A module ships
  schema, components and SQL; the screens that use them are scaffolded from the template tree and owned
  by the generated project afterwards. Not every app wants every screen a module offers, so they are now
  chosen rather than assumed. Defaults to all, and expands a selection to include anything the chosen
  bundles declare in `requires` (reporting what it added), so a screen never ships without the siblings
  it cross-links to.

  A bundle lives at `templates/modules/<module>/screens/<id>/` as `manifest.json` plus two halves:
  - **`ui/`** — the `+page.svelte` files, provider-neutral, importing their view-model types from the
    module package.
  - **`server.superprototype/`** — loaders and form actions for that scaffold flavour. `server.native/`
    is where Native's would go if it revives.

  They merge into the same route directories at scaffold time, so the generated project has a screen and
  its loader side by side despite being authored apart.

  `@sveltebuilder/logistic` gains **`./views`**, the contract that makes the split safe: a screen imports
  `SupplierListView`, every flavour's loader returns it, and a disagreement is a compile error rather
  than a runtime surprise. The selectable unit is a feature bundle, not a route file, because screens
  cross-link.

  The **supplier** bundle is the first ported: list and detail, with update/addContact/deleteContact form
  actions rewritten against `event.locals.supabase`. It is also now properly internationalised — the
  originals had hardcoded English — using global copy from the layout's dictionary for action labels and
  the module's own scoped copy for everything else, with twelve new slugs seeded in EN and FR.

  The remaining logistic route templates move to `screens/_unported/`, which nothing copies, so only
  ported bundles are reachable. Logistic stays gated in the CLI until the port finishes.

### Patch Changes

- Updated dependencies [[`82a7349`](https://github.com/cailenfisher/SvelteBuilder/commit/82a7349fc2d0502704adbb2765c4f0565e888314), [`99b6a39`](https://github.com/cailenfisher/SvelteBuilder/commit/99b6a39abb4483d5646a78dad81d229808f8d598)]:
  - @sveltebuilder/coreui@0.1.1
  - @sveltebuilder/local-text-schema@0.2.0

## 0.0.10

### Patch Changes

- Updated dependencies []:
  - @sveltebuilder/coreui@0.1.0
