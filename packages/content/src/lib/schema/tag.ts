import { pgTable, bigint, boolean, text, timestamp } from 'drizzle-orm/pg-core';

export const tag = pgTable('tag', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  slug: text('slug').notNull().unique(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
});

export type Tag = typeof tag.$inferSelect;

export type TagWithCopy = Tag & {
  name: string;
};
