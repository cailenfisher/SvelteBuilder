import { pgTable, bigint, text, unique } from 'drizzle-orm/pg-core';

export const localTextLink = pgTable(
  'local_text_link',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull(),
    scope: text('scope'),
    entityId: bigint('entity_id', { mode: 'number' }),
  },
  (table) => [
    // One link per (slug, scope, entity_id), with NULL treated as a value.
    //
    // NULLS NOT DISTINCT is load-bearing, not a detail. A plain unique index over
    // these three columns does not constrain global copy at all: scope and
    // entity_id are both NULL there, Postgres treats NULLs as distinct in a unique
    // index, and so every re-insert of ('app.name', null, null) is accepted as a
    // new row. That makes `on conflict do nothing` a no-op for exactly the rows the
    // base seed is made of — re-running a seed silently duplicates every global
    // link, and get_dictionary's `distinct on` hides it at read time.
    //
    // The pair of indexes this replaces (a plain unique on all three columns plus a
    // partial unique on (slug, scope) where entity_id is null) covered the
    // entity-bound and scoped-UI cases and missed the global one for the same
    // reason. One constraint with NULLS NOT DISTINCT covers all three:
    //
    //   ('app.name',  null,     null)  twice  → conflict (global UI copy)
    //   ('buy_label', 'product', null) twice  → conflict (scoped UI copy)
    //   ('title',     'product', 1) vs (…, 2) → allowed  (per-entity copy)
    //
    // Requires Postgres 15+, which Supabase has been on since before this schema
    // existed. The pre-Drizzle SQL schema expressed it this way too.
    unique('uq_local_text_link_slug_scope_entity')
      .on(table.slug, table.scope, table.entityId)
      .nullsNotDistinct(),
  ],
);

export type LocalTextLink = typeof localTextLink.$inferSelect;
export type NewLocalTextLink = typeof localTextLink.$inferInsert;
