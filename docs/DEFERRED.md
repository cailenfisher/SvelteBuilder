# DEFERRED.md

Items intentionally deferred, or explicitly out of scope, during the diglossia 0.1.0 +
SvelteBuilder integration work order. Read alongside `CLAUDE.md`'s Known Open Issues table.

---

## Logistic module — GATED (2026-09-30)

`@sveltebuilder/logistic` is no longer selectable in `npm create sveltebuilder`. The CLI names the
reason and stops rather than scaffolding without a module the user asked for.

Its 18 route templates under `tools/create/templates/modules/logistic/routes/` query through
`locals.db.withUser()`. Phase 1 removed that handle from SuperPrototype, so every one of those files
references something the generated project no longer has — the scaffold did not typecheck, and
nothing caught it until a smoke test, because no route template is exercised by CI.

The module's `./server` export has the same problem one layer down: its queries import `drizzle-orm`
at runtime, which guardrail 8 in `CLAUDE.md` forbids precisely because a direct connection runs as a
table-owning role and bypasses RLS. So porting the route templates alone would strand the query layer
they call. `@sveltebuilder/content` exports a Drizzle `./server` too; it escaped the break only
because it ships no route templates.

What to decide before ungating — the full exploration is in `docs/MODULE-ROUTES.md`:

- whether Native is cancelled, which collapses most of the question;
- what happens to the modules' `./server` export (deleted, moved into Postgres as views and
  `SECURITY INVOKER` functions, or made Native-only);
- whether modules should ship route code by copying at all, given that a copied route is a fork at
  scaffold time and can never receive a fix.

Do not simply rewrite the 18 files against `locals.supabase`. That restores the option while
re-committing to the pattern that broke, and leaves both the `./server` question and the
upgradeability question untouched.

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
  has *not* yet migrated to asymmetric signing keys.
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
