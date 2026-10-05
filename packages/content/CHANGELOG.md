# @sveltebuilder/content

## 1.0.0

### Patch Changes

- Updated dependencies [[`ca21505`](https://github.com/cailenfisher/SvelteBuilder/commit/ca215055910fc83c8e509f80af791ca3e68cca5d)]:
  - @sveltebuilder/coreui@0.2.0

## 0.1.1

### Patch Changes

- [#15](https://github.com/cailenfisher/SvelteBuilder/pull/15) [`2a36a12`](https://github.com/cailenfisher/SvelteBuilder/commit/2a36a126289147dceb8451d0355245278fd5e535) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Camp 2 components now forward the `dictionary` prop to the Camp 2 components they render, and
  `ArticleCard` asks for the status slug the seed actually writes.

  **Article bodies rendered as `[missing: …]` sentinels on every install before this.** Four composite
  components accepted a `dictionary` prop, used it for their own copy, then rendered child Camp 2
  components without passing it on. The children fell back to `getDictionary()` — the root layout's
  context dictionary, which by design carries only global scope-null copy — so every string resolved by
  a child became a sentinel: every paragraph of every article body, every byline, section label, topic
  tag, image caption and live update. Twelve call sites across `ArticleView`, `ArticleCard`,
  `ArticleBlockRenderer` and `LiveCoverageView`.

  The screens were never at fault. They pass `dictionary={scoped}` correctly; the break was one level
  down, inside the package.

  `ArticleCard` also asked for `article_status:label` while the module's seed writes
  `article_status:name` — as do all four admin screens and every sibling entity (`section`, `topic`,
  `author_profile`, `tag`). `label` belongs to `publish_checklist_item`, a different scope. This one was
  dormant behind `showStatus`, which defaults to false, so only a caller opting into the status badge
  saw it. Two lines above it, `statusVariant` tested for a `ready_to_publish` status the module does not
  seed — the workflow statuses are `pitch`, `draft`, `in_review`, `ready`, `published`, `archived` — so
  the `ready` state never got its badge variant. Both now use the seeded vocabulary, via a lookup that
  falls through to `default` for statuses a project adds itself.

  **Why none of this was caught:** `dictionary` is an optional prop, so omitting it is valid TypeScript
  and `svelte-check` passes. The components had no tests, and no template screen renders them in CI —
  the gap `docs/DEV-KITCHEN.md` describes. `pnpm sql:check` runs no components and `pnpm scaffold:check`
  only typechecks and builds. It took scaffolding a project by hand and reading the page.

  So the package now ships a test suite that renders every Camp 2 component with the dictionary supplied
  as a prop — the way a screen supplies it — and asserts that nothing went missing. It asserts on
  diglossia's `onMissing` hook rather than scanning the HTML for `[missing:`, because a sentinel can land
  somewhere a string scan would plausibly not look, such as `MediaFigure`'s `alt` attribute; the HTML
  scan stays as a backstop. The composite cases additionally assert that child-resolved copy appears in
  the output, which is what actually pins the forwarding. Each of the three defects above was
  re-introduced one at a time to confirm the suite fails on it.

  Also fixes an unused-variable lint error in `buildArticleMetaTags`, where `og:site_name` recomputed
  the publisher name inline instead of using the one already in scope. No behaviour change — it was the
  same expression — but it left `pnpm lint` red for the package.

## 0.1.0

### Minor Changes

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

- [#13](https://github.com/cailenfisher/SvelteBuilder/pull/13) [`d4ab34b`](https://github.com/cailenfisher/SvelteBuilder/commit/d4ab34b087a962041b92774df2171c77b9d169c4) Thanks [@cailenfisher](https://github.com/cailenfisher)! - Modules no longer ship a data-access layer.

  Both packages exported `./server`, a Drizzle query layer importing `drizzle-orm` at runtime. Guardrail 8
  forbids exactly that: runtime Drizzle means a direct Postgres connection, which runs as a role that owns
  the tables, which makes Postgres skip every RLS policy in the project. Since SuperPrototype moved to
  PostgREST the export was also simply unusable — the route templates calling it could not even be
  scaffolded. A module now ships its schema, its components, and (for content) its pure publishing
  utilities. Queries belong to the app, which reaches the database through `event.locals.supabase`.
  - **logistic**: `./server` removed. It contained only `queries.ts`.
  - **content**: `./server` removed and replaced by **`./publishing`**. Its query layer is gone, but the
    four modules that lived beside it — `generateRssFeed`, the sitemap builders, the JSON-LD and meta-tag
    builders, and `validateArticleForPublish` — are pure functions over already-fetched entities, with
    type-only imports and no database access. Those are domain knowledge rather than data access, so they
    stay under a name that does not imply otherwise.

  Content's 13 in-package route templates move out to the create CLI's template tree. They had been
  compiled into `dist/templates/` and published, while the CLI never copied them into a scaffolded
  project — so they were unreachable build output rather than usable screens. They will return as
  selectable screen bundles.

  Also fixed while here: the `diglossia` peer range was `^0.0.1`, which excludes the 0.1.x actually
  shipping, so installing either module beside diglossia produced a peer conflict. Now `^0.1.0`.

  **Breaking:** `SectionFront` drops its required `sections` prop. It was never read — the derived map
  that used it had been dead since the component was written — so every caller was fetching and passing
  section rows for nothing.

### Patch Changes

- Updated dependencies [[`82a7349`](https://github.com/cailenfisher/SvelteBuilder/commit/82a7349fc2d0502704adbb2765c4f0565e888314)]:
  - @sveltebuilder/coreui@0.1.1

## 0.0.6

### Patch Changes

- Updated dependencies []:
  - @sveltebuilder/coreui@0.1.0
