import { pgTable, bigint, text } from 'drizzle-orm/pg-core';

export const locale = pgTable('locale', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  nativeName: text('native_name').notNull(),
  dir: text('dir').notNull().default('ltr'),
});

export type Locale = typeof locale.$inferSelect;
export type NewLocale = typeof locale.$inferInsert;
