---
'@sveltebuilder/coreui': major
'@sveltebuilder/content': major
'@sveltebuilder/logistic': major
'create-sveltebuilder': minor
---

Scaffolded screens read as layout plus named components. New package components:
`FilterLinkList` in coreui (a server-side filter as a `<nav>` of links); `StockAdjustmentList`,
`StorageLocationFieldset`, `InboundReceiptSummary`, `InboundReceiptList`, `CycleCountLineTable`,
`ShipmentLineTable` and `LogisticMetricSummary` in logistic; `CommentList` in content. Components
bound to a route (forms, tables that link) are scaffolded beside the page that uses them.
