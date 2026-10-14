import { pgTable, bigint, index, primaryKey } from 'drizzle-orm/pg-core';
import { article } from './article.js';
import { topic } from './topic.js';

export const articleTopic = pgTable(
  'article_topic',
  {
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    topicId: bigint('topic_id', { mode: 'number' })
      .notNull()
      .references(() => topic.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.topicId] }),
    index('idx_article_topic_topic').on(table.topicId),
  ]
);

export type ArticleTopic = typeof articleTopic.$inferSelect;
