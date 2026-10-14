import { pgTable, bigint, boolean, integer, text, timestamp } from 'drizzle-orm/pg-core';
import type { SupplierContact } from './supplier-contact.js';

export const supplier = pgTable('supplier', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  slug: text('slug').notNull().unique(),
  leadTimeDay: integer('lead_time_day'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

export type Supplier = typeof supplier.$inferSelect;

export type SupplierWithCopy = Supplier & {
  name: string;
  contacts: SupplierContact[];
};
