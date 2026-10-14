import { pgTable, bigint, boolean, index, integer, timestamp } from 'drizzle-orm/pg-core';
import { liveCoverage } from './live-coverage.js';

export const liveUpdate = pgTable(
  'live_update',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    liveCoverageId: bigint('live_coverage_id', { mode: 'number' })
      .notNull()
      .references(() => liveCoverage.id, { onDelete: 'cascade' }),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    pinned: boolean('pinned').notNull().default(false),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_live_update_coverage').on(table.liveCoverageId, table.position),
    index('idx_live_update_published').on(table.publishedAt),
    index('idx_live_update_pinned').on(table.liveCoverageId, table.pinned),
  ]
);

export type LiveUpdate = typeof liveUpdate.$inferSelect;

export type LiveUpdateWithCopy = LiveUpdate & {
  text: string;
};
