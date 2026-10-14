import { pgTable, bigint, boolean, index, integer, text } from 'drizzle-orm/pg-core';

export const publishChecklistItem = pgTable(
  'publish_checklist_item',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull().unique(),
    position: integer('position').notNull().default(0),
    required: boolean('required').notNull().default(true),
  },
  (table) => [index('idx_publish_checklist_item_position').on(table.position)]
);

export type PublishChecklistItem = typeof publishChecklistItem.$inferSelect;
