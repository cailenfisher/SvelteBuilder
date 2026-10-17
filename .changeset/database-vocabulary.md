---
'@sveltebuilder/content': major
'@sveltebuilder/logistic': major
'@sveltebuilder/local-text-schema': minor
'create-sveltebuilder': minor
---

One word per idea across every module's database. Existing databases need the upgrade SQL in
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
