---
"@sveltebuilder/logistic": minor
"@sveltebuilder/content": minor
---

Modules no longer ship a data-access layer.

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
