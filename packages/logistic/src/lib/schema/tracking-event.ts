import { pgTable, bigint, index, text, timestamp } from 'drizzle-orm/pg-core';
import { shipment } from './shipment.js';

export const trackingEvent = pgTable(
  'tracking_event',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    shipmentId: bigint('shipment_id', { mode: 'number' })
      .notNull()
      .references(() => shipment.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    eventLocation: text('event_location'),
    description: text('description'),
    occurredAt: timestamp('occurred_at', { mode: 'string' }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('idx_tracking_event_shipment').on(table.shipmentId, table.occurredAt)],
);

export type TrackingEvent = typeof trackingEvent.$inferSelect;
