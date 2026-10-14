import { pgTable, bigint, index, primaryKey } from 'drizzle-orm/pg-core';
import { article } from './article.js';
import { tag } from './tag.js';

export const articleTag = pgTable(
  'article_tag',
  {
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    tagId: bigint('tag_id', { mode: 'number' })
      .notNull()
      .references(() => tag.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.tagId] }),
    index('idx_article_tag_tag').on(table.tagId),
  ]
);

export type ArticleTag = typeof articleTag.$inferSelect;
