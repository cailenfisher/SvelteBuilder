# DEFERRED.md

Items intentionally deferred, or explicitly out of scope, during the diglossia 0.1.0 +
SvelteBuilder integration work order. Read alongside `CLAUDE.md`'s Known Open Issues table.

---

## dev-kitchen

`apps/dev-kitchen` is stagnant per this work order's standing rules — not fixed, not migrated.
The following are now broken there as a direct, expected consequence of diglossia 0.1.0 and the
coreui message bus rewrite (both consumed via `link:../../../diglossia`, so dev-kitchen picks up
the new API immediately rather than at some future upgrade):

- Every bare `import { load, merge, localText, LocalText } from 'diglossia'` in dev-kitchen no
  longer resolves — those exports don't exist anymore. Affected: `src/routes/+layout.svelte`,
  `src/routes/+error.svelte`, `src/routes/+page.svelte`,
  `src/lib/components/LocaleSwitcher.svelte`, `src/routes/dev/hermes/+page.svelte`, and the 7
  `src/routes/dev/content/*/+page.svelte` showcase routes (`import { load as hermesLoad } from
  'diglossia'`). Type-only imports (`DictionaryPayload`, `Locale` in `app.d.ts` and the
  `api/local-text`/`api/locale` `+server.ts` files) still work unchanged.
- `import { messageBus } from '@sveltebuilder/coreui'` no longer resolves — replaced by
  `createMessageBus`/`setMessageBus`/`getMessageBus`. Affected: `src/routes/+layout.svelte` and
  the 4 `src/routes/dev/coreui/{+page,toast,confirm-dialog,banner}/+page.svelte` showcase routes.
- Auth UI still uses the old Supabase hook shape and has not been migrated to the `withUser`
  pattern (pre-existing gap, carried forward from `CLAUDE.md`'s prior Known Open Issues entry).

---

## Pending manual steps

**Publish diglossia and switch off `link:`.** `packages/coreui`, `packages/content`, and
`packages/logistic` each declare `"diglossia": "link:../../../diglossia"`, which resolves to a
sibling checkout outside this repo and breaks on a fresh clone. Publish `diglossia@0.1.0` to npm
(four commits are ready on `main` in the sibling `diglossia` repo, not yet pushed — see below),
then replace the `link:` entries with `^0.1.0`, and move the local link into a root
`pnpm.overrides` block documented in `CONTRIBUTING.md`.

**diglossia's commits are local-only.** Phase 1 landed as four commits on `main` in
`/home/cailen/code/diglossia` (the split, the instance refactor, the MF2 addition, and a docs
commit), plus a changeset for a `0.1.0` minor release. None have been pushed — pushing to a
remote wasn't something this work order asked for, and it's a visible action worth a deliberate
decision rather than a default. Push (and decide whether to let the changeset bot run) when ready.

**Second resolution path only closed for headline/dek.** `structured-data.ts`, `rss.ts`, and
`sitemap.ts` now resolve `headline`/`dek` through a `DictionaryInstance` instead of reading them
as bare fields — the two fields the work order named explicitly, and the two that
`buildArticleDictionaryPayload`/`buildArticleListDictionaryPayload` already produce dictionary
entries for. Byline names, section names, tag names, and the publisher's name are still read as
bare fields off `ArticleWithCopy`/`PublisherProfileWithCopy` (populated by the query layer, not by
a dictionary lookup) — `getPublisherProfile` in particular resolves the publisher's name through
its own separate, non-diglossia mechanism entirely. Routing all of these through the dictionary
would require extending both payload builders to include byline/section/tag entries (only
`buildArticleDictionaryPayload`, the single-article builder, currently does) and reworking
publisher-profile resolution — a larger, separate task.

**No new entity-scoped seed fixture was added.** The work order's premise — "no seed anywhere has
entity-scoped rows, which is why the constraint defect was invisible" — didn't hold up:
`tools/create/templates/modules/logistic/seed/seed.sql` already inserts `('name', 'storage_location',
<id>)` across 15 different storage locations and `('name', 'supplier', <id>)` across 3 different
suppliers, exactly the "two entity-scoped links sharing slug and scope" pattern requested. That
seed already exercises the constraint against the real Drizzle-generated schema; a scratch
`drizzle-kit generate` run against `packages/local-text-schema/src/tables/local-text-link.ts`
(see `CLAUDE.md`'s "Local-text DB schema" row) confirmed the partial index survives generation
correctly. `@sveltebuilder/content` has no seed file at all yet ("content module seed" isn't a
thing to append to), and `@sveltebuilder/local-text-schema`'s `BASE_SLUGS` are global-only by
design (no `entityId`), so neither was a natural home for a redundant example.

**dev-kitchen's hand-written unique constraint is the wrong shape.** Confirmed by reading it
directly: `apps/dev-kitchen/supabase/schemas/local_text_link.sql`'s `uq_local_text_link_global
unique nulls not distinct (slug, scope)` is a full-table constraint on two columns with no `where
entity_id is null` clause, so it would incorrectly reject two legitimate entity-scoped rows
sharing a slug and scope. Out of scope per the work order (dev-kitchen is stagnant); the correct
shape is the partial index in `packages/local-text-schema/src/tables/local-text-link.ts` /
`tools/create/templates/base/supabase/supplemental/00-local-text-rls.sql`'s Drizzle-generated
equivalent.

**Historical documents were not rewritten.** `packages/content/CONTENT_AUDIT.md` and
`CONTENT_BUILD_LOG.md` still say "hermes" in sections describing what was actually true when they
were written (a Phase 0 audit of the since-retired blog module; a build log of the content
module's construction). Rewriting a log to use terminology that didn't exist at the time would
misrepresent history rather than correct it, so these were left alone. The root `README.md`'s
Roadmap section has staleness unrelated to hermes (phases further along than its checkboxes show)
that wasn't addressed — out of scope for a hermes-reference cleanup.

**Pre-existing, unrelated defects surfaced by svelte-check.** Running svelte-check against
`packages/content` (via `apps/dev-kitchen`'s installed binary, read-only, since the package has no
`check` script and `src/lib/templates/**` is excluded from its own tsconfig — this module has
apparently never been typechecked with Svelte awareness) turned up defects with no connection to
diglossia, confirmed unrelated by checking they sit outside anything this work order touched:
`ArticleList`/`AssignmentQueue`/`SubscriberList`'s `DataTable` column-snippet typing,
`FrontCurationBoard`'s `Badge` `variant="neutral"`, `BlockEditorHost`'s `EditorBlock` type
mismatch and a stray `onChange` prop, several `ArticleWorkflowPanel` coreui prop-shape mismatches
(`tabList`, `label`, `onCheckedChange`), `NewsletterSignup`'s `Button` `label` prop, and
`AuthorProfileView`/`SectionFront` passing a `mediaAssets` prop to `ArticleCard`, which doesn't
declare one. Left as found.

---

## Verification

Phase 2.6 asks for a server-side render of an article route, asserting the response body has no
`[missing:` substring and that `<title>`, the `NewsArticle` JSON-LD `headline`, and the `og:title`
meta tag all carry real copy. This requires a live Supabase project (schema migrated, seeded, and
reachable) and a scaffolded project — neither is available in this environment. Exact manual
check:

```sh
# From a fresh scaffold:
npm create sveltebuilder@latest my-test-app   # select SuperPrototype + the Content module
cd my-test-app
# Point .env at a real Supabase project, then:
npx supabase db push                          # or: apply supabase/migrations/*.sql directly
psql "$DATABASE_URL" -f supabase/seed.sql
npm run dev
```

Then, with a published article present (the content module's seed data includes one):

```sh
curl -s http://localhost:5173/article/<seeded-article-canonical-slug> \
  | tee /tmp/article.html \
  | grep -c '\[missing:'                       # expect: 0

grep -o '<title>[^<]*</title>' /tmp/article.html
grep -o '"headline":"[^"]*"' /tmp/article.html
grep -o '<meta property="og:title"[^>]*>' /tmp/article.html
```

All three should show the article's real, resolved headline — not `[missing: article:headline:…]`
and not empty. If any come back empty or with the sentinel, the dictionary payload built by
`buildArticleDictionaryPayload` isn't reaching `createDictionary()`/`getDictionary().merge(...)`
correctly for that route, or `get_dictionary`'s RLS/grants are misconfigured for the `anon` role.
