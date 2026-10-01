---
'create-sveltebuilder': minor
'@sveltebuilder/content': minor
'@sveltebuilder/coreui': patch
---

The content module gains row level security, a seed, and its route code as five screen bundles.

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
