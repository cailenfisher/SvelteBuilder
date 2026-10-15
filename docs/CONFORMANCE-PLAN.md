# SvelteBuilder Conformance and coreui 1.0 Plan

Instructions for Claude Code to bring this repository into line with the global engineering principles (`~/.claude/CLAUDE.md`) and the repository's own `CLAUDE.md`, and to take `@sveltebuilder/coreui` to 1.0 in the same release. Place this file at `docs/CONFORMANCE-PLAN.md` and run it phase by phase.

It folds in stage 1 of `docs/COREUI-1.0.md` in full (every item in `docs/COREUI-API-AUDIT.md`), the cheap parts of stages 2 and 4, and runs stages 3 and 5 as the release-candidate window.

## Release strategy

**One release train, one major per package, ever.** Everything breaking ships together:

| Package                            | Now   | Release candidate           | Stable  |
| ---------------------------------- | ----- | --------------------------- | ------- |
| `@sveltebuilder/coreui`            | 0.2.x | `1.0.0-rc.N`                | `1.0.0` |
| `@sveltebuilder/content`           | 1.1.x | `2.0.0-rc.N`                | `2.0.0` |
| `@sveltebuilder/logistic`          | 1.0.x | `2.0.0-rc.N`                | `2.0.0` |
| `@sveltebuilder/local-text-schema` | 0.2.x | minor or patch, as computed |         |
| `create-sveltebuilder`             | 0.1.x | minor                       |         |

Why this shape:

- coreui goes **straight from 0.2.x to 1.0**, never through 0.3.0. A 0.3.0 would cascade the modules to 2.0.0, and the 1.0 after it would cascade them again to 3.0.0.
- Once the modules peer on `^1.0.0`, every later coreui minor is inside their range, and the cascade described in `docs/DEFERRED.md` ends.
- The release candidate uses Changesets **pre mode**. Breaking fixes found during the RC window (human accessibility pass, beta use) ship as further `rc` versions of the **same** major, not as new majors.
- The modules' 2.0.0 is the one deliberate major. Their renames are breaking under semver whatever coreui does, so it can't be avoided, only consolidated.

### Branching

All work happens on `dev`. It already runs every CI gate on push, and the Release workflow only runs on `main`, so nothing on `dev` can publish. `dev` is reserved for this plan until Phase 13: no unrelated work lands on it.

- **Non-breaking fixes** (Phase 1) are committed on `dev`, then `dev` merges to `main` and releases as patches, per the interim rule in `docs/DEFERRED.md`.
- **All breaking work** (Phases 2–13) continues on `dev`. Changesets are written as the work happens, but `dev` does not merge to `main` again until pre mode is entered in Phase 13. Changesets' `version` consumes every pending changeset, so a merge before then would ship the majors.
- **A hotfix during the train** goes on a short branch off `main`, and `main` is then merged back into `dev`.

## Ground rules

- **Stop after Phase 0** and wait for the manifest and decisions to be approved.
- After Phase 0, run the phases in order. Each phase is **one commit** (or a small series), with a message naming the phase.
- **Pause for review** at the end of any phase marked ⏸. Otherwise continue once the gate passes.
- **Never weaken a gate to make it pass.** If a gate fails and the fix isn't obvious, stop and report.
- **Every rename is total** (table, type, enum, view type, route, screen id, manifest, copy slug, seed, component, CSS class, dev-kitchen page, test, docs) and lands in one phase.
- Approved names come from `docs/conformance-manifest.md`. A name the manifest doesn't cover is added as **pending**, and you stop at the end of the phase to get it approved.
- Do not edit historical `CHANGELOG.md` entries.
- Run `pnpm changeset status --verbose` after writing any changeset. If it shows a major for any package other than coreui, content or logistic, stop.

### Deferred decisions and their deadlines

Choices taken provisionally during the run, each with the phase it has to be settled before. Report
this table at the end of every phase, and update it when an item lands or a new one is deferred.

| Item | Where it is recorded | Must land before | Status |
| --- | --- | --- | --- |
| Styling a class passed to a child component (`:global` stopgap on the base local-text page) | `docs/DEFERRED.md` | Phase 11 (screen decomposition multiplies the cases) | landed in Phase 10: plain stylesheets, no `<style>` blocks or `:global` |
| `useField`/`FieldContext` as public API, or another way for a custom control to read `Field` | `docs/DEFERRED.md` | Phase 13 (1.0 freezes it), or before a second consumer | open |
| Hard-coded English found along the way: `PickTaskCard` progress `aria-label`; `LiveUpdateItem` ("Pinned"), `LiveCoverageView` ("Live", "Coverage ended"), `BylineList` ("By"), `FrontCurationBoard` (layout names, slot labels), `InboundReceiptCard` ("Expected", "Received", "Lines", "units"), `StorageLocationPath` ("Storage location path"), `ArticleBlockRenderer` ("Live update"). `SubscriberList`, `ArticleList`, `AssignmentQueue` and `ArticleWorkflowPanel` were done in Phase 7 | this table | Phase 12 (copy sweep) | open |
| Right-to-left: a `Checkbox` label's first letter is hidden ("artial shipments" on `/dev/theme`). Present before the Phase 7 rename too; axe does not see it | this table | Phase 13 (the RC's human RTL pass), or fix in Phase 12 | open |
| Validate the upgrade SQL against a database built from the 1.x schema | `docs/MIGRATION-2.0.md` | Phase 13 | open |
| Content's `ArticleList`, `ArticleWorkflowPanel` and `ArticleBlockEditor` are used by no screen, while the article admin screens render the same three concepts by hand (a table, an inline workflow with forms, a read-only block table). One concept, one component: adapt the components to the screens, or retire them. Phase 11 left those three screen sections unextracted | this table | Phase 13 (1.0 and 2.0 freeze the package API) | open |
| The base admin dashboard is a placeholder: null stats, an always-empty "recent items" table with generic names, a "view all" button with no link, badges that print their variant name | this table | Phase 13 (production-ready bar) | open |
| Return grading's condition, disposition and location `Select`s, in table cells, have no accessible name: `Select` takes it only from a `Field`. Needs visible labels or a coreui prop | this table | Phase 12 (with the copy sweep) | open |

### Gate (run at the end of every phase)

```sh
pnpm lint && pnpm check && pnpm test && pnpm scaffold:check
```

Add `pnpm sql:check` (needs Docker) whenever a phase touches SQL, migrations, seeds, enums or column names. Add `pnpm --filter dev-kitchen test:a11y` (the Accessibility workflow's suites) whenever a phase touches components, stylesheets or dev-kitchen; Phase 10 shipped a failing run because the gate left it out. A phase is complete only when the full gate passes.

---

## Phase 0: Inventory, manifest and decisions (stop afterwards)

**Goal:** a complete, approved list of every name that changes, and an answer to every open decision. No code changes.

1. Inventory every concept name in every layer: Drizzle tables and enums, hand-written types, view-model types (`views.ts`), exported components and constants (`index.ts`), screen bundle ids, routes and `manifest.json`, copy slugs and seeds, dev-kitchen pages and `catalog.ts`, CSS classes in `packages/coreui/styles/components.css` and in `<style>` blocks, and `README.md`, `CLAUDE.md` and `docs/`.
2. Compare each concept's name across layers and record every mismatch.
3. Write `docs/conformance-manifest.md`: one table per package, `old name | new name | layers affected | status (proposed / pending)`. Start from the seed list below, verify each entry against the code, and add anything missing.
4. Write a recommendation for each decision below, with evidence from the code.
5. Stop and present the manifest and decisions.

### Seed rename list (verify and complete)

**Logistic: concept shortened in the UI layers**

| Old                                                                          | Proposed                                                       | Notes                        |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------- |
| screen/route `receipt`                                                       | `inbound-receipt`                                              | table `inbound_receipt`      |
| screen/route `return`                                                        | `return-authorization`                                         | table `return_authorization` |
| screen/route `stock`                                                         | `stock-level`                                                  | table `stock_level`          |
| `ReceiptCard`                                                                | `InboundReceiptCard`                                           |                              |
| copy slugs `logistic.receipt.*`                                              | `logistic.inbound_receipt.*`                                   | manifest already mixes both  |
| `ReturnListView`, `ReturnDetailView`                                         | `ReturnAuthorizationListView`, `ReturnAuthorizationDetailView` |                              |
| `StockListView`                                                              | `StockLevelListView`                                           |                              |
| `PickQueueView`                                                              | `PickTaskQueueView`                                            |                              |
| `ReceiveQueueView`, `ReceiveDetailView`, `CountQueueView`, `CountDetailView` | see D3                                                         | warehouse app                |
| `LocationOption`                                                             | `StorageLocationOption`                                        |                              |
| `EntityOption`                                                               | verify; generic name                                           |                              |
| `AdjustmentReason` / `adjustment_reason`                                     | `StockAdjustmentReason` / `stock_adjustment_reason`            | DB enum rename               |
| copy slug `logistic.field.location`                                          | `logistic.field.storage_location`                              |                              |
| `PickTaskStatusBadge`, `ShipmentStatusBadge`, `ReturnConditionBadge`         | keep names; wrap `Badge`                                       | audit B4                     |

**Content: parent concept dropped, or names colliding**

| Old                                                             | Proposed                                                     | Notes                                |
| --------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------ |
| `AssignmentQueue`                                               | `ArticleAssignmentQueue`                                     |                                      |
| `BylineList`                                                    | `ArticleBylineList`                                          |                                      |
| `MediaFigure`                                                   | `MediaAssetFigure`                                           |                                      |
| `TopicTag`                                                      | `TopicLink`                                                  | `tag` is a separate concept          |
| `SectionFront`                                                  | `FrontDetail`                                                | renders `FrontWithSlots`; verify     |
| `SectionLabel`                                                  | `SectionLink` or `SectionBadge`                              | verify whether it links              |
| `ArticleView`, `AuthorProfileView`, `LiveCoverageView`          | `ArticleDetail`, `AuthorProfileDetail`, `LiveCoverageDetail` | D8                                   |
| `LiveUpdateItem`                                                | `LiveUpdateCard` or `LiveUpdateRow`                          |                                      |
| `NewsletterSignup`                                              | `NewsletterSubscriptionForm`                                 |                                      |
| `BlockEditorHost` + coreui `BlockEditor`                        | one component, `ArticleBlockEditor`                          | audit B1; one concept, one component |
| route `preview/[token]`                                         | D4                                                           |                                      |
| screen id `admin-article`                                       | verify against parent-first rule                             |                                      |
| `ArticleWorkflowPanel` tab labels "Status", "Checklist", "Team" | copy slugs; "Team" → assignment                              |                                      |

**coreui: components**

| Old                                                 | Proposed                                                                                   | Notes                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------- |
| `RadioItem`                                         | `RadioGroupItem`                                                                           | parent-first               |
| `TableHead` vs `TableHeader`                        | e.g. keep `TableHead` (thead), `TableHeader` → `TableHeaderCell` (th)                      |                            |
| `LocaleEdit`, `LocalTextEdit`, `LocalTextLinkEdit`  | move to the base template (audit B2) as `LocaleFieldset`, `LocalTextFieldset`, `LocalTextLinkFieldset` |                            |
| `LocaleSwitcher`                                    | `LocalePicker`                                                                             | stays in coreui (audit B2) |
| `StatusBadge`                                       | removed                                                                                    | audit B4                   |
| `MessageAriaLive`, `SelectItemCollector`            | verify; propose names                                                                      |                            |
| `SBMessage`, `SBMessageAction`, `SBMessageSeverity` | `Message`, `MessageAction`, `MessageSeverity`                                              | no prefixes                |
| `DEFAULT_MESSAGE_LABELS`                            | no longer exported                                                                         | audit F4                   |

**coreui: CSS classes (become a public contract at 1.0)**

| Old                                                                               | Proposed                              | Notes                                     |
| --------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------- |
| `.btn`, `.block-btn`, `.add-block-btn`, `.pagination-btn`, `.select-scroll-btn`   | `.button`, …`-button`                 | no abbreviations                          |
| `.dialog-desc`                                                                    | `.dialog__description`                | `.drawer-description` already spelled out |
| `.checkbox-wrap`, `.switch-wrap`, `.table-wrap`                                   | concept part names                    | generic "wrap"                            |
| `.datetime-picker`                                                                | `.date-time-picker`                   | matches `DateTimePicker`                  |
| `.progress`                                                                       | `.progress-bar`                       | matches `ProgressBar`                     |
| `.notification`                                                                   | `.inline-notification`                | matches `InlineNotification`              |
| `.aria-live`                                                                      | matches the renamed `MessageAriaLive` |                                           |
| `.radio-item`, `.radio-control`                                                   | `.radio-group-item`, …                | follows the rename                        |
| every internal element class (`.label`, `.icon`, `.body`, `.close`, `.footer`, …) | `component__part`                     | audit D2                                  |
| `.local-text-edit`, `.local-text-link-edit`, `.locale-edit`                       | move with the components              | audit B2                                  |

**Schema and vocabulary**

| Old                                     | Proposed                                               | Notes               |
| --------------------------------------- | ------------------------------------------------------ | ------------------- |
| status value `complete` vs `completed`  | D1                                                     |                     |
| `pinned_until`, `embargo_until`         | D2                                                     |                     |
| severity `danger` vs `error`            | audit C4                                               | one word everywhere |
| comments mentioning "hermes" (17 files) | "diglossia"                                            | former package name |
| "Camp 1" / "Camp 2" comments            | e.g. "dictionary-independent" / "dictionary-resolving" | code names          |

### Decisions to resolve in Phase 0

**Conformance**

| #   | Question                                                                                                    | Recommendation                                                                                                                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Single form for completion status values                                                                    | `completed`                                                                                                                                                                                                                                       |
| D2  | `pinned_until`, `embargo_until`                                                                             | `pin_expires_at`, `embargo_expires_at`                                                                                                                                                                                                            |
| D3  | Warehouse routes `warehouse/pick`, `receive`, `count`                                                       | Rename to `warehouse/pick-task`, `warehouse/inbound-receipt`, `warehouse/cycle-count`; warehouse view variants as e.g. `InboundReceiptWarehouseDetailView`                                                                                        |
| D4  | `preview/[token]`                                                                                           | `article-preview/[token]`                                                                                                                                                                                                                         |
| D5  | Backend seam location (guardrail 11 bans a data layer in packages; bundle-shared code may not go in `$lib`) | Module-level server overlay in the template tree, copied by the CLI whenever the module is selected. Generic helpers such as `toOne` in the flavour base `templates/superprototype/src/lib/server/`. Fallback: bundle-local `<concept>.server.ts` |
| D6  | Where extracted screen sub-components live                                                                  | Presentational → module package concept folder. Bound to a route's actions or hrefs → bundle-local                                                                                                                                                |
| D7  | Versioning                                                                                                  | The release strategy above. No deprecated aliases                                                                                                                                                                                                 |
| D8  | `View` suffix used for components and view-model types                                                      | Reserve `View` for view-model types                                                                                                                                                                                                               |
| D9  | Repo role vocabulary                                                                                        | Add `Queue`, `Board`, `Panel`, `Renderer`, `Figure`, `Bar`, `Path`, and `Item` for coreui primitives only (`MenuItem`, `AccordionItem`)                                                                                                           |
| D10 | Schema file layout                                                                                          | One `schema/` folder per package with a per-concept file holding the table, enum values and derived types. Align `local-text-schema/src/tables/`                                                                                                  |
| D11 | Single-letter lambda parameters and `t`                                                                     | Allow in one-line lambdas. Rename `t` to `localText` or `copy`                                                                                                                                                                                    |

**coreui API (from `COREUI-API-AUDIT.md`, "Decisions needed")**

| #   | Question                               | Audit recommendation                                                                                                                                    |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1 | Copy policy (A1, A2)                   | Every user-facing string prop required, no English defaults; `BlockEditor` takes one typed `labels` prop                                                |
| A-2 | Boundary (B1–B3)                       | Move `BlockEditor` to content and the locale editors to the template; `BarcodeInput` follows commerce's needs, and becomes a `Field` citizen either way |
| A-3 | Duplicates (B4, B5)                    | Remove `StatusBadge`; keep `Alert` and `InlineNotification` with a stated distinction                                                                   |
| A-4 | Severity word (C4)                     | `danger`, matching the tokens                                                                                                                           |
| A-5 | Attribute forwarding (C6, F3)          | Closed and explicit for 1.0; `useField`/`FieldContext` public only if custom controls are supported                                                     |
| A-6 | CSS contract (D1, D2)                  | Published list of public classes; internal elements renamed `component__part`                                                                           |
| A-7 | Callback and text conventions (C1, C3) | `on<Event>` camelCase, `on<Value>Change` for bindables; strings where the value names something, snippets where it's content                            |
| A-8 | Svelte peer floor (F1)                 | `^5.33.0`, in step with bits-ui                                                                                                                         |

---

## Phase 1: Non-breaking fixes (released as patches)

**Goal:** ship every non-breaking audit item now, so the breaking train is smaller and these fixes reach users immediately.

On `dev`, as patch changesets per `docs/DEFERRED.md`:

- **E1:** replace hard-coded element ids with `$props.id()`.
- **E2:** `Switch` consumes `useField()`; correct the `Field` doc comment.
- **E3:** `MenuLabel` outside a group renders a plain label or fails with a clear development error.
- **F2:** declare `@internationalized/date` as a coreui peer.
- **F3:** export `FieldContext` (or decide A-5 first and skip).
- **C2:** add missing `onCheckedChange`, `onValueChange`, `onOpenChange`.
- **C5:** add `class` to every component with a styled root.
- **D3:** convert physical-direction CSS to logical properties.

Skip anything a later breaking phase will rewrite anyway (for example, ids inside the locale editors if they're moving). Gate, merge `dev` to `main`, release. From here on, `dev` does not merge to `main` until Phase 13.

---

## Phase 2: Rules, contracts and documentation

**Goal:** every rule and contract the later phases implement is written down first.

1. Update the repo `CLAUDE.md`:
   - **REST paths** singular `kebab-case`; remove the plural exception.
   - **Concept folders** for every package and app.
   - The D5 seam rule, D6 placement rule, D8 suffix reservation, D9 role vocabulary, D10 schema layout.
   - **Single-source enums:** values declared once in a runtime-safe constant, with the `pgEnum` and type union derived from it.
   - The A-7 callback and text conventions, and the A-1 copy policy.
2. Write `docs/COREUI-COMPATIBILITY.md` (COREUI-1.0 stage 4): what counts as breaking (props, public class names, data attributes, tokens, DOM structure, peer ranges), how deprecations are announced and how long they last, and the Svelte, bits-ui and browser support floors.
3. Write the public CSS surface list (A-6): root classes, modifiers, data attributes, public and readable derived tokens. Use the **new** names from the manifest.
4. Update `docs/MODULE-ROUTES.md`, `docs/coreui-theming.md` and `README.md`.
5. Gate.

---

## Phase 3: coreui boundary ⏸

**Goal:** coreui contains only what belongs in it before anything is renamed or moved into folders.

1. **B1:** merge `BlockEditor` into content with `BlockEditorHost` as one component (`ArticleBlockEditor`, per the manifest), with the A-1 `labels` prop.
2. **B2:** move the three locale editors into the base template, under the new names. `LocaleSwitcher` stays.
3. **B3:** apply the decision for `BarcodeInput`; make it compose with `Field` either way.
4. **B4:** remove `StatusBadge`. The logistic status badges wrap `Badge` directly.
5. **B5:** apply the `Alert` / `InlineNotification` decision and document the distinction.
6. Update dev-kitchen pages, the catalog, templates and tests for every moved or removed component.
7. Write changesets (coreui `major`, content and logistic `major`).
8. Gate. Pause for review.

---

## Phase 4: Schema single source of truth

**Goal:** each table, enum and type is declared once.

1. Restructure each package's schema per D10. Resolve the `schema.ts` / `schema/index.ts` collision.
2. Replace hand-written entity types with Drizzle inference (`typeof inboundReceipt.$inferSelect`), as `local-text-schema` already does. Timestamps use `{ mode: 'string' }`, so inferred types should match. **Compare each inferred type with the hand-written one field by field** and stop on any unexplained difference.
3. Keep composite types (`InboundReceiptWithCopy`, …) as intersections of inferred types.
4. **Enums:** declare each enum's values once as a plain `as const` array in a module that **does not import `drizzle-orm`** (guardrail 8 bans runtime `drizzle-orm` imports, and screens need the values at runtime). Build the `pgEnum` and the type union from it. Replace every duplicate list (`RECEIPT_STATUSES`, `STATUSES`, …).
5. Package exports don't change in this phase.
6. Gate.

---

## Phase 5: Database vocabulary ⏸

**Goal:** apply D1, D2 and every column or enum rename in the manifest.

1. Rename enum values and columns in the Drizzle schema and generate migrations (`ALTER TYPE … RENAME VALUE`, `ALTER TABLE … RENAME COLUMN`).
2. Update seeds, RLS policies, supplemental SQL, loaders, form actions and copy slugs.
3. Update `scripts/sql-check/` assertions.
4. Write changesets (exported status types change).
5. Gate, **including `pnpm sql:check`**. Pause for review.

---

## Phase 6: Concept folders (no API change)

**Goal:** every component library and app is organized by concept. Pure moves, no renames.

1. Move package components into concept folders: logistic (`InboundReceipt/`, `PickTask/`, `Shipment/`, …), content (`Article/`, `Article/ArticleBlock/`, `Front/`, …), coreui (`Menu/`, `Table/`, `Tabs/`, `Select/`, `RadioGroup/`, `Toast/`, `Message/`, …), with non-component modules beside the component they serve. The same applies to components moved into the base template in Phase 3.
2. Keep `index.ts` export names unchanged.
3. Update imports, tests and dev-kitchen.
4. Gate. (`scaffold:check` packs tarballs, so missing `files`/`exports` entries fail here.)

---

## Phase 7: coreui API ⏸

**Goal:** apply every breaking audit item, so coreui's API is final before the domain modules are renamed against it.

1. **A1, A2:** make user-facing string props required; the message bus takes a complete `MessageLabels`; stop exporting `DEFAULT_MESSAGE_LABELS` (F4).
2. **C1:** callback renames (`onremove` → `onRemove`, `onSort` → `onSortChange`, …).
3. **C3:** text-prop alignment (`MenuSub` and `Tooltip` take `trigger` snippets).
4. **C4:** one severity word everywhere. Export the variant and size unions as types.
5. **C6 / F3:** apply the attribute-forwarding decision.
6. **D2:** rename every CSS class to the manifest names (`component__part` for internals, no abbreviations, root classes matching component names). Update `components.css`, every `<style>` block, the theming docs and the public class list.
7. **F1:** raise the Svelte peer floor.
8. Rename the coreui components in the manifest (`RadioGroupItem`, `LocalePicker`, `SBMessage` → `Message`, …).
9. Update every consumer: content, logistic, templates, dev-kitchen. Domain components and screens now pass their copy explicitly.
10. Write changesets. Gate. Pause for review.

---

## Phase 8: Domain renames across every layer ⏸

**Goal:** apply the logistic and content parts of the manifest.

Work one concept at a time, and run the gate after each package. For each concept, rename in every layer at once:

- component file and folder, export name, and every import
- view-model types in `views.ts`
- screen bundle folder, `manifest.json` (`id`, `routes`, `views`, `copySlugs`) and route directories
- copy slugs in screens and seeds (both required locales)
- CSS block and element classes
- dev-kitchen route, `catalog.ts` entry and fixtures
- tests, including `tools/create/test/screen-bundle.test.ts`, package tests and Playwright specs
- `scripts/scaffold-check.mjs` and CLI references to screen ids
- `README.md`, `CLAUDE.md` and `docs/`

Write changesets. Gate, including `pnpm sql:check`. Pause for review.

---

## Phase 9: Backend seam

**Goal:** loaders and actions call a named data module per concept instead of building queries inline.

1. Implement the CLI support D5 requires (if approved), with a test in `tools/create/test/`.
2. Move the generic `toOne` helper (copy-pasted into 14 files) to the shared location and delete the copies.
3. Create each concept's data module (e.g. `inbound-receipt.ts` exporting `listInboundReceipt`, `getInboundReceipt`, `addInboundReceiptLine`, …). Each function takes the `supabase` client as an argument, so it still goes through `event.locals.supabase` (guardrail 8), and keeps the existing explicit error handling.
4. Rewrite every route file that calls `.from('…')` (35 today) to use the data modules.
5. Confirm by search that no route file still calls `.from(`.
6. Gate, including `pnpm sql:check`.

---

## Phase 10: Plain stylesheets ⏸

**Goal:** every style is a plain CSS file that the page links, and no component has a `<style>` block. Decided 2026-10-14, replacing the `:global` stopgap (`docs/DEFERRED.md`).

BEM class names already scope every rule, which is what BEM was designed for. Svelte's compiled scoping is a second system on top, and it is the one that breaks when a component styles part of a child it composes, which is exactly what Phase 11 multiplies. The native pattern costs more files and loses `svelte-check`'s unused-selector warning; the check in step 2 replaces that warning.

### Rules (written into `CLAUDE.md` in step 1)

- **No `<style>` blocks and no `:global`** in packages, templates or dev-kitchen. This supersedes guardrail 7's allowance for structural wrapper rules.
- **One stylesheet per concept folder**, named after the folder in kebab case and placed in it: `Table/table.css` holds `.table`, `.table-row`, `.table-cell` and the rest of that folder's blocks; a nested concept has its own (`Article/ArticleBlock/article-block.css`). A route directory works the same way, and its stylesheet is named after the screen's root block.
- **Every selector names its own block.** A bare element selector (`h2`, `ul`) was scoped to its component inside a `<style>` block; as plain CSS it would apply to the whole app, so it becomes a class. A rule may reach into a child component only through that child's public classes (`.article-card__media .media-asset-figure__img`).
- **Screen root blocks are named after the screen's view-model type**, with `View` replaced by `Screen`: `InboundReceiptWarehouseDetailView` renders `.inbound-receipt-warehouse-detail-screen`. (Amended during the phase: without the suffix, the article page's block was `.article-detail`, the block of the `ArticleDetail` component it renders.) A base-template screen with no view type is named after its concept and role (`.local-text-admin`). Screen classes become app-wide, so drifted or generic ones (`.dashboard`, `.count-detail`, `.receive-queue`) are renamed. New names are added to the manifest as pending.
- **Package stylesheets are layered by the app.** Each package exports `./styles/components.css`, a list of `@import`s of its folder stylesheets. The scaffold's `app.css` imports coreui's into the `components` layer, then each selected module's into the same layer after it, so a module rule that styles a coreui part wins by order, and the developer's unlayered CSS still overrides both. The create CLI writes the module lines.
- **App stylesheets are unlayered.** A screen, layout or template component imports its own stylesheet (`import './stock-level-admin.css';`), and SvelteKit links it for that route. It is the developer's code, so it sits with the developer's other unlayered CSS.

### Steps

1. Write the rules into `CLAUDE.md` (guardrail 7, CSS Style System), `docs/COREUI-COMPATIBILITY.md` (the stylesheet exports and their layer), `docs/coreui-theming.md` and `docs/MODULE-ROUTES.md`.
2. Add `scripts/css-check.mjs` to `pnpm lint`. It fails on any `<style>` block or `:global` in the covered trees, on a selector that does not start with its own file's block, on a stylesheet nothing imports, and on a class defined in a stylesheet that no component or route mentions.
3. Take a dev-kitchen screenshot baseline (the Phase 7 method) before changing any CSS.
4. **coreui:** split `styles/components.css` into folder stylesheets beside the components, and make `components.css` the import list. Its export path does not change. Move the `Input`, `Textarea` and `Select` `<style>` rules into their folders' stylesheets.
5. **content and logistic:** convert every `<style>` block into folder stylesheets, and add the `./styles/components.css` export and its `files` entry. Remove `ArticleCard`'s `:global`.
6. **Templates:** the create CLI adds each selected module's stylesheet import to `app.css`, with a test in `tools/create/test/`. Convert screens, layouts and the base template's components, renaming screen root blocks per the rule above. Remove the local-text page's `:global`.
7. **dev-kitchen:** `sync-chrome.mjs` writes the module imports into its copy of `app.css`, aliases the module stylesheets to source, and converts its own pages.
8. Screenshot every dev-kitchen page again. Explain every difference or fix it. No browser harness reaches the screens, so for them `css-check` (every selector names its own block, and blocks are unique) is what shows that a rule matches the same elements it did when it was scoped.
9. Changesets: content and logistic consumers must now import the module stylesheet, so record it in `docs/MIGRATION-2.0.md` along with the renamed screen classes.
10. Close the `docs/DEFERRED.md` entry. Gate. Pause for review.

---

## Phase 11: Screen decomposition

**Goal:** every screen reads as layout plus named domain components.

1. For each `+page.svelte`, largest first (stock-level list, inbound-receipt detail, logistic dashboard, article admin detail, return-authorization detail), identify each structural sub-block (BEM `__element` groups with their own heading, form, table or list) that names a concept.
2. Extract each one per D6, named `<ParentConcept><Qualifier?><Role>`. For example, inbound-receipt detail becomes `InboundReceiptDetailHeader`, `InboundReceiptLineAddForm`, `InboundReceiptLineTable`, `InboundReceiptLineRow` and `InboundReceiptLineReceiveForm`. The view type `InboundReceiptLineRow` already exists; the component takes it as its prop.
3. Before creating any component, search all packages for an existing one representing the same concept. Promote to coreui per the promotion rule when a second module needs it.
4. Give every new package component a dev-kitchen showcase. Its styles go in its folder's stylesheet (Phase 10 rules), and a screen's extracted bundle-local component takes the matching part of the screen's stylesheet with it.
5. Report each screen's line count before and after.
6. Gate.

---

## Phase 12: Behaviour tests, browsers and final audit

**Goal:** the parts of COREUI-1.0 stage 2 that protect this release, plus a final conformance check.

1. Add a browser-level behaviour test layer (Playwright against dev-kitchen, or a component-testing setup) per COREUI-1.0 stage 2.
2. Write behaviour tests at least for every coreui component whose API changed in Phases 3 and 7, and for the high-risk interactive components (`Select`, `DataTable`, `DateTimePicker`, overlays, the message bus). Cover keyboard interaction, controlled vs bound usage, callbacks firing exactly once, and focus moving in and returning.
3. Add WebKit and Firefox to the accessibility workflow.
4. Replace remaining hardcoded labels (`ArticleWorkflowPanel` and any others) with copy slugs in both locales.
5. Replace "hermes" and "Camp 1/2" with real names and descriptive terms. Apply D11.
6. Final audit, reported:
   - every old name in the manifest has zero hits outside `CHANGELOG.md` and the migration notes
   - no flat component directories remain
   - no route file calls `.from(`
   - no `is_`/`has_` columns, non-`_at` timestamps or duplicated enum value lists remain
   - every item in `COREUI-API-AUDIT.md` is marked changed or explicitly kept, with the reason
7. Gate, including `pnpm sql:check`.

---

## Phase 13: Release candidate ⏸

**Goal:** publish the RC versions and hand off to the human RC window.

1. Enter pre mode: `pnpm changeset pre enter rc`.
2. Confirm with `pnpm changeset status --verbose` that the plan is exactly: coreui `1.0.0-rc.0`, content `2.0.0-rc.0`, logistic `2.0.0-rc.0`, and only minors or patches for everything else. Stop if not.
3. Confirm content and logistic peer on coreui `^1.0.0-rc.0` (which also admits `1.0.0` and every later 1.x).
4. Complete `docs/MIGRATION-2.0.md` (drafted from Phase 5 on): every old → new export, component, prop, callback, route, view type, copy slug, CSS class, enum value and column, with the SQL for existing databases. **Validate the SQL**: build a database from the last 1.x scaffold, run the upgrade, re-apply the supplemental files, and confirm `pnpm sql:check`'s assertions pass against it.
5. Update `docs/COREUI-1.0.md` to show stages 1, 2 (partial) and 4 (policy) done, and stages 3 and 5 in progress.
6. Pause. The release itself is the maintainer's call: merging `dev` to `main` publishes the RC.

### The RC window (human, not Claude Code)

- **COREUI-1.0 stage 3:** screen readers (VoiceOver macOS/iOS, NVDA, TalkBack), 400% zoom and 320px reflow, RTL mirroring, forced-colors mode, reduced motion, touch target sizes.
- **Stage 5:** real use in the newspaper POC and in freshly scaffolded apps.
- Fixes, breaking or not, ship as further `rc` versions.
- **Exit:** `pnpm changeset pre exit`, publish `coreui 1.0.0`, `content 2.0.0` and `logistic 2.0.0`. Retire the interim "coreui changesets as patch" rule in `docs/DEFERRED.md`.

---

## Tasks that may remain after this plan

**From the coreui 1.0 roadmap, deliberately not fully folded in:**

- **Full behaviour coverage.** Phase 12 covers the changed and high-risk components. The rest of the 65 still need behaviour tests.
- **Per-component reference docs** (COREUI-1.0 stage 4, audit G1). The compatibility policy and CSS contract are written; the reference pages for every component, and `apps/docs`, are not.
- **The human accessibility pass and beta use** (stages 3 and 5) happen in the RC window and are only as complete as the time given to them. This is what makes the 1.0 "slightly premature."

**Outside the repository or the plan's reach:**

- **Already-scaffolded apps.** Screens are owned by the generated app (guardrail 10), so existing apps get none of the renames, data modules or decomposed screens. `MIGRATION-2.0.md` is their only guide; a codemod for imports and copy slugs would help.
- **Deployed databases** must apply the enum and column renames, and update stored copy rows whose slugs changed, or those strings go missing at runtime.
- **Published package consumers** break on renamed exports, props, callbacks and CSS classes. The migration guide and release notes are the only signal they get.
- **Old URLs** for renamed routes will 404 in existing apps unless redirects are added there.
- **GitHub wiki.** The Naming-Conventions page lives outside the repo and must be updated by hand.
- **diglossia repository** hasn't been reviewed against these rules.
- **The `native` flavour.** Only `server.superprototype` screen halves exist. Check the D5 seam design against a future `server.native`.
- **commerce module** is a stub. The rules apply when it's built, and `BarcodeInput`'s placement (A-2) may need revisiting then.
- **Automated enforcement.** Most of these rules aren't enforced by any linter. Without a custom ESLint rule or a conformance script in CI, drift will return.
- **Pending manifest entries** not approved during the run remain as drift and should be listed in the final summary.
