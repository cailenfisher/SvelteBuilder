# create-sveltebuilder

## 0.2.0-rc.1

### Patch Changes

- [#43](https://github.com/cailenfisher/SvelteBuilder/pull/43) [`fe6c120`](https://github.com/cailenfisher/SvelteBuilder/commit/fe6c120da073b1cc9c6bb6c43c0d3a6a21a12072) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Scaffolds now depend on the SvelteBuilder packages of the release that created them, pinned as `^<version>`, instead of `latest`. Under a prerelease `latest` meant the previous major: `npm create sveltebuilder@rc` installed 1.x packages under 2.0 templates and the project failed `svelte-check` with 201 errors.

  Scaffolds also get their `.gitignore` again. npm never publishes a file named `.gitignore`, so it was missing from every project created from the published package, and a first `git add .` committed `.env`. The template now stores it as `gitignore` and the CLI renames it.

- Updated dependencies [[`fe6c120`](https://github.com/cailenfisher/SvelteBuilder/commit/fe6c120da073b1cc9c6bb6c43c0d3a6a21a12072)]:
  - @sveltebuilder/cli@0.0.16-rc.1

## 0.2.0-rc.0

### Minor Changes

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

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`a9769d6`](https://github.com/cailenfisher/SvelteBuilder/commit/a9769d6be19db5d96bf50c453c25cee49c5cc566) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Scaffolded projects reach the database through data modules, one per table, instead of building
  queries in route files. Selecting a module now also copies its data modules to
  `src/lib/server/<module>/` (`inbound-receipt.ts`, `inbound-receipt-line.ts`, …), whether or not any
  of its screens are chosen, and the SuperPrototype template's own routes use `locale.ts`,
  `local-text.ts`, `navigation-item.ts` and `user-account.ts` in `src/lib/server/`. Each function
  takes the request's Supabase client, so RLS still applies, and returns supabase-js's
  `{ data, error }` with the rows already in camelCase. Routes check the error and decide what it
  means, exactly as before.

  `toOne` is no longer copied into each loader; `toLocale`, `LOCALE_COLUMNS` and
  `toDictionaryPayload` moved from `$lib/server/postgrest` into the data modules that use them. The
  article admin screen's publish check now answers a failed read with a 500 rather than reporting the
  article as not found.

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

- Updated dependencies []:
  - @sveltebuilder/cli@0.0.16-rc.0

## 0.1.4

### Patch Changes

- [#34](https://github.com/cailenfisher/SvelteBuilder/pull/34) [`06a3f67`](https://github.com/cailenfisher/SvelteBuilder/commit/06a3f67601354f2cd98bb1557ee2a114eedc00e6) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Fix what rendering every content component for the first time found.
  - **Missing copy.** `NewsletterSignup` and `ArticleWorkflowPanel` ask for twelve module-scoped slugs (`newsletter.*`, `action.*`) that the content seed never created, so both rendered `[missing: …]` for every label and button. The seed now provides them in English and French. The screen-bundle suite now checks every module-scoped slug a module's components render, not only the ones its screens do.
  - **Contrast.** `SectionLabel`, `AuthorProfileView`, `LiveCoverageView`, `NewsletterSignup`, `FrontCurationBoard` and `ArticleWorkflowPanel` used raw `--brand`, `--danger` and `--success` as text colors; they use the `-text` variants now. A pinned `LiveUpdateItem` mixed its background with white, which in dark mode put light text on a near-white panel; it uses `--brand-soft`.
  - **`BlockEditorHost`** no longer asks the dictionary for the text of image, video and embed blocks, which logged a missing key for every media block in an article.

- [#34](https://github.com/cailenfisher/SvelteBuilder/pull/34) [`29badab`](https://github.com/cailenfisher/SvelteBuilder/commit/29badabfb76c89e54b315f6df7cd5e3dfbe9d73f) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Scaffolded apps now declare their page language. `app.html` has always carried `<html lang="%sveltekit.lang%">`, but that is not a placeholder SvelteKit fills on its own, and no hook replaced it, so every page shipped the literal string as its language (a WCAG 3.1.1 failure). Both templates' `hooks.server.ts` now fill it with the resolved locale code through `transformPageChunk`. In the base template the code comes from a cookie or header, so it is only used when shaped like a language tag.

  The root layout also no longer raises svelte's `state_referenced_locally` warning in `pnpm check`. Capturing the first `data.dictionary` is intended, since a locale switch is a full page load.

## 0.1.3

### Patch Changes

- [#30](https://github.com/cailenfisher/SvelteBuilder/pull/30) [`6d9a709`](https://github.com/cailenfisher/SvelteBuilder/commit/6d9a709f01a10129d70b1677cfb43f21c484356b) Thanks [@cailenfisher](https://github.com/cailenfisher)! - SuperPrototype scaffolds now ship a Supabase-specific `CLAUDE.md` (data access, RLS policies, RPCs, auth, seeds, localization, coreui and a definition of done) instead of the provider-neutral base one. The template README now documents promoting administrators through `admin_set_user_admin()`, the sign-in setup, and the schema change loop.

## 0.1.2

### Patch Changes

- [#25](https://github.com/cailenfisher/SvelteBuilder/pull/25) [`ca21505`](https://github.com/cailenfisher/SvelteBuilder/commit/ca215055910fc83c8e509f80af791ca3e68cca5d) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `ConfirmDialog` is now built on Bits UI's `AlertDialog`, and coreui's remaining hardcoded English
  labels become props.

  **ConfirmDialog.** It composed the general `Dialog`, so it rendered as `role="dialog"` and an
  outside click dismissed it — a stray click could stand in for an answer to a destructive
  confirmation. As an `AlertDialog` it is announced as an alert dialog and ignores outside clicks.
  It no longer shows a close button (cancel is the way out), Escape is ignored while `loading`, and
  `onCancel` now also fires on Escape, not only on the cancel button.

  **Labels.** `Dialog` and `Drawer` take `closeLabel`; `Pagination` takes `previousLabel`,
  `nextLabel` and `label`. The message surfaces share a new `MessageLabels` set passed once as
  `createMessageBus({ labels })` and read from context by `Toast`, `ToastRegion`, `Banner` and
  `InlineNotification`. Every label defaults to its previous English text, so existing callers are
  unaffected. `Dialog` also drops the hidden "{title} dialog" description it rendered when no
  `description` was given.

  The base scaffold passes localized labels for all of these, from eight new `message.*` base slugs
  seeded in English and French.

## 0.1.1

### Patch Changes

- [#17](https://github.com/cailenfisher/SvelteBuilder/pull/17) [`6f94556`](https://github.com/cailenfisher/SvelteBuilder/commit/6f94556a5bb311ba05ef997c00737d6f3ba9e1b7) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Bring the Logistic module's RLS policies onto the sanctioned shape, and make the gate that should
  have caught the drift actually run.

  **The policies.** All 40 of the module's policies called `public.current_user_id()` bare rather than
  as `(select …)`, and the 15 admin policies re-implemented the admin check as an inline
  `exists (select 1 from public.user_account where id = … and admin)` instead of calling
  `public.current_user_admin()`. The 37 bare calls are now wrapped and the inline checks replaced.

  The inline form was the one with teeth. It runs as the caller, so it re-enters `user_account`'s own
  policies and resolved only because `user_account_owner_read` admits exactly the row it asked for
  (`(select public.current_user_id()) = id`). Narrowing that policy later — gating it on an active
  flag, say — would have made all 15 admin policies deny admins, with nothing to point at.
  `current_user_admin()` is SECURITY DEFINER and does not have the problem. The file's own header
  comment had prescribed the inline form as the target, so it is replaced with the three conventions.

  **A new assertion.** `pnpm sql:check` now checks policy _shape_ across every policy in `public`: that
  no policy calls an identity helper bare, and that none tests `user_account.admin` inline. Both
  anti-patterns typecheck nowhere, pass every other assertion, and behave correctly in any test that
  runs as a single principal. Verified in both directions — it names all 20 drifted policies when the
  old definitions are restored.

  **`sync:supabase` resolved the wrong project root under any package manager.** It consulted
  `INIT_CWD` ahead of `process.cwd()`. A package manager sets `INIT_CWD` to the directory the user
  typed the command in, not the project root, and every grandchild process inherits it — so the CLI,
  spawned by a script in some other directory, was silently redirected back to wherever the outer
  command started, found no manifests, and generated nothing. With an empty registry it then warned
  and returned 0, so callers reported success. Root resolution is now `root ?? process.cwd()`, an
  empty registry is a hard error, and the CLI's commands exit non-zero on a thrown error instead of
  surfacing an unhandled rejection.

  The effect was that `pnpm sql:check` could not get past its own `sync:supabase` step, and
  `pnpm scaffold:check`, which never asserts that migrations were produced, ran that step as a no-op
  while reporting it green.

- Updated dependencies [[`6f94556`](https://github.com/cailenfisher/SvelteBuilder/commit/6f94556a5bb311ba05ef997c00737d6f3ba9e1b7)]:
  - @sveltebuilder/cli@0.0.15

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

- [#13](https://github.com/cailenfisher/SvelteBuilder/pull/13) [`5ce8545`](https://github.com/cailenfisher/SvelteBuilder/commit/5ce8545d7d1d0598b50f21503c8c273391a50cd1) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Non-interactive flags, a scaffold-and-build CI gate, and module availability read from the tree.

  **Flags.** `--template`, `--pm`, `--modules`, and `--screens` each skip their prompt, so supplying all
  of them makes a run fully non-interactive. Useful to anyone scripting project creation, and required by
  the new CI gate — driving a TUI by feeding keystrokes to a pseudo-terminal works right up until a
  prompt is added or reordered.

  **`pnpm scaffold:check`.** Scaffolds real projects from the template tree and checks each typechecks
  and builds, across four cases: bare, content, logistic with all screens, and logistic with none. This
  closes the gap that let the Logistic module ship a scaffold which could not typecheck, from the day
  SuperPrototype moved to PostgREST until a manual smoke test found it — templates are inert text until
  the CLI copies them, so no package test could reach them. It runs as a GitHub Actions matrix on pushes
  to main and dev and on pull requests.

  The harness links the workspace packages into each project rather than installing them from npm:
  templates are written against the packages in this repo, which are usually ahead of the registry, so
  verifying against published copies would mean the gate can never check an unreleased change. Verified
  by deliberately reintroducing the original bug (`locals.supabase` → `locals.db`), which the gate
  catches at the `check` step — `build` passes straight over it, since Vite does not typecheck.

  **Module availability is now data-driven.** The Logistic gate is removed. It existed because the
  module's route templates called a data layer SuperPrototype had dropped, and what actually fixed that
  was moving the unported ones into `screens/_unported/`, which the CLI never copies. Each module's hint
  now reports its screen coverage read from the template tree — how many bundles exist, and whether more
  are pending — so a module becomes more capable as bundles land with nothing here to maintain by hand. A
  module with no bundles is still perfectly installable; it brings schema, components and SQL rather than
  pages.

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

- [#12](https://github.com/cailenfisher/SvelteBuilder/pull/12) [`aeafa62`](https://github.com/cailenfisher/SvelteBuilder/commit/aeafa627f550457932593f98652a761ef375d6e1) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Scaffold SuperPrototype as a Supabase-native application, and gate the two options that no longer
  work with it.

  **SuperPrototype's data layer is now PostgREST.** Every admin route, API endpoint, and auth guard in
  the generated project queries through `event.locals.supabase` — a per-request `@supabase/ssr` client
  built from the request's own cookies — instead of a Drizzle handle over a direct Postgres connection.
  The generated project no longer contains `src/lib/server/db/client.ts`, `with-user.ts`, or a
  `DATABASE_URL`.

  This is a correctness fix, not a preference. A direct connection runs as a role that owns the tables,
  and Postgres skips row-level security entirely for table owners — so every RLS policy the scaffold
  shipped was silently inert. Going through PostgREST means the user's JWT reaches Postgres and policies
  apply to every query without the application arranging anything.

  Alongside it: `getClaims()` for route guards (verifying the token against cached JWKS rather than
  calling the Auth server), the publishable key in place of the legacy anon key, `SECURITY INVOKER` RPCs
  for writes that span more than one statement, and `ensure_user_account()` provisioning the domain
  principal in SQL so the first-user-is-admin check cannot run under RLS and grant admin to everyone.

  **Two options are gated in the interactive CLI, and both say so when selected rather than scaffolding
  something broken:**
  - The **Native** template is on hold. Its `withUser` + Drizzle pattern is what SuperPrototype moved
    away from, and its RLS enforcement has the same table-owner defect.
  - The **Logistic** module is on hold. Its route templates call `locals.db.withUser()`, the handle
    SuperPrototype dropped, so scaffolding them produced a project that did not typecheck. The
    underlying design question — how domain modules should deliver route code across templates — is
    explored in `docs/MODULE-ROUTES.md`.

  Content and coreui are unaffected.

### Patch Changes

- [#13](https://github.com/cailenfisher/SvelteBuilder/pull/13) [`1148d30`](https://github.com/cailenfisher/SvelteBuilder/commit/1148d302cebcba05d0cf9d447771d95d784139e8) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Pin the scaffold's third-party dependencies, and fix the 12 type errors that pinning revealed.

  Every dependency in the base template was `"latest"`. That resolved `typescript` to 7.0.2, which
  svelte-check 4 refuses outright unless TypeScript 6 is installed alongside it and it is run with
  `--tsgo` — so `pnpm check` could not run at all in a scaffolded project, and had not been able to for
  some time. Third-party deps are now pinned to the majors verified working end to end (svelte 5, Kit 2,
  Vite 8, svelte-check 4, TypeScript 5.9, `@supabase/*`). First-party packages stay on `"latest"`: they
  are released from this repo and a new scaffold should pick up current module code.

  With `svelte-check` able to run again it reported 12 errors in the scaffold's own admin routes, all
  pre-existing and all previously invisible. A scaffolded project now typechecks with 0 errors.

  One was a live bug rather than a typing complaint: the admin layout read `item.local_text_link` while
  its loader returned `localTextLink`, so every sidebar nav label silently fell back to showing the raw
  href instead of its translation.

  The rest were three patterns, now fixed at the source in a new `src/lib/server/postgrest.ts`:
  - **To-one embeds typed as arrays.** supabase-js types every PostgREST embed as an array without
    generated database types, so `local_text_link(...)` came back typed `[]` while being an object at
    runtime. `toOne()` narrows it, and documents why.
  - **Partial `locale` selects.** Three loaders selected `id, code, native_name` and passed the result
    where a full `Locale` was expected. `LOCALE_COLUMNS` and `toLocale()` keep the select and the
    boundary mapping together.
  - **Untyped dictionary rows.** The three `/api/local-text` endpoints each hand-rolled the same
    snake_case→camelCase map with an implicitly-`any` row. `toDictionaryPayload()` replaces all three.

  Also fixes an accessibility bug in the navigation-item editor: a `Checkbox` was wrapped in a `Field`
  with a label, but `Checkbox` is self-labelling — it renders its own `<label>` around the control. The
  result was one `<label>` nested inside another with the outer one's `for` pointing at no element. It
  now takes `label` directly.

- [#11](https://github.com/cailenfisher/SvelteBuilder/pull/11) [`6d94cf8`](https://github.com/cailenfisher/SvelteBuilder/commit/6d94cf873d1d1193c21411cba5a7dd373830b35f) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Give each scaffolded project its own Supabase `project_id`.

  The SuperPrototype template's `supabase/config.toml` had no `project_id`, so the CLI fell back to
  naming the local Docker containers after the working directory. The template now declares the key and
  the scaffolder rewrites it to the project name, so containers are `supabase_db_<project-name>` and a
  folder rename no longer moves the stack out from under a project.

- Updated dependencies [[`99b6a39`](https://github.com/cailenfisher/SvelteBuilder/commit/99b6a39abb4483d5646a78dad81d229808f8d598)]:
  - @sveltebuilder/cli@0.0.14
