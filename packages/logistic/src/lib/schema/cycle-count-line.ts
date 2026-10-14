import { pgTable, bigint, index, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { storageLocation } from './storage-location.js';
import { stockLevel } from './stock-level.js';
import { cycleCount } from './cycle-count.js';

export const cycleCountLine = pgTable(
  'cycle_count_line',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    cycleCountId: bigint('cycle_count_id', { mode: 'number' })
      .notNull()
      .references(() => cycleCount.id, { onDelete: 'cascade' }),
    stockLevelId: bigint('stock_level_id', { mode: 'number' })
      .notNull()
      .references(() => stockLevel.id),
    storageLocationId: bigint('storage_location_id', { mode: 'number' })
      .notNull()
      .references(() => storageLocation.id),
    sku: text('sku').notNull(),
    expectedQuantity: integer('expected_quantity').notNull(),
    countedQuantity: integer('counted_quantity'),
    variance: integer('variance').generatedAlwaysAs(
      sql`counted_quantity - expected_quantity`,
    ),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('idx_cycle_count_line_count').on(table.cycleCountId)],
);

export type CycleCountLine = typeof cycleCountLine.$inferSelect;
