---
'@sveltebuilder/content': major
'@sveltebuilder/logistic': major
'create-sveltebuilder': minor
---

Every content and logistic concept now has one full name in every layer.

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
