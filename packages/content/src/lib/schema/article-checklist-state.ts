import { pgTable, bigint, boolean, index, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { article } from './article.js';
import { publishChecklistItem } from './publish-checklist-item.js';

export const articleChecklistState = pgTable(
  'article_checklist_state',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    publishChecklistItemId: bigint('publish_checklist_item_id', { mode: 'number' })
      .notNull()
      .references(() => publishChecklistItem.id, { onDelete: 'cascade' }),
    satisfied: boolean('satisfied').notNull().default(false),
    satisfiedAt: timestamp('satisfied_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    uniqueIndex('uq_article_checklist_state').on(table.articleId, table.publishChecklistItemId),
    index('idx_article_checklist_state_article').on(table.articleId),
  ]
);

export type ArticleChecklistState = typeof articleChecklistState.$inferSelect;
