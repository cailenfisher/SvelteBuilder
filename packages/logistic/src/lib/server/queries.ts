// Server-only — never import from client-side code.
// All functions accept a typed Supabase client and return camelCase domain types.
// snake_case → camelCase conversion happens once, at the serialization boundary.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DictionaryPayload } from '@sveltebuilder/hermes';
import type {
  StorageLocation,
  StorageLocationType,
  StorageLocationWithCopy,
  Supplier,
  SupplierContact,
  SupplierWithCopy,
  StockLevel,
  StockLevelWithLocation,
  StockAdjustment,
  AdjustmentReason,
  InboundReceipt,
  InboundReceiptStatus,
  InboundReceiptLine,
  InboundReceiptWithCopy,
  PickTask,
  PickTaskStatus,
  PickTaskLine,
  PickTaskWithLines,
  Shipment,
  ShipmentStatus,
  ShipmentLine,
  ShipmentWithEvents,
  TrackingEvent,
  ReturnAuthorization,
  ReturnAuthorizationStatus,
  ReturnAuthorizationLine,
  ReturnAuthorizationWithLines,
  ReturnCondition,
  ReturnDisposition,
  CycleCount,
  CycleCountStatus,
  CycleCountLine,
  CycleCountWithLines,
} from '../schema/index.js';

// ---------------------------------------------------------------------------
// Internal row mappers (snake_case → camelCase)
// ---------------------------------------------------------------------------

function mapStorageLocation(row: Record<string, unknown>): StorageLocation {
  return {
    id: row.id as number,
    slug: row.slug as string,
    locationType: row.location_type as StorageLocationType,
    parentStorageLocationId: row.parent_storage_location_id as number | null,
    active: row.active as boolean,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  };
}

function mapSupplier(row: Record<string, unknown>): Supplier {
  return {
    id: row.id as number,
    slug: row.slug as string,
    leadTimeDay: row.lead_time_day as number | null,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

function mapSupplierContact(row: Record<string, unknown>): SupplierContact {
  return {
    id: row.id as number,
    supplierId: row.supplier_id as number,
    role: row.role as string,
    name: row.name as string,
    email: row.email as string | null,
    phone: row.phone as string | null,
    createdAt: row.created_at as string,
  };
}

function mapStockLevel(row: Record<string, unknown>): StockLevel {
  return {
    id: row.id as number,
    storageLocationId: row.storage_location_id as number,
    sku: row.sku as string,
    onHand: row.on_hand as number,
    reserved: row.reserved as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapStockAdjustment(row: Record<string, unknown>): StockAdjustment {
  return {
    id: row.id as number,
    stockLevelId: row.stock_level_id as number,
    userAccountId: row.user_account_id as string,
    delta: row.delta as number,
    onHandBefore: row.on_hand_before as number,
    onHandAfter: row.on_hand_after as number,
    reason: row.reason as AdjustmentReason,
    note: row.note as string | null,
    createdAt: row.created_at as string,
  };
}

function mapInboundReceipt(row: Record<string, unknown>): InboundReceipt {
  return {
    id: row.id as number,
    supplierId: row.supplier_id as number,
    userAccountId: row.user_account_id as string,
    status: row.status as InboundReceiptStatus,
    expectedAt: row.expected_at as string | null,
    receivedAt: row.received_at as string | null,
    note: row.note as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapInboundReceiptLine(row: Record<string, unknown>): InboundReceiptLine {
  return {
    id: row.id as number,
    inboundReceiptId: row.inbound_receipt_id as number,
    storageLocationId: row.storage_location_id as number,
    sku: row.sku as string,
    expectedQuantity: row.expected_quantity as number,
    receivedQuantity: row.received_quantity as number,
    discrepancy: row.discrepancy as number,
    createdAt: row.created_at as string,
  };
}

function mapPickTask(row: Record<string, unknown>): PickTask {
  return {
    id: row.id as number,
    userAccountId: row.user_account_id as string | null,
    status: row.status as PickTaskStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapPickTaskLine(row: Record<string, unknown>): PickTaskLine {
  return {
    id: row.id as number,
    pickTaskId: row.pick_task_id as number,
    stockLevelId: row.stock_level_id as number,
    storageLocationId: row.storage_location_id as number,
    sku: row.sku as string,
    requestedQuantity: row.requested_quantity as number,
    pickedQuantity: row.picked_quantity as number,
    createdAt: row.created_at as string,
  };
}

function mapShipment(row: Record<string, unknown>): Shipment {
  return {
    id: row.id as number,
    userAccountId: row.user_account_id as string,
    status: row.status as ShipmentStatus,
    carrier: row.carrier as string | null,
    serviceLevel: row.service_level as string | null,
    trackingNumber: row.tracking_number as string | null,
    shippedAt: row.shipped_at as string | null,
    deliveredAt: row.delivered_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapShipmentLine(row: Record<string, unknown>): ShipmentLine {
  return {
    id: row.id as number,
    shipmentId: row.shipment_id as number,
    pickTaskLineId: row.pick_task_line_id as number | null,
    sku: row.sku as string,
    quantity: row.quantity as number,
    createdAt: row.created_at as string,
  };
}

function mapTrackingEvent(row: Record<string, unknown>): TrackingEvent {
  return {
    id: row.id as number,
    shipmentId: row.shipment_id as number,
    status: row.status as string,
    eventLocation: row.event_location as string | null,
    description: row.description as string | null,
    occurredAt: row.occurred_at as string,
    createdAt: row.created_at as string,
  };
}

function mapReturnAuthorization(row: Record<string, unknown>): ReturnAuthorization {
  return {
    id: row.id as number,
    shipmentId: row.shipment_id as number | null,
    userAccountId: row.user_account_id as string,
    status: row.status as ReturnAuthorizationStatus,
    reason: row.reason as string | null,
    note: row.note as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapReturnAuthorizationLine(row: Record<string, unknown>): ReturnAuthorizationLine {
  return {
    id: row.id as number,
    returnAuthorizationId: row.return_authorization_id as number,
    shipmentLineId: row.shipment_line_id as number | null,
    sku: row.sku as string,
    expectedQuantity: row.expected_quantity as number,
    receivedQuantity: row.received_quantity as number,
    condition: row.condition as ReturnCondition | null,
    disposition: row.disposition as ReturnDisposition | null,
    createdAt: row.created_at as string,
  };
}

function mapCycleCount(row: Record<string, unknown>): CycleCount {
  return {
    id: row.id as number,
    userAccountId: row.user_account_id as string,
    status: row.status as CycleCountStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapCycleCountLine(row: Record<string, unknown>): CycleCountLine {
  return {
    id: row.id as number,
    cycleCountId: row.cycle_count_id as number,
    stockLevelId: row.stock_level_id as number,
    storageLocationId: row.storage_location_id as number,
    sku: row.sku as string,
    expectedQuantity: row.expected_quantity as number,
    countedQuantity: row.counted_quantity as number | null,
    variance: row.variance as number | null,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Text resolution helpers
// ---------------------------------------------------------------------------

async function resolveEntityText(
  supabase: SupabaseClient,
  entityIds: number[],
  scope: string,
  locale: string,
  fallbackLocale: string,
): Promise<Record<string, string>> {
  if (entityIds.length === 0) return {};

  const { data, error } = await supabase
    .from('local_text_link')
    .select(`slug, entity_id, local_text ( content, locale:locale ( code ) )`)
    .eq('scope', scope)
    .in('entity_id', entityIds);

  if (error) throw new Error(`[logistic] resolveEntityText error: ${error.message}`);

  const result: Record<string, string> = {};

  for (const row of data ?? []) {
    const slug = row.slug as string;
    const entityId = row.entity_id as number;
    const texts = (row.local_text ?? []) as Array<{
      content: string;
      locale: { code: string } | null;
    }>;

    const resolved =
      texts.find((t) => t.locale?.code === locale) ??
      texts.find((t) => t.locale?.code === fallbackLocale) ??
      texts[0];

    if (resolved) result[`${slug}.${entityId}`] = resolved.content;
  }

  return result;
}

// ---------------------------------------------------------------------------
// StorageLocation
// ---------------------------------------------------------------------------

export async function getStorageLocations(
  supabase: SupabaseClient,
  options?: { type?: StorageLocationType; active?: boolean },
): Promise<StorageLocation[]> {
  let query = supabase
    .from('storage_location')
    .select('*')
    .order('sort_order', { ascending: true });

  if (options?.type) query = query.eq('location_type', options.type);
  if (options?.active !== undefined) query = query.eq('active', options.active);

  const { data, error } = await query;
  if (error) throw new Error(`[logistic] getStorageLocations error: ${error.message}`);
  return (data ?? []).map((r) => mapStorageLocation(r as Record<string, unknown>));
}

export async function getStorageLocation(
  supabase: SupabaseClient,
  id: number,
): Promise<StorageLocation | null> {
  const { data, error } = await supabase
    .from('storage_location')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`[logistic] getStorageLocation error: ${error.message}`);
  if (!data) return null;
  return mapStorageLocation(data as Record<string, unknown>);
}

// Resolves the full ancestor chain from root down to the given location.
// Returned array is ordered root → bin.
async function resolveLocationAncestors(
  supabase: SupabaseClient,
  location: StorageLocation,
  allLocations: StorageLocation[],
  text: Record<string, string>,
): Promise<StorageLocationWithCopy[]> {
  const ancestors: StorageLocationWithCopy[] = [];
  let current: StorageLocation | undefined = location;

  while (current?.parentStorageLocationId) {
    const parent = allLocations.find((l) => l.id === current!.parentStorageLocationId);
    if (!parent) break;
    ancestors.unshift({
      ...parent,
      name: text[`name.${parent.id}`] ?? parent.slug,
      ancestors: [],
    });
    current = parent;
  }

  return ancestors;
}

export async function getStorageLocationPath(
  supabase: SupabaseClient,
  id: number,
  locale: string,
  fallbackLocale = 'en',
): Promise<StorageLocationWithCopy | null> {
  const { data: allData, error } = await supabase
    .from('storage_location')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`[logistic] getStorageLocationPath error: ${error.message}`);

  const allLocations = (allData ?? []).map((r) => mapStorageLocation(r as Record<string, unknown>));
  const location = allLocations.find((l) => l.id === id);
  if (!location) return null;

  const ids = allLocations.map((l) => l.id);
  const text = await resolveEntityText(supabase, ids, 'storage_location', locale, fallbackLocale);
  const ancestors = await resolveLocationAncestors(supabase, location, allLocations, text);

  return {
    ...location,
    name: text[`name.${location.id}`] ?? location.slug,
    ancestors,
  };
}

// ---------------------------------------------------------------------------
// Supplier
// ---------------------------------------------------------------------------

export async function getSuppliers(
  supabase: SupabaseClient,
  locale: string,
  options?: { active?: boolean; fallbackLocale?: string },
): Promise<SupplierWithCopy[]> {
  const fallbackLocale = options?.fallbackLocale ?? 'en';

  let query = supabase.from('supplier').select('*').order('slug', { ascending: true });
  if (options?.active !== undefined) query = query.eq('active', options.active);

  const { data, error } = await query;
  if (error) throw new Error(`[logistic] getSuppliers error: ${error.message}`);

  const suppliers = (data ?? []).map((r) => mapSupplier(r as Record<string, unknown>));
  if (suppliers.length === 0) return [];

  const ids = suppliers.map((s) => s.id);
  const [text, contactRows] = await Promise.all([
    resolveEntityText(supabase, ids, 'supplier', locale, fallbackLocale),
    supabase
      .from('supplier_contact')
      .select('*')
      .in('supplier_id', ids)
      .order('created_at', { ascending: true }),
  ]);

  if (contactRows.error)
    throw new Error(`[logistic] getSuppliers contacts error: ${contactRows.error.message}`);

  const contacts = (contactRows.data ?? []).map((r) =>
    mapSupplierContact(r as Record<string, unknown>),
  );

  return suppliers.map((s) => ({
    ...s,
    name: text[`name.${s.id}`] ?? s.slug,
    contacts: contacts.filter((c) => c.supplierId === s.id),
  }));
}

export async function getSupplier(
  supabase: SupabaseClient,
  id: number,
  locale: string,
  fallbackLocale = 'en',
): Promise<SupplierWithCopy | null> {
  const { data, error } = await supabase
    .from('supplier')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`[logistic] getSupplier error: ${error.message}`);
  if (!data) return null;

  const supplier = mapSupplier(data as Record<string, unknown>);
  const [text, contactRows] = await Promise.all([
    resolveEntityText(supabase, [id], 'supplier', locale, fallbackLocale),
    supabase
      .from('supplier_contact')
      .select('*')
      .eq('supplier_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (contactRows.error)
    throw new Error(`[logistic] getSupplier contacts error: ${contactRows.error.message}`);

  return {
    ...supplier,
    name: text[`name.${id}`] ?? supplier.slug,
    contacts: (contactRows.data ?? []).map((r) =>
      mapSupplierContact(r as Record<string, unknown>),
    ),
  };
}

export async function createSupplier(
  supabase: SupabaseClient,
  data: { slug: string; leadTimeDay?: number },
): Promise<number> {
  const { data: row, error } = await supabase
    .from('supplier')
    .insert({ slug: data.slug, lead_time_day: data.leadTimeDay ?? null })
    .select('id')
    .single();

  if (error) throw new Error(`[logistic] createSupplier error: ${error.message}`);
  return row.id as number;
}

export async function updateSupplier(
  supabase: SupabaseClient,
  id: number,
  data: Partial<{ slug: string; leadTimeDay: number | null; active: boolean }>,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.slug !== undefined) payload.slug = data.slug;
  if (data.leadTimeDay !== undefined) payload.lead_time_day = data.leadTimeDay;
  if (data.active !== undefined) payload.active = data.active;

  const { error } = await supabase.from('supplier').update(payload).eq('id', id);
  if (error) throw new Error(`[logistic] updateSupplier error: ${error.message}`);
}

export async function upsertSupplierContact(
  supabase: SupabaseClient,
  data: {
    id?: number;
    supplierId: number;
    role: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  },
): Promise<number> {
  const payload = {
    supplier_id: data.supplierId,
    role: data.role,
    name: data.name,
    email: data.email ?? null,
    phone: data.phone ?? null,
  };

  if (data.id) {
    const { error } = await supabase
      .from('supplier_contact')
      .update(payload)
      .eq('id', data.id);
    if (error) throw new Error(`[logistic] upsertSupplierContact error: ${error.message}`);
    return data.id;
  }

  const { data: row, error } = await supabase
    .from('supplier_contact')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw new Error(`[logistic] upsertSupplierContact error: ${error.message}`);
  return row.id as number;
}

export async function deleteSupplierContact(
  supabase: SupabaseClient,
  id: number,
): Promise<void> {
  const { error } = await supabase.from('supplier_contact').delete().eq('id', id);
  if (error) throw new Error(`[logistic] deleteSupplierContact error: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

export async function getStockLevels(
  supabase: SupabaseClient,
  locale: string,
  options?: {
    sku?: string;
    storageLocationId?: number;
    belowReorder?: number;
    fallbackLocale?: string;
  },
): Promise<StockLevelWithLocation[]> {
  const fallbackLocale = options?.fallbackLocale ?? 'en';

  let query = supabase.from('stock_level').select('*').order('sku', { ascending: true });
  if (options?.sku) query = query.eq('sku', options.sku);
  if (options?.storageLocationId)
    query = query.eq('storage_location_id', options.storageLocationId);
  if (options?.belowReorder !== undefined)
    query = query.lt('on_hand', options.belowReorder);

  const { data, error } = await query;
  if (error) throw new Error(`[logistic] getStockLevels error: ${error.message}`);

  const levels = (data ?? []).map((r) => mapStockLevel(r as Record<string, unknown>));
  if (levels.length === 0) return [];

  const locationIds = [...new Set(levels.map((l) => l.storageLocationId))];
  const { data: locData, error: locError } = await supabase
    .from('storage_location')
    .select('*')
    .in('id', locationIds);

  if (locError) throw new Error(`[logistic] getStockLevels locations error: ${locError.message}`);

  const allLoc = (locData ?? []).map((r) => mapStorageLocation(r as Record<string, unknown>));
  const text = await resolveEntityText(
    supabase,
    allLoc.map((l) => l.id),
    'storage_location',
    locale,
    fallbackLocale,
  );

  const locationMap = new Map(
    allLoc.map((l) => [
      l.id,
      { ...l, name: text[`name.${l.id}`] ?? l.slug, ancestors: [] } as StorageLocationWithCopy,
    ]),
  );

  return levels.map((level) => ({
    ...level,
    available: level.onHand - level.reserved,
    storageLocation: locationMap.get(level.storageLocationId) ?? {
      id: level.storageLocationId,
      slug: '',
      locationType: 'bin' as const,
      parentStorageLocationId: null,
      active: true,
      sortOrder: 0,
      createdAt: '',
      name: '',
      ancestors: [],
    },
  }));
}

// Atomically adjusts stock via Postgres RPC. The DB function handles the
// on_hand_before/after capture and appends to stock_adjustment.
export async function adjustStock(
  supabase: SupabaseClient,
  data: {
    stockLevelId: number;
    delta: number;
    reason: AdjustmentReason;
    userAccountId: string;
    note?: string;
  },
): Promise<StockAdjustment> {
  const { data: row, error } = await supabase.rpc('logistic_adjust_stock', {
    p_stock_level_id: data.stockLevelId,
    p_delta: data.delta,
    p_reason: data.reason,
    p_user_account_id: data.userAccountId,
    p_note: data.note ?? null,
  });

  if (error) throw new Error(`[logistic] adjustStock error: ${error.message}`);
  return mapStockAdjustment(row as Record<string, unknown>);
}

export async function getStockAdjustments(
  supabase: SupabaseClient,
  stockLevelId: number,
  options?: { limit?: number },
): Promise<StockAdjustment[]> {
  let query = supabase
    .from('stock_adjustment')
    .select('*')
    .eq('stock_level_id', stockLevelId)
    .order('created_at', { ascending: false });

  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(`[logistic] getStockAdjustments error: ${error.message}`);
  return (data ?? []).map((r) => mapStockAdjustment(r as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// Inbound Receipt
// ---------------------------------------------------------------------------

export async function getInboundReceipts(
  supabase: SupabaseClient,
  locale: string,
  options?: {
    status?: InboundReceiptStatus;
    page?: number;
    perPage?: number;
    fallbackLocale?: string;
  },
): Promise<{ receipts: InboundReceiptWithCopy[]; total: number }> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const fallbackLocale = options?.fallbackLocale ?? 'en';
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('inbound_receipt')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options?.status) query = query.eq('status', options.status);

  const { data, error, count } = await query;
  if (error) throw new Error(`[logistic] getInboundReceipts error: ${error.message}`);

  const receipts = (data ?? []).map((r) => mapInboundReceipt(r as Record<string, unknown>));
  if (receipts.length === 0) return { receipts: [], total: 0 };

  const supplierIds = [...new Set(receipts.map((r) => r.supplierId))];
  const receiptIds = receipts.map((r) => r.id);

  const [supplierText, supplierContactRows, lineRows] = await Promise.all([
    resolveEntityText(supabase, supplierIds, 'supplier', locale, fallbackLocale),
    supabase.from('supplier_contact').select('*').in('supplier_id', supplierIds),
    supabase
      .from('inbound_receipt_line')
      .select('*')
      .in('inbound_receipt_id', receiptIds),
  ]);

  if (supplierContactRows.error)
    throw new Error(`[logistic] getInboundReceipts contacts error: ${supplierContactRows.error.message}`);
  if (lineRows.error)
    throw new Error(`[logistic] getInboundReceipts lines error: ${lineRows.error.message}`);

  const { data: supplierData, error: supplierError } = await supabase
    .from('supplier')
    .select('*')
    .in('id', supplierIds);
  if (supplierError)
    throw new Error(`[logistic] getInboundReceipts suppliers error: ${supplierError.message}`);

  const supplierMap = new Map(
    (supplierData ?? []).map((r) => {
      const s = mapSupplier(r as Record<string, unknown>);
      return [
        s.id,
        {
          ...s,
          name: supplierText[`name.${s.id}`] ?? s.slug,
          contacts: (supplierContactRows.data ?? [])
            .filter((c) => c.supplier_id === s.id)
            .map((c) => mapSupplierContact(c as Record<string, unknown>)),
        } as SupplierWithCopy,
      ];
    }),
  );

  const lines = (lineRows.data ?? []).map((r) =>
    mapInboundReceiptLine(r as Record<string, unknown>),
  );

  const enriched = receipts.map((receipt) => ({
    ...receipt,
    supplier: supplierMap.get(receipt.supplierId)!,
    lines: lines.filter((l) => l.inboundReceiptId === receipt.id),
  }));

  return { receipts: enriched, total: count ?? 0 };
}

export async function getInboundReceipt(
  supabase: SupabaseClient,
  id: number,
  locale: string,
  fallbackLocale = 'en',
): Promise<InboundReceiptWithCopy | null> {
  const { data, error } = await supabase
    .from('inbound_receipt')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`[logistic] getInboundReceipt error: ${error.message}`);
  if (!data) return null;

  const receipt = mapInboundReceipt(data as Record<string, unknown>);
  const [supplier, lineRows] = await Promise.all([
    getSupplier(supabase, receipt.supplierId, locale, fallbackLocale),
    supabase
      .from('inbound_receipt_line')
      .select('*')
      .eq('inbound_receipt_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (lineRows.error)
    throw new Error(`[logistic] getInboundReceipt lines error: ${lineRows.error.message}`);

  return {
    ...receipt,
    supplier: supplier ?? {
      id: receipt.supplierId,
      slug: '',
      leadTimeDay: null,
      active: true,
      createdAt: '',
      name: '',
      contacts: [],
    },
    lines: (lineRows.data ?? []).map((r) =>
      mapInboundReceiptLine(r as Record<string, unknown>),
    ),
  };
}

export async function createInboundReceipt(
  supabase: SupabaseClient,
  data: {
    supplierId: number;
    userAccountId: string;
    expectedAt?: string;
    note?: string;
  },
): Promise<number> {
  const { data: row, error } = await supabase
    .from('inbound_receipt')
    .insert({
      supplier_id: data.supplierId,
      user_account_id: data.userAccountId,
      expected_at: data.expectedAt ?? null,
      note: data.note ?? null,
    })
    .select('id')
    .single();

  if (error) throw new Error(`[logistic] createInboundReceipt error: ${error.message}`);
  return row.id as number;
}

export async function addInboundReceiptLine(
  supabase: SupabaseClient,
  data: {
    inboundReceiptId: number;
    storageLocationId: number;
    sku: string;
    expectedQuantity: number;
  },
): Promise<number> {
  const { data: row, error } = await supabase
    .from('inbound_receipt_line')
    .insert({
      inbound_receipt_id: data.inboundReceiptId,
      storage_location_id: data.storageLocationId,
      sku: data.sku,
      expected_quantity: data.expectedQuantity,
      received_quantity: 0,
    })
    .select('id')
    .single();

  if (error) throw new Error(`[logistic] addInboundReceiptLine error: ${error.message}`);
  return row.id as number;
}

// Records received quantity for a line, adjusts stock, and updates receipt status.
export async function receiveReceiptLine(
  supabase: SupabaseClient,
  lineId: number,
  receivedQuantity: number,
  userAccountId: string,
): Promise<void> {
  const { data: lineData, error: lineError } = await supabase
    .from('inbound_receipt_line')
    .select('*')
    .eq('id', lineId)
    .single();

  if (lineError) throw new Error(`[logistic] receiveReceiptLine fetch error: ${lineError.message}`);

  const line = mapInboundReceiptLine(lineData as Record<string, unknown>);

  // Upsert stock_level for this sku + location
  const { data: stockData, error: stockError } = await supabase
    .from('stock_level')
    .upsert(
      { storage_location_id: line.storageLocationId, sku: line.sku, on_hand: 0, reserved: 0 },
      { onConflict: 'storage_location_id,sku', ignoreDuplicates: true },
    )
    .select('id, on_hand')
    .single();

  // After upsert, fetch the actual current stock level id
  const { data: currentStock, error: currentError } = await supabase
    .from('stock_level')
    .select('id')
    .eq('storage_location_id', line.storageLocationId)
    .eq('sku', line.sku)
    .single();

  if (currentError || (!stockData && !currentStock))
    throw new Error(`[logistic] receiveReceiptLine stock upsert error: ${stockError?.message ?? currentError?.message}`);

  const stockLevelId = (currentStock?.id ?? stockData?.id) as number;

  await adjustStock(supabase, {
    stockLevelId,
    delta: receivedQuantity,
    reason: 'system_correction',
    userAccountId,
    note: `Inbound receipt line ${lineId}`,
  });

  const { error: updateError } = await supabase
    .from('inbound_receipt_line')
    .update({ received_quantity: receivedQuantity })
    .eq('id', lineId);

  if (updateError)
    throw new Error(`[logistic] receiveReceiptLine update error: ${updateError.message}`);

  // Recalculate receipt status
  await refreshReceiptStatus(supabase, line.inboundReceiptId);
}

async function refreshReceiptStatus(
  supabase: SupabaseClient,
  receiptId: number,
): Promise<void> {
  const { data: lines, error } = await supabase
    .from('inbound_receipt_line')
    .select('expected_quantity, received_quantity')
    .eq('inbound_receipt_id', receiptId);

  if (error) return;

  const allLines = lines ?? [];
  const allComplete = allLines.every((l) => l.received_quantity >= l.expected_quantity);
  const anyReceived = allLines.some((l) => l.received_quantity > 0);

  const status = allComplete ? 'complete' : anyReceived ? 'partial' : 'pending';

  await supabase
    .from('inbound_receipt')
    .update({
      status,
      received_at: allComplete ? new Date().toISOString() : null,
    })
    .eq('id', receiptId);
}

// ---------------------------------------------------------------------------
// Pick Task
// ---------------------------------------------------------------------------

export async function getPickTasks(
  supabase: SupabaseClient,
  options?: {
    status?: PickTaskStatus;
    userAccountId?: string;
    page?: number;
    perPage?: number;
  },
): Promise<{ tasks: PickTask[]; total: number }> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('pick_task')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options?.status) query = query.eq('status', options.status);
  if (options?.userAccountId) query = query.eq('user_account_id', options.userAccountId);

  const { data, error, count } = await query;
  if (error) throw new Error(`[logistic] getPickTasks error: ${error.message}`);

  return {
    tasks: (data ?? []).map((r) => mapPickTask(r as Record<string, unknown>)),
    total: count ?? 0,
  };
}

export async function getPickTask(
  supabase: SupabaseClient,
  id: number,
  locale: string,
  fallbackLocale = 'en',
): Promise<PickTaskWithLines | null> {
  const { data, error } = await supabase
    .from('pick_task')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`[logistic] getPickTask error: ${error.message}`);
  if (!data) return null;

  const task = mapPickTask(data as Record<string, unknown>);

  const { data: lineData, error: lineError } = await supabase
    .from('pick_task_line')
    .select('*')
    .eq('pick_task_id', id)
    .order('created_at', { ascending: true });

  if (lineError) throw new Error(`[logistic] getPickTask lines error: ${lineError.message}`);

  const lines = (lineData ?? []).map((r) => mapPickTaskLine(r as Record<string, unknown>));
  const locationIds = [...new Set(lines.map((l) => l.storageLocationId))];

  const { data: locData, error: locError } = await supabase
    .from('storage_location')
    .select('*')
    .in('id', locationIds);

  if (locError) throw new Error(`[logistic] getPickTask locations error: ${locError.message}`);

  const allLoc = (locData ?? []).map((r) => mapStorageLocation(r as Record<string, unknown>));
  const text = await resolveEntityText(
    supabase,
    allLoc.map((l) => l.id),
    'storage_location',
    locale,
    fallbackLocale,
  );

  const locationMap = new Map(
    allLoc.map((l) => [
      l.id,
      { ...l, name: text[`name.${l.id}`] ?? l.slug, ancestors: [] } as StorageLocationWithCopy,
    ]),
  );

  return {
    ...task,
    lines: lines.map((line) => ({
      ...line,
      storageLocation: locationMap.get(line.storageLocationId) ?? {
        id: line.storageLocationId,
        slug: '',
        locationType: 'bin' as const,
        parentStorageLocationId: null,
        active: true,
        sortOrder: 0,
        createdAt: '',
        name: '',
        ancestors: [],
      },
    })),
  };
}

export async function createPickTask(
  supabase: SupabaseClient,
  lines: Array<{
    stockLevelId: number;
    storageLocationId: number;
    sku: string;
    requestedQuantity: number;
  }>,
): Promise<number> {
  const { data: taskRow, error: taskError } = await supabase
    .from('pick_task')
    .insert({ status: 'open' })
    .select('id')
    .single();

  if (taskError) throw new Error(`[logistic] createPickTask error: ${taskError.message}`);

  const taskId = taskRow.id as number;

  const { error: lineError } = await supabase.from('pick_task_line').insert(
    lines.map((l) => ({
      pick_task_id: taskId,
      stock_level_id: l.stockLevelId,
      storage_location_id: l.storageLocationId,
      sku: l.sku,
      requested_quantity: l.requestedQuantity,
      picked_quantity: 0,
    })),
  );

  if (lineError) throw new Error(`[logistic] createPickTask lines error: ${lineError.message}`);

  // Reserve stock for each line via RPC
  for (const line of lines) {
    const { error } = await supabase.rpc('logistic_reserve_stock', {
      p_stock_level_id: line.stockLevelId,
      p_quantity: line.requestedQuantity,
    });
    if (error) throw new Error(`[logistic] createPickTask reserve error: ${error.message}`);
  }

  return taskId;
}

export async function assignPickTask(
  supabase: SupabaseClient,
  id: number,
  userAccountId: string,
): Promise<void> {
  const { error } = await supabase
    .from('pick_task')
    .update({ status: 'in_progress', user_account_id: userAccountId })
    .eq('id', id)
    .eq('status', 'open');

  if (error) throw new Error(`[logistic] assignPickTask error: ${error.message}`);
}

export async function recordPickedQuantity(
  supabase: SupabaseClient,
  lineId: number,
  pickedQuantity: number,
  userAccountId: string,
): Promise<void> {
  const { data: lineData, error: lineError } = await supabase
    .from('pick_task_line')
    .select('stock_level_id, requested_quantity, picked_quantity')
    .eq('id', lineId)
    .single();

  if (lineError) throw new Error(`[logistic] recordPickedQuantity fetch error: ${lineError.message}`);

  const previousPicked = lineData.picked_quantity as number;
  const delta = pickedQuantity - previousPicked;

  const { error: updateError } = await supabase
    .from('pick_task_line')
    .update({ picked_quantity: pickedQuantity })
    .eq('id', lineId);

  if (updateError)
    throw new Error(`[logistic] recordPickedQuantity update error: ${updateError.message}`);

  if (delta !== 0) {
    await adjustStock(supabase, {
      stockLevelId: lineData.stock_level_id as number,
      delta: -delta,
      reason: 'system_correction',
      userAccountId,
      note: `Pick task line ${lineId}`,
    });
  }
}

export async function completePickTask(
  supabase: SupabaseClient,
  id: number,
  userAccountId: string,
): Promise<void> {
  // Release reservations for all lines
  const { data: lines, error: lineError } = await supabase
    .from('pick_task_line')
    .select('stock_level_id, requested_quantity')
    .eq('pick_task_id', id);

  if (lineError) throw new Error(`[logistic] completePickTask lines error: ${lineError.message}`);

  for (const line of lines ?? []) {
    const { error } = await supabase.rpc('logistic_release_stock_reservation', {
      p_stock_level_id: line.stock_level_id,
      p_quantity: line.requested_quantity,
    });
    if (error) throw new Error(`[logistic] completePickTask release error: ${error.message}`);
  }

  const { error } = await supabase
    .from('pick_task')
    .update({ status: 'completed' })
    .eq('id', id)
    .eq('user_account_id', userAccountId);

  if (error) throw new Error(`[logistic] completePickTask error: ${error.message}`);
}

export async function cancelPickTask(
  supabase: SupabaseClient,
  id: number,
): Promise<void> {
  const { data: lines, error: lineError } = await supabase
    .from('pick_task_line')
    .select('stock_level_id, requested_quantity')
    .eq('pick_task_id', id);

  if (lineError) throw new Error(`[logistic] cancelPickTask lines error: ${lineError.message}`);

  for (const line of lines ?? []) {
    const { error } = await supabase.rpc('logistic_release_stock_reservation', {
      p_stock_level_id: line.stock_level_id,
      p_quantity: line.requested_quantity,
    });
    if (error) throw new Error(`[logistic] cancelPickTask release error: ${error.message}`);
  }

  const { error } = await supabase
    .from('pick_task')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) throw new Error(`[logistic] cancelPickTask error: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Shipment
// ---------------------------------------------------------------------------

export async function getShipments(
  supabase: SupabaseClient,
  options?: {
    status?: ShipmentStatus;
    page?: number;
    perPage?: number;
  },
): Promise<{ shipments: Shipment[]; total: number }> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('shipment')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options?.status) query = query.eq('status', options.status);

  const { data, error, count } = await query;
  if (error) throw new Error(`[logistic] getShipments error: ${error.message}`);

  return {
    shipments: (data ?? []).map((r) => mapShipment(r as Record<string, unknown>)),
    total: count ?? 0,
  };
}

export async function getShipment(
  supabase: SupabaseClient,
  id: number,
): Promise<ShipmentWithEvents | null> {
  const { data, error } = await supabase
    .from('shipment')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`[logistic] getShipment error: ${error.message}`);
  if (!data) return null;

  const shipment = mapShipment(data as Record<string, unknown>);

  const [lineRows, eventRows] = await Promise.all([
    supabase
      .from('shipment_line')
      .select('*')
      .eq('shipment_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('tracking_event')
      .select('*')
      .eq('shipment_id', id)
      .order('occurred_at', { ascending: true }),
  ]);

  if (lineRows.error) throw new Error(`[logistic] getShipment lines error: ${lineRows.error.message}`);
  if (eventRows.error) throw new Error(`[logistic] getShipment events error: ${eventRows.error.message}`);

  return {
    ...shipment,
    lines: (lineRows.data ?? []).map((r) => mapShipmentLine(r as Record<string, unknown>)),
    trackingEvents: (eventRows.data ?? []).map((r) => mapTrackingEvent(r as Record<string, unknown>)),
  };
}

export async function createShipment(
  supabase: SupabaseClient,
  data: {
    userAccountId: string;
    carrier?: string;
    serviceLevel?: string;
    lines: Array<{ pickTaskLineId?: number; sku: string; quantity: number }>;
  },
): Promise<number> {
  const { data: row, error } = await supabase
    .from('shipment')
    .insert({
      user_account_id: data.userAccountId,
      carrier: data.carrier ?? null,
      service_level: data.serviceLevel ?? null,
      status: 'created',
    })
    .select('id')
    .single();

  if (error) throw new Error(`[logistic] createShipment error: ${error.message}`);

  const shipmentId = row.id as number;

  const { error: lineError } = await supabase.from('shipment_line').insert(
    data.lines.map((l) => ({
      shipment_id: shipmentId,
      pick_task_line_id: l.pickTaskLineId ?? null,
      sku: l.sku,
      quantity: l.quantity,
    })),
  );

  if (lineError) throw new Error(`[logistic] createShipment lines error: ${lineError.message}`);
  return shipmentId;
}

export async function updateShipmentStatus(
  supabase: SupabaseClient,
  id: number,
  status: ShipmentStatus,
): Promise<void> {
  const payload: Record<string, unknown> = { status };
  if (status === 'dispatched') payload.shipped_at = new Date().toISOString();
  if (status === 'delivered') payload.delivered_at = new Date().toISOString();

  const { error } = await supabase.from('shipment').update(payload).eq('id', id);
  if (error) throw new Error(`[logistic] updateShipmentStatus error: ${error.message}`);
}

export async function updateShipmentTracking(
  supabase: SupabaseClient,
  id: number,
  data: { trackingNumber?: string; carrier?: string; serviceLevel?: string },
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.trackingNumber !== undefined) payload.tracking_number = data.trackingNumber;
  if (data.carrier !== undefined) payload.carrier = data.carrier;
  if (data.serviceLevel !== undefined) payload.service_level = data.serviceLevel;

  const { error } = await supabase.from('shipment').update(payload).eq('id', id);
  if (error) throw new Error(`[logistic] updateShipmentTracking error: ${error.message}`);
}

export async function addTrackingEvent(
  supabase: SupabaseClient,
  data: {
    shipmentId: number;
    status: string;
    eventLocation?: string;
    description?: string;
    occurredAt?: string;
  },
): Promise<void> {
  const { error } = await supabase.from('tracking_event').insert({
    shipment_id: data.shipmentId,
    status: data.status,
    event_location: data.eventLocation ?? null,
    description: data.description ?? null,
    occurred_at: data.occurredAt ?? new Date().toISOString(),
  });

  if (error) throw new Error(`[logistic] addTrackingEvent error: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Return Authorization
// ---------------------------------------------------------------------------

export async function getReturnAuthorizations(
  supabase: SupabaseClient,
  options?: {
    status?: ReturnAuthorizationStatus;
    page?: number;
    perPage?: number;
  },
): Promise<{ returns: ReturnAuthorization[]; total: number }> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('return_authorization')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options?.status) query = query.eq('status', options.status);

  const { data, error, count } = await query;
  if (error) throw new Error(`[logistic] getReturnAuthorizations error: ${error.message}`);

  return {
    returns: (data ?? []).map((r) => mapReturnAuthorization(r as Record<string, unknown>)),
    total: count ?? 0,
  };
}

export async function getReturnAuthorization(
  supabase: SupabaseClient,
  id: number,
): Promise<ReturnAuthorizationWithLines | null> {
  const { data, error } = await supabase
    .from('return_authorization')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`[logistic] getReturnAuthorization error: ${error.message}`);
  if (!data) return null;

  const returnAuth = mapReturnAuthorization(data as Record<string, unknown>);

  const { data: lineData, error: lineError } = await supabase
    .from('return_authorization_line')
    .select('*')
    .eq('return_authorization_id', id)
    .order('created_at', { ascending: true });

  if (lineError)
    throw new Error(`[logistic] getReturnAuthorization lines error: ${lineError.message}`);

  return {
    ...returnAuth,
    lines: (lineData ?? []).map((r) => mapReturnAuthorizationLine(r as Record<string, unknown>)),
  };
}

export async function createReturnAuthorization(
  supabase: SupabaseClient,
  data: {
    shipmentId?: number;
    userAccountId: string;
    reason?: string;
    note?: string;
    lines: Array<{ shipmentLineId?: number; sku: string; expectedQuantity: number }>;
  },
): Promise<number> {
  const { data: row, error } = await supabase
    .from('return_authorization')
    .insert({
      shipment_id: data.shipmentId ?? null,
      user_account_id: data.userAccountId,
      reason: data.reason ?? null,
      note: data.note ?? null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(`[logistic] createReturnAuthorization error: ${error.message}`);

  const returnId = row.id as number;

  const { error: lineError } = await supabase.from('return_authorization_line').insert(
    data.lines.map((l) => ({
      return_authorization_id: returnId,
      shipment_line_id: l.shipmentLineId ?? null,
      sku: l.sku,
      expected_quantity: l.expectedQuantity,
      received_quantity: 0,
    })),
  );

  if (lineError)
    throw new Error(`[logistic] createReturnAuthorization lines error: ${lineError.message}`);

  return returnId;
}

// Grades a received return line and optionally restocks it.
export async function gradeReturnLine(
  supabase: SupabaseClient,
  lineId: number,
  data: {
    receivedQuantity: number;
    condition: ReturnCondition;
    disposition: ReturnDisposition;
    storageLocationId?: number;
    userAccountId: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from('return_authorization_line')
    .update({
      received_quantity: data.receivedQuantity,
      condition: data.condition,
      disposition: data.disposition,
    })
    .eq('id', lineId);

  if (error) throw new Error(`[logistic] gradeReturnLine error: ${error.message}`);

  if (data.disposition === 'restock' && data.storageLocationId) {
    const { data: lineData } = await supabase
      .from('return_authorization_line')
      .select('sku')
      .eq('id', lineId)
      .single();

    if (lineData) {
      const sku = lineData.sku as string;

      await supabase
        .from('stock_level')
        .upsert(
          { storage_location_id: data.storageLocationId, sku, on_hand: 0, reserved: 0 },
          { onConflict: 'storage_location_id,sku', ignoreDuplicates: true },
        );

      const { data: stockData } = await supabase
        .from('stock_level')
        .select('id')
        .eq('storage_location_id', data.storageLocationId)
        .eq('sku', sku)
        .single();

      if (stockData) {
        await adjustStock(supabase, {
          stockLevelId: stockData.id as number,
          delta: data.receivedQuantity,
          reason: 'system_correction',
          userAccountId: data.userAccountId,
          note: `Return authorization line ${lineId} — restocked`,
        });
      }
    }
  }
}

export async function processReturnAuthorization(
  supabase: SupabaseClient,
  id: number,
): Promise<void> {
  const { error } = await supabase
    .from('return_authorization')
    .update({ status: 'processed' })
    .eq('id', id);

  if (error) throw new Error(`[logistic] processReturnAuthorization error: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Cycle Count
// ---------------------------------------------------------------------------

export async function getCycleCounts(
  supabase: SupabaseClient,
  options?: {
    status?: CycleCountStatus;
    page?: number;
    perPage?: number;
  },
): Promise<{ counts: CycleCount[]; total: number }> {
  const page = options?.page ?? 1;
  const perPage = options?.perPage ?? 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('cycle_count')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options?.status) query = query.eq('status', options.status);

  const { data, error, count } = await query;
  if (error) throw new Error(`[logistic] getCycleCounts error: ${error.message}`);

  return {
    counts: (data ?? []).map((r) => mapCycleCount(r as Record<string, unknown>)),
    total: count ?? 0,
  };
}

export async function getCycleCount(
  supabase: SupabaseClient,
  id: number,
  locale: string,
  fallbackLocale = 'en',
): Promise<CycleCountWithLines | null> {
  const { data, error } = await supabase
    .from('cycle_count')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`[logistic] getCycleCount error: ${error.message}`);
  if (!data) return null;

  const count = mapCycleCount(data as Record<string, unknown>);

  const { data: lineData, error: lineError } = await supabase
    .from('cycle_count_line')
    .select('*')
    .eq('cycle_count_id', id)
    .order('created_at', { ascending: true });

  if (lineError) throw new Error(`[logistic] getCycleCount lines error: ${lineError.message}`);

  const lines = (lineData ?? []).map((r) => mapCycleCountLine(r as Record<string, unknown>));
  const locationIds = [...new Set(lines.map((l) => l.storageLocationId))];

  const { data: locData, error: locError } = await supabase
    .from('storage_location')
    .select('*')
    .in('id', locationIds);

  if (locError) throw new Error(`[logistic] getCycleCount locations error: ${locError.message}`);

  const allLoc = (locData ?? []).map((r) => mapStorageLocation(r as Record<string, unknown>));
  const text = await resolveEntityText(
    supabase,
    allLoc.map((l) => l.id),
    'storage_location',
    locale,
    fallbackLocale,
  );

  const locationMap = new Map(
    allLoc.map((l) => [
      l.id,
      { ...l, name: text[`name.${l.id}`] ?? l.slug, ancestors: [] } as StorageLocationWithCopy,
    ]),
  );

  return {
    ...count,
    lines: lines.map((line) => ({
      ...line,
      storageLocation: locationMap.get(line.storageLocationId) ?? {
        id: line.storageLocationId,
        slug: '',
        locationType: 'bin' as const,
        parentStorageLocationId: null,
        active: true,
        sortOrder: 0,
        createdAt: '',
        name: '',
        ancestors: [],
      },
    })),
  };
}

// Creates a cycle count scoped to the given storage locations.
// Auto-populates lines from current stock_level rows for those locations.
export async function createCycleCount(
  supabase: SupabaseClient,
  storageLocationIds: number[],
  userAccountId: string,
): Promise<number> {
  if (storageLocationIds.length === 0)
    throw new Error('[logistic] createCycleCount requires at least one storage location');

  const { data: taskRow, error: taskError } = await supabase
    .from('cycle_count')
    .insert({ user_account_id: userAccountId, status: 'open' })
    .select('id')
    .single();

  if (taskError) throw new Error(`[logistic] createCycleCount error: ${taskError.message}`);

  const cycleCountId = taskRow.id as number;

  const { data: stockRows, error: stockError } = await supabase
    .from('stock_level')
    .select('id, storage_location_id, sku, on_hand')
    .in('storage_location_id', storageLocationIds);

  if (stockError) throw new Error(`[logistic] createCycleCount stock error: ${stockError.message}`);

  if ((stockRows ?? []).length === 0) return cycleCountId;

  const { error: lineError } = await supabase.from('cycle_count_line').insert(
    (stockRows ?? []).map((s) => ({
      cycle_count_id: cycleCountId,
      stock_level_id: s.id,
      storage_location_id: s.storage_location_id,
      sku: s.sku,
      expected_quantity: s.on_hand,
      counted_quantity: null,
    })),
  );

  if (lineError) throw new Error(`[logistic] createCycleCount lines error: ${lineError.message}`);

  return cycleCountId;
}

export async function recordCycleCountLine(
  supabase: SupabaseClient,
  lineId: number,
  countedQuantity: number,
): Promise<void> {
  const { error } = await supabase
    .from('cycle_count_line')
    .update({ counted_quantity: countedQuantity })
    .eq('id', lineId);

  if (error) throw new Error(`[logistic] recordCycleCountLine error: ${error.message}`);
}

// Approves a cycle count: generates stock_adjustment for every line with variance.
export async function approveCycleCount(
  supabase: SupabaseClient,
  id: number,
  userAccountId: string,
): Promise<void> {
  const { data: lines, error: lineError } = await supabase
    .from('cycle_count_line')
    .select('id, stock_level_id, counted_quantity, expected_quantity')
    .eq('cycle_count_id', id)
    .not('counted_quantity', 'is', null);

  if (lineError) throw new Error(`[logistic] approveCycleCount lines error: ${lineError.message}`);

  for (const line of lines ?? []) {
    const delta = (line.counted_quantity as number) - (line.expected_quantity as number);
    if (delta !== 0) {
      await adjustStock(supabase, {
        stockLevelId: line.stock_level_id as number,
        delta,
        reason: 'cycle_count_variance',
        userAccountId,
        note: `Cycle count ${id} — line ${line.id}`,
      });
    }
  }

  const { error } = await supabase
    .from('cycle_count')
    .update({ status: 'complete' })
    .eq('id', id);

  if (error) throw new Error(`[logistic] approveCycleCount error: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Dashboard metrics
// ---------------------------------------------------------------------------

export async function getLogisticMetrics(supabase: SupabaseClient): Promise<{
  openPickTaskCount: number;
  pendingReceiptCount: number;
  openReturnCount: number;
  openCycleCountCount: number;
}> {
  const [pickTasks, receipts, returns, cycleCounts] = await Promise.all([
    supabase
      .from('pick_task')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']),
    supabase
      .from('inbound_receipt')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'partial']),
    supabase
      .from('return_authorization')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'received']),
    supabase
      .from('cycle_count')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']),
  ]);

  return {
    openPickTaskCount: pickTasks.count ?? 0,
    pendingReceiptCount: receipts.count ?? 0,
    openReturnCount: returns.count ?? 0,
    openCycleCountCount: cycleCounts.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Dictionary payload builder (for hermes client-side merge)
// ---------------------------------------------------------------------------

export function buildLogisticDictionaryPayload(
  items: Array<{ entityId: number; name: string; scope: string }>,
  locale: string,
): DictionaryPayload {
  return items.map((item) => ({
    link: { id: 0, slug: 'name', scope: item.scope, entityId: item.entityId },
    content: item.name,
    localeCode: locale,
  }));
}
