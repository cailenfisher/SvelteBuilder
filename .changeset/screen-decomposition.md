---
'@sveltebuilder/coreui': major
'@sveltebuilder/content': major
'@sveltebuilder/logistic': major
'create-sveltebuilder': minor
'@sveltebuilder/local-text-schema': minor
---

Scaffolded screens read as layout plus named components. New package components:
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
