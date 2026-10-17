---
'@sveltebuilder/content': major
'@sveltebuilder/logistic': major
---

Each table, enum and type is now declared once.

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
