import { pgTable, bigint, index, integer, text } from 'drizzle-orm/pg-core';

export const articleStatus = pgTable(
  'article_status',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull().unique(),
    position: integer('position').notNull().default(0),
  },
  (table) => [index('idx_article_status_position').on(table.position)]
);

export type ArticleStatus = typeof articleStatus.$inferSelect;

export type ArticleStatusWithCopy = ArticleStatus & {
  label: string;
};
