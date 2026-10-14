import { pgEnum, pgTable, bigint, index, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { RETURN_CONDITIONS } from './return-condition.js';
import { RETURN_DISPOSITIONS } from './return-disposition.js';
import { shipmentLine } from './shipment-line.js';
import { returnAuthorization } from './return-authorization.js';

export const returnCondition = pgEnum('return_condition', RETURN_CONDITIONS);

export const returnDisposition = pgEnum('return_disposition', RETURN_DISPOSITIONS);

export const returnAuthorizationLine = pgTable(
  'return_authorization_line',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    returnAuthorizationId: bigint('return_authorization_id', { mode: 'number' })
      .notNull()
      .references(() => returnAuthorization.id, { onDelete: 'cascade' }),
    shipmentLineId: bigint('shipment_line_id', { mode: 'number' }).references(
      () => shipmentLine.id,
      { onDelete: 'set null' },
    ),
    sku: text('sku').notNull(),
    expectedQuantity: integer('expected_quantity').notNull(),
    receivedQuantity: integer('received_quantity').notNull().default(0),
    condition: returnCondition('condition'),
    disposition: returnDisposition('disposition'),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_return_authorization_line_return').on(table.returnAuthorizationId),
  ],
);

export type ReturnAuthorizationLine = typeof returnAuthorizationLine.$inferSelect;
