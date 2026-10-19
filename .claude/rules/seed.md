---
paths:
  - "**/seed/**"
  - "**/seeds/**"
  - "**/seed.sql"
  - "tools/cli/src/lib/generate-seed-sql.ts"
  - "packages/local-text-schema/**"
  - "tools/create/templates/modules/**"
---

### Seed file conventions

**Never use manual IDs.** All `INSERT` statements omit the `id` column; sequences assign IDs
automatically. This applies to every table including `local_text_link` and `local_text`.

**Resolve entity IDs by slug.** When a seed record needs a foreign key to a just-inserted
entity, join on the entity's `slug` column — never copy-paste a generated integer ID.

**Resolve locale IDs by code.** Use `(select id from locale where code = 'en')` as an inline
subquery — never assume a locale has a specific integer ID.

**`local_text_link` conflicts.** Use `on conflict do nothing` for all link inserts. The single
`UNIQUE NULLS NOT DISTINCT (slug, scope, entity_id)` constraint produces the conflict this clause
resolves, for entity-bound copy, scoped UI copy, and global copy alike.

That constraint is what makes seeds re-runnable, so do not "simplify" it to a plain `UNIQUE`.
Without `NULLS NOT DISTINCT`, global rows (`scope` and `entity_id` both null) raise no conflict —
Postgres treats NULLs as distinct in a unique index — so `on conflict do nothing` becomes a silent
no-op and re-running a seed duplicates every global link. `get_dictionary`'s `distinct on` masks
the damage at read time, so the first symptom is a doubled admin list, not a failure. Use the bare
clause rather than naming a conflict target: one constraint now covers every case, and the bare
form keeps working if that ever changes.

**Language coverage.** Every module seed must provide English (`en`) and French (`fr`)
translations at minimum — both entity-bound names and UI application-level copy. Follow the
`select … join local_text_link … on conflict (link, locale) do nothing` pattern used by
`tools/cli/src/lib/generate-seed-sql.ts` (base local-text seed) and each module's own
`seed/seed.sql` template (e.g. `tools/create/templates/modules/logistic/seed/seed.sql`).

**UI copy scope.** Application-level copy within a module uses `scope = '<module-name>'` and
`entity_id = null`. Entity-bound copy uses `scope = '<table_name>'` and
`entity_id = <entity>.id`.

**UI copy slugs.** A module's application-level slug always starts with the module name, even
though its scope already says it: `logistic.inbound_receipt.title` in scope `logistic`. The second
segment is the full, singular concept name (`inbound_receipt`, never `receipt` or `receipts`).
Screens, components, manifests and seeds all use the same full slug.

---
