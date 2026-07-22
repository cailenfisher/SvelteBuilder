// Server-only — never import from client-side code.
//
// Every function takes the Drizzle transaction provided by
// event.locals.db.withUser((tx) => ...). Functions never open their own
// transactions: atomicity is the caller's withUser boundary, which also sets
// app.current_user_id for RLS. Multi-step workflows (create pick task +
// reserve, receive line + adjust stock) are therefore atomic end to end.
//
// Stock mutations go through SECURITY DEFINER SQL functions
// (logistic_adjust_stock, logistic_reserve_stock, logistic_consume_stock,
// logistic_release_stock_reservation, logistic_ensure_stock_level) because
// direct writes to stock_level are admin-only under RLS. The functions hold
// row locks (FOR UPDATE) and append to stock_adjustment, keeping the ledger
// append-only and concurrency-safe.

import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { locale, localText, localTextLink } from '@sveltebuilder/hermes-schema/schema';
import type { DictionaryPayload } from '@sveltebuilder/hermes';
import {
  storageLocation,
  supplier,
  supplierContact,
  stockLevel,
  stockAdjustment,
  inboundReceipt,
  inboundReceiptLine,
  pickTask,
  pickTaskLine,
  shipment,
  shipmentLine,
  trackingEvent,
  returnAuthorization,
  returnAuthorizationLine,
  cycleCount,
  cycleCountLine,
} from '../schema.js';
import type {
  StorageLocation,
  StorageLocationType,
  StorageLocationWithCopy,
  SupplierWithCopy,
  StockAdjustment,
  AdjustmentReason,
  InboundReceiptStatus,
  InboundReceiptWithCopy,
  PickTask,
  PickTaskStatus,
  PickTaskWithLines,
  Shipment,
  ShipmentStatus,
  ShipmentWithEvents,
  ReturnAuthorization,
  ReturnAuthorizationStatus,
  ReturnAuthorizationWithLines,
  ReturnCondition,
  ReturnDisposition,
  CycleCount,
  CycleCountStatus,
  CycleCountWithLines,
  StockLevelWithLocation,
} from '../schema/index.js';

// Matches the callback parameter of UserScopedDb.withUser in the scaffold.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tx = PgTransaction<any, any, any>;

// event.locals.userAccountId is bigint | null; domain columns are read back as
// number. Accept both so route code can pass locals straight through.
type UserAccountId = number | bigint;

// tx.execute result shape differs by driver (postgres-js returns a row array,
// node-postgres returns { rows }). Normalize before reading.
function executeRows(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  const rows = (result as { rows?: unknown }).rows;
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
}

// ---------------------------------------------------------------------------
// Text resolution
// ---------------------------------------------------------------------------

async function resolveEntityText(
  tx: Tx,
  entityIds: number[],
  scope: string,
  localeCode: string,
  fallbackLocaleCode: string,
): Promise<Record<string, string>> {
  if (entityIds.length === 0) return {};

  const rows = await tx
    .select({
      slug: localTextLink.slug,
      entityId: localTextLink.entityId,
      content: localText.content,
      localeCode: locale.code,
    })
    .from(localTextLink)
    .innerJoin(localText, eq(localText.link, localTextLink.id))
    .innerJoin(locale, eq(locale.id, localText.locale))
    .where(and(eq(localTextLink.scope, scope), inArray(localTextLink.entityId, entityIds)));

  const rank = (code: string): number =>
    code === localeCode ? 0 : code === fallbackLocaleCode ? 1 : 2;

  const best = new Map<string, { rank: number; content: string }>();
  for (const row of rows) {
    const key = `${row.slug}.${row.entityId}`;
    const rowRank = rank(row.localeCode);
    const current = best.get(key);
    if (!current || rowRank < current.rank) best.set(key, { rank: rowRank, content: row.content });
  }

  const result: Record<string, string> = {};
  for (const [key, entry] of best) result[key] = entry.content;
  return result;
}

async function resolveLocationsWithCopy(
  tx: Tx,
  locationIds: number[],
  localeCode: string,
  fallbackLocaleCode: string,
): Promise<Map<number, StorageLocationWithCopy>> {
  if (locationIds.length === 0) return new Map();

  const locations = await tx
    .select()
    .from(storageLocation)
    .where(inArray(storageLocation.id, locationIds));

  const text = await resolveEntityText(
    tx,
    locations.map((l) => l.id),
    'storage_location',
    localeCode,
    fallbackLocaleCode,
  );

  return new Map(
    locations.map((l) => [
      l.id,
      { ...l, name: text[`name.${l.id}`] ?? l.slug, ancestors: [] },
    ]),
  );
}

// ---------------------------------------------------------------------------
// StorageLocation
// ---------------------------------------------------------------------------

export async function getStorageLocations(
  tx: Tx,
  options?: { type?: StorageLocationType; active?: boolean },
): Promise<StorageLocation[]> {
  const conditions = [];
  if (options?.type) conditions.push(eq(storageLocation.locationType, options.type));
  if (options?.active !== undefined) conditions.push(eq(storageLocation.active, options.active));

  return tx
    .select()
    .from(storageLocation)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(storageLocation.sortOrder));
}

export async function getStorageLocation(tx: Tx, id: number): Promise<StorageLocation | null> {
  const [location] = await tx.select().from(storageLocation).where(eq(storageLocation.id, id));
  return location ?? null;
}

// Resolves the full ancestor chain from root down to the given location.
// Returned ancestors array is ordered root → bin.
export async function getStorageLocationPath(
  tx: Tx,
  id: number,
  localeCode: string,
  fallbackLocaleCode = 'en',
): Promise<StorageLocationWithCopy | null> {
  const allLocations = await tx
    .select()
    .from(storageLocation)
    .orderBy(asc(storageLocation.sortOrder));

  const location = allLocations.find((l) => l.id === id);
  if (!location) return null;

  const text = await resolveEntityText(
    tx,
    allLocations.map((l) => l.id),
    'storage_location',
    localeCode,
    fallbackLocaleCode,
  );

  const ancestors: StorageLocationWithCopy[] = [];
  let current: StorageLocation | undefined = location;
  while (current?.parentStorageLocationId) {
    const parentId: number = current.parentStorageLocationId;
    const parent = allLocations.find((l) => l.id === parentId);
    if (!parent) break;
    ancestors.unshift({
      ...parent,
      name: text[`name.${parent.id}`] ?? parent.slug,
      ancestors: [],
    });
    current = parent;
  }

  return {
    ...location,
    name: text[`name.${location.id}`] ?? location.slug,
    ancestors,
  };
}

// ---------------------------------------------------------------------------
// Supplier
// ---------------------------------------------------------------------------

async function enrichSuppliers(
  tx: Tx,
  suppliers: (typeof supplier.$inferSelect)[],
  localeCode: string,
  fallbackLocaleCode: string,
): Promise<SupplierWithCopy[]> {
  if (suppliers.length === 0) return [];

  const ids = suppliers.map((s) => s.id);
  const [text, contacts] = await Promise.all([
    resolveEntityText(tx, ids, 'supplier', localeCode, fallbackLocaleCode),
    tx
      .select()
      .from(supplierContact)
      .where(inArray(supplierContact.supplierId, ids))
      .orderBy(asc(supplierContact.createdAt)),
  ]);

  return suppliers.map((s) => ({
    ...s,
    name: text[`name.${s.id}`] ?? s.slug,
    contacts: contacts.filter((c) => c.supplierId === s.id),
  }));
}

export async function getSuppliers(
  tx: Tx,
  localeCode: string,
  options?: { active?: boolean; fallbackLocale?: string },
): Promise<SupplierWithCopy[]> {
  const suppliers = await tx
    .select()
    .from(supplier)
    .where(options?.active !== undefined ? eq(supplier.active, options.active) : undefined)
    .orderBy(asc(supplier.slug));

  return enrichSuppliers(tx, suppliers, localeCode, options?.fallbackLocale ?? 'en');
}

export async function getSupplier(
  tx: Tx,
  id: number,
  localeCode: string,
  fallbackLocaleCode = 'en',
): Promise<SupplierWithCopy | null> {
  const rows = await tx.select().from(supplier).where(eq(supplier.id, id));
  const [enriched] = await enrichSuppliers(tx, rows, localeCode, fallbackLocaleCode);
  return enriched ?? null;
}

export async function createSupplier(
  tx: Tx,
  data: { slug: string; leadTimeDay?: number },
): Promise<number> {
  const [row] = await tx
    .insert(supplier)
    .values({ slug: data.slug, leadTimeDay: data.leadTimeDay ?? null })
    .returning({ id: supplier.id });
  return row.id;
}

export async function updateSupplier(
  tx: Tx,
  id: number,
  data: Partial<{ slug: string; leadTimeDay: number | null; active: boolean }>,
): Promise<void> {
  await tx.update(supplier).set(data).where(eq(supplier.id, id));
}

export async function upsertSupplierContact(
  tx: Tx,
  data: {
    id?: number;
    supplierId: number;
    role: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  },
): Promise<number> {
  const values = {
    supplierId: data.supplierId,
    role: data.role,
    name: data.name,
    email: data.email ?? null,
    phone: data.phone ?? null,
  };

  if (data.id) {
    await tx.update(supplierContact).set(values).where(eq(supplierContact.id, data.id));
    return data.id;
  }

  const [row] = await tx.insert(supplierContact).values(values).returning({ id: supplierContact.id });
  return row.id;
}

export async function deleteSupplierContact(tx: Tx, id: number): Promise<void> {
  await tx.delete(supplierContact).where(eq(supplierContact.id, id));
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

export async function getStockLevels(
  tx: Tx,
  localeCode: string,
  options?: {
    sku?: string;
    storageLocationId?: number;
    // available (on_hand - reserved) at or below reorder_point
    lowStock?: boolean;
    fallbackLocale?: string;
  },
): Promise<StockLevelWithLocation[]> {
  const conditions = [];
  if (options?.sku) conditions.push(eq(stockLevel.sku, options.sku));
  if (options?.storageLocationId)
    conditions.push(eq(stockLevel.storageLocationId, options.storageLocationId));
  if (options?.lowStock)
    conditions.push(
      sql`${stockLevel.reorderPoint} is not null and ${stockLevel.onHand} - ${stockLevel.reserved} <= ${stockLevel.reorderPoint}`,
    );

  const rows = await tx
    .select({ level: stockLevel, location: storageLocation })
    .from(stockLevel)
    .innerJoin(storageLocation, eq(storageLocation.id, stockLevel.storageLocationId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(stockLevel.sku));

  const text = await resolveEntityText(
    tx,
    [...new Set(rows.map((r) => r.location.id))],
    'storage_location',
    localeCode,
    options?.fallbackLocale ?? 'en',
  );

  return rows.map(({ level, location }) => ({
    ...level,
    available: level.onHand - level.reserved,
    storageLocation: {
      ...location,
      name: text[`name.${location.id}`] ?? location.slug,
      ancestors: [],
    },
  }));
}

export async function setReorderPoint(
  tx: Tx,
  stockLevelId: number,
  reorderPoint: number | null,
): Promise<void> {
  await tx.update(stockLevel).set({ reorderPoint }).where(eq(stockLevel.id, stockLevelId));
}

// Finds or creates the stock_level row for a location + sku. SECURITY DEFINER
// because stock_level inserts are admin-only under RLS but workers receive goods.
async function ensureStockLevel(tx: Tx, storageLocationId: number, sku: string): Promise<number> {
  const result = await tx.execute(
    sql`select logistic_ensure_stock_level(${storageLocationId}, ${sku}) as id`,
  );
  return Number(executeRows(result)[0].id);
}

// Atomically mutates on_hand and appends the stock_adjustment audit row.
export async function adjustStock(
  tx: Tx,
  data: {
    stockLevelId: number;
    delta: number;
    reason: AdjustmentReason;
    userAccountId: UserAccountId;
    note?: string;
  },
): Promise<StockAdjustment> {
  const result = await tx.execute(
    sql`select id from logistic_adjust_stock(
      ${data.stockLevelId},
      ${data.delta},
      ${data.reason}::adjustment_reason,
      ${Number(data.userAccountId)},
      ${data.note ?? null}
    )`,
  );
  const adjustmentId = Number(executeRows(result)[0].id);

  const [adjustment] = await tx
    .select()
    .from(stockAdjustment)
    .where(eq(stockAdjustment.id, adjustmentId));
  return adjustment;
}

export async function getStockAdjustments(
  tx: Tx,
  stockLevelId: number,
  options?: { limit?: number },
): Promise<StockAdjustment[]> {
  const query = tx
    .select()
    .from(stockAdjustment)
    .where(eq(stockAdjustment.stockLevelId, stockLevelId))
    .orderBy(desc(stockAdjustment.createdAt));

  return options?.limit ? query.limit(options.limit) : query;
}

// Decrements on_hand AND reserved together (physical pick of reserved stock)
// and appends the audit row. Negative quantity reverses a pick.
async function consumeStock(
  tx: Tx,
  data: {
    stockLevelId: number;
    quantity: number;
    reason: AdjustmentReason;
    userAccountId: UserAccountId;
    note?: string;
  },
): Promise<void> {
  await tx.execute(
    sql`select logistic_consume_stock(
      ${data.stockLevelId},
      ${data.quantity},
      ${data.reason}::adjustment_reason,
      ${Number(data.userAccountId)},
      ${data.note ?? null}
    )`,
  );
}

async function releaseStockReservation(
  tx: Tx,
  stockLevelId: number,
  quantity: number,
): Promise<void> {
  if (quantity <= 0) return;
  await tx.execute(
    sql`select logistic_release_stock_reservation(${stockLevelId}, ${quantity})`,
  );
}

// ---------------------------------------------------------------------------
// Inbound Receipt
// ---------------------------------------------------------------------------

export async function getInboundReceipts(
  tx: Tx,
  localeCode: string,
  options?: {
    status?: InboundReceiptStatus;
    page?: number;
    perPage?: number;
    fallbackLocale?: string;
  },
): Promise<{ receipts: InboundReceiptWithCopy[]; total: number }> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const fallbackLocaleCode = options?.fallbackLocale ?? 'en';
  const where = options?.status ? eq(inboundReceipt.status, options.status) : undefined;

  const [receipts, [{ value: total }]] = await Promise.all([
    tx
      .select()
      .from(inboundReceipt)
      .where(where)
      .orderBy(desc(inboundReceipt.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    tx.select({ value: count() }).from(inboundReceipt).where(where),
  ]);

  if (receipts.length === 0) return { receipts: [], total };

  const supplierIds = [...new Set(receipts.map((r) => r.supplierId).filter((id) => id !== null))];
  const receiptIds = receipts.map((r) => r.id);

  const [supplierRows, lines] = await Promise.all([
    supplierIds.length > 0
      ? tx.select().from(supplier).where(inArray(supplier.id, supplierIds))
      : Promise.resolve([]),
    tx
      .select()
      .from(inboundReceiptLine)
      .where(inArray(inboundReceiptLine.inboundReceiptId, receiptIds))
      .orderBy(asc(inboundReceiptLine.createdAt)),
  ]);

  const enriched = await enrichSuppliers(tx, supplierRows, localeCode, fallbackLocaleCode);
  const supplierMap = new Map(enriched.map((s) => [s.id, s]));

  return {
    receipts: receipts.map((receipt) => ({
      ...receipt,
      supplier: receipt.supplierId !== null ? (supplierMap.get(receipt.supplierId) ?? null) : null,
      lines: lines.filter((l) => l.inboundReceiptId === receipt.id),
    })),
    total,
  };
}

export async function getInboundReceipt(
  tx: Tx,
  id: number,
  localeCode: string,
  fallbackLocaleCode = 'en',
): Promise<InboundReceiptWithCopy | null> {
  const [receipt] = await tx.select().from(inboundReceipt).where(eq(inboundReceipt.id, id));
  if (!receipt) return null;

  const [supplierWithCopy, lines] = await Promise.all([
    receipt.supplierId !== null
      ? getSupplier(tx, receipt.supplierId, localeCode, fallbackLocaleCode)
      : Promise.resolve(null),
    tx
      .select()
      .from(inboundReceiptLine)
      .where(eq(inboundReceiptLine.inboundReceiptId, id))
      .orderBy(asc(inboundReceiptLine.createdAt)),
  ]);

  return { ...receipt, supplier: supplierWithCopy, lines };
}

// supplierId omitted/null = blind receiving (ad-hoc inbound without a PO).
export async function createInboundReceipt(
  tx: Tx,
  data: {
    supplierId?: number | null;
    userAccountId: UserAccountId;
    expectedAt?: string;
    note?: string;
  },
): Promise<number> {
  const [row] = await tx
    .insert(inboundReceipt)
    .values({
      supplierId: data.supplierId ?? null,
      userAccountId: Number(data.userAccountId),
      expectedAt: data.expectedAt ?? null,
      note: data.note ?? null,
    })
    .returning({ id: inboundReceipt.id });
  return row.id;
}

export async function addInboundReceiptLine(
  tx: Tx,
  data: {
    inboundReceiptId: number;
    storageLocationId: number;
    sku: string;
    expectedQuantity: number;
  },
): Promise<number> {
  const [row] = await tx
    .insert(inboundReceiptLine)
    .values({
      inboundReceiptId: data.inboundReceiptId,
      storageLocationId: data.storageLocationId,
      sku: data.sku,
      expectedQuantity: data.expectedQuantity,
      receivedQuantity: 0,
    })
    .returning({ id: inboundReceiptLine.id });
  return row.id;
}

// Records received quantity for a line, moves stock, and updates receipt
// status — atomic within the caller's withUser transaction.
export async function receiveReceiptLine(
  tx: Tx,
  lineId: number,
  receivedQuantity: number,
  userAccountId: UserAccountId,
): Promise<void> {
  const [line] = await tx
    .select()
    .from(inboundReceiptLine)
    .where(eq(inboundReceiptLine.id, lineId));
  if (!line) throw new Error(`[logistic] inbound_receipt_line ${lineId} not found`);

  const delta = receivedQuantity - line.receivedQuantity;
  if (delta !== 0) {
    const stockLevelId = await ensureStockLevel(tx, line.storageLocationId, line.sku);
    await adjustStock(tx, {
      stockLevelId,
      delta,
      reason: 'inbound_receipt',
      userAccountId,
      note: `Inbound receipt line ${lineId}`,
    });
  }

  await tx
    .update(inboundReceiptLine)
    .set({ receivedQuantity })
    .where(eq(inboundReceiptLine.id, lineId));

  await refreshReceiptStatus(tx, line.inboundReceiptId);
}

async function refreshReceiptStatus(tx: Tx, receiptId: number): Promise<void> {
  const lines = await tx
    .select({
      expectedQuantity: inboundReceiptLine.expectedQuantity,
      receivedQuantity: inboundReceiptLine.receivedQuantity,
    })
    .from(inboundReceiptLine)
    .where(eq(inboundReceiptLine.inboundReceiptId, receiptId));

  const allComplete =
    lines.length > 0 && lines.every((l) => l.receivedQuantity >= l.expectedQuantity);
  const anyReceived = lines.some((l) => l.receivedQuantity > 0);
  const status: InboundReceiptStatus = allComplete ? 'complete' : anyReceived ? 'partial' : 'pending';

  await tx
    .update(inboundReceipt)
    .set({
      status,
      receivedAt: allComplete ? new Date().toISOString() : null,
    })
    .where(eq(inboundReceipt.id, receiptId));
}

// ---------------------------------------------------------------------------
// Pick Task
// ---------------------------------------------------------------------------

export async function getPickTasks(
  tx: Tx,
  options?: {
    status?: PickTaskStatus;
    userAccountId?: UserAccountId;
    page?: number;
    perPage?: number;
  },
): Promise<{ tasks: PickTask[]; total: number }> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;

  const conditions = [];
  if (options?.status) conditions.push(eq(pickTask.status, options.status));
  if (options?.userAccountId !== undefined)
    conditions.push(eq(pickTask.userAccountId, Number(options.userAccountId)));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [tasks, [{ value: total }]] = await Promise.all([
    tx
      .select()
      .from(pickTask)
      .where(where)
      .orderBy(desc(pickTask.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    tx.select({ value: count() }).from(pickTask).where(where),
  ]);

  return { tasks, total };
}

export async function getPickTask(
  tx: Tx,
  id: number,
  localeCode: string,
  fallbackLocaleCode = 'en',
): Promise<PickTaskWithLines | null> {
  const [task] = await tx.select().from(pickTask).where(eq(pickTask.id, id));
  if (!task) return null;

  const lines = await tx
    .select()
    .from(pickTaskLine)
    .where(eq(pickTaskLine.pickTaskId, id))
    .orderBy(asc(pickTaskLine.sequence));

  const locationMap = await resolveLocationsWithCopy(
    tx,
    [...new Set(lines.map((l) => l.storageLocationId))],
    localeCode,
    fallbackLocaleCode,
  );

  return {
    ...task,
    lines: lines.map((line) => {
      const location = locationMap.get(line.storageLocationId);
      if (!location) throw new Error(`[logistic] storage_location ${line.storageLocationId} not found`);
      return { ...line, storageLocation: location };
    }),
  };
}

// Creates the task, sequences lines by storage_location.sort_order (walk
// path), and reserves stock — all atomic in the caller's transaction.
export async function createPickTask(
  tx: Tx,
  lines: Array<{
    stockLevelId: number;
    storageLocationId: number;
    sku: string;
    requestedQuantity: number;
  }>,
): Promise<number> {
  if (lines.length === 0) throw new Error('[logistic] createPickTask requires at least one line');

  const locations = await tx
    .select({ id: storageLocation.id, sortOrder: storageLocation.sortOrder })
    .from(storageLocation)
    .where(inArray(storageLocation.id, [...new Set(lines.map((l) => l.storageLocationId))]));
  const walkOrder = new Map(locations.map((l) => [l.id, l.sortOrder]));

  const ordered = [...lines].sort(
    (a, b) =>
      (walkOrder.get(a.storageLocationId) ?? 0) - (walkOrder.get(b.storageLocationId) ?? 0) ||
      a.sku.localeCompare(b.sku),
  );

  const [task] = await tx.insert(pickTask).values({ status: 'open' }).returning({ id: pickTask.id });

  await tx.insert(pickTaskLine).values(
    ordered.map((line, index) => ({
      pickTaskId: task.id,
      stockLevelId: line.stockLevelId,
      storageLocationId: line.storageLocationId,
      sku: line.sku,
      requestedQuantity: line.requestedQuantity,
      pickedQuantity: 0,
      sequence: index + 1,
    })),
  );

  for (const line of ordered) {
    await tx.execute(
      sql`select logistic_reserve_stock(${line.stockLevelId}, ${line.requestedQuantity})`,
    );
  }

  return task.id;
}

export async function assignPickTask(
  tx: Tx,
  id: number,
  userAccountId: UserAccountId,
): Promise<void> {
  await tx
    .update(pickTask)
    .set({ status: 'in_progress', userAccountId: Number(userAccountId) })
    .where(and(eq(pickTask.id, id), eq(pickTask.status, 'open')));
}

// Physically picking consumes on_hand AND reserved together — see
// logistic_consume_stock. Lowering a previously recorded quantity reverses it.
export async function recordPickedQuantity(
  tx: Tx,
  lineId: number,
  pickedQuantity: number,
  userAccountId: UserAccountId,
): Promise<void> {
  const [line] = await tx.select().from(pickTaskLine).where(eq(pickTaskLine.id, lineId));
  if (!line) throw new Error(`[logistic] pick_task_line ${lineId} not found`);
  if (pickedQuantity < 0 || pickedQuantity > line.requestedQuantity)
    throw new Error(
      `[logistic] picked quantity ${pickedQuantity} outside [0, ${line.requestedQuantity}]`,
    );

  const delta = pickedQuantity - line.pickedQuantity;
  if (delta === 0) return;

  await tx.update(pickTaskLine).set({ pickedQuantity }).where(eq(pickTaskLine.id, lineId));

  await consumeStock(tx, {
    stockLevelId: line.stockLevelId,
    quantity: delta,
    reason: 'pick',
    userAccountId,
    note: `Pick task line ${lineId}`,
  });
}

// Releases only the unpicked remainder of each reservation (picked stock was
// already consumed from both on_hand and reserved).
export async function completePickTask(
  tx: Tx,
  id: number,
  userAccountId: UserAccountId,
): Promise<void> {
  const [task] = await tx.select().from(pickTask).where(eq(pickTask.id, id));
  if (!task) throw new Error(`[logistic] pick_task ${id} not found`);
  if (task.userAccountId !== Number(userAccountId))
    throw new Error(`[logistic] pick_task ${id} is not assigned to this user`);
  if (task.status !== 'in_progress')
    throw new Error(`[logistic] pick_task ${id} is not in progress`);

  const lines = await tx.select().from(pickTaskLine).where(eq(pickTaskLine.pickTaskId, id));
  for (const line of lines) {
    await releaseStockReservation(tx, line.stockLevelId, line.requestedQuantity - line.pickedQuantity);
  }

  await tx.update(pickTask).set({ status: 'completed' }).where(eq(pickTask.id, id));
}

export async function cancelPickTask(tx: Tx, id: number): Promise<void> {
  const [task] = await tx.select().from(pickTask).where(eq(pickTask.id, id));
  if (!task) throw new Error(`[logistic] pick_task ${id} not found`);
  if (task.status === 'completed' || task.status === 'cancelled') return;

  const lines = await tx.select().from(pickTaskLine).where(eq(pickTaskLine.pickTaskId, id));
  for (const line of lines) {
    await releaseStockReservation(tx, line.stockLevelId, line.requestedQuantity - line.pickedQuantity);
  }

  await tx.update(pickTask).set({ status: 'cancelled' }).where(eq(pickTask.id, id));
}

// ---------------------------------------------------------------------------
// Shipment
// ---------------------------------------------------------------------------

export async function getShipments(
  tx: Tx,
  options?: { status?: ShipmentStatus; page?: number; perPage?: number },
): Promise<{ shipments: Shipment[]; total: number }> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const where = options?.status ? eq(shipment.status, options.status) : undefined;

  const [shipments, [{ value: total }]] = await Promise.all([
    tx
      .select()
      .from(shipment)
      .where(where)
      .orderBy(desc(shipment.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    tx.select({ value: count() }).from(shipment).where(where),
  ]);

  return { shipments, total };
}

export async function getShipment(tx: Tx, id: number): Promise<ShipmentWithEvents | null> {
  const [row] = await tx.select().from(shipment).where(eq(shipment.id, id));
  if (!row) return null;

  const [lines, events] = await Promise.all([
    tx
      .select()
      .from(shipmentLine)
      .where(eq(shipmentLine.shipmentId, id))
      .orderBy(asc(shipmentLine.createdAt)),
    tx
      .select()
      .from(trackingEvent)
      .where(eq(trackingEvent.shipmentId, id))
      .orderBy(asc(trackingEvent.occurredAt)),
  ]);

  return { ...row, lines, trackingEvents: events };
}

export async function createShipment(
  tx: Tx,
  data: {
    userAccountId: UserAccountId;
    carrier?: string;
    serviceLevel?: string;
    lines: Array<{ pickTaskLineId?: number; sku: string; quantity: number }>;
  },
): Promise<number> {
  const [row] = await tx
    .insert(shipment)
    .values({
      userAccountId: Number(data.userAccountId),
      carrier: data.carrier ?? null,
      serviceLevel: data.serviceLevel ?? null,
      status: 'created',
    })
    .returning({ id: shipment.id });

  if (data.lines.length > 0) {
    await tx.insert(shipmentLine).values(
      data.lines.map((l) => ({
        shipmentId: row.id,
        pickTaskLineId: l.pickTaskLineId ?? null,
        sku: l.sku,
        quantity: l.quantity,
      })),
    );
  }

  return row.id;
}

export async function updateShipmentStatus(
  tx: Tx,
  id: number,
  status: ShipmentStatus,
): Promise<void> {
  const values: Partial<typeof shipment.$inferInsert> = { status };
  if (status === 'dispatched') values.shippedAt = new Date().toISOString();
  if (status === 'delivered') values.deliveredAt = new Date().toISOString();

  await tx.update(shipment).set(values).where(eq(shipment.id, id));
}

export async function updateShipmentTracking(
  tx: Tx,
  id: number,
  data: { trackingNumber?: string; carrier?: string; serviceLevel?: string },
): Promise<void> {
  await tx.update(shipment).set(data).where(eq(shipment.id, id));
}

export async function addTrackingEvent(
  tx: Tx,
  data: {
    shipmentId: number;
    status: string;
    eventLocation?: string;
    description?: string;
    occurredAt?: string;
  },
): Promise<void> {
  await tx.insert(trackingEvent).values({
    shipmentId: data.shipmentId,
    status: data.status,
    eventLocation: data.eventLocation ?? null,
    description: data.description ?? null,
    occurredAt: data.occurredAt ?? new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Return Authorization
// ---------------------------------------------------------------------------

export async function getReturnAuthorizations(
  tx: Tx,
  options?: { status?: ReturnAuthorizationStatus; page?: number; perPage?: number },
): Promise<{ returns: ReturnAuthorization[]; total: number }> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const where = options?.status ? eq(returnAuthorization.status, options.status) : undefined;

  const [returns, [{ value: total }]] = await Promise.all([
    tx
      .select()
      .from(returnAuthorization)
      .where(where)
      .orderBy(desc(returnAuthorization.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    tx.select({ value: count() }).from(returnAuthorization).where(where),
  ]);

  return { returns, total };
}

export async function getReturnAuthorization(
  tx: Tx,
  id: number,
): Promise<ReturnAuthorizationWithLines | null> {
  const [row] = await tx
    .select()
    .from(returnAuthorization)
    .where(eq(returnAuthorization.id, id));
  if (!row) return null;

  const lines = await tx
    .select()
    .from(returnAuthorizationLine)
    .where(eq(returnAuthorizationLine.returnAuthorizationId, id))
    .orderBy(asc(returnAuthorizationLine.createdAt));

  return { ...row, lines };
}

export async function createReturnAuthorization(
  tx: Tx,
  data: {
    shipmentId?: number;
    userAccountId: UserAccountId;
    reason?: string;
    note?: string;
    lines: Array<{ shipmentLineId?: number; sku: string; expectedQuantity: number }>;
  },
): Promise<number> {
  const [row] = await tx
    .insert(returnAuthorization)
    .values({
      shipmentId: data.shipmentId ?? null,
      userAccountId: Number(data.userAccountId),
      reason: data.reason ?? null,
      note: data.note ?? null,
      status: 'pending',
    })
    .returning({ id: returnAuthorization.id });

  if (data.lines.length > 0) {
    await tx.insert(returnAuthorizationLine).values(
      data.lines.map((l) => ({
        returnAuthorizationId: row.id,
        shipmentLineId: l.shipmentLineId ?? null,
        sku: l.sku,
        expectedQuantity: l.expectedQuantity,
        receivedQuantity: 0,
      })),
    );
  }

  return row.id;
}

// Grades a received return line; a 'restock' disposition puts the goods back
// into salable stock at the given location, with a full audit trail.
export async function gradeReturnLine(
  tx: Tx,
  lineId: number,
  data: {
    receivedQuantity: number;
    condition: ReturnCondition;
    disposition: ReturnDisposition;
    storageLocationId?: number;
    userAccountId: UserAccountId;
  },
): Promise<void> {
  const [line] = await tx
    .select()
    .from(returnAuthorizationLine)
    .where(eq(returnAuthorizationLine.id, lineId));
  if (!line) throw new Error(`[logistic] return_authorization_line ${lineId} not found`);
  if (data.disposition === 'restock' && data.storageLocationId === undefined)
    throw new Error('[logistic] restock disposition requires a storage location');

  await tx
    .update(returnAuthorizationLine)
    .set({
      receivedQuantity: data.receivedQuantity,
      condition: data.condition,
      disposition: data.disposition,
    })
    .where(eq(returnAuthorizationLine.id, lineId));

  if (data.disposition === 'restock' && data.storageLocationId !== undefined) {
    const stockLevelId = await ensureStockLevel(tx, data.storageLocationId, line.sku);
    await adjustStock(tx, {
      stockLevelId,
      delta: data.receivedQuantity,
      reason: 'return_restock',
      userAccountId: data.userAccountId,
      note: `Return authorization line ${lineId} — restocked`,
    });
  }
}

export async function processReturnAuthorization(tx: Tx, id: number): Promise<void> {
  await tx
    .update(returnAuthorization)
    .set({ status: 'processed' })
    .where(eq(returnAuthorization.id, id));
}

// ---------------------------------------------------------------------------
// Cycle Count
// ---------------------------------------------------------------------------

export async function getCycleCounts(
  tx: Tx,
  options?: {
    status?: CycleCountStatus;
    userAccountId?: UserAccountId;
    page?: number;
    perPage?: number;
  },
): Promise<{ counts: CycleCount[]; total: number }> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;

  const conditions = [];
  if (options?.status) conditions.push(eq(cycleCount.status, options.status));
  if (options?.userAccountId !== undefined)
    conditions.push(eq(cycleCount.userAccountId, Number(options.userAccountId)));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [counts, [{ value: total }]] = await Promise.all([
    tx
      .select()
      .from(cycleCount)
      .where(where)
      .orderBy(desc(cycleCount.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    tx.select({ value: count() }).from(cycleCount).where(where),
  ]);

  return { counts, total };
}

export async function getCycleCount(
  tx: Tx,
  id: number,
  localeCode: string,
  fallbackLocaleCode = 'en',
): Promise<CycleCountWithLines | null> {
  const [row] = await tx.select().from(cycleCount).where(eq(cycleCount.id, id));
  if (!row) return null;

  // Walk order: count in storage location order, same as picking.
  const lines = await tx
    .select({ line: cycleCountLine, location: storageLocation })
    .from(cycleCountLine)
    .innerJoin(storageLocation, eq(storageLocation.id, cycleCountLine.storageLocationId))
    .where(eq(cycleCountLine.cycleCountId, id))
    .orderBy(asc(storageLocation.sortOrder), asc(cycleCountLine.sku));

  const text = await resolveEntityText(
    tx,
    [...new Set(lines.map((l) => l.location.id))],
    'storage_location',
    localeCode,
    fallbackLocaleCode,
  );

  return {
    ...row,
    lines: lines.map(({ line, location }) => ({
      ...line,
      storageLocation: {
        ...location,
        name: text[`name.${location.id}`] ?? location.slug,
        ancestors: [],
      },
    })),
  };
}

// Creates a cycle count scoped to the given storage locations, snapshotting
// expected quantities from current stock levels.
export async function createCycleCount(
  tx: Tx,
  storageLocationIds: number[],
  userAccountId: UserAccountId,
): Promise<number> {
  if (storageLocationIds.length === 0)
    throw new Error('[logistic] createCycleCount requires at least one storage location');

  const [row] = await tx
    .insert(cycleCount)
    .values({ userAccountId: Number(userAccountId), status: 'open' })
    .returning({ id: cycleCount.id });

  const stockRows = await tx
    .select()
    .from(stockLevel)
    .where(inArray(stockLevel.storageLocationId, storageLocationIds));

  if (stockRows.length > 0) {
    await tx.insert(cycleCountLine).values(
      stockRows.map((s) => ({
        cycleCountId: row.id,
        stockLevelId: s.id,
        storageLocationId: s.storageLocationId,
        sku: s.sku,
        expectedQuantity: s.onHand,
        countedQuantity: null,
      })),
    );
  }

  return row.id;
}

// Claims an open cycle count, mirroring assignPickTask. Workers can only
// record lines on counts assigned to them (enforced by RLS).
export async function assignCycleCount(
  tx: Tx,
  id: number,
  userAccountId: UserAccountId,
): Promise<void> {
  await tx
    .update(cycleCount)
    .set({ status: 'in_progress', userAccountId: Number(userAccountId) })
    .where(and(eq(cycleCount.id, id), eq(cycleCount.status, 'open')));
}

export async function recordCycleCountLine(
  tx: Tx,
  lineId: number,
  countedQuantity: number,
): Promise<void> {
  await tx
    .update(cycleCountLine)
    .set({ countedQuantity })
    .where(eq(cycleCountLine.id, lineId));
}

// Approves a cycle count: generates a stock_adjustment for every counted line
// with variance, atomically with the status change.
export async function approveCycleCount(
  tx: Tx,
  id: number,
  userAccountId: UserAccountId,
): Promise<void> {
  const lines = await tx
    .select()
    .from(cycleCountLine)
    .where(eq(cycleCountLine.cycleCountId, id));

  for (const line of lines) {
    if (line.countedQuantity === null) continue;
    const delta = line.countedQuantity - line.expectedQuantity;
    if (delta !== 0) {
      await adjustStock(tx, {
        stockLevelId: line.stockLevelId,
        delta,
        reason: 'cycle_count_variance',
        userAccountId,
        note: `Cycle count ${id} — line ${line.id}`,
      });
    }
  }

  await tx.update(cycleCount).set({ status: 'complete' }).where(eq(cycleCount.id, id));
}

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------

export async function getLogisticMetrics(tx: Tx): Promise<{
  openPickTaskCount: number;
  pendingReceiptCount: number;
  openReturnCount: number;
  openCycleCountCount: number;
  lowStockCount: number;
}> {
  const [pickTasks, receipts, returns, cycleCounts, lowStock] = await Promise.all([
    tx
      .select({ value: count() })
      .from(pickTask)
      .where(inArray(pickTask.status, ['open', 'in_progress'])),
    tx
      .select({ value: count() })
      .from(inboundReceipt)
      .where(inArray(inboundReceipt.status, ['pending', 'partial'])),
    tx
      .select({ value: count() })
      .from(returnAuthorization)
      .where(inArray(returnAuthorization.status, ['pending', 'received'])),
    tx
      .select({ value: count() })
      .from(cycleCount)
      .where(inArray(cycleCount.status, ['open', 'in_progress'])),
    tx
      .select({ value: count() })
      .from(stockLevel)
      .where(
        sql`${stockLevel.reorderPoint} is not null and ${stockLevel.onHand} - ${stockLevel.reserved} <= ${stockLevel.reorderPoint}`,
      ),
  ]);

  return {
    openPickTaskCount: pickTasks[0].value,
    pendingReceiptCount: receipts[0].value,
    openReturnCount: returns[0].value,
    openCycleCountCount: cycleCounts[0].value,
    lowStockCount: lowStock[0].value,
  };
}

// ---------------------------------------------------------------------------
// Dictionary payload builder (for hermes client-side merge)
// ---------------------------------------------------------------------------

export function buildLogisticDictionaryPayload(
  items: Array<{ entityId: number; name: string; scope: string }>,
  localeCode: string,
): DictionaryPayload {
  return items.map((item) => ({
    link: { id: 0, slug: 'name', scope: item.scope, entityId: item.entityId },
    content: item.name,
    localeCode,
  }));
}
