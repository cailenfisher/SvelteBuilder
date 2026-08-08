# @sveltebuilder/content — Build Log

Replaces `@sveltebuilder/blog`. Targets newspaper/publisher applications.

---

## Phase 0 — Audit

Reviewed: `@sveltebuilder/blog`, `@sveltebuilder/coreui` (24 components), `@sveltebuilder/logistic`.

**Blog bugs fixed in content:**
- `encodeURIComponent(post.title)` used for URLs in `rss.ts` and `sitemap.ts` — should use `canonicalSlug`. Fixed.
- RLS used `auth.uid()` (UUID) instead of `public.current_user_id()` (bigint). Fixed throughout.
- `user_account_id` was UUID. Fixed to `bigint`.

**Component precedence decisions:**
- `StatusBadge`, `MetricCard`, `Timeline`, `Table` family — already in coreui, reused.
- `DataTable`, `BlockEditor`, `Drawer`, `DateTimePicker` — added to coreui (cross-domain, Camp 1).
- All logistic domain components stay in logistic.

---

## Phase 1 — Package Scaffolding

Created `packages/content/`:
- `package.json` — exports `.`, `./server`, `./schema`
- `tsconfig.json` — extends base, excludes `src/lib/templates/**`
- `svelte.config.js`
- `src/index.ts` → `src/lib/index.ts`

---

## Phase 2 — Domain Schema (14 SQL files)

`packages/content/src/lib/supabase/schemas/`:

| File | Tables / Types |
|------|----------------|
| `set_updated_at.sql` | shared trigger function |
| `publisher_profile.sql` | `publisher_profile` |
| `article_status.sql` | `article_status` |
| `article.sql` | `article`, `article_block_type` enum, `article_block` |
| `article_workflow.sql` | `article_assignment_role` enum, `article_assignment`, `article_revision`, `publish_checklist_item`, `article_checklist_state` |
| `taxonomy.sql` | `section`, `topic`, `tag`, junction tables |
| `author_profile.sql` | `author_profile`, `article_byline` |
| `media_asset.sql` | `media_type`/`media_license` enums, `media_asset`, `media_asset_rights`, late FKs |
| `front.sql` | `front_layout_variant` enum, `front`, `front_slot` |
| `live_coverage.sql` | `live_coverage`, `live_update` |
| `newsletter.sql` | `newsletter`, `subscriber`, `newsletter_subscription` |
| `article_preview_token.sql` | `article_preview_token` |
| `comment.sql` | `comment_status` enum, `comment` |

**Scope deviations (documented):**
- `comment.author_name`, `comment.author_email`, `comment.body` — reader-submitted runtime data.
- `subscriber.email_address` — PII, not translatable copy.

All tables: bigint PKs, `public.current_user_id()` RLS, no `auth.uid()`/`auth.jwt()`.

`manifest.json` — topological sort: after `@sveltebuilder/hermes-schema`, `@sveltebuilder/superprototype`.

**Seed:** `seed.sql` — 7 article statuses (EN+FR), 5 checklist items (EN+FR), 31 UI strings (EN+FR), sections/topics/tags, publisher profile, jane-doe author, 2 sample articles with blocks/bylines/taxonomy/front slots.

---

## Phase 3 — TypeScript Types

`packages/content/src/lib/schema/index.ts` (376 lines):
- All enums: `ArticleBlockType`, `ArticleAssignmentRole`, `MediaType`, `MediaLicense`, `FrontLayoutVariant`, `CommentStatus`
- Block content jsonb shapes: `HeadingBlockContent`, `EmbedBlockContent`, etc.
- 20+ base entities
- Enriched types: `ArticleWithCopy`, `FrontWithSlots`, `LiveCoverageWithUpdates`, `NewsletterWithCopy`, etc.
- `PaginatedResult<T>` generic

---

## Phase 4 — Server Queries + Feed/SEO Utilities

`packages/content/src/lib/server/`:

| File | Exports |
|------|---------|
| `queries.ts` | `getPublishedArticles`, `getPublishedArticleBySlug`, `getArticleByPreviewToken`, `getSectionFront`, `getLiveCoverage`, newsletter CRUD + subscriptions, `transitionArticleStatus`, `setChecklistState`, `getApprovedComments`, `createComment`, `getPublisherProfile`, `buildArticleDictionaryPayload`, `buildArticleListDictionaryPayload`, `getAdminArticles`, `createArticle`, `updateArticle`, `softDeleteArticle` |
| `rss.ts` | `generateRssFeed` — proper 5-entity XML escape, RFC 822 `+0000` suffix |
| `sitemap.ts` | `getArticleSitemapEntries`, `generateNewsSitemap` (48h window, 1000 cap, ISO with offset), `generateStandardSitemap` |
| `structured-data.ts` | `buildNewsArticleJsonLd` (all 5 required Google fields), `buildLiveBlogPostingJsonLd`, `buildArticleMetaTags` (OG/Twitter/canonical/hreflang with x-default) |
| `validate-publish.ts` | `validateArticleForPublish` — headline, dek, bylines, sections, blocks, image alt, publisher profile, timezone, embargo sanity |
| `index.ts` | re-exports all above |

---

## Phase 5 — coreui Additions + Camp 2 Components

### New coreui primitives
- `Drawer.svelte` — Bits UI Dialog-backed slide-over, right/left/bottom sides
- `DataTable.svelte` — generic `T extends Record<string,unknown>`, sortable, paginated
- `BlockEditor.svelte` — 8 block types, keyboard accessible, aria-labels
- `DateTimePicker.svelte` — timezone-aware datetime-local, ISO with offset

### Camp 2 components (13 total)

**Tier 1 — cards / compact:**
- `ArticleCard` — lead/secondary/river/brief variants, hero image, section/byline/topic
- `BylineList` — resolves author names, linked, "and" separator
- `SectionLabel` — uppercase kicker link, resolves section name
- `TopicTag` — pill link, resolves topic name
- `LiveUpdateItem` — pinned badge, time, resolved text
- `MediaFigure` — `<figure>` + resolved alt/caption/credit; decorative mode

**Tier 2 — full views:**
- `ArticleBlockRenderer` — dispatches on `block_type`, renders all 8 types
- `ArticleView` — full article layout: hero image from first image block, headline/dek/meta/body/after slot
- `LiveCoverageView` — pinned updates first, live pulse animation, `aria-live`
- `SectionFront` — lead/secondary/river/briefs grid, resolves front title
- `AuthorProfileView` — avatar/placeholder, name/bio/expertise, article list

**Tier 3 — admin tables (Camp 1 — no hermes):**
- `ArticleList` — coreui DataTable, pre-resolved headlines
- `SubscriberList` — coreui DataTable, email/locale/confirmed columns
- `AssignmentQueue` — coreui DataTable, role/assignee/due columns

**Tier 4 — complex admin UI:**
- `ArticleWorkflowPanel` — Drawer + Tabs: Status/Checklist/Team; calls `?/transition` + `?/checklist` actions
- `BlockEditorHost` — maps `ArticleBlock[]` → `EditorBlock[]`, wires hermes text resolve on load
- `NewsletterSignup` — form action submit, hermes labels from `content` scope
- `FrontCurationBoard` — drag-reorder (HTML5 DnD) + keyboard move up/down; Camp 1

---

## Phase 6 — Scaffold Template Routes

`packages/content/src/lib/templates/routes/`:

| Route | Purpose |
|-------|---------|
| `(content)/article/[slug]/+page.server.ts` | load + `?/comment` action |
| `(content)/article/[slug]/+page.svelte` | JSON-LD, OG/hreflang meta, ArticleView, comment form |
| `(content)/section/[slug]/+page.server.ts` | SectionFront + article list |
| `(content)/section/[slug]/+page.svelte` | SectionFront component |
| `(content)/preview/[token]/+page.server.ts` | preview token load, `noindex` |
| `(content)/preview/[token]/+page.svelte` | preview banner + ArticleView |
| `(content)/rss.xml/+server.ts` | RSS feed, 30min cache |
| `(content)/sitemap-news.xml/+server.ts` | Google News sitemap, 5min cache |
| `(content)/sitemap.xml/+server.ts` | standard sitemap, 1hr cache |
| `admin/content/article/+page.server.ts` | admin list with `withUser` |
| `admin/content/article/+page.svelte` | ArticleList with pagination |
| `admin/content/article/[id]/+page.server.ts` | detail + `?/transition` + `?/checklist` |
| `admin/content/article/[id]/+page.svelte` | ArticleView + ArticleWorkflowPanel |

---

## Phase 7 — Blog Retirement

- Deleted `packages/blog/` entirely.
- Deleted `tools/create/templates/modules/blog/` entirely.
- Updated `tools/create/src/index.ts`:
  - `MODULE_DEPS`: `blog` → `content`
  - Module selection prompt: `Blog` → `Content` with updated hint text
- Created `tools/create/templates/modules/content/manifest.json`
- Created `tools/create/templates/modules/content/supplemental/01-content-supplements.sql` — cross-package FKs for `user_account`
- Updated `apps/dev-kitchen`:
  - `vite.config.ts` — alias `@sveltebuilder/blog` → `@sveltebuilder/content` + `@sveltebuilder/content/server`
  - `package.json` — replaced `@sveltebuilder/blog` with `@sveltebuilder/content: workspace:*`
  - Deleted `src/routes/blog/` and `src/routes/dev/blog/`
  - Deleted `src/lib/blog-fixtures.ts`
  - Created `src/lib/content-fixtures.ts` with fixture data + `fixtureDictionaryPayload`
  - Created `src/routes/dev/content/` with 7 component showcases
  - Updated `src/routes/dev/+layout.svelte` — replaced Blog nav section with Content
  - Updated `src/routes/+page.svelte` — replaced "Blog demo" link with "Content components"
- Updated `eslint.config.js` — updated `svelte/no-at-html-tags` overrides for content paths.

---

## Phase 8 — Build Verification

| Package | Result |
|---------|--------|
| `@sveltebuilder/hermes` | ✅ clean |
| `@sveltebuilder/coreui` | ✅ clean |
| `@sveltebuilder/logistic` | ✅ clean |
| `@sveltebuilder/content` | ✅ clean |
| `tsc --noEmit` (content) | ✅ 0 errors |

Template routes excluded from `tsc` via `tsconfig.json` `exclude` — they require `$types` from `svelte-kit sync` at scaffold time.

---

## Known Gaps (out of v1 scope)

- No `svelte-check` pass on Svelte components (requires `@sveltejs/kit` installed as dep for `$types`).
- `ArticleWorkflowPanel` uses `Tabs` with a manual `role="tab"` button pattern — should be validated against the coreui Tabs API once the Svelte `$types` are available.
- `FrontCurationBoard` uses HTML5 Drag-and-Drop API — no pointer-events fallback for mobile.
- No unit tests written (vitest in `devDependencies` but no test files).
- `apps/dev-kitchen` build not verified — the app uses Supabase live connection; dev-kitchen build requires env vars.
