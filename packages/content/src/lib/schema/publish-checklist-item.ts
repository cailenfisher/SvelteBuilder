import { pgTable, bigint, boolean, index, integer, text } from 'drizzle-orm/pg-core';

export const publishChecklistItem = pgTable(
  'publish_checklist_item',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull().unique(),
    ordinal: integer('ordinal').notNull().default(0),
    required: boolean('required').notNull().default(true),
  },
  (table) => [index('idx_publish_checklist_item_ordinal').on(table.ordinal)]
);

export type PublishChecklistItem = typeof publishChecklistItem.$inferSelect;
