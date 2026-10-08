# DEFERRED.md

Items intentionally deferred, or explicitly out of scope, during the diglossia 0.1.0 +
SvelteBuilder integration work order. Read alongside `CLAUDE.md`'s Known Open Issues table.

---

## Logistic module — route port complete (2026-09-30)

`@sveltebuilder/logistic` ships all of its route code as 8 screen bundles: supplier, stock, receipt,
shipment, return, cycle-count, warehouse, and dashboard. `screens/_unported/` is gone. Every loader
queries `event.locals.supabase`, every screen is internationalised (the originals were hardcoded
English throughout), and what a module offers is read from the template tree, so the create CLI's
hint now reports "8 screen bundles" with nothing left pending.

The warehouse app is one bundle rather than four. Its shell nav and home screen link to all three
flows, so any subset renders dead links, and a warehouse app without picking is not a configuration
anyone wants. `MODULE-ROUTES.md` already defines the selectable unit as a coherent feature carrying
its shared layout, so this applies that rule rather than bending it.

**Seven operations became RPCs**, all in `supabase/supplemental/05-logistic-supplements.sql` and all
SECURITY INVOKER so RLS still checks each statement inside:

| Function                                                          | Why it cannot be two calls                                                                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logistic_create_supplier`                                        | The name is a `local_text_link` plus a `local_text`, not a column, so a partial result renders `[missing: name]` in every list.                                       |
| `logistic_create_shipment`                                        | Shipment plus lines, and no screen can add a line afterwards.                                                                                                         |
| `logistic_create_return_authorization`                            | Same, and a return with no lines has nothing to grade.                                                                                                                |
| `logistic_create_cycle_count`                                     | The lines _are_ the snapshot of what the system believed was there; a later movement must not change what the counter was asked to verify.                            |
| `logistic_receive_receipt_line`                                   | Move stock, update the line, recompute the receipt's derived status. Stock moved without the line recording it double-receives on retry.                              |
| `logistic_grade_return_line`                                      | Update the line and, for a restock, put the goods away.                                                                                                               |
| `logistic_record_picked_quantity` / `logistic_complete_pick_task` | Picking must decrement on_hand and reserved together or the reservation double-counts; completing short must release the remainder or that stock is reserved forever. |

One rule runs through all of them: **the RLS-governed update goes first, and its row count is
checked.** Under RLS a forbidden UPDATE affects zero rows rather than raising, so ordering it first
means a refusal aborts before any stock has moved. The other order moves stock and then silently
fails to record it.

### Found and fixed along the way

- **All five SECURITY DEFINER stock functions had no `set search_path`**, which CLAUDE.md makes
  mandatory precisely because a definer function without one inherits the caller's search_path and
  can be made to run a shadowed object with the owner's privileges. It surfaced as a composition
  failure, not a security report: an unqualified type name in a DECLARE stops resolving once a
  hardened caller sets search_path to empty. All are schema-qualified now, with explicit grants
  rather than relying on Postgres defaulting EXECUTE to PUBLIC, and `sql:check` asserts the property
  for every definer function in `public`.
- **Props that could never have typechecked**, because these templates had never been typechecked:
  `Tabs`/`TabsTrigger` given `aria-label` and `href`, `Select` given `required`, `SelectItem` given
  children, `StatusBadge` given `status`, `PickTaskStatusBadge` imported from coreui.
- **The supplier bundle's "Add supplier" button 404'd** — it linked to `/supplier/new`, which no
  route serves. Carried over faithfully from the original.
- **Two i18n violations**: a location select rendered a raw database slug to the user, and all eight
  return condition/disposition values were literal English markup.
- **A silently dropped write**: grading a return as restocked with no location recorded the
  disposition and moved no stock.
- **A filter missing a value**: the shipment status row omitted `packed`, so packed shipments could
  not be filtered for.
- **A list capped by a fetch**: the receiving queue fetched fifty receipts and split them in JS, so
  both of its lists were bounded by whatever those fifty happened to contain.

### Still open

The RLS policy-pattern pass is done (2026-10-01): all 40 policies call the helpers as `(select …)`
and gate admin through `public.current_user_admin()`, and `pnpm sql:check` asserts both properties.

Outstanding for the package: a vitest suite (it still runs `--passWithNoTests` with no test files).
All 9 components now render in `apps/dev-kitchen`, including the 3 no screen bundle uses.

---

## Content module — route port complete, and RLS written (2026-10-01)

`@sveltebuilder/content` ships its route code as 5 screen bundles: article, section, feeds, preview,
admin-article. `screens/_unsorted/` is gone, and `@sveltebuilder/content/views` exports the screen
contracts. Its query layer was already PostgREST rather than Drizzle, so the loaders were a
translation rather than a rewrite — the work was elsewhere.

### The security finding

**All 27 of the module's tables shipped with row level security disabled.** Supabase's bootstrap
grants give anon and authenticated full privileges on everything in `public`, so anyone holding the
publishable key could read and write every one of them — `subscriber`, `comment`,
`newsletter_subscription` included. Verified rather than inferred: as the anon role, inserting a row
into `subscriber` and then deleting every row both succeeded.

Worth dwelling on why nothing caught it. A table with no policies is valid SQL; it typechecks
nowhere; and it behaves perfectly in any test that connects as an owner, because owners skip RLS.
`pnpm sql:check` now asserts that every table in `public` has RLS enabled and that every RLS-enabled
table has at least one policy — the second because a policy-less table denies everything, which is
safe but almost always a mistake rather than an intention.

`02-content-rls.sql` holds the access model. Two seams needed functions rather than policies:

- **Newsletter signup.** `subscriber` is PII, and a table anon can insert into is a table anon can
  probe — a unique violation on the email column answers "is this person subscribed?" for anyone who
  asks. `content_subscribe` is SECURITY DEFINER, idempotent, and returns void, so a caller learns
  nothing either way.
- **Preview by link.** A policy cannot see which token a request presented, so admitting "any article
  with a live token" would make every draft with an outstanding link world-readable.
  `content_preview_article` and `content_preview_blocks` take the token as the credential.

### The module shipped no seed at all

Which made it inert rather than empty: every public query resolves the slug `'published'` through
`article_status`, and with no rows there is no such status, so nothing could ever be published and
every page rendered nothing. The seed now provides the six workflow statuses, the publish checklist,
a publisher identity for the feeds, sections, topics, tags, a newsletter, and one sample article with
blocks and a byline — EN and FR throughout.

### Types narrowed, and why it kept happening

Five types in the package demanded resolved copy that the code reading them never used:
`ArticleView`'s prop, `ArticleForStructuredData`, `RssFeedArticle`, `NewsSitemapArticle` and
`validateArticleForPublish`. Each was an `ArticleWithCopy` or an `Omit<>` of one, while the function
or component already took a `DictionaryInstance` and resolved the headline through it — then read
byline names, section names and block text as baked strings off the row.

That was not merely redundant. A baked string is resolved once, by whatever query produced the row,
so it cannot follow a locale switch; and `validateArticleForPublish` was therefore validating
whichever locale the query happened to resolve. It now resolves through the dictionary and treats a
`[missing: …]` sentinel as absent, which means publishing a half-translated article is caught instead
of waved through. All five narrowed onto two named shapes, `ArticleWithRelations` and
`ArticleRenderable`; any `ArticleWithCopy` still satisfies them, so no caller broke.

### Structural additions

- **`loadEntityCopy`**, beside `loadScopedCopy` in the scaffold. Loading a whole scope is right for
  suppliers and wrong for articles: a publisher with ten thousand of them would ship ten thousand
  headlines to render one page.
- **`ScreenStorage` on the view types.** `storageBaseUrl` was referenced by the old article screen
  and returned by no loader, so every media URL was built against `undefined`.
- **`endpoints` in the manifest**, for bundles that ship `+server.ts` rather than pages. `routes`
  means "has a page", and conflating the two would have made the page assertions unenforceable.
- **`create_local_text_entry` takes an entity id.** It hardcoded `entity_id` to null, so no caller
  could create an article's headline.
- **coreui `Checkbox` gained `onCheckedChange`.** `bind:checked` covers a parent that owns the value,
  not one that needs to persist the change.

### Still open

Unit tests now exist (`packages/content/test/`, five files rendering 9 of the 18 components
server-side, including a no-`[missing:]` gate), but the other 9 have none. The live-coverage,
front-curation, author-profile, newsletter and
media screens were never written — only the thirteen route files that existed were ported, and
`SectionFront`, `FrontCurationBoard`, `AssignmentQueue`, `SubscriberList`, `LiveCoverageView` and
`AuthorProfileView` are components with no screen rendering them. They render in `apps/dev-kitchen`
and pass its accessibility audit, but no scaffold can show them. That is the next content gap, and
it is feature work rather than a port.

The section page is a lead-plus-river listing. The screen it replaced rendered a curated front and
nothing else, which was blank for any section without curation — every section a fresh scaffold has.
Fronts deserve their own screen; they do not belong bolted to a section listing.

---

## Native template — ON HOLD (2026-09-29)

`tools/create/templates/native/` is frozen. It is not selectable in `npm create sveltebuilder`
(the CLI cancels if chosen), and no further work goes into it until that decision is revisited.

Rationale: SuperPrototype is being realigned to use Supabase's own client and patterns rather than
a provider-neutral Drizzle + `withUser` data layer. Maintaining Native in lockstep would force
SuperPrototype to keep fighting Supabase's model for the sake of a template nobody can install
yet. SvelteBuilder is also locked to Postgres, which removes the portability argument that
motivated a database-agnostic query layer in the first place.

Standing rules while on hold:

- Shared surfaces — base template, `@sveltebuilder/coreui`, `@sveltebuilder/local-text-schema`,
  and the domain module packages — must not take hard Supabase dependencies. The seam stays where
  it is.
- SuperPrototype-only code may be fully Supabase-coupled.
- Native's own drift is expected and not a defect to fix.

What Native will need whenever it resumes (record additions here rather than fixing them now):

- A data-access story to replace whatever SuperPrototype drops. If SuperPrototype moves to
  `supabase-js`/PostgREST, Native needs its own query layer, and the two templates will no longer
  share route code.
- A working RLS enforcement mechanism. Native's current `withUser` + `app.current_user_id` GUC
  pattern does not enforce RLS at all when the connection role owns the tables or is a superuser
  (see the RLS section of this repo's history); a dedicated non-owner Postgres role plus
  `ALTER DEFAULT PRIVILEGES` is the fix, and it has not been applied.
- Its own schema/migration path. It has no `supabase/` directory and `sveltebuilder sync:supabase`
  is Supabase-specific; `CLAUDE.md` already notes Native has never defined a sync path.
- A `README.md` (it has none) and `.env.example` guidance that does not point `DATABASE_URL` at a
  table-owning superuser role.
- **Two SQL functions it does not define.** The shared base template's
  `supabase/supplemental/00-local-text-rls.sql` calls `public.current_user_admin()` and
  `public.current_user_id()`. SuperPrototype supplies both in
  `supabase/supplemental/00-auth-functions.sql`, resolved from `auth.uid()`. Native has no
  `supabase/` directory at all, so it supplies neither — it will need its own definitions with the
  same signatures (`current_user_id() returns bigint`, `current_user_admin() returns boolean`),
  plus an equivalent of `ensure_user_account()`. This is the seam; it is deliberately narrow.
- **A route-code story.** SuperPrototype's routes now query `event.locals.supabase` directly, so
  the two templates no longer share loader/action code at all.

---

## dev-kitchen — rebuilt (2026-10-07)

The first `apps/dev-kitchen` was deleted on 2026-09-30 (commit 4988ae6) after it hand-maintained a
second copy of the scaffold's wiring until it could not build. It was rebuilt on 2026-10-07 to the
requirements in `docs/DEV-KITCHEN.md`, which now records the design as built, what its first runs
found, and what it still does not cover.

Standing rules:

- **Never edit its generated chrome.** `hooks.server.ts`, the root layout and error page,
  `app.d.ts`, `app.html` and the CSS are copied from `tools/create/templates/base/` on every run and
  gitignored. A change to them belongs in the template.
- **Nothing under `apps/` is exempt from CI.** Keep it that way instead of reintroducing a filter.
- **A new component export needs a showcase page.** `pnpm check` fails otherwise; that is the point.

### Found by it and not fixed

- **No favicon in any scaffold.** Both templates' `app.html` link `%sveltekit.assets%/favicon.png`,
  and neither ships a `static/` directory, so every page of every scaffolded app requests a file
  that does not exist and logs a 404. Fixing it needs an icon, which is a branding decision.
- **`ArticleWorkflowPanel` is hard-coded English** ("Article Workflow", "Status", "Checklist",
  "Team", "Required", the role names). It now works and is accessible, but showing it in another
  locale needs copy slugs and seed rows.
- **coreui's internal `class="label"`.** Seven components besides `Field` and `LocaleSwitcher` use
  it for an internal element, so the form `Label`'s rules apply to them too. `Button`'s use failed
  contrast and was renamed; the others pass, by luck rather than design.
- **Right-to-left mirroring is unreviewed.** `components.css` has 15 physical-direction
  declarations (`left`, `margin-right`, …) against 5 logical ones. axe passes under `dir="rtl"`,
  but mirroring is visual.

---

## Pending manual steps

**Migrate the Supabase project to asymmetric JWT signing keys.** `getClaims()` only verifies
tokens locally — the whole reason it replaced `getUser()` in `auth-resolver.ts` — when the project
signs with an asymmetric key (ES256/RSA) it can publish at `.well-known/jwks.json`. On a project
still using the legacy shared HS256 secret, `getClaims()` falls back to asking the Auth server,
which works but gives up the latency win. This is a dashboard action per project (Auth > Signing
Keys), not something the scaffold can do. Wait ~20 minutes after creating a standby key before
rotating, so in-flight tokens are not rejected.

**Verify the app layer against a live Supabase project.** The SQL half of the RLS rebuild has been
executed and tested (see below), but nothing has run against real Supabase or PostgREST.
Specifically unverified:

- `getClaims()` end to end against a real Supabase-issued JWT, and its behaviour on a project that
  has _not_ yet migrated to asymmetric signing keys.
- PostgREST response shapes the loaders assume: that the embedded `local_text_link(...)` resource
  comes back as a single object rather than an array (it should, given the FK), that `.rpc()` binds
  `bigint[]` / `text[]` array arguments as written, and that `.upsert(..., { onConflict:
'link,locale' })` targets `uq_local_text_entry` correctly.
- The whole scaffold flow: `npm create sveltebuilder` → `sync:supabase` → `db:reset` → `dev`, with
  a real sign-in.
- That the admin area's new 403 for a signed-in non-admin renders sensibly rather than as a raw
  error page.

**Already verified (2026-09-29, throwaway Postgres 16 container with a stand-in `auth.uid()` and
non-owner `anon`/`authenticated` roles).** All five supplemental SQL files applied cleanly and
twelve behavioural cases passed. Worth recording because two of them were the actual risks:

- The **old** inline `exists (select 1 from public.user_account …)` policy on `user_account` does
  raise `infinite recursion detected in policy for relation` — confirming the latent bug the total
  RLS bypass had been masking. The `current_user_admin()` SECURITY DEFINER helper resolves it: the
  rewritten policy returns 2 rows for an admin and 1 (own row only) for a non-admin.
- `ensure_user_account()` grants `admin = true` to the first principal and, critically, **not** to
  the second. This is the privilege-escalation trap that would appear if the emptiness check ever
  moved back into application code, where RLS hides all rows from a brand-new user.
- Non-admins are refused writes to `locale` and refused inside the SECURITY INVOKER RPCs, proving
  those functions add atomicity without adding privilege.
- `create_local_text_entry` rolls back as one unit on a bad locale FK, leaving no orphaned link.
- `get_dictionary` resolves for `anon`, including locale fallback.

The harness is not kept in the repo — it hand-rolls the Supabase-managed pieces and would rot
against the real platform. Recreate it if these policies change materially.

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

**dev-kitchen's divergent unique constraint is gone with the app.** Its
`supabase/schemas/local_text_link.sql` carried a hand-written `uq_local_text_link_global unique
nulls not distinct (slug, scope)` — a full-table constraint on two columns with no `where entity_id
is null` clause, so it would have rejected two legitimate entity-scoped rows sharing a slug and
scope. It was never fixed, and commit 4988ae6 deleted it, leaving the correct shape as the only
definition in the repo: the partial index in
`packages/local-text-schema/src/tables/local-text-link.ts` and its Drizzle-generated equivalent in
`tools/create/templates/base/supabase/supplemental/00-local-text-rls.sql`.

**Historical documents were not rewritten.** `packages/content/CONTENT_AUDIT.md` and
`CONTENT_BUILD_LOG.md` still say "hermes" in sections describing what was actually true when they
were written (a Phase 0 audit of the since-retired blog module; a build log of the content
module's construction). Rewriting a log to use terminology that didn't exist at the time would
misrepresent history rather than correct it, so these were left alone. The root `README.md`'s
Roadmap section has staleness unrelated to hermes (phases further along than its checkboxes show)
that wasn't addressed — out of scope for a hermes-reference cleanup.

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
