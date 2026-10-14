import { pgEnum, pgTable, bigint, index, text, timestamp } from 'drizzle-orm/pg-core';
import { RETURN_AUTHORIZATION_STATUSES } from './return-authorization-status.js';
import { shipment } from './shipment.js';
import type { ReturnAuthorizationLine } from './return-authorization-line.js';

export const returnAuthorizationStatus = pgEnum('return_authorization_status', RETURN_AUTHORIZATION_STATUSES);

export const returnAuthorization = pgTable(
  'return_authorization',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    shipmentId: bigint('shipment_id', { mode: 'number' }).references(() => shipment.id, {
      onDelete: 'set null',
    }),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }).notNull(),
    status: returnAuthorizationStatus('status').notNull().default('pending'),
    reason: text('reason'),
    note: text('note'),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_return_authorization_status').on(table.status, table.createdAt),
    index('idx_return_authorization_shipment').on(table.shipmentId),
  ],
);

export type ReturnAuthorization = typeof returnAuthorization.$inferSelect;

export type ReturnAuthorizationWithLines = ReturnAuthorization & {
  lines: ReturnAuthorizationLine[];
};
