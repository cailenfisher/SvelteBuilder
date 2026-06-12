import { pgTable, bigint, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { locale } from './locale.ts';
import { localTextLink } from './local-text-link.ts';

export const localText = pgTable(
  'local_text',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    link: bigint('link', { mode: 'number' })
      .notNull()
      .references(() => localTextLink.id, { onDelete: 'restrict' }),
    locale: bigint('locale', { mode: 'number' })
      .notNull()
      .references(() => locale.id, { onDelete: 'restrict' }),
    content: text('content').notNull(),
  },
  (table) => [uniqueIndex('uq_local_text_entry').on(table.link, table.locale)],
);

export type LocalText = typeof localText.$inferSelect;
export type NewLocalText = typeof localText.$inferInsert;
