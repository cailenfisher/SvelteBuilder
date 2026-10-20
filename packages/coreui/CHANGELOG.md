# @sveltebuilder/coreui

## 1.0.0-rc.1

### Minor Changes

- [#47](https://github.com/cailenfisher/SvelteBuilder/pull/47) [`9763d7b`](https://github.com/cailenfisher/SvelteBuilder/commit/9763d7badb9ab3b116906de32aaf41c6115535e8) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Logistic adopts roles and permissions (docs/ACCESS-CONTROL.md §7).

  **Breaking (logistic):** a signed-in user with no logistic role now reads nothing and does no floor work; before, any signed-in user could read every logistic table and pick, receive and count. Give existing staff the new Warehouse operator role as soon as you upgrade (`docs/MIGRATION-2.0.md`). The logistic RPCs no longer take the acting user account: `logistic_receive_receipt_line`, `_record_picked_quantity`, `_complete_pick_task`, `_grade_return_line`, `_approve_cycle_count`, `_create_shipment`, `_create_return_authorization` and `_create_cycle_count` read it from the session, and the old signatures are dropped. The stock primitives (`logistic_adjust_stock` and the rest) can no longer be called through the API; adjust stock with `logistic_adjust_stock_level`, which checks `stock_level.adjust`. Workers no longer update lines directly, so a pick line's requested quantity cannot be rewritten.

  Logistic's manifest declares its permission catalog, with the verbs `adjust`, `receive`, `pick`, `grade`, `count` and `approve`, and its seed adds the Logistics manager and Warehouse operator roles and their menu entries. Every policy grants by permission, and children follow their parent. The admin views gain optional `actions`, and coreui exports the `ScreenAction` type they share.

  Scaffolds: the logistic admin screens require their scope and show only the controls the reader may use; the warehouse admits anyone holding a picking, receiving or counting permission. `require-administrator.ts` is now `require-access.ts`, with `requireScope` beside `requireAdministrator`, and `current_user_actions(scope)` joins the core access SQL.

- [#47](https://github.com/cailenfisher/SvelteBuilder/pull/47) [`23bace2`](https://github.com/cailenfisher/SvelteBuilder/commit/23bace235634b0af84f3c65816db5ed8a09ffd02) Thanks [@cailenfisher](https://github.com/cailenfisher)! - New `CheckboxMatrix`: a table of checkboxes, one per row-and-column pair, such as a role's permissions with kinds of thing down the side and actions across the top. Each box is named by its row and column headers; a cell held through something else renders checked and read-only, with its source as visible text and as the box's description; a read-only matrix toggles and submits nothing. Exports `CheckboxMatrixRow`, `CheckboxMatrixColumn` and `CheckboxMatrixCell`.

  `Checkbox` takes three new optional props: `readonly` (focusable, announced, not toggleable), `aria-labelledby` and `aria-describedby`.

## 1.0.0-rc.0

### Major Changes

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

- [#41](https://github.com/cailenfisher/SvelteBuilder/pull/41) [`7799af6`](https://github.com/cailenfisher/SvelteBuilder/commit/7799af683f657b095a4c58021577c0343078748a) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `useField()` returns `FieldControl`: the five attributes a control puts on its focusable element,
  under their HTML names (`id`, `aria-describedby`, `aria-invalid`, `required`, `disabled`), so a
  custom control can spread it. `FieldContext` is no longer exported. `Field` works out the
  description once, so a control with its own `error` (`Input`, `Textarea`, `Select`) is still
  marked invalid but never points `aria-describedby` at an error message the `Field` did not render.
  logistic's `BarcodeInput` uses the new shape.

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

## 0.2.4

### Patch Changes

- [#39](https://github.com/cailenfisher/SvelteBuilder/pull/39) [`6abeb5f`](https://github.com/cailenfisher/SvelteBuilder/commit/6abeb5f2a08f36c842f390f21c681d1ca150e6f8) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Non-breaking fixes from the coreui 1.0 API audit:
  - `Drawer` and `LocaleSwitcher` generate their element ids, so two on one page no longer share an id.
  - `Switch` inside a `Field` takes the Field's id, hint or error description, `required`, `disabled` and error state, so the Field's label names it. `RadioGroup` inside a `Field` is labelled by it. `DateTimePicker` is described only by the hint or error the Field actually renders.
  - `MenuLabel` outside a `MenuGroup` or `MenuRadioGroup` renders a plain label instead of throwing and emptying the menu.
  - New change callbacks: `onCheckedChange` on `Switch` and `MenuCheckboxItem`; `onValueChange` on `RadioGroup`, `Select`, `Tabs`, `Accordion` and `MenuRadioGroup`; `onOpenChange` on `Dialog`, `Popover`, `Menu` and `ConfirmDialog`.
  - `class` on `ConfirmDialog`, `Toast`, `ToastRegion`, `MessageAriaLive` and `LocaleSwitcher`.
  - `FieldContext`, the type `useField()` returns, is exported.
  - `@internationalized/date` is declared as a peer dependency, matching bits-ui's.
  - Component styles use logical properties, so menus, tables, tabs and toasts mirror correctly in right-to-left layouts.

## 0.2.3

### Patch Changes

- [#34](https://github.com/cailenfisher/SvelteBuilder/pull/34) [`2531d4d`](https://github.com/cailenfisher/SvelteBuilder/commit/2531d4d3944843337da02f7691b45b587219559d) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Fix the WCAG 2.2 A and AA failures the first automated audit of every component found. Several of them changed what keyboard and screen-reader users could do at all.

  **Keyboard.** The built-in triggers of `Dialog`, `Menu`, `Popover` and `Tooltip` were `display: contents`, which in Chromium takes a button out of the focus order, so none of those overlays could be opened from the keyboard. They are now real, styled-away buttons that look the same. `Drawer`'s trigger gets the same treatment.

  **Labels and roles.** A `Select` inside a `Field` was never associated with the Field's label. It is now a select-only combobox (`role="combobox"`) named by the label plus its current value, described by the Field's hint or error, and pointing at its listbox, which is named too. `Field` exposes a `labelId` in its context for that. `ToastRegion` is a named `region` landmark rather than a role-less `div` with an `aria-label`. `BlockEditor` no longer puts an `aria-label` on a list item. `MenuLabel` documents that it must sit inside a `MenuGroup` or `MenuRadioGroup`; outside one it throws, taking the whole menu with it.

  **Contrast.** Derived color tokens hold 4.5:1 for any base color, not only the defaults:
  - `--*-text` (and `--link-text`) are the family's hue at a fixed OKLCH lightness (0.48 light, 0.80 dark) instead of a 10% mix toward black, which left the scaffold's `#45b1e8` brand at 2.4:1.
  - `--*-fg`, the text on a solid fill, is black or white by the fill's WCAG luminance, computed in CSS, so it is the better of the two for every color.
  - `--text-soft` and `--text-muted` sit at fixed lightnesses that pass on `--surface` and `--surface-raised`.
  - Focus rings use `--brand-text`, which clears the 3:1 that WCAG 1.4.11 requires of an indicator. Plain links take `--link-text`; they previously kept the browser's default blue, which measures 1.9:1 in dark mode.
  - Notification and banner detail text, toggles and actions are no longer dimmed with opacity.
  - `Button`'s inner text no longer picks up the form `Label`'s color through a shared `.label` class.

  The derived tokens use CSS relative color syntax (`oklch(from …)`, `color(from … srgb-linear …)`), supported in every evergreen browser since 2024.

  **Light mode.** `data-color-scheme="light"` now forces light tokens. Before, it did nothing on a system set to dark.

  The `bits-ui` peer range rises to `^2.19.5`. In 2.18.1, `DropdownMenu.Content` rendered without its `id`, so a `Menu` trigger's `aria-controls` pointed at nothing.

- [#34](https://github.com/cailenfisher/SvelteBuilder/pull/34) [`3a8f724`](https://github.com/cailenfisher/SvelteBuilder/commit/3a8f7242e577483502cdf4a7ef91c7a1f787eba0) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Fix the defects a first `svelte-check` over each package found.

  coreui: `Tooltip`'s `delay` prop now takes effect. It was passed to bits-ui as `openDelay`, which bits-ui v2 does not accept, so every tooltip opened after bits-ui's default 700ms. `Button` declares `disabled` for links as well as buttons, and `EditorBlock` declares the `mediaAssetId` that `BlockEditor` already read.

  content: `BlockEditorHost` now works. It mapped blocks with `type` instead of `blockType`, dropped `position`, and listened for an `onChange` that `BlockEditor` never emits, so no edit reached the parent. `ArticleWorkflowPanel` uses coreui's actual `Drawer`, `Tabs`, `Button` and `Checkbox` APIs; its tabs never switched before. `SectionFront` and `AuthorProfileView` pass `ArticleCard` its required `status` and forward `dictionary`, without which entity copy fell back to context and rendered as `[missing: …]`. `NewsletterSignup`'s submit button passes its label as children. `Button` has no `label` prop, so it was rendering an undefined `children` snippet. Finally, `FrontCurationBoard` uses a `Badge` variant that exists.

## 0.2.2

### Patch Changes

- [#32](https://github.com/cailenfisher/SvelteBuilder/pull/32) [`c31704e`](https://github.com/cailenfisher/SvelteBuilder/commit/c31704e944d3e5c6a2138d1db66b8aab67c6b0c4) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Bump diglossia to ^0.2.0. The `diglossia` peer range on content and logistic moves from `^0.1.0` to `^0.2.0`. 0.2.0 only adds to the API (`subscribe()`/`getVersion()` on `DictionaryInstance`, reactive `merge()` on the instance passed to `setDictionary()`, and a `formatText` that no longer throws on malformed MF2), so no consumer code changes.

## 0.2.1

### Patch Changes

- [#27](https://github.com/cailenfisher/SvelteBuilder/pull/27) [`d36230f`](https://github.com/cailenfisher/SvelteBuilder/commit/d36230f9e3a2d7e2d4e69ae91bf671840b4477a7) Thanks [@cailenfisher](https://github.com/cailenfisher)! - `Select`: the closed trigger shows the selected item's label, not its value. Bits UI resolves the
  trigger text from items that are mounted, and the list is portaled and unmounted until it opens, so
  a Select with a preselected value showed `all_rights_reserved` instead of "All rights reserved"
  until the user opened it. Select now renders its children once in a silent registration pass in
  which each `SelectItem` reports its label, and passes the result to Bits UI as `items`. No change
  to the `Select` / `SelectItem` API.

## 0.2.0

### Minor Changes

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

## 0.1.0

### Minor Changes

- Republish to bring npm in sync with the source: the diglossia extraction (dropped the stale
  `@sveltebuilder/hermes` peer dependency) and the messaging system rewrite (`createMessageBus` /
  `setMessageBus` / `getMessageBus`, replacing the old module-level `messageBus` singleton) landed
  in the repo without a version bump. The last published `0.0.15` still ships the pre-rewrite code,
  which breaks the base scaffold template's root layout (`setMessageBus(createMessageBus())` —
  `createMessageBus` doesn't exist in that build) on first render of every freshly scaffolded
  project.
