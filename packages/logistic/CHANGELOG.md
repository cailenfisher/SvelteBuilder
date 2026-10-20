# @sveltebuilder/logistic

## 2.0.0-rc.1

### Major Changes

- [#47](https://github.com/cailenfisher/SvelteBuilder/pull/47) [`9763d7b`](https://github.com/cailenfisher/SvelteBuilder/commit/9763d7badb9ab3b116906de32aaf41c6115535e8) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Logistic adopts roles and permissions (docs/ACCESS-CONTROL.md §7).

  **Breaking (logistic):** a signed-in user with no logistic role now reads nothing and does no floor work; before, any signed-in user could read every logistic table and pick, receive and count. Give existing staff the new Warehouse operator role as soon as you upgrade (`docs/MIGRATION-2.0.md`). The logistic RPCs no longer take the acting user account: `logistic_receive_receipt_line`, `_record_picked_quantity`, `_complete_pick_task`, `_grade_return_line`, `_approve_cycle_count`, `_create_shipment`, `_create_return_authorization` and `_create_cycle_count` read it from the session, and the old signatures are dropped. The stock primitives (`logistic_adjust_stock` and the rest) can no longer be called through the API; adjust stock with `logistic_adjust_stock_level`, which checks `stock_level.adjust`. Workers no longer update lines directly, so a pick line's requested quantity cannot be rewritten.

  Logistic's manifest declares its permission catalog, with the verbs `adjust`, `receive`, `pick`, `grade`, `count` and `approve`, and its seed adds the Logistics manager and Warehouse operator roles and their menu entries. Every policy grants by permission, and children follow their parent. The admin views gain optional `actions`, and coreui exports the `ScreenAction` type they share.

  Scaffolds: the logistic admin screens require their scope and show only the controls the reader may use; the warehouse admits anyone holding a picking, receiving or counting permission. `require-administrator.ts` is now `require-access.ts`, with `requireScope` beside `requireAdministrator`, and `current_user_actions(scope)` joins the core access SQL.

### Patch Changes

- Updated dependencies [[`d227635`](https://github.com/cailenfisher/SvelteBuilder/commit/d227635fb77d0232d0fd56fc277520de71b62298), [`9763d7b`](https://github.com/cailenfisher/SvelteBuilder/commit/9763d7badb9ab3b116906de32aaf41c6115535e8), [`23bace2`](https://github.com/cailenfisher/SvelteBuilder/commit/23bace235634b0af84f3c65816db5ed8a09ffd02)]:
  - @sveltebuilder/local-text-schema@0.3.0-rc.1
  - @sveltebuilder/coreui@1.0.0-rc.1

## 2.0.0-rc.0

### Major Changes

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`ca15716`](https://github.com/cailenfisher/SvelteBuilder/commit/ca1571655ee3a49cc587ecefa0a7859afbd85452) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Behaviour tests in three browsers, and the last hard-coded English in the module components.

  coreui fixes found by the new browser tests: `DateTimePicker` reads a typed time in its own
  `timezone` rather than the browser's, updates a bound `value` even when `onValueChange` is also
  given, and passes `min` and `max` to the input in the form it accepts; a disabled `SelectItem`
  carries `aria-disabled`; `Tooltip` content has `role="tooltip"`; a checked `Switch` thumb stays in
  its track in right-to-left; `MessageLiveRegion` drops two fixed ids nothing referenced.

  content and logistic components take their remaining copy from the dictionary, in English and
  French: the live coverage and live update labels, bylines (now joined with `Intl.ListFormat`), the
  article timestamps, the front layout names, the inbound receipt and pick task cards, the stock level
  bar, the supplier card and the tracking event list. `FrontCurationBoard`, `StockLevelBar` and
  `TrackingEventList` gain the optional `dictionary` prop; `FrontCurationBoard` no longer takes
  `locale`, and `PickTaskCard` and `TrackingEventList` require it. `StorageLocationPath` is a labelled
  list rather than a navigation landmark, and several `aria-label`s on plain elements, which ARIA
  does not allow, are gone.

  Scaffolded screens name their copy lookup `localText` instead of `t`.

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`b0aeab9`](https://github.com/cailenfisher/SvelteBuilder/commit/b0aeab93b0de2e74f0736f713fb78c8af0395dbf) Thanks [@cailenfisher](https://github.com/cailenfisher)! - coreui's API and CSS settle for 1.0. Every rename is listed in `docs/MIGRATION-2.0.md` (completed for
  the release candidate); the public CSS surface is in `docs/COREUI-COMPATIBILITY.md`.
  - **No English defaults.** Accessible-name strings are required: `Dialog`/`Drawer` `closeLabel`,
    `ConfirmDialog` `confirmLabel`/`cancelLabel`, `Pagination` labels, `Spinner` and `ProgressBar`
    `label`, and `removeLabel` whenever a `Tag` has `onRemove`. `DataTable` replaces `emptyLabel` with
    one required `labels` object (`empty`, `pagination`, `previousPage`, `nextPage`). `Select`'s
    `placeholder` is optional with no default. `createMessageBus()` requires a complete `labels`
    object, `DEFAULT_MESSAGE_LABELS` is gone, and `InlineNotification` without a message bus in
    context now throws instead of falling back to English.
  - **Renamed:** `RadioItem` → `RadioGroupItem`, `TableHeader` → `TableHeaderCell`, `LocaleSwitcher` →
    `LocalePicker`, `MessageAriaLive` → `MessageLiveRegion`, and the `SBMessage`, `SBMessageAction`,
    `SBMessageSeverity` types → `Message`, `MessageAction`, `MessageSeverity`.
  - **One severity word:** the message severity `error` is now `danger`, matching `Badge`, `Alert` and
    the colour tokens.
  - **Callbacks and text:** `Tag`'s `onremove` is `onRemove`. `MenuSub` takes a `trigger` snippet
    instead of `triggerLabel`, and `Tooltip` a `trigger` snippet instead of `children`.
    `DataTableColumn.align` is `'start' | 'end'`.
  - **Types:** every variant, size, side and orientation union is exported (`ButtonVariant`,
    `BadgeSize`, `DrawerSide`, …), as are `DataTableLabels` and the screen-contract types
    `ScreenCopy`, `ScreenLocale`, `ScreenPage` and `ScreenFormResult`, which content and logistic now
    import instead of declaring their own.
  - **CSS is BEM.** Roots match component names (`.btn` → `.button`, `.progress` → `.progress-bar`,
    `.notification` → `.inline-notification`), parts are `__part` (`.card .body` → `.card__body`) and
    modifiers `--modifier` (`.btn.primary` → `.button--primary`). Generic internal classes no longer
    collide: a `Tag`'s text, a `MetricCard` or `TimelineItem` label, a `Select` inside an errored `Field`,
    a `MenuCheckboxItem` and a `Timeline` inside a `Card` had each been picking up another component's
    rules. `Table`'s `class` now lands on its scrolling root.
  - **Peers:** `svelte` `^5.33.0`; `diglossia` is an optional peer, for the screen-contract types.
  - content's `ArticleList`, `AssignmentQueue`, `SubscriberList` and `ArticleWorkflowPanel` resolve
    their own column, table and panel copy from the dictionary (scope `content`), seeded in English and
    French, and take an optional `dictionary` prop.

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`02c0bc7`](https://github.com/cailenfisher/SvelteBuilder/commit/02c0bc7fe1a84c7159543ed3c380a0196c3a8d37) Thanks [@cailenfisher](https://github.com/cailenfisher)! - coreui now holds only domain-agnostic components. Breaking: four things left it.
  - **`BlockEditor` moved to content** and merged with `BlockEditorHost` into one component,
    `ArticleBlockEditor`. It takes the article's saved `blocks`, resolves their text and its own
    controls' copy from the dictionary (no more hard-coded English), and reports changes as
    `ArticleBlockDraft[]` (formerly coreui's `EditorBlock`). The unused `articleId` and `locale`
    props are gone. Its classes are `.article-block-editor` and `.article-block-editor__*`. The
    content seed adds its copy, and a name for each `article_block_type`, in English and French.
  - **`LocaleEdit`, `LocalTextEdit` and `LocalTextLinkEdit` moved into the base scaffold** as
    `LocaleFieldset`, `LocalTextFieldset` and `LocalTextLinkFieldset` under `src/lib/`, each a
    `<fieldset>` the page places inside its own form. They now generate their
    field ids, so several on one page no longer collide, and no longer show English placeholders.
  - **`BarcodeInput` moved to logistic**, and composes with coreui's `Field`: wrap it in a `Field`,
    which supplies the label, hint and error. Its `label` and `error` props are removed, and
    `placeholder` no longer defaults to English.
  - **`StatusBadge` is removed.** Use `Badge`, passing the label as its content. The logistic status
    badges wrap `Badge` directly.

  `Alert` and `InlineNotification` both stay, with the difference now documented: `Alert` is static
  page content, and `InlineNotification` is the message system's surface for the result of
  something the user did.

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`1e4a485`](https://github.com/cailenfisher/SvelteBuilder/commit/1e4a48532161b74e527af2fafaaf1c14af73ee69) Thanks [@cailenfisher](https://github.com/cailenfisher)! - One word per idea across every module's database. Existing databases need the upgrade SQL in
  `docs/MIGRATION-2.0.md` before regenerating migrations.
  - **Finished states are `completed`.** `inbound_receipt_status` and `cycle_count_status` used
    `complete`; `pick_task_status` already said `completed`. Their copy slugs follow
    (`logistic.inbound_receipt.status.completed`).
  - **Expiry timestamps end in `_expires_at`:** `article.embargo_expires_at` and
    `front_slot.pin_expires_at` (were `embargo_until`, `pinned_until`).
  - **Manual ordering is `position`:** `storage_location`, `navigation_item`, `article_status`,
    `publish_checklist_item` and `section` (were `sort_order` and `ordinal`).
  - **Every timestamp is `timestamptz`.** logistic, `navigation_item` and `local_text` used plain
    `timestamp`; content and `user_account` already used `timestamptz`.
  - **Parent concepts restored:** `adjustment_reason` is `stock_adjustment_reason`
    (`StockAdjustmentReason`, `STOCK_ADJUSTMENT_REASONS`, `logistic.stock_adjustment_reason.*`),
    `media_type` is `media_asset_type` (`MediaAssetType`), `media_license` is
    `media_asset_license` (`MediaAssetLicense`).
  - **Column names follow the rules:** `media_asset.uploaded_by` is `user_account_id`,
    `article.allow_comment` is `comment_allowed`, and the base scaffold's `navigation_item.scope`
    is `menu`, which no longer collides with the i18n scope convention.
  - **`subscriber.locale` is `locale_id`**, a foreign key to `locale`. `content_subscribe()` still
    takes a locale code and falls back to English for one the project lacks. `SubscriberList` takes
    `SubscriberWithLocale[]`.

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`3af07d0`](https://github.com/cailenfisher/SvelteBuilder/commit/3af07d0bf1c631f5bbbf46d70ab7e023e5056df6) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Every content and logistic concept now has one full name in every layer.
  - **logistic screens and routes:** `inbound-receipt`, `return-authorization` and `stock-level`
    (`/admin/logistic/inbound-receipt` …); the warehouse app's `/warehouse/pick-task`,
    `/warehouse/inbound-receipt` and `/warehouse/cycle-count`.
  - **logistic exports:** `ReceiptCard` → `InboundReceiptCard`; `LocationOption` →
    `StorageLocationOption`; view types `StockLevelListView`, `ReturnAuthorizationListView`,
    `ReturnAuthorizationDetailView`, and the warehouse views `PickTaskWarehouseQueueView`,
    `PickTaskWarehouseDetailView`, `InboundReceiptWarehouseQueueView`,
    `InboundReceiptWarehouseDetailView`, `CycleCountWarehouseQueueView`,
    `CycleCountWarehouseDetailView`. View fields name their concept (`inboundReceipts`,
    `stockLevels`, `myPickTasks`, `storageLocations`, …).
  - **content screens and routes:** `article-admin`, `article-preview` (`/article-preview/[token]`)
    and `feed`.
  - **content exports:** `ArticleDetail`, `AuthorProfileDetail`, `LiveCoverageDetail` (were `…View`),
    `LiveUpdateCard` (was `LiveUpdateItem`; its `update` prop is `liveUpdate`), `FrontDetail` (was
    `SectionFront`), `SectionLink`, `TopicLink`, `MediaAssetFigure`, `ArticleBylineList`,
    `ArticleAssignmentQueue`, `NewsletterSubscriptionForm`; view types `ArticleDetailView`,
    `SectionDetailView`, `ArticlePreviewDetailView`, `ArticleAdminListView`, `ArticleAdminDetailView`,
    `ArticleChecklistEntry`; block content types `ArticleBlockParagraphContent` and the rest.
  - **CSS:** each component's block is its name in kebab case (`.inbound-receipt-card`,
    `.article-detail`, `.article-workflow-panel`, `.article-block-renderer`, …).
  - **Copy slugs** use the full concept name: `logistic.inbound_receipt.*`,
    `logistic.return_authorization.*`, `logistic.stock_level.*`, `logistic.storage_location_type.*`,
    warehouse copy under `logistic.warehouse.<concept>.*`, `content.article_admin.*`,
    `content.comment.*`, `content.article_preview.*`, and the components' own copy under
    `content.newsletter_subscription_form.*` and `content.article_workflow.*`. Headings and navigation
    use full names ("Inbound receipts", "Return authorizations", "Stock levels").
  - **Form actions and fields** name their concept (`addInboundReceiptLine`,
    `inbound_receipt_line_id`, `pick_task_id`, …).

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`7799af6`](https://github.com/cailenfisher/SvelteBuilder/commit/7799af683f657b095a4c58021577c0343078748a) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `useField()` returns `FieldControl`: the five attributes a control puts on its focusable element,
  under their HTML names (`id`, `aria-describedby`, `aria-invalid`, `required`, `disabled`), so a
  custom control can spread it. `FieldContext` is no longer exported. `Field` works out the
  description once, so a control with its own `error` (`Input`, `Textarea`, `Select`) is still
  marked invalid but never points `aria-describedby` at an error message the `Field` did not render.
  logistic's `BarcodeInput` uses the new shape.

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`9ce6154`](https://github.com/cailenfisher/SvelteBuilder/commit/9ce6154fb7c4f8bef568cfae8242d910a431c1d3) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `nav` is spelled `navigation` everywhere. Copy slugs `nav.*`, `admin.nav.*`, `logistic.admin.nav.*`
  and `logistic.warehouse.nav` become `navigation.*`, `admin.navigation.*`,
  `logistic.admin.navigation.*` and `logistic.warehouse.navigation`; `docs/MIGRATION-2.0.md` has the
  SQL that renames them in an existing database. coreui's `.pagination__button--nav` becomes
  `.pagination__button--navigation`. In scaffolded screens, `navItems` and `navItem` become
  `navigationItems` and `navigationItem`.

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`e5990d4`](https://github.com/cailenfisher/SvelteBuilder/commit/e5990d41b93d10e6be2df17f569603ad24601beb) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Components carry no Svelte `<style>` blocks. Every style is a plain stylesheet beside the component
  it styles, and each package lists its stylesheets in one entry point the app imports into the
  `components` layer: `@sveltebuilder/coreui/styles/components.css` (same path as before),
  `@sveltebuilder/content/styles/components.css` and `@sveltebuilder/logistic/styles/components.css`
  (new). **Import the module stylesheets you use**, after coreui's, or their components render
  unstyled; projects from `npm create sveltebuilder` get the lines automatically. coreui's table rules
  now target `.table-row`, `.table-cell` and `.table-header-cell` instead of `tr`, `td` and `th`.

  Scaffolded screens import their own stylesheets, and their root classes are named after their view
  types (`.inbound-receipt-list-screen`). The base template gains `src/utilities.css` with
  `.visually-hidden`, imported into the `utilities` layer. See `docs/MIGRATION-2.0.md`, "Stylesheets".

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`ef79b84`](https://github.com/cailenfisher/SvelteBuilder/commit/ef79b84481723e1846158e50af904dd283eb1393) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Each table, enum and type is now declared once.
  - Entity types are inferred from the Drizzle tables instead of hand-written beside them. They are
    unchanged except for content's `Article.leadMediaAssetId`, which is now a required
    `number | null` rather than optional: a loader that renders an article selects it.
  - Each enum's values are exported at runtime from the package entry, from a module that does not
    import drizzle-orm: `INBOUND_RECEIPT_STATUSES`, `SHIPMENT_STATUSES`, `RETURN_CONDITIONS`,
    `ARTICLE_BLOCK_TYPES`, `COMMENT_STATUSES` and the rest. Use them instead of repeating the values.
    The view types' `statuses`, `conditions` and `dispositions` fields are now `readonly` arrays.
  - content's main entry exports its schema as types only. It previously re-exported the schema
    module wholesale, which would have pulled drizzle-orm into a runtime bundle once that module held
    tables.
  - content exports `ArticleSection`, `ArticleTopic` and `ArticleTag`, and no longer exports the
    unused `PaginatedResult`.
  - The `./schema` export resolves to `dist/schema/index.js`. The specifier is unchanged, and the
    generated SQL is identical.

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`5a9b980`](https://github.com/cailenfisher/SvelteBuilder/commit/5a9b980d674ed60861ef3eda383d5c82b0833bdf) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Scaffolded screens read as layout plus named components. New package components:
  `FilterLinkList` in coreui (a server-side filter as a `<nav>` of links); `StockAdjustmentList`,
  `StorageLocationFieldset`, `InboundReceiptSummary`, `InboundReceiptList`, `CycleCountLineTable`,
  `ShipmentLineTable` and `LogisticMetricSummary` in logistic; `CommentList` in content. Components
  bound to a route (forms, tables that link) are scaffolded beside the page that uses them.

  content's `ArticleList`, `ArticleWorkflowPanel` and `ArticleBlockEditor` now fit the article admin
  screens, which render them in place of hand-built sections. `ArticleList` takes `ArticleRow`s and an
  `href` per article, resolves headlines and status names through the dictionary, and shows status,
  canonical slug and creation date. `ArticleWorkflowPanel` is an inline section of plain forms posting
  to the `transitionAction` and `checklistAction` it is given, with an optional `enhance`, in place of
  a drawer driven by callbacks; its assignment tab and per-status buttons are gone. `ArticleBlockEditor`
  shows its `readonly` mode as text rather than disabled controls, with an empty state. The base
  admin dashboard's placeholder statistics and empty table are gone, with their six base copy slugs: it
  links to each admin area.

### Patch Changes

- Updated dependencies [[`ca15716`](https://github.com/cailenfisher/SvelteBuilder/commit/ca1571655ee3a49cc587ecefa0a7859afbd85452), [`b0aeab9`](https://github.com/cailenfisher/SvelteBuilder/commit/b0aeab93b0de2e74f0736f713fb78c8af0395dbf), [`02c0bc7`](https://github.com/cailenfisher/SvelteBuilder/commit/02c0bc7fe1a84c7159543ed3c380a0196c3a8d37), [`1e4a485`](https://github.com/cailenfisher/SvelteBuilder/commit/1e4a48532161b74e527af2fafaaf1c14af73ee69), [`7799af6`](https://github.com/cailenfisher/SvelteBuilder/commit/7799af683f657b095a4c58021577c0343078748a), [`1fb15dd`](https://github.com/cailenfisher/SvelteBuilder/commit/1fb15ddc1f2481101b34ecd9654e71e023f6dc4e), [`9ce6154`](https://github.com/cailenfisher/SvelteBuilder/commit/9ce6154fb7c4f8bef568cfae8242d910a431c1d3), [`e5990d4`](https://github.com/cailenfisher/SvelteBuilder/commit/e5990d41b93d10e6be2df17f569603ad24601beb), [`5a9b980`](https://github.com/cailenfisher/SvelteBuilder/commit/5a9b980d674ed60861ef3eda383d5c82b0833bdf)]:
  - @sveltebuilder/coreui@1.0.0-rc.0
  - @sveltebuilder/local-text-schema@0.3.0-rc.0

## 1.0.2

### Patch Changes

- [#34](https://github.com/cailenfisher/SvelteBuilder/pull/34) [`97f69d4`](https://github.com/cailenfisher/SvelteBuilder/commit/97f69d4efc8df9bfef9f085b6612808a67cc4638) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `PickTaskCard` forwards its `dictionary` to the `StorageLocationPath` it renders for each line. It did not, so a screen passing scoped copy as a prop saw every line's location render as `[missing: …]`. Cancelled cards and picked lines are no longer dimmed with opacity, which took their text below 4.5:1 contrast; they use secondary text color and, for cancelled, a dashed border.

- Updated dependencies [[`2531d4d`](https://github.com/cailenfisher/SvelteBuilder/commit/2531d4d3944843337da02f7691b45b587219559d), [`3a8f724`](https://github.com/cailenfisher/SvelteBuilder/commit/3a8f7242e577483502cdf4a7ef91c7a1f787eba0)]:
  - @sveltebuilder/coreui@0.2.3

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
