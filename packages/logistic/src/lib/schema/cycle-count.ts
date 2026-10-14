import { pgEnum, pgTable, bigint, index, timestamp } from 'drizzle-orm/pg-core';
import { CYCLE_COUNT_STATUSES } from './cycle-count-status.js';
import type { CycleCountLine } from './cycle-count-line.js';
import type { StorageLocationWithCopy } from './storage-location.js';

export const cycleCountStatus = pgEnum('cycle_count_status', CYCLE_COUNT_STATUSES);

export const cycleCount = pgTable(
  'cycle_count',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }).notNull(),
    status: cycleCountStatus('status').notNull().default('open'),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('idx_cycle_count_status').on(table.status, table.createdAt)],
);

export type CycleCount = typeof cycleCount.$inferSelect;

export type CycleCountWithLines = CycleCount & {
  lines: Array<CycleCountLine & { storageLocation: StorageLocationWithCopy }>;
};
