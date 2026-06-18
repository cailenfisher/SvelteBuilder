import {
  pgEnum,
  pgTable,
  bigint,
  boolean,
  check,
  index,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── Enums ────────────────────────────────────────────────────────────────────

export const storageLocationType = pgEnum('storage_location_type', [
  'warehouse', 'zone', 'aisle', 'bin',
]);

export const adjustmentReason = pgEnum('adjustment_reason', [
  'damage', 'theft', 'receiving_error', 'cycle_count_variance', 'system_correction', 'other',
]);

export const inboundReceiptStatus = pgEnum('inbound_receipt_status', [
  'pending', 'partial', 'complete', 'cancelled',
]);

export const pickTaskStatus = pgEnum('pick_task_status', [
  'open', 'in_progress', 'completed', 'cancelled',
]);

export const shipmentStatus = pgEnum('shipment_status', [
  'created', 'packed', 'dispatched', 'in_transit', 'delivered', 'exception',
]);

export const returnCondition = pgEnum('return_condition', [
  'salable', 'damaged', 'defective', 'wrong_item',
]);

export const returnDisposition = pgEnum('return_disposition', [
  'restock', 'quarantine', 'scrap', 'refurbish',
]);

export const returnAuthorizationStatus = pgEnum('return_authorization_status', [
  'pending', 'received', 'processed', 'cancelled',
]);

export const cycleCountStatus = pgEnum('cycle_count_status', [
  'open', 'in_progress', 'complete', 'cancelled',
]);

// ── Tables ───────────────────────────────────────────────────────────────────

export const storageLocation = pgTable(
  'storage_location',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull().unique(),
    locationType: storageLocationType('location_type').notNull(),
    // Self-referential FK
    parentStorageLocationId: bigint('parent_storage_location_id', { mode: 'number' }).references(
      (): AnyPgColumn => storageLocation.id,
      { onDelete: 'set null' },
    ),
    active: boolean('active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_storage_location_parent').on(table.parentStorageLocationId),
    index('idx_storage_location_type').on(table.locationType),
  ],
);

export const supplier = pgTable('supplier', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  slug: text('slug').notNull().unique(),
  leadTimeDay: integer('lead_time_day'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

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
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('idx_supplier_contact_supplier').on(table.supplierId)],
);

export const stockLevel = pgTable(
  'stock_level',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    storageLocationId: bigint('storage_location_id', { mode: 'number' })
      .notNull()
      .references(() => storageLocation.id),
    sku: text('sku').notNull(),
    onHand: integer('on_hand').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_stock_level_location_sku').on(table.storageLocationId, table.sku),
    index('idx_stock_level_location').on(table.storageLocationId),
    index('idx_stock_level_sku').on(table.sku),
    check('stock_on_hand_non_negative', sql`${table.onHand} >= 0`),
    check('stock_reserved_non_negative', sql`${table.reserved} >= 0`),
    check('stock_reserved_lte_on_hand', sql`${table.reserved} <= ${table.onHand}`),
  ],
);

export const stockAdjustment = pgTable(
  'stock_adjustment',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    stockLevelId: bigint('stock_level_id', { mode: 'number' })
      .notNull()
      .references(() => stockLevel.id),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'bigint' }).notNull(),
    delta: integer('delta').notNull(),
    onHandBefore: integer('on_hand_before').notNull(),
    onHandAfter: integer('on_hand_after').notNull(),
    reason: adjustmentReason('reason').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_stock_adjustment_stock_level').on(table.stockLevelId, table.createdAt),
  ],
);

export const inboundReceipt = pgTable(
  'inbound_receipt',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    supplierId: bigint('supplier_id', { mode: 'number' })
      .notNull()
      .references(() => supplier.id),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'bigint' }).notNull(),
    status: inboundReceiptStatus('status').notNull().default('pending'),
    expectedAt: timestamp('expected_at'),
    receivedAt: timestamp('received_at'),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_inbound_receipt_supplier').on(table.supplierId),
    index('idx_inbound_receipt_status').on(table.status, table.createdAt),
  ],
);

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
    discrepancy: integer('discrepancy').generatedAlwaysAs(
      sql`received_quantity - expected_quantity`,
    ),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('idx_inbound_receipt_line_receipt').on(table.inboundReceiptId)],
);

export const pickTask = pgTable(
  'pick_task',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'bigint' }),
    status: pickTaskStatus('status').notNull().default('open'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_pick_task_status').on(table.status, table.createdAt),
    index('idx_pick_task_user_account').on(table.userAccountId),
  ],
);

export const pickTaskLine = pgTable(
  'pick_task_line',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    pickTaskId: bigint('pick_task_id', { mode: 'number' })
      .notNull()
      .references(() => pickTask.id, { onDelete: 'cascade' }),
    stockLevelId: bigint('stock_level_id', { mode: 'number' })
      .notNull()
      .references(() => stockLevel.id),
    storageLocationId: bigint('storage_location_id', { mode: 'number' })
      .notNull()
      .references(() => storageLocation.id),
    sku: text('sku').notNull(),
    requestedQuantity: integer('requested_quantity').notNull(),
    pickedQuantity: integer('picked_quantity').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('idx_pick_task_line_task').on(table.pickTaskId)],
);

export const shipment = pgTable(
  'shipment',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'bigint' }).notNull(),
    status: shipmentStatus('status').notNull().default('created'),
    carrier: text('carrier'),
    serviceLevel: text('service_level'),
    trackingNumber: text('tracking_number'),
    shippedAt: timestamp('shipped_at'),
    deliveredAt: timestamp('delivered_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_shipment_status').on(table.status, table.createdAt),
    index('idx_shipment_tracking_number')
      .on(table.trackingNumber)
      .where(sql`${table.trackingNumber} is not null`),
  ],
);

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
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('idx_shipment_line_shipment').on(table.shipmentId)],
);

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
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('idx_tracking_event_shipment').on(table.shipmentId, table.occurredAt)],
);

export const returnAuthorization = pgTable(
  'return_authorization',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    shipmentId: bigint('shipment_id', { mode: 'number' }).references(() => shipment.id, {
      onDelete: 'set null',
    }),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'bigint' }).notNull(),
    status: returnAuthorizationStatus('status').notNull().default('pending'),
    reason: text('reason'),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_return_authorization_status').on(table.status, table.createdAt),
    index('idx_return_authorization_shipment').on(table.shipmentId),
  ],
);

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
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_return_authorization_line_return').on(table.returnAuthorizationId),
  ],
);

export const cycleCount = pgTable(
  'cycle_count',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'bigint' }).notNull(),
    status: cycleCountStatus('status').notNull().default('open'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('idx_cycle_count_status').on(table.status, table.createdAt)],
);

export const cycleCountLine = pgTable(
  'cycle_count_line',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    cycleCountId: bigint('cycle_count_id', { mode: 'number' })
      .notNull()
      .references(() => cycleCount.id, { onDelete: 'cascade' }),
    stockLevelId: bigint('stock_level_id', { mode: 'number' })
      .notNull()
      .references(() => stockLevel.id),
    storageLocationId: bigint('storage_location_id', { mode: 'number' })
      .notNull()
      .references(() => storageLocation.id),
    sku: text('sku').notNull(),
    expectedQuantity: integer('expected_quantity').notNull(),
    countedQuantity: integer('counted_quantity'),
    variance: integer('variance').generatedAlwaysAs(
      sql`counted_quantity - expected_quantity`,
    ),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('idx_cycle_count_line_count').on(table.cycleCountId)],
);
