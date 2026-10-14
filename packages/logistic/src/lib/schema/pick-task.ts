import { pgEnum, pgTable, bigint, index, timestamp } from 'drizzle-orm/pg-core';
import { PICK_TASK_STATUSES } from './pick-task-status.js';
import type { PickTaskLine } from './pick-task-line.js';
import type { StorageLocationWithCopy } from './storage-location.js';

export const pickTaskStatus = pgEnum('pick_task_status', PICK_TASK_STATUSES);

export const pickTask = pgTable(
  'pick_task',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }),
    status: pickTaskStatus('status').notNull().default('open'),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_pick_task_status').on(table.status, table.createdAt),
    index('idx_pick_task_user_account').on(table.userAccountId),
  ],
);

export type PickTask = typeof pickTask.$inferSelect;

export type PickTaskWithLines = PickTask & {
  lines: Array<PickTaskLine & { storageLocation: StorageLocationWithCopy }>;
};
