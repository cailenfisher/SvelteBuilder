# @sveltebuilder/content

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

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`1fb15dd`](https://github.com/cailenfisher/SvelteBuilder/commit/1fb15ddc1f2481101b34ecd9654e71e023f6dc4e) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Form-action errors are copy, not English. `ScreenFormResult.error` is a `ScreenFormError`
  (`{ slug, detail? }`), and the success branch drops `message`. Scaffolded actions return
  `formError(status, slug, detail?)`, and screens show the slug in the reader's language through
  `formErrorText`, falling back to the global `feedback.error` (logged) when a slug has no copy. Every
  error is seeded in English and French: `logistic.error.*`, `content.error.*`, and global `error.*`
  for the base template's screens.

  content's `validateArticleForPublish` returns its issues (`PublishValidationIssue[]`, each a
  `content.publish_validation.*` slug with values) instead of throwing English text; the publish
  action shows them in the editor's language.

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

- Updated dependencies [[`ca15716`](https://github.com/cailenfisher/SvelteBuilder/commit/ca1571655ee3a49cc587ecefa0a7859afbd85452), [`b0aeab9`](https://github.com/cailenfisher/SvelteBuilder/commit/b0aeab93b0de2e74f0736f713fb78c8af0395dbf), [`02c0bc7`](https://github.com/cailenfisher/SvelteBuilder/commit/02c0bc7fe1a84c7159543ed3c380a0196c3a8d37), [`7799af6`](https://github.com/cailenfisher/SvelteBuilder/commit/7799af683f657b095a4c58021577c0343078748a), [`1fb15dd`](https://github.com/cailenfisher/SvelteBuilder/commit/1fb15ddc1f2481101b34ecd9654e71e023f6dc4e), [`9ce6154`](https://github.com/cailenfisher/SvelteBuilder/commit/9ce6154fb7c4f8bef568cfae8242d910a431c1d3), [`e5990d4`](https://github.com/cailenfisher/SvelteBuilder/commit/e5990d41b93d10e6be2df17f569603ad24601beb), [`5a9b980`](https://github.com/cailenfisher/SvelteBuilder/commit/5a9b980d674ed60861ef3eda383d5c82b0833bdf)]:
  - @sveltebuilder/coreui@1.0.0-rc.0

## 1.1.2

### Patch Changes

- [#34](https://github.com/cailenfisher/SvelteBuilder/pull/34) [`06a3f67`](https://github.com/cailenfisher/SvelteBuilder/commit/06a3f67601354f2cd98bb1557ee2a114eedc00e6) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Fix what rendering every content component for the first time found.
  - **Missing copy.** `NewsletterSignup` and `ArticleWorkflowPanel` ask for twelve module-scoped slugs (`newsletter.*`, `action.*`) that the content seed never created, so both rendered `[missing: …]` for every label and button. The seed now provides them in English and French. The screen-bundle suite now checks every module-scoped slug a module's components render, not only the ones its screens do.
  - **Contrast.** `SectionLabel`, `AuthorProfileView`, `LiveCoverageView`, `NewsletterSignup`, `FrontCurationBoard` and `ArticleWorkflowPanel` used raw `--brand`, `--danger` and `--success` as text colors; they use the `-text` variants now. A pinned `LiveUpdateItem` mixed its background with white, which in dark mode put light text on a near-white panel; it uses `--brand-soft`.
  - **`BlockEditorHost`** no longer asks the dictionary for the text of image, video and embed blocks, which logged a missing key for every media block in an article.

- [#34](https://github.com/cailenfisher/SvelteBuilder/pull/34) [`3a8f724`](https://github.com/cailenfisher/SvelteBuilder/commit/3a8f7242e577483502cdf4a7ef91c7a1f787eba0) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Fix the defects a first `svelte-check` over each package found.

  coreui: `Tooltip`'s `delay` prop now takes effect. It was passed to bits-ui as `openDelay`, which bits-ui v2 does not accept, so every tooltip opened after bits-ui's default 700ms. `Button` declares `disabled` for links as well as buttons, and `EditorBlock` declares the `mediaAssetId` that `BlockEditor` already read.

  content: `BlockEditorHost` now works. It mapped blocks with `type` instead of `blockType`, dropped `position`, and listened for an `onChange` that `BlockEditor` never emits, so no edit reached the parent. `ArticleWorkflowPanel` uses coreui's actual `Drawer`, `Tabs`, `Button` and `Checkbox` APIs; its tabs never switched before. `SectionFront` and `AuthorProfileView` pass `ArticleCard` its required `status` and forward `dictionary`, without which entity copy fell back to context and rendered as `[missing: …]`. `NewsletterSignup`'s submit button passes its label as children. `Button` has no `label` prop, so it was rendering an undefined `children` snippet. Finally, `FrontCurationBoard` uses a `Badge` variant that exists.

- Updated dependencies [[`2531d4d`](https://github.com/cailenfisher/SvelteBuilder/commit/2531d4d3944843337da02f7691b45b587219559d), [`3a8f724`](https://github.com/cailenfisher/SvelteBuilder/commit/3a8f7242e577483502cdf4a7ef91c7a1f787eba0)]:
  - @sveltebuilder/coreui@0.2.3

## 1.1.1

### Patch Changes

- [#32](https://github.com/cailenfisher/SvelteBuilder/pull/32) [`c31704e`](https://github.com/cailenfisher/SvelteBuilder/commit/c31704e944d3e5c6a2138d1db66b8aab67c6b0c4) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Bump diglossia to ^0.2.0. The `diglossia` peer range on content and logistic moves from `^0.1.0` to `^0.2.0`. 0.2.0 only adds to the API (`subscribe()`/`getVersion()` on `DictionaryInstance`, reactive `merge()` on the instance passed to `setDictionary()`, and a `formatText` that no longer throws on malformed MF2), so no consumer code changes.

- Updated dependencies [[`c31704e`](https://github.com/cailenfisher/SvelteBuilder/commit/c31704e944d3e5c6a2138d1db66b8aab67c6b0c4)]:
  - @sveltebuilder/coreui@0.2.2

## 1.1.0

### Minor Changes

- [#27](https://github.com/cailenfisher/SvelteBuilder/pull/27) [`ffd074c`](https://github.com/cailenfisher/SvelteBuilder/commit/ffd074c0727da97804775ee95fd500bbb6a5ad1d) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Images: provenance, attribution, card pictures and an explicit lead image.
  - **`ArticleView` no longer renders the lead image twice.** The body skipped nothing, so the block
    chosen as the hero was rendered again in place. The body now skips it by id. New `hero` prop
    (default `true`); `hero={false}` leaves every image in the body.
  - **Provenance in the schema.** New `media_asset_source` table (`media_asset_id` unique,
    `source_url`, `license_url`, `retrieved_at`), because `creative_commons` alone cannot say CC BY
    4.0 from CC BY-SA 2.0. `media_asset_rights` gets a unique index on `media_asset_id` — one rights
    row per asset — so writes can be `on conflict`. **Existing databases with duplicate rights rows
    must deduplicate before applying the migration.**
  - **Write RPCs** (`03-content-media.sql`): `create_media_asset`, `set_media_asset_rights`,
    `set_media_asset_copy` — an asset, its rights, its source and its alt text / caption / credit in
    one transaction. `SECURITY INVOKER`, so the admin policies still apply.
  - **`validateArticleForPublish` checks image rights.** New optional fourth argument
    `{ imageProvenance, locale, now? }` (a `Map` of asset id to `{ rights, source }`). Reports: no
    rights row, no source, `creative_commons` without a license URL, an expired license, and a
    required credit (always, for `creative_commons`) not written in the locale being published —
    compared with `localeOf`, since `localText` falls back to the default locale. An image block with
    no asset attached is now an error whether or not the option is passed. Callers that do not pass
    the option keep the old alt-text-only behaviour; pass it.
  - **Credit lines link to the license.** `media_asset_rights` is admin-only, so a new public view,
    `media_asset_attribution`, exposes only the source and license URLs of `creative_commons` and
    `public_domain` assets. `MediaFigure` takes `attribution` (credit links to the source, the
    license is named — `CC BY 4.0`, derived from its URL — and linked); `ArticleBlockRenderer` and
    `ArticleView` take `attributions`, a map by asset id. Only http(s) URLs become links.
  - **`ArticleCard` shows a picture.** New `mediaAssets`, `blocks` and `storageBaseUrl` props: large
    on `lead`, a banner on `secondary`, a thumbnail beside the text on `river`, none on `brief`.
    `SectionFront` and `AuthorProfileView` pass them through. No props, no picture, as before.
  - **Explicit lead image.** New nullable `article.lead_media_asset_id`. `selectLeadMediaAssetId`
    (exported from `/publishing`) is the one rule — the editor's choice, else the first image block —
    now shared by `ArticleView`'s hero, the cards, `og:image`/`twitter:image` and the JSON-LD image.
    A social-only crop is not included.
  - `buildArticleMetaTags` now resolves `og:image:alt` / `twitter:image:alt` from the dictionary; it
    previously read an `altText` field that the asset lookup never carried.
  - New exports from `/publishing`: `selectLeadMediaAssetId`, `licenseLabelFromUrl`, `safeHttpUrl`,
    `ImageProvenance`. New view types: `ScreenAttribution`; `SectionPageView` now includes
    `ScreenStorage`; `ArticleRow.blocks` is optional.

### Patch Changes

- Updated dependencies [[`d36230f`](https://github.com/cailenfisher/SvelteBuilder/commit/d36230f9e3a2d7e2d4e69ae91bf671840b4477a7)]:
  - @sveltebuilder/coreui@0.2.1

## 1.0.0

### Patch Changes

- Updated dependencies [[`ca21505`](https://github.com/cailenfisher/SvelteBuilder/commit/ca215055910fc83c8e509f80af791ca3e68cca5d)]:
  - @sveltebuilder/coreui@0.2.0

## 0.1.1

### Patch Changes

- [#15](https://github.com/cailenfisher/SvelteBuilder/pull/15) [`2a36a12`](https://github.com/cailenfisher/SvelteBuilder/commit/2a36a126289147dceb8451d0355245278fd5e535) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Camp 2 components now forward the `dictionary` prop to the Camp 2 components they render, and
  `ArticleCard` asks for the status slug the seed actually writes.

  **Article bodies rendered as `[missing: …]` sentinels on every install before this.** Four composite
  components accepted a `dictionary` prop, used it for their own copy, then rendered child Camp 2
  components without passing it on. The children fell back to `getDictionary()` — the root layout's
  context dictionary, which by design carries only global scope-null copy — so every string resolved by
  a child became a sentinel: every paragraph of every article body, every byline, section label, topic
  tag, image caption and live update. Twelve call sites across `ArticleView`, `ArticleCard`,
  `ArticleBlockRenderer` and `LiveCoverageView`.

  The screens were never at fault. They pass `dictionary={scoped}` correctly; the break was one level
  down, inside the package.

  `ArticleCard` also asked for `article_status:label` while the module's seed writes
  `article_status:name` — as do all four admin screens and every sibling entity (`section`, `topic`,
  `author_profile`, `tag`). `label` belongs to `publish_checklist_item`, a different scope. This one was
  dormant behind `showStatus`, which defaults to false, so only a caller opting into the status badge
  saw it. Two lines above it, `statusVariant` tested for a `ready_to_publish` status the module does not
  seed — the workflow statuses are `pitch`, `draft`, `in_review`, `ready`, `published`, `archived` — so
  the `ready` state never got its badge variant. Both now use the seeded vocabulary, via a lookup that
  falls through to `default` for statuses a project adds itself.

  **Why none of this was caught:** `dictionary` is an optional prop, so omitting it is valid TypeScript
  and `svelte-check` passes. The components had no tests, and no template screen renders them in CI —
  the gap `docs/DEV-KITCHEN.md` describes. `pnpm sql:check` runs no components and `pnpm scaffold:check`
  only typechecks and builds. It took scaffolding a project by hand and reading the page.

  So the package now ships a test suite that renders every Camp 2 component with the dictionary supplied
  as a prop — the way a screen supplies it — and asserts that nothing went missing. It asserts on
  diglossia's `onMissing` hook rather than scanning the HTML for `[missing:`, because a sentinel can land
  somewhere a string scan would plausibly not look, such as `MediaFigure`'s `alt` attribute; the HTML
  scan stays as a backstop. The composite cases additionally assert that child-resolved copy appears in
  the output, which is what actually pins the forwarding. Each of the three defects above was
  re-introduced one at a time to confirm the suite fails on it.

  Also fixes an unused-variable lint error in `buildArticleMetaTags`, where `og:site_name` recomputed
  the publisher name inline instead of using the one already in scope. No behaviour change — it was the
  same expression — but it left `pnpm lint` red for the package.

## 0.1.0

### Minor Changes

- [#13](https://github.com/cailenfisher/SvelteBuilder/pull/13) [`82a7349`](https://github.com/cailenfisher/SvelteBuilder/commit/82a7349fc2d0502704adbb2765c4f0565e888314) Thanks [@cailenfisher](https://github.com/cailenfisher)! - The content module gains row level security, a seed, and its route code as five screen bundles.

  **Security fix — read this one.** All 27 of the module's tables shipped with row level security
  disabled. Supabase's bootstrap grants give anon and authenticated full privileges on everything in
  `public`, so anyone holding the publishable key could read and write every one of them, including
  `subscriber`, `comment` and `newsletter_subscription`. It was verified exploitable, not theorised: as
  the anon role, inserting a row into `subscriber` and then deleting every row both succeeded. Any
  project scaffolded with this module before this release should treat its content tables as having been
  publicly writable.

  Published editorial content is now world-readable; editorial workflow, media licensing terms, preview
  tokens and subscriber PII are admin-only; comments are readable once approved and insertable only as
  pending. Two seams needed SECURITY DEFINER functions rather than policies: newsletter signup, because
  a table anon can insert into is a table anon can probe for membership, and preview-by-link, because a
  policy cannot see which token a request presented and so would have to admit every draft with an
  outstanding link.

  **The module also shipped no seed**, which made it inert rather than empty — every public query
  resolves the slug `'published'` through `article_status`, and with no rows there was no such status.
  The seed now provides the workflow statuses, the publish checklist, a publisher identity for the
  feeds, taxonomy, a newsletter, and one sample article, in English and French.

  **Five screen bundles**: article (body, bylines, comments, OG/Twitter meta, NewsArticle JSON-LD),
  section (lead-plus-river listing with paging), feeds (RSS, sitemap, news sitemap), preview (an
  unpublished article behind an expiring link), admin-article (every status, the publish checklist,
  workflow transitions). Every loader queries `event.locals.supabase`, and
  `@sveltebuilder/content/views` exports the screen contracts.

  **Types narrowed.** `ArticleView`'s prop, `ArticleForStructuredData`, `RssFeedArticle`,
  `NewsSitemapArticle` and `validateArticleForPublish` each demanded resolved copy their own code never
  read, while already taking a `DictionaryInstance` and resolving the headline through it. Everything
  resolves through the dictionary now. That is a behaviour fix as well as a cleanup:
  `validateArticleForPublish` was validating whichever locale a query happened to resolve, and now
  treats a missing translation as missing — so publishing a half-translated article is caught.
  `ArticleWithRelations` and `ArticleRenderable` replace the five ad-hoc shapes; any `ArticleWithCopy`
  still satisfies them.

  **Also fixed:** `storageBaseUrl` was referenced by the old article screen and returned by no loader,
  so every media URL was built against `undefined`. `create_local_text_entry` hardcoded `entity_id` to
  null, so no caller could create entity-bound copy such as an article's headline; it takes an optional
  entity id now. coreui's `Checkbox` had no change callback, which a checklist row needs — it gains
  `onCheckedChange`. The article screen mutated the dictionary the root layout puts in context, shared
  across a server request and accumulating on the client; each screen builds its own request-scoped
  instance.

  **Gates.** `pnpm sql:check` asserts that every table in `public` has RLS and that every RLS-enabled
  table has at least one policy — the check that would have caught the finding above, which nothing
  else could: a table with no policies is valid SQL, typechecks nowhere, and behaves correctly in any
  test running as an owner. It also gains a content assertion file written from the attacker's side. The
  screen-bundle suite understands endpoint routes, and `scaffold:check` gains a content-no-screens case.

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

### Patch Changes

- Updated dependencies [[`82a7349`](https://github.com/cailenfisher/SvelteBuilder/commit/82a7349fc2d0502704adbb2765c4f0565e888314)]:
  - @sveltebuilder/coreui@0.1.1

## 0.0.6

### Patch Changes

- Updated dependencies []:
  - @sveltebuilder/coreui@0.1.0
