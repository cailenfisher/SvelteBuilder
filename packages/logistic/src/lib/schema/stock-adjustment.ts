import { pgEnum, pgTable, bigint, index, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { ADJUSTMENT_REASONS } from './adjustment-reason.js';
import { stockLevel } from './stock-level.js';

export const adjustmentReason = pgEnum('adjustment_reason', ADJUSTMENT_REASONS);

export const stockAdjustment = pgTable(
  'stock_adjustment',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    stockLevelId: bigint('stock_level_id', { mode: 'number' })
      .notNull()
      .references(() => stockLevel.id),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }).notNull(),
    delta: integer('delta').notNull(),
    onHandBefore: integer('on_hand_before').notNull(),
    onHandAfter: integer('on_hand_after').notNull(),
    reason: adjustmentReason('reason').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_stock_adjustment_stock_level').on(table.stockLevelId, table.createdAt),
  ],
);

export type StockAdjustment = typeof stockAdjustment.$inferSelect;
