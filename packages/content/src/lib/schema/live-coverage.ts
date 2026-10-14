import { pgTable, bigint, boolean, index, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { article } from './article.js';
import type { LiveUpdateWithCopy } from './live-update.js';

export const liveCoverage = pgTable(
  'live_coverage',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    active: boolean('active').notNull().default(true),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    uniqueIndex('uq_live_coverage_article').on(table.articleId),
    index('idx_live_coverage_article').on(table.articleId),
    index('idx_live_coverage_active').on(table.active),
  ]
);

export type LiveCoverage = typeof liveCoverage.$inferSelect;

export type LiveCoverageWithUpdates = LiveCoverage & {
  updates: LiveUpdateWithCopy[];
};
