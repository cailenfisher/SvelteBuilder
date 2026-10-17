# @sveltebuilder/local-text-schema

## 0.3.0-rc.0

### Minor Changes

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

## 0.2.1

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

## 0.2.0

### Minor Changes

- [#11](https://github.com/cailenfisher/SvelteBuilder/pull/11) [`99b6a39`](https://github.com/cailenfisher/SvelteBuilder/commit/99b6a39abb4483d5646a78dad81d229808f8d598) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Make `local_text_link` uniqueness actually cover global copy.

  The table carried a plain unique index on `(slug, scope, entity_id)` plus a partial unique index on
  `(slug, scope) where entity_id is null`. Between them, nothing constrained global copy: those rows
  have `scope` and `entity_id` both null, and Postgres treats nulls as distinct in a unique index, so
  re-inserting `('app.name', null, null)` was accepted as a new row every time.

  That made `on conflict do nothing` a silent no-op for precisely the rows the base seed consists of —
  re-running `supabase/seed.sql` duplicated all 90 global links, and `get_dictionary`'s `distinct on`
  kept the dictionary resolving correctly, so the first visible symptom was a doubled admin list
  rather than an error.

  Both indexes are replaced by a single `unique (slug, scope, entity_id) nulls not distinct`, which
  covers all three cases: global copy and scoped UI copy each conflict on a repeat insert, while
  per-entity copy sharing a slug and scope across different `entity_id` values is still allowed.

  Existing projects: run `sveltebuilder sync:supabase` to generate the migration that swaps the
  indexes for the constraint. If a database already holds duplicated global links, de-duplicate before
  applying it or the constraint will fail to build.
