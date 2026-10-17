import { pgTable, bigint, index, timestamp } from 'drizzle-orm/pg-core';
import { article } from './article.js';

export const articleRevision = pgTable(
  'article_revision',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('idx_article_revision_article').on(table.articleId, table.createdAt)]
);

export type ArticleRevision = typeof articleRevision.$inferSelect;
