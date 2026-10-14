import { pgEnum, pgTable, bigint, index, text, timestamp } from 'drizzle-orm/pg-core';
import { INBOUND_RECEIPT_STATUSES } from './inbound-receipt-status.js';
import { supplier } from './supplier.js';
import type { InboundReceiptLine } from './inbound-receipt-line.js';
import type { SupplierWithCopy } from './supplier.js';

export const inboundReceiptStatus = pgEnum('inbound_receipt_status', INBOUND_RECEIPT_STATUSES);

export const inboundReceipt = pgTable(
  'inbound_receipt',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    // Null = blind receiving (ad-hoc inbound without a supplier/PO reference).
    supplierId: bigint('supplier_id', { mode: 'number' }).references(() => supplier.id),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }).notNull(),
    status: inboundReceiptStatus('status').notNull().default('pending'),
    expectedAt: timestamp('expected_at', { withTimezone: true, mode: 'string' }),
    receivedAt: timestamp('received_at', { withTimezone: true, mode: 'string' }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_inbound_receipt_supplier').on(table.supplierId),
    index('idx_inbound_receipt_status').on(table.status, table.createdAt),
  ],
);

export type InboundReceipt = typeof inboundReceipt.$inferSelect;

export type InboundReceiptWithCopy = InboundReceipt & {
  // Null for blind receipts.
  supplier: SupplierWithCopy | null;
  lines: InboundReceiptLine[];
};
