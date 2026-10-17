import { pgTable, bigint, check, index, integer, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { storageLocation } from './storage-location.js';
import type { StorageLocationWithCopy } from './storage-location.js';

export const stockLevel = pgTable(
  'stock_level',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    storageLocationId: bigint('storage_location_id', { mode: 'number' })
      .notNull()
      .references(() => storageLocation.id),
    sku: text('sku').notNull(),
    onHand: integer('on_hand').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    // Low-stock threshold compared against available (on_hand - reserved). Null = no alerting.
    reorderPoint: integer('reorder_point'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_stock_level_location_sku').on(table.storageLocationId, table.sku),
    index('idx_stock_level_location').on(table.storageLocationId),
    index('idx_stock_level_sku').on(table.sku),
    check('stock_on_hand_non_negative', sql`${table.onHand} >= 0`),
    check('stock_reserved_non_negative', sql`${table.reserved} >= 0`),
    check('stock_reserved_lte_on_hand', sql`${table.reserved} <= ${table.onHand}`),
  ],
);

export type StockLevel = typeof stockLevel.$inferSelect;

// available is derived: on_hand - reserved (never stored in DB)
export type StockLevelWithLocation = StockLevel & {
  available: number;
  storageLocation: StorageLocationWithCopy;
};
