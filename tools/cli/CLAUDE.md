# CLAUDE.md — @sveltebuilder/cli


A scaffolded project registers every module's schema in `.sveltebuilder/registry/*.json`:

```json
{
  "package": "@sveltebuilder/commerce",
  "schema": "@sveltebuilder/commerce/schema",
  "after": ["@sveltebuilder/local-text-schema"]
}
```

`schema` is an ESM module specifier — either an npm export (`@pkg/schema`) or a
project-root-relative path (`./src/lib/server/schema.ts`) for the scaffold's own tables.
`after` controls topological ordering across modules; `@sveltebuilder/local-text-schema` sorts first.

`sveltebuilder sync:supabase` (in `@sveltebuilder/cli`):

1. Discovers manifests from `.sveltebuilder/registry/*.json` and resolves `after`-order.
2. Writes a barrel file (`.sveltebuilder/schema.ts`) re-exporting every module's Drizzle schema.
3. Runs `drizzle-kit generate` against that barrel to produce `supabase/migrations/*.sql`.
4. Writes any new or changed `supabase/supplemental/*.sql` (RLS, functions — anything Drizzle
   can't express) into a migration created by this run: drizzle-kit's own when the schema
   changed, else an empty `drizzle-kit generate --custom` one. Never into an existing migration,
   which may already be applied where `supabase db push` will not run it again.
5. Regenerates `supabase/seed.sql` from `@sveltebuilder/local-text-schema`'s canonical locale/slug
   data plus any `supabase/seeds/*.sql` files, appended in alphabetical order.

`sveltebuilder sync` is a deprecated alias for `sync:supabase`. There is no `sync:drizzle` —
the Native template has no Supabase migrations step and has not yet defined its own sync path.
