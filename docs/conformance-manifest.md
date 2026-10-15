# Conformance manifest

The approved name list for [`CONFORMANCE-PLAN.md`](./CONFORMANCE-PLAN.md). Every rename in Phases 3–12 comes from this file. A name not listed here is added as **pending** and approved before its phase closes.

**Approved 2026-10-13**: every `proposed` entry, every recommendation in the decisions section, and the resolutions recorded in the pending rows below.

Inventoried 2026-10-13 against `main` at `63d8dcd`.

**Status:** `proposed` means verified against the code and ready to approve. `pending` means the right name is a judgment call and needs your answer. `decision` means it waits on an entry in the decisions section at the end.

**Layers key:** `db` table, column or enum · `type` TypeScript type · `view` view-model type · `cmp` component · `css` class · `route` route or screen id · `slug` copy slug and seed · `dk` dev-kitchen page and `catalog.ts` · `doc` README, CLAUDE.md, docs

---

## Logistic

### Screens and routes

| Old | New | Layers | Status |
| --- | --- | --- | --- |
| screen `receipt`, route `/admin/logistic/receipt[/[id]]` | `inbound-receipt`, `/admin/logistic/inbound-receipt[/[id]]` | route, manifest, `dashboard.requires`, scaffold-check, test, doc | proposed |
| screen `return`, route `/admin/logistic/return[/[id]]` | `return-authorization`, `/admin/logistic/return-authorization[/[id]]` | same | proposed |
| screen `stock`, route `/admin/logistic/stock` | `stock-level`, `/admin/logistic/stock-level` | same | proposed |
| route `/warehouse/pick[/[id]]` | `/warehouse/pick-task[/[id]]` | route, manifest, links | decision D3 |
| route `/warehouse/receive[/[id]]` | `/warehouse/inbound-receipt[/[id]]` | route, manifest, links | decision D3 |
| route `/warehouse/count[/[id]]` | `/warehouse/cycle-count[/[id]]` | route, manifest, links | decision D3 |
| form action `addLine`, `receiveLine` (inbound receipt) | `addInboundReceiptLine`, `receiveInboundReceiptLine` | route, manifest | approved; the same rule applies to every bundle's actions and fields in Phase 8 |
| form field `line_id` | `inbound_receipt_line_id` | route, manifest | approved |

Screens `supplier`, `shipment`, `cycle-count`, `warehouse` and `dashboard` already conform.

### Components

| Old | New | Layers | Status |
| --- | --- | --- | --- |
| `ReceiptCard`, `.receipt-card` | `InboundReceiptCard`, `.inbound-receipt-card` | cmp, css, dk, test, doc | proposed |
| `PickTaskStatusBadge`, `ShipmentStatusBadge`, `ReturnConditionBadge` | keep names; wrap `Badge` instead of `StatusBadge` | cmp | proposed (audit B4) |

### View-model types (`views.ts`)

| Old | New | Status |
| --- | --- | --- |
| `StockListView` | `StockLevelListView` | proposed |
| `ReturnListView`, `ReturnDetailView` | `ReturnAuthorizationListView`, `ReturnAuthorizationDetailView` | proposed |
| `PickQueueView` | `PickTaskWarehouseQueueView` | decision D3 |
| `PickTaskDetailView` (warehouse) | `PickTaskWarehouseDetailView` | decision D3 |
| `ReceiveQueueView`, `ReceiveDetailView` | `InboundReceiptWarehouseQueueView`, `InboundReceiptWarehouseDetailView` | decision D3 |
| `CountQueueView`, `CountDetailView` | `CycleCountWarehouseQueueView`, `CycleCountWarehouseDetailView` | decision D3 |
| `LocationOption` | `StorageLocationOption` | proposed |
| `EntityOption` | keep. It is the shared shape of every `<Select>` option (`id`, `slug`), and "entity" is the repo's own term for a row that copy links to (`entity_id`). | proposed (keep) |
| `ScreenCopy`, `ScreenLocale`, `ScreenPage`, `ScreenFormResult` | declared once, not per module | decision D16 |
| field `LogisticMetrics.pendingReceiptCount` | `pendingInboundReceiptCount` | proposed |
| field `LogisticMetrics.openReturnCount` | `openReturnAuthorizationCount` | proposed |
| field `LogisticDashboardView.pendingReceipts`, `openReturns` | `pendingInboundReceipts`, `openReturnAuthorizations` | proposed |
| field `StockLevelListView.levels`, `history`, `historyId` | `stockLevels`, `stockAdjustments`, `historyStockLevelId` | proposed |
| field `PickQueueView.myTasks`, `openTasks` | `myPickTasks`, `openPickTasks` | proposed |
| field `ReceiveQueueView.active`, `recent` | `activeInboundReceipts`, `recentInboundReceipts` | proposed |
| field `CountQueueView.myCounts`, `openCounts` | `myCycleCounts`, `openCycleCounts` | proposed |
| field `ReceiveDetailView.receipt`, `PickTaskDetailView.task` | `inboundReceipt`, `pickTask` | proposed |

### Schema

| Old | New | Layers | Status |
| --- | --- | --- | --- |
| enum `adjustment_reason` / `AdjustmentReason` | `stock_adjustment_reason` / `StockAdjustmentReason` | db (`ALTER TYPE … RENAME`), type, slug | proposed |
| `inbound_receipt_status` value `complete` | `completed` | db, type, slug | decision D1 |
| `cycle_count_status` value `complete` | `completed` | db, type, slug | decision D1 |
| `storage_location.sort_order` | see D12 | db, type | decision D12 |
| `tracking_event.description`, `tracking_event.status` (text) | keep. Carrier-supplied data, not copy, so guardrail 2 does not apply; record it as a documented deviation beside `supplier_contact.name` | doc | proposed (keep) |
| `src/lib/schema.ts` + hand-written `src/lib/schema/index.ts` | one `schema/` folder per D10, types inferred | type | decision D10 |

### Copy slugs

All live in scope `logistic`. Both seeded locales (en, fr) and every `manifest.json` `copySlugs` list change with them.

| Old prefix | New prefix | Status |
| --- | --- | --- |
| `logistic.receipt.*` (18) | `logistic.inbound_receipt.*` (joins the 5 already there) | proposed |
| `logistic.return.*` (28) | `logistic.return_authorization.*` | proposed |
| `logistic.stock.*` (14) | `logistic.stock_level.*` | proposed |
| `logistic.pick.*` (13) | `logistic.pick_task.*` | proposed |
| `logistic.count.*` (8) | `logistic.cycle_count.*` | proposed |
| `logistic.receive.*` (6) | `logistic.inbound_receipt.*`, warehouse-only ones as `logistic.warehouse.inbound_receipt.*` | decision D3 |
| `logistic.warehouse.pick`, `.receive`, `.count` (+ `.hint`) | `logistic.warehouse.pick_task`, `.inbound_receipt`, `.cycle_count` | decision D3 |
| `logistic.location_type.*` | `logistic.storage_location_type.*` | proposed |
| `logistic.adjustment_reason.*` | `logistic.stock_adjustment_reason.*` | proposed |
| `logistic.field.location`, `logistic.field.location_type` | `logistic.field.storage_location`, `logistic.field.storage_location_type` | proposed |
| `logistic.admin.dashboard.title` | `logistic.dashboard.title` (one prefix for the dashboard) | proposed |
| `logistic.dashboard.pending_receipts`, `open_picks`, `open_returns` | `pending_inbound_receipt`, `open_pick_task`, `open_return_authorization` | proposed |
| `logistic.admin.nav.*` (8) | keep, labels per D13. **Corrected in Phase 8:** Phase 0 recorded these as never rendered and approved deleting them, but the logistic dashboard renders them as its section links; the inventory search missed that file | corrected |
| English labels "Receiving", "Returns", "Stock", "Locations" | "Inbound receipts", "Return authorizations", "Stock levels", "Storage locations" (and French equivalents) | decision D13 |

### dev-kitchen

| Old | New | Status |
| --- | --- | --- |
| `/dev/logistic/receipt` | `/dev/logistic/inbound-receipt` | proposed |
| `/dev/logistic/tracking` | `/dev/logistic/tracking-event` | proposed |
| `/dev/logistic/status-badge` | keep. It shows three status badges side by side; "status badge" is their role, not a concept. | proposed (keep) |

---

## Content

### Screens and routes

| Old | New | Layers | Status |
| --- | --- | --- | --- |
| screen `admin-article` | `article-admin` (qualifier after parent) | route, manifest, scaffold-check, test, doc | proposed |
| screen `preview`, route `/preview/[token]` | `article-preview`, `/article-preview/[token]` | route, manifest, preview-link generation | decision D4 |
| screen `feeds` | `feed` (singular) | manifest, scaffold-check, test, doc | proposed |
| `feed-articles.ts` | `feed-article.ts` | route | proposed |

`rss.xml`, `sitemap.xml` and `sitemap-news.xml` keep their names: their URLs are fixed by convention outside this repo.

### Components

| Old | New | Root class | Status |
| --- | --- | --- | --- |
| `AssignmentQueue` | `ArticleAssignmentQueue` | `.article-assignment-queue` | proposed |
| `BylineList` | `ArticleBylineList` | `.article-byline-list` | proposed |
| `MediaFigure` | `MediaAssetFigure` | `.media-asset-figure` | proposed |
| `TopicTag` | `TopicLink`. It renders an `<a>` to `/?topic=…`, and `tag` is a separate table. | `.topic-link` | proposed |
| `SectionFront` | `FrontDetail`. Its prop is `front: FrontWithSlots`. | `.front-detail` | proposed |
| `SectionLabel` | `SectionLink`. It always renders an `<a>`. | `.section-link` | proposed |
| `ArticleView` | `ArticleDetail` | `.article-detail` | decision D8 |
| `AuthorProfileView` | `AuthorProfileDetail` | `.author-profile-detail` | decision D8 |
| `LiveCoverageView` | `LiveCoverageDetail` | `.live-coverage-detail` | decision D8 |
| `LiveUpdateItem` (prop `update`) | `LiveUpdateCard` (prop `liveUpdate`). It renders a self-contained `<article>`. | `.live-update-card` | proposed |
| `NewsletterSignup` | `NewsletterSubscriptionForm` | `.newsletter-subscription-form` | proposed |
| `BlockEditorHost` + coreui `BlockEditor` | `ArticleBlockEditor` | `.article-block-editor`, internals `.article-block-editor__*` | proposed (A-2) |
| `ArticleBlockRenderer` | keep name | `.article-block` → `.article-block-renderer` | proposed |
| `ArticleWorkflowPanel` | keep name | `.workflow-panel` → `.article-workflow-panel` | proposed |
| `ArticleWorkflowPanel` tab "Team", class `__team-item` | "Assignment", `__assignment` | — | proposed |
| `ArticleWorkflowPanel` hard-coded "Status", "Checklist", "Team" | copy slugs (see below) | slug | proposed |
| local type `AssignmentWithArticle` (in `AssignmentQueue`) | `ArticleAssignmentWithArticle` | type | proposed |

### Types

| Old | New | Status |
| --- | --- | --- |
| `ArticlePageView` | `ArticleDetailView` | proposed |
| `SectionPageView` | `SectionDetailView` | proposed |
| `PreviewPageView` | `ArticlePreviewDetailView` | decision D4 |
| `AdminArticleListView`, `AdminArticleDetailView` | `ArticleAdminListView`, `ArticleAdminDetailView` | proposed |
| `ChecklistEntry` | `ArticleChecklistEntry` | approved |
| `ParagraphBlockContent`, `HeadingBlockContent`, `ImageBlockContent`, `GalleryBlockContent`, `VideoBlockContent`, `EmbedBlockContent`, `PullquoteBlockContent`, `LiveUpdateBlockContent` | `ArticleBlockParagraphContent`, … (parent `ArticleBlock` first) | proposed |
| `MediaType` / enum `media_type` | `MediaAssetType` / `media_asset_type` | proposed |
| `MediaLicense` / enum `media_license` | `MediaAssetLicense` / `media_asset_license` | proposed |
| `MediaAssetRights` / table `media_asset_rights` | keep; "rights" is a mass noun (one row is a rights record). Document the exception at the table definition. | approved (keep) |
| `ScreenCopy`, `ScreenLocale`, `ScreenStorage`, `ScreenAttribution`, `ScreenPage`, `ScreenFormResult` | see D16 | decision D16 |

### Schema

| Old | New | Status |
| --- | --- | --- |
| `front_slot.pinned_until` | `pin_expires_at` | decision D2 |
| `article.embargo_until` | `embargo_expires_at` | decision D2 |
| `media_asset.uploaded_by` (FK to `user_account`) | `user_account_id` (FK rule: `<table>_id`) | proposed |
| `article.allow_comment` | `comment_allowed` (booleans read as states) | proposed |
| `ordinal` (`article_status`, `publish_checklist_item`, `section`) and `position` (`article_block`, `article_byline`, `front_slot`, `live_update`) | see D12 | decision D12 |
| `subscriber.locale` (text, no FK) | `subscriber.locale_id` → `locale.id`, FK added in supplemental SQL like content's `user_account` refs. `content_subscribe()` keeps its text `p_locale` parameter and resolves the code itself, falling back to `en`. `SubscriberList` shows the locale code via a join. Existing rows convert by code in the migration. Phase 5. | approved |
| table `publish_checklist_item` | see D15 | decision D15 |

### Copy slugs

| Old | New | Status |
| --- | --- | --- |
| `content.comments.*` (7) | `content.comment.*` (singular) | proposed |
| `content.admin.*` (21) | `content.article_admin.*`, matching the screen id | proposed |
| `content.admin.articles`, `.bylines`, `.sections` | `content.article_admin.article`, `.article_byline`, `.section` | proposed |
| component slugs without the module prefix (`newsletter.signup_heading`, `action.publish`, … in scope `content`) | one convention; see D14 | decision D14 |
| new: workflow tabs | `content.article_workflow.status`, `.checklist`, `.assignment` | proposed |

### dev-kitchen

| Old | New | Status |
| --- | --- | --- |
| `/dev/content/article-view` | `/dev/content/article-detail` | decision D8 |
| `/dev/content/section-front` | `/dev/content/front-detail` | proposed |
| `/dev/content/workflow` | `/dev/content/article-workflow` | proposed |
| `/dev/content/newsletter` | keep (shows `NewsletterSubscriptionForm` and `SubscriberList`) | proposed (keep) |
| `/dev/content/taxonomy` | `/dev/content/topic` and `/dev/content/section` | approved |
| new | `/dev/content/article-block-editor` (from `/dev/coreui/block-editor`) | proposed |

---

## coreui

### Components and exports

| Old | New | Status |
| --- | --- | --- |
| `RadioItem` | `RadioGroupItem` | proposed |
| `TableHead` (`<thead>`), `TableHeader` (`<th>`) | `TableHead` kept; `TableHeader` → `TableHeaderCell` | proposed |
| `LocaleEdit`, `LocalTextEdit`, `LocalTextLinkEdit` | moved to the base template as `LocaleFieldset`, `LocalTextFieldset`, `LocalTextLinkFieldset` | approved 2026-10-13 (A-2). First approved as `…Form`; renamed because none owns a `<form>`, they group inputs inside the page's form |
| `LocaleSwitcher` | `LocalePicker` | proposed |
| `StatusBadge` | removed | proposed (A-3) |
| `BlockEditor`, type `EditorBlock` | moved to content as `ArticleBlockEditor`; type `ArticleBlockDraft` | approved |
| `MessageAriaLive` | `MessageLiveRegion`. It is the message system's polite/assertive live region; "aria" names a technology, not the concept. | approved |
| `SelectItemCollector` (internal, not exported) | keep | proposed (keep) |
| `SBMessage`, `SBMessageAction`, `SBMessageSeverity` | `Message`, `MessageAction`, `MessageSeverity` | proposed |
| `DEFAULT_MESSAGE_LABELS` | no longer exported | proposed (A-1) |
| `interface MessageBus` | `type MessageBus` (TS convention: `type` unless merging) | proposed |
| `.table .align-right` | `.table__cell--end` (logical, BEM) | proposed |

### CSS classes

**Rule (A-6):** the root class of every exported component is its name in kebab case. Every internal element is `<root>__<part>`. Modifiers follow decision A-6b.

**Root classes that change:**

| Old | New |
| --- | --- |
| `.btn` | `.button` |
| `.progress` | `.progress-bar` |
| `.notification` | `.inline-notification` |
| `.datetime-picker` | `.date-time-picker` |
| `.aria-live` | `.message-live-region` |
| `.radio-item` | `.radio-group-item` |
| `.table-header` | `.table-header-cell` |
| `.locale-switcher` | `.locale-picker` |
| `.checkbox-wrap`, `.switch-wrap` | `.checkbox`, `.switch` become the wrapping root; the inputs become `.checkbox__control`, `.switch__control` |
| `.table-wrap` | `.table` becomes the scroll root; `<table>` becomes `.table__element` |
| `.block-editor`, `.block-*`, `.add-block-btn`, `.embed-*`, `.heading-level-select` | move with the component as `.article-block-editor__*` |
| `.locale-edit`, `.local-text-edit`, `.local-text-link-edit` | move with the components as `.locale-fieldset`, `.local-text-fieldset`, `.local-text-link-fieldset` |

**Internal elements that become `__part`:**

| Root | Internals today → new |
| --- | --- |
| `.accordion-item` | `.accordion-header`, `.accordion-trigger`, `.accordion-content`, `.chevron`, `.title`, `.body` → `__header`, `__trigger`, `__content`, `__chevron`, `__title`, `__body` |
| `.alert` | `.icon .title .body .content` → `.alert__icon`, … |
| `.avatar` | `.image .fallback` |
| `.banner` | `.icon .summary .detail .body .actions .action .close` |
| `.barcode-input` | `.label .field .input-wrap .icon .error-msg` (`error-msg` → `__error-message`) |
| `.button` | `.leading .trailing .spinner` |
| `.card` | `.header .body .footer` |
| `.checkbox` | `.checkbox-indicator .icon .label` |
| `.data-table` | `.empty .footer` |
| `.dialog` | `.dialog-overlay .dialog-trigger .dialog-title .dialog-desc .dialog-close .header .body .footer` (`desc` → `__description`) |
| `.drawer` | `.drawer-overlay .drawer-trigger .drawer-title .drawer-description .drawer-close .drawer-header .drawer-body .drawer-footer` |
| `.field` | `.label .required .hint .error .control` |
| `.inline-notification` | `.icon .summary .detail .detail-toggle .ref .body .actions .action .close` (`ref` → `__reference`) |
| `.locale-picker` | `.label .select` |
| `.menu` | `.menu-trigger`; `.menu-item` internals `.leading .check .radio-dot .sub-arrow` |
| `.metric-card` | `.label .value .trend .description` |
| `.pagination` | `.pagination-btn .pages .ellipsis` (`btn` → `__button`) |
| `.popover`, `.tooltip` | `-trigger`, `-arrow` |
| `.progress-bar` | `.track .indicator` |
| `.radio-group-item` | `.radio-control .label` |
| `.select` | `.select-trigger .select-value .select-content .select-viewport .select-scroll-btn .chevron` |
| `.spinner` | `.svg .track .arc` |
| `.switch` | `.switch-thumb .label` |
| `.table-header-cell` | `.sort-trigger .sort-icon .content` |
| `.table` | `.caption` |
| `.tag` | `.remove` |
| `.timeline-item` | `.dot .body .content .label .meta .timestamp` |
| `.toast`, `.toast-region` | `.icon .summary .detail .detail-toggle .ref .body .actions .action .close .fill .timer`; region `.queue` |

Roots of exported sub-components stay as they are: `.accordion-item`, `.menu-item`, `.menu-group`, `.menu-label`, `.menu-radio-group`, `.menu-separator`, `.select-item`, `.tabs-list`, `.tabs-trigger`, `.tabs-content`, `.table-head`, `.table-body`, `.table-foot`, `.table-row`, `.table-cell`, `.timeline-item`, `.toast-region`. `.dialog` stays shared with `ConfirmDialog`, and `.menu` / `.menu-item` with the menu family, as the audit records.

### dev-kitchen

| Old | New | Status |
| --- | --- | --- |
| `/dev/coreui/progress` | `/dev/coreui/progress-bar` | proposed |
| `/dev/coreui/locale` | `/dev/coreui/locale-picker`; the editors leave with B2 | proposed |
| `/dev/coreui/block-editor` | moves to content | proposed |
| `/dev/coreui/choice` | `/dev/coreui/checkbox`, `/dev/coreui/radio-group`, `/dev/coreui/switch` | approved |

---

## Base and SuperPrototype templates

| Old | New | Status |
| --- | --- | --- |
| `navigation_item.scope` | `navigation_item.menu` (already flagged in CLAUDE.md as colliding with the i18n scope) | approved |
| table `navigation_item` | see D15 | decision D15 |
| `src/lib/server/scoped-copy.ts`, `hooks.server.ts` call `.from(` | not route files; excluded from the Phase 9 "no `.from(` in routes" check. (content's `feed-articles.ts` is the third non-route file in the 35, and it moves into the content seam.) | proposed |

REST paths (`/api/locale`, `/api/local-text/...`) are already singular. Only `CLAUDE.md`'s naming table still states the plural exception (Phase 2).

---

## Comments, docs and vocabulary

| Old | New | Scope | Status |
| --- | --- | --- | --- |
| "hermes", `@sveltebuilder/hermes` | "diglossia" | 25 files outside `CHANGELOG.md` (17 code files, plus README, CLAUDE.md, `docs/DEFERRED.md`, `docs/DEV-KITCHEN.md`, the messaging doc, two content build logs and the logistic seed) | proposed |
| "Camp 1", "Camp 2" | "dictionary-independent", "dictionary-resolving" | 45 files | proposed |
| `t` (293 calls in screens) | `localText` | screens | decision D11 |
| severity `error` vs `danger` | `danger` | coreui, base template, docs | decision A-4 |

`packages/content/CONTENT_AUDIT.md` and `CONTENT_BUILD_LOG.md` are historical records. Proposed: leave them unedited, the same as `CHANGELOG.md`.

---

## Decisions

### From the plan

| # | Question | Recommendation and evidence |
| --- | --- | --- |
| D1 | One form for completion status | **`completed`.** `pick_task_status` already uses it; `inbound_receipt_status` and `cycle_count_status` say `complete`. `completed` also matches `in_progress`/`cancelled` as past-participle states. Two `ALTER TYPE … RENAME VALUE`, plus 2 slugs per locale. |
| D2 | `pinned_until`, `embargo_until` | **`pin_expires_at`, `embargo_expires_at`.** The schema already has `media_asset_rights.expires_at` and `article_preview_token.expires_at`. These are the only two non-`_at` timestamps in the repo. |
| D3 | Warehouse routes | **Agree with the plan.** `/warehouse/pick-task`, `/warehouse/inbound-receipt`, `/warehouse/cycle-count`; views `<Concept>Warehouse<Role>View`; slugs `logistic.warehouse.<concept>.*`. The worker home screen labels can stay friendly ("Pick", "Receive", "Count") as copy, since those are actions, not concept names. |
| D4 | `preview/[token]` | **`/article-preview/[token]`.** The token is `article_preview_token.token`, and only articles are previewable. |
| D5 | Backend seam location | **Module-level server overlay.** `tools/create/src/index.ts` already copies per-module `supplemental/`, `seed/` and `manifest.json` when a module is selected (lines 428–453). Adding `modules/<module>/server.superprototype/` → `src/lib/server/<module>/` is the same mechanism, a few lines. `toOne` (in 14 files) goes in `templates/superprototype/src/lib/server/`. The 35 files calling `.from(` confirm the scope; 3 of them are not route files (see the templates section). |
| D6 | Extracted screen sub-components | **Agree.** Presentational → module package; bound to a route's actions or hrefs → bundle-local. |
| D7 | Versioning | **Agree.** No deprecated aliases. |
| D8 | `View` suffix | **Reserve `View` for view-model types.** Today it means both: `ArticleView` (component) and `ArticlePageView` (type), which is the "a suffix means one thing" violation. `Detail` is already in the role vocabulary. |
| D9 | Role vocabulary additions | **Agree**, with D15 settled first, because it decides what `Item` may mean. `Queue` (`ArticleAssignmentQueue`), `Board` (`FrontCurationBoard`), `Panel` (`ArticleWorkflowPanel`), `Renderer` (`ArticleBlockRenderer`), `Figure` (`MediaAssetFigure`), `Bar` (`StockLevelBar`, `ProgressBar`), `Path` (`StorageLocationPath`) all have current users. Also add `Editor` (`ArticleBlockEditor`), `Region` (`ToastRegion`, `MessageLiveRegion`) and `Option` (`StorageLocationOption`, a type role). |
| D10 | Schema file layout | **Agree.** Logistic and content each have `src/lib/schema.ts` (Drizzle) *and* `src/lib/schema/index.ts` (hand-written types) — the collision Phase 4 resolves. `local-text-schema` already uses `src/tables/<concept>.ts`; adopt `src/lib/schema/<concept>.ts` everywhere. |
| D11 | Single-letter lambdas and `t` | **Allow single letters in one-line lambdas; rename `t` to `localText`.** Every screen declares `const t = (slug) => scoped.localText(slug, 'logistic')`, so the new name says what it already is. |

### coreui API

| # | Question | Recommendation |
| --- | --- | --- |
| A-1 | Copy policy | **Agree:** required string props, no English defaults; `ArticleBlockEditor` takes one typed `labels`. |
| A-2 | Boundary | **Agree.** `BarcodeInput`: commerce is a stub with no planned scanning screen, so **move it to logistic** now. Adding it back to coreui later is additive; removing it from coreui after 1.0 would be breaking. |
| A-3 | Duplicates | **Agree:** remove `StatusBadge`; keep `Alert` (static page content) and `InlineNotification` (a message-system result). |
| A-4 | Severity word | **`danger`.** Note that `MessageSeverity` also has `critical`, which `Badge`/`Alert` lack; it stays message-only. |
| A-5 | Attribute forwarding | **Closed and explicit.** `useField` and `FieldContext` are **public**: `BarcodeInput` moving to logistic (A-2) is a custom control that must read `Field`'s wiring. F3 ships in Phase 1. Approved as the best option today, to be revisited; see `DEFERRED.md`. |
| A-6 | CSS contract | **Agree,** using the tables above. |
| A-6b | Modifier form (new) | Modifiers are mixed today: `.btn.primary`, `.progress.lg`, `.toast.success` but `.drawer--left`. **Recommend BEM `--`** (`.button--primary`), which CLAUDE.md already names as the structure convention. |
| A-7 | Callback and text conventions | **Agree.** |
| A-8 | Svelte peer floor | **`^5.33.0`.** |

### New, found in the inventory

| # | Question | Recommendation |
| --- | --- | --- |
| D12 | One name for ordering columns | Three names for one idea: `ordinal` (3 tables), `position` (4), `sort_order` (1). **Recommend `position`**, the most used. Renames 4 columns. |
| D13 | Do UI labels use the full concept name? | The global rule says a shorter everyday label is drift. Logistic's nav says "Receiving", "Returns", "Stock". **Recommend full names in admin chrome and headings** ("Inbound receipts", "Return authorizations"), and allow short action words only for buttons and the warehouse worker home ("Receive", "Pick"). |
| D14 | Module UI copy slug convention | Screens use `logistic.receipt.title` in scope `logistic` (module prefix repeated in slug and scope). Content's components use `newsletter.signup_heading` in scope `content` (no prefix). **Recommend keeping the prefix everywhere**, which changes only content's components (about 15 slugs) instead of every screen; the screen-bundle test and manifests are written against prefixed slugs. |
| D15 | `Item` in domain table names | `publish_checklist_item` and `navigation_item` are domain tables, but D9 limits `Item` to coreui primitives. **Recommend allowing `Item` where the domain itself says it** ("checklist item", "navigation item" are the domain's terms) and banning it only as a stand-alone generic name. Otherwise: `publish_checklist_requirement`, `navigation_link`. |
| D16 | `Screen*` view types duplicated | `ScreenCopy`, `ScreenLocale`, `ScreenPage` and `ScreenFormResult` are declared identically in both `views.ts` files (content adds `ScreenStorage`, `ScreenAttribution`). A helper declared twice is a bug under the single-source rule. **Recommend moving the shared ones into coreui as types-only exports** (`ScreenCopy` needs only a type import from diglossia, which guardrail 1 allows). Keep content's two extras in content. |
| D17 | Timestamp type (found in Phase 4) | `timestamptz` (`withTimezone: true`) in content and `user_account`; plain `timestamp` in logistic, `navigation_item` and local-text-schema's `local_text`. Same idea, two types, sometimes in one schema file. **Recommend `timestamptz` everywhere**, Postgres's own advice for points in time. A Phase 5 column type change (`ALTER COLUMN … TYPE timestamptz`), with existing values read as UTC. **Pending.** |

---

## Added during Phase 8 (approved 2026-10-14)

Applied in Phase 8 because they follow from approved rules.

| Old | New | Rule |
| --- | --- | --- |
| view fields `receipts`, `receipt` (admin inbound receipt), `returns`, `counts`, `locations` (3 views), `task`, `active`, `recent`, `openTotal` | `inboundReceipts`, `inboundReceipt`, `returnAuthorizations`, `cycleCounts`, `storageLocations`, `pickTask`, `activeInboundReceipts`, `recentInboundReceipts`, `openPickTaskTotal` | never drop the parent concept (same as the approved `pendingReceipts` → `pendingInboundReceipts`) |
| warehouse copy `logistic.pick.*`, `logistic.count.*`, `logistic.receive.*`; nav `logistic.warehouse.pick` (+ `.hint`) etc. | `logistic.warehouse.pick_task.*`, `logistic.warehouse.cycle_count.*`, `logistic.warehouse.inbound_receipt.*`; `logistic.warehouse.pick_task.title` (+ `.hint`) | D3: warehouse slugs under `logistic.warehouse.<concept>.*`; avoids colliding with the admin `logistic.cycle_count.empty`, `.lines` |
| `logistic.pick.task` (dashboard label) | `logistic.pick_task.one` | matches `logistic.cycle_count.one`, `logistic.shipment.one` |
| form actions `gradeLine`, `addContact`, `deleteContact`, `addEvent` | `gradeReturnAuthorizationLine`, `addSupplierContact`, `deleteSupplierContact`, `addTrackingEvent` | approved rule for every bundle's actions |
| form fields `line_id`, `task_id`, `count_id`, `contact_id`, `location_ids` | `inbound_receipt_line_id`, `return_authorization_line_id`, `pick_task_line_id`, `cycle_count_line_id`, `pick_task_id`, `cycle_count_id`, `supplier_contact_id`, `storage_location_ids` | approved rule for every bundle's fields |
| English "RMA" (`logistic.return_authorization.one`) | "Return authorization" | no abbreviations; D13 |
| D14: `newsletter.*` and `action.submit_for_review` … `action.unpublish` in scope `content` | `content.newsletter_subscription_form.*`, `content.article_workflow.*` | D14 prefix, grouped by the component that renders them, like `content.article_block_editor.*` |
| dev-kitchen `/dev/content/taxonomy` | `/dev/content/article-byline`, `/dev/content/section`, `/dev/content/topic` | the page also showed `ArticleBylineList`, so it splits three ways |
| page-local CSS `admin-article`, `admin-article-list` | `article-admin`, `article-admin-list` | follows the screen id |

## Added during Phase 9 (approved 2026-10-14)

New names, not renames. Data module functions follow `<verb><Table>` with the table's full name
(`listInboundReceipt`, `getPickTaskLine`, `receiveInboundReceiptLine`) and are not listed one by
one; the files are one per table, named like the schema file. The rest:

| Name | What it is | Rule |
| --- | --- | --- |
| file per table, not per concept (`inbound-receipt-line.ts` beside `inbound-receipt.ts`) | data module layout; amends the D5 wording in `CLAUDE.md` and `MODULE-ROUTES.md`, whose example put `addInboundReceiptLine` in `inbound-receipt.ts` | layers mirror each other: a query's file follows from its table's name, as the schema file does |
| `QueryResult<T>` | every data module function's return: supabase-js's `{ data, error }`, data in camelCase | one way to report a failure; the route decides what it means |
| `QueryRange` (`offset`, `limit`), `CountedRows<T>` (`rows`, `total`) | a list function's slice argument and its counted result | generic names, allowed because `postgrest.ts` is shared infrastructure, not domain code |
| `LocaleFields`, `NavigationItemFields`, `SupplierFields`, `SupplierContactFields`, `LocalTextEntryFields` | what an administrator edits, as a data module argument | `<Table>Fields`, a suffix for a data module's argument type |
| `NavigationItemWithLocalTextLink` | a navigation item with its copy link embedded | composite types are `<Concept>With<Concept>` |
| `listActiveInboundReceipt`, `listRecentInboundReceipt`, `listAssignedPickTask`, `listOpenPickTask`, `listAssignedCycleCount`, `listOpenCycleCount`, `countOpenCycleCount`, `listActiveSection`, `listActiveTopic`, `listLatestArticle`, `getInitialArticleStatus` | lists named for what they select, where one table has several | qualifier before the table, as the view fields they fill (`activeInboundReceipts`) already do |
| `getDictionaryPayload` | the `get_dictionary` RPC, in `local-text.ts` | avoids `getDictionary`, which diglossia/svelte already exports |
| `getArticleByPreviewToken` | the two preview RPCs, in `article-preview-token.ts` | a function lives in the file of the table its query starts from |

## Abbreviation cleanup (2026-10-14, between Phases 9 and 10, at the user's request)

| Old | New |
| --- | --- |
| copy slugs `nav.*`, `admin.nav.*`, `logistic.admin.nav.*`, `logistic.warehouse.nav` | `navigation.*`, `admin.navigation.*`, `logistic.admin.navigation.*`, `logistic.warehouse.navigation` |
| data keys and locals `navItems`, `navItem`, `NavItem`, `navLinks`, `navId`, `navResult` | `navigationItems`, `navigationItem`, `NavigationItem`, `navigationLinks`, `navigationItemId`, `navigationItemResult` |
| CSS `__nav`, `__nav-link`, `.pagination__button--nav`, `.nav-item-edit-page`, `.warehouse-home__flow-desc` | `__navigation`, `__navigation-link`, `.pagination__button--navigation`, `.navigation-item-edit-page`, `.warehouse-home__flow-hint` |
| element ids `nav-href`, `nav-menu`, `nav-position` | `navigation-item-href`, `navigation-item-menu`, `navigation-item-position` |
| locals `msg`, `imgError`, `str`, `e` (multi-line or non-lambda), `urlEls`, field `desc` | `message`, `imageError`, `text`, `entry`/`event`, `urlElements`, `hint` |

Kept: `src`, `params` and `e` in one-line lambdas, which are platform names or allowed by `CLAUDE.md`.

## Added during Phase 10 (approved 2026-10-14)

| Old | New | Rule |
| --- | --- | --- |
| screen root blocks named freely (`.receipt-list`, `.count-detail`, `.pick-task`, `.article-page`, `.preview-page`, `.stock-page`, `.dashboard`, …) | the view type with `View` → `Screen`: `.inbound-receipt-list-screen`, `.cycle-count-detail-screen`, `.pick-task-warehouse-detail-screen`, `.article-detail-screen`, `.article-preview-detail-screen`, `.stock-level-list-screen`; base screens by concept and role: `.admin-dashboard-screen`, `.locale-admin-list-screen`, `.local-text-admin-detail-screen`, `.navigation-item-admin-list-screen`, `.sign-in-screen`; `.warehouse-home-screen` (the home page has no view type of its own) | amends the plan's "view type without `View`", which made the article page `.article-detail`, colliding with the `ArticleDetail` component it renders |
| sub-blocks of a screen: `.cycle-count-new-form`, `.receipt-new-form`, `.return-new-form`, `.shipment-new-form`, `.sign-in-card`, `.stat` | `.<screen>__new-form`, `.sign-in-screen__card`, `.admin-dashboard-screen__stat` | elements of the screen until Phase 11 extracts them |
| root layout `.app`, `.full-page` | `.app-layout`, `.full-page-layout` | layouts are `<group>-layout`, like `.admin-layout` |
| `.sr-only` (three copies) | `.visually-hidden` in `src/utilities.css`, `layer(utilities)` | no abbreviations; one helper, in the reserved utilities layer |
| bare elements under a block (`__pullquote p`, `__embed iframe`, `__live-update p`, `__detail dt`/`dd`, `__meta dt`/`code`, `__filing dt`/`dd`, `__meta-item dt`/`dd`, `__logo a`, `kitchen__pages a`) | `__pullquote-text`, `__embed-frame`, `__live-update-text`, `__detail-term`/`-value`, `__meta-term`/`-code`, `__filing-term`/`-value`, `__meta-term`/`-value`, `__logo-link`, `__page-link` | every element a rule reaches has a class |
| coreui table rules on `tr`, `td`, `th`, `thead` | `.table-row`, `.table-cell`, `.table-header-cell`, `.table-head` | same |
| dev-kitchen `.kitchen`, `.theme` | `.kitchen-layout`, `.theme-screen` | same naming as the templates |
| — | `src/lib/components.css` in each package (the stylesheet index, exported as `styles/components.css`), `src/utilities.css`, `scripts/css-check.mjs`, `pnpm css:check` | new files |

## Added during Phase 11 (approved 2026-10-14)

New components. "Package" ones only take props and render markup (D6) and have dev-kitchen
showcases; "bundle" ones post to their route's actions or build its links, and sit beside the page.

| Component | Where | Notes |
| --- | --- | --- |
| `FilterLinkList` (+ type `FilterLink`) | coreui | a list's server-side filter as a `<nav>` of links; replaces the same markup in six screens across two modules (promotion rule) |
| `StockAdjustmentList`, `StorageLocationFieldset`, `InboundReceiptSummary`, `InboundReceiptList`, `CycleCountLineTable`, `ShipmentLineTable`, `LogisticMetricSummary` | logistic | `InboundReceiptList` is used by the admin list and the warehouse queue, with the link per receipt as a prop |
| `CommentList` | content | renders readers' own words, so it needs no dictionary |
| `<Concept>CreateForm`: `InboundReceiptCreateForm`, `ShipmentCreateForm`, `ReturnAuthorizationCreateForm`, `CycleCountCreateForm`, `SupplierCreateForm`, `ArticleCreateForm`, `LocalTextCreateForm`, `LocaleCreateForm`, `NavigationItemCreateForm` | bundle | named after the `create` action they post to |
| `<Concept>Table`: `ShipmentTable`, `ReturnAuthorizationTable`, `CycleCountTable`, `StockLevelTable`, `StockLevelLowTable`, `LocalTextTable`, `LocaleTable`, `NavigationItemTable`; line tables `InboundReceiptLineTable`, `ReturnAuthorizationLineTable` | bundle | tables whose rows link to a route or post to one |
| `<Concept>DetailHeader`: `InboundReceiptDetailHeader`, `ReturnAuthorizationDetailHeader`, `CycleCountDetailHeader`, `ShipmentDetailHeader`, `ArticleAdminDetailHeader` | bundle | named after the view type, like the screen root (`ArticleAdminDetailView` → `ArticleAdminDetailHeader`) |
| child-row forms: `InboundReceiptLineAddForm`, `InboundReceiptLineReceiveForm`, `ReturnAuthorizationLineGradeForm`, `SupplierContactAddForm`, `TrackingEventAddForm`; edits: `SupplierUpdateForm`, `NavigationItemUpdateForm`, `ShipmentStatusForm`, `ShipmentTrackingForm`, `StockAdjustmentForm`, `StockLevelReorderPointForm`, `CommentForm` | bundle | `Add` for a child row, `Create` for a root, `Update` for the row itself |
| `StockAdjustmentModal`, `StockAdjustmentPanel` | bundle | the stock-level screen's adjust dialog and history panel |
| `SupplierList`, `SupplierContactList` | bundle | |
| `LogisticDashboardSection`, `LogisticDashboardLinkList` | bundle | one frame and one preview list for the dashboard's four sections |
| warehouse: `PickTaskAssignedList`, `PickTaskQueue`, `PickTaskLineList`, `CycleCountAssignedList`, `CycleCountQueue`, `CycleCountLineList`, `InboundReceiptLineList` | bundle | `Assigned` matches the data module's `listAssignedPickTask`; `Queue` is the open work a worker takes from |
| `LocalTextForm` | base template `$lib/LocalText/` | one locale's copy, shared by the local-text and navigation-item detail screens, posting to the action the page names |

Also: `class:negative` and `class:done` (bare classes) became BEM modifiers (`__discrepancy--negative`,
`__line--done`), and text coloured `--danger` became `--danger-text`, which axe found failing contrast
once the rules reached a showcased component.


## Added during Phase 12 (pending approval)

Includes the names the three Phase 11 decisions brought in (2026-10-14).

| Name | What it is |
| --- | --- |
| `ArticleList` props `href`, `onPageChange` (now required), `locale`; `ArticleWorkflowPanel` props `statusSlug`, `statuses`, `checklist`, `transitionAction`, `checklistAction`, `enhance` | the adapted content components; `href` matches `InboundReceiptList`'s, the action props `NewsletterSubscriptionForm`'s `action` |
| slugs `content.article_list.canonical_slug`, `content.article_list.created_at`, `content.article_workflow.transition`, `content.article_workflow.save`, `content.article_workflow.publish_blocked`, `content.article_block_editor.empty` | copy for the adapted components |
| `toLocalDateTime`, `toIsoDateTime` in `DateTimePicker/date-time-picker.ts` | the picker's timezone conversions, internal (not exported from the package) |
| dev-kitchen `CallbackLog` (`$lib/CallbackLog/`), `tests/behaviour.spec.ts`, script `test:browser` (was `test:a11y`), fixtures `ARTICLE_ROWS`, `ARTICLE_STATUSES`, `CHECKLIST` | the behaviour test layer; the script runs accessibility and behaviour, so it no longer says only one |
| slugs `content.article_block_renderer.{gallery,embed}`, `content.article_byline_list.by`, `content.article_card.topics`, `content.article_detail.{published,updated}`, `content.author_profile_detail.articles`, `content.front_detail.brief`, `content.front_curation_board.{empty,list,move_up,move_down,remove}`, `content.live_coverage_detail.{region,live,ended,pinned,all,empty}` | component copy, named after the component, like `content.article_list.*` |
| slugs `content.live_update.{label,pinned_label,pinned}`, `content.front_layout_variant.{lead,secondary,river,brief}` | named after the concept rather than a component: the first is shared by `LiveUpdateCard` and `ArticleBlockRenderer`, the second is the enum's value names, like `content.article_block_type.*` |
| slugs `logistic.inbound_receipt.{number,discrepancy_alert}`, `logistic.pick_task.{number,lines,lines_completed}`, `logistic.stock_level.below_reorder_point`, `logistic.storage_location.path`, `logistic.supplier.{inactive,lead_time,contact_more}`, `logistic.tracking_event.empty` | logistic component copy; the cards reuse `logistic.inbound_receipt.expected_at`, `received_at`, `lines`, `logistic.field.{available,reserved,on_hand}` and `logistic.warehouse.inbound_receipt.received_of` rather than add twins |
| "application-level" and "entity" components | the descriptive terms replacing "Camp 1" and "Camp 2", taken from CLAUDE.md's own table |
