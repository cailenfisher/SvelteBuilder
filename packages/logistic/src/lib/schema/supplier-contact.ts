import { pgTable, bigint, index, text, timestamp } from 'drizzle-orm/pg-core';
import { supplier } from './supplier.js';

export const supplierContact = pgTable(
  'supplier_contact',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    supplierId: bigint('supplier_id', { mode: 'number' })
      .notNull()
      .references(() => supplier.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    // SCOPE DEVIATION: person's actual name, not editorial copy.
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('idx_supplier_contact_supplier').on(table.supplierId)],
);

export type SupplierContact = typeof supplierContact.$inferSelect;
