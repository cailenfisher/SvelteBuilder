import { pgTable, bigint, index, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { storageLocation } from './storage-location.js';
import { stockLevel } from './stock-level.js';
import { pickTask } from './pick-task.js';

export const pickTaskLine = pgTable(
  'pick_task_line',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    pickTaskId: bigint('pick_task_id', { mode: 'number' })
      .notNull()
      .references(() => pickTask.id, { onDelete: 'cascade' }),
    stockLevelId: bigint('stock_level_id', { mode: 'number' })
      .notNull()
      .references(() => stockLevel.id),
    storageLocationId: bigint('storage_location_id', { mode: 'number' })
      .notNull()
      .references(() => storageLocation.id),
    sku: text('sku').notNull(),
    requestedQuantity: integer('requested_quantity').notNull(),
    pickedQuantity: integer('picked_quantity').notNull().default(0),
    // Walk order within the task, snapshotted from storage_location.sort_order at creation.
    sequence: integer('sequence').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('idx_pick_task_line_task').on(table.pickTaskId, table.sequence)],
);

export type PickTaskLine = typeof pickTaskLine.$inferSelect;
