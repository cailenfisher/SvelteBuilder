import { pgTable, bigint, boolean, index, text, timestamp } from 'drizzle-orm/pg-core';

export const authorProfile = pgTable(
  'author_profile',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }),
    slug: text('slug').notNull().unique(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_author_profile_user').on(table.userAccountId),
    index('idx_author_profile_slug').on(table.slug),
  ]
);

export type AuthorProfile = typeof authorProfile.$inferSelect;

export type AuthorProfileWithCopy = AuthorProfile & {
  name: string;
  bio: string;
};
