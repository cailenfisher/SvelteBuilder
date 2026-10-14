import { pgTable, bigint, index, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { pickTaskLine } from './pick-task-line.js';
import { shipment } from './shipment.js';

export const shipmentLine = pgTable(
  'shipment_line',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    shipmentId: bigint('shipment_id', { mode: 'number' })
      .notNull()
      .references(() => shipment.id, { onDelete: 'cascade' }),
    pickTaskLineId: bigint('pick_task_line_id', { mode: 'number' }).references(
      () => pickTaskLine.id,
      { onDelete: 'set null' },
    ),
    sku: text('sku').notNull(),
    quantity: integer('quantity').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('idx_shipment_line_shipment').on(table.shipmentId)],
);

export type ShipmentLine = typeof shipmentLine.$inferSelect;
