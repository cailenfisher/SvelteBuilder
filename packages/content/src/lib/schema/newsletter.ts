import { pgTable, bigint, boolean, text, timestamp } from 'drizzle-orm/pg-core';

export const newsletter = pgTable('newsletter', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  slug: text('slug').notNull().unique(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
});

export type Newsletter = typeof newsletter.$inferSelect;

export type NewsletterWithCopy = Newsletter & {
  name: string;
  description: string;
};
