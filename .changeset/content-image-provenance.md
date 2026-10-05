---
'@sveltebuilder/content': minor
---

Images: provenance, attribution, card pictures and an explicit lead image.

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
