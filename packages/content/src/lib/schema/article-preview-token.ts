import { pgTable, bigint, index, text, timestamp } from 'drizzle-orm/pg-core';
import { article } from './article.js';

export const articlePreviewToken = pgTable(
  'article_preview_token',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_article_preview_token_article').on(table.articleId),
    index('idx_article_preview_token_token').on(table.token),
    index('idx_article_preview_token_expiry').on(table.expiresAt),
  ]
);

export type ArticlePreviewToken = typeof articlePreviewToken.$inferSelect;
