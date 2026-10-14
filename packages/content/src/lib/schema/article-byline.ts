import { pgTable, bigint, index, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { article } from './article.js';
import { authorProfile } from './author-profile.js';

export const articleByline = pgTable(
  'article_byline',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    authorProfileId: bigint('author_profile_id', { mode: 'number' })
      .notNull()
      .references(() => authorProfile.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(1),
  },
  (table) => [
    uniqueIndex('uq_article_byline').on(table.articleId, table.authorProfileId),
    index('idx_article_byline_article').on(table.articleId, table.position),
    index('idx_article_byline_author').on(table.authorProfileId),
  ]
);

export type ArticleByline = typeof articleByline.$inferSelect;
