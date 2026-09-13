import { pgTable, bigint, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const localTextLink = pgTable(
  'local_text_link',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull(),
    scope: text('scope'),
    entityId: bigint('entity_id', { mode: 'number' }),
  },
  (table) => [
    // Unique on all three columns (handles rows where entity_id is not null)
    uniqueIndex('uq_local_text_link_slug_scope_entity').on(
      table.slug,
      table.scope,
      table.entityId,
    ),
    // Partial unique on slug + scope where entity_id is null
    uniqueIndex('uq_local_text_link_slug_scope_null_entity')
      .on(table.slug, table.scope)
      .where(sql`${table.entityId} is null`),
  ],
);

export type LocalTextLink = typeof localTextLink.$inferSelect;
export type NewLocalTextLink = typeof localTextLink.$inferInsert;
