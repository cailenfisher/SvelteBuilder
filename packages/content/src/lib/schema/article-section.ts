import { pgTable, bigint, index, primaryKey } from 'drizzle-orm/pg-core';
import { article } from './article.js';
import { section } from './section.js';

export const articleSection = pgTable(
  'article_section',
  {
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    sectionId: bigint('section_id', { mode: 'number' })
      .notNull()
      .references(() => section.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.sectionId] }),
    index('idx_article_section_section').on(table.sectionId),
  ]
);

export type ArticleSection = typeof articleSection.$inferSelect;
