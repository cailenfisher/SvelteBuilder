import { pgTable, bigint, index, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { storageLocation } from './storage-location.js';
import { inboundReceipt } from './inbound-receipt.js';

export const inboundReceiptLine = pgTable(
  'inbound_receipt_line',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    inboundReceiptId: bigint('inbound_receipt_id', { mode: 'number' })
      .notNull()
      .references(() => inboundReceipt.id, { onDelete: 'cascade' }),
    storageLocationId: bigint('storage_location_id', { mode: 'number' })
      .notNull()
      .references(() => storageLocation.id),
    sku: text('sku').notNull(),
    expectedQuantity: integer('expected_quantity').notNull(),
    receivedQuantity: integer('received_quantity').notNull().default(0),
    discrepancy: integer('discrepancy')
      .generatedAlwaysAs(sql`received_quantity - expected_quantity`)
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('idx_inbound_receipt_line_receipt').on(table.inboundReceiptId)],
);

export type InboundReceiptLine = typeof inboundReceiptLine.$inferSelect;
