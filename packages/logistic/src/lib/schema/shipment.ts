import { pgEnum, pgTable, bigint, index, text, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { SHIPMENT_STATUSES } from './shipment-status.js';
import type { ShipmentLine } from './shipment-line.js';
import type { TrackingEvent } from './tracking-event.js';

export const shipmentStatus = pgEnum('shipment_status', SHIPMENT_STATUSES);

export const shipment = pgTable(
  'shipment',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }).notNull(),
    status: shipmentStatus('status').notNull().default('created'),
    carrier: text('carrier'),
    serviceLevel: text('service_level'),
    trackingNumber: text('tracking_number'),
    shippedAt: timestamp('shipped_at', { mode: 'string' }),
    deliveredAt: timestamp('delivered_at', { mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_shipment_status').on(table.status, table.createdAt),
    index('idx_shipment_tracking_number')
      .on(table.trackingNumber)
      .where(sql`${table.trackingNumber} is not null`),
  ],
);

export type Shipment = typeof shipment.$inferSelect;

export type ShipmentWithEvents = Shipment & {
  lines: ShipmentLine[];
  trackingEvents: TrackingEvent[];
};
