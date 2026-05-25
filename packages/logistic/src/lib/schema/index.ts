// =============================================================================
// @sveltebuilder/logistic — TypeScript types
//
// i18n convention: entities with user-facing names carry NO name/label/title
// fields. Copy is linked via hermes (scope = table name, entity_id = bigint PK).
// Callers resolve via: localText('name', 'supplier', supplier.id)
//
// SCOPE DEVIATIONS (documented):
//   supplier_contact.name — a person's actual name, not editorial copy.
//     Stored as plain text (not translated). Same pattern as blog comment.body.
// =============================================================================

// ---------------------------------------------------------------------------
// Status / reason enums
// ---------------------------------------------------------------------------

export type StorageLocationType = 'warehouse' | 'zone' | 'aisle' | 'bin';

export type AdjustmentReason =
  | 'damage'
  | 'theft'
  | 'receiving_error'
  | 'cycle_count_variance'
  | 'system_correction'
  | 'other';

export type InboundReceiptStatus = 'pending' | 'partial' | 'complete' | 'cancelled';

export type PickTaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export type ShipmentStatus =
  | 'created'
  | 'packed'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'exception';

export type ReturnCondition = 'salable' | 'damaged' | 'defective' | 'wrong_item';

export type ReturnDisposition = 'restock' | 'quarantine' | 'scrap' | 'refurbish';

export type ReturnAuthorizationStatus = 'pending' | 'received' | 'processed' | 'cancelled';

export type CycleCountStatus = 'open' | 'in_progress' | 'complete' | 'cancelled';

// ---------------------------------------------------------------------------
// Base entities
// ---------------------------------------------------------------------------

export type StorageLocation = {
  id: number;
  slug: string;
  locationType: StorageLocationType;
  parentStorageLocationId: number | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
};

export type Supplier = {
  id: number;
  slug: string;
  leadTimeDay: number | null;
  active: boolean;
  createdAt: string;
};

// SCOPE DEVIATION: name is a person's actual name, not editorial copy.
export type SupplierContact = {
  id: number;
  supplierId: number;
  role: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export type StockLevel = {
  id: number;
  storageLocationId: number;
  sku: string;
  onHand: number;
  reserved: number;
  createdAt: string;
  updatedAt: string;
};

// Append-only audit log of every stock mutation.
export type StockAdjustment = {
  id: number;
  stockLevelId: number;
  userAccountId: string;
  delta: number;
  onHandBefore: number;
  onHandAfter: number;
  reason: AdjustmentReason;
  note: string | null;
  createdAt: string;
};

export type InboundReceipt = {
  id: number;
  supplierId: number;
  userAccountId: string;
  status: InboundReceiptStatus;
  expectedAt: string | null;
  receivedAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InboundReceiptLine = {
  id: number;
  inboundReceiptId: number;
  storageLocationId: number;
  sku: string;
  expectedQuantity: number;
  receivedQuantity: number;
  discrepancy: number;
  createdAt: string;
};

export type PickTask = {
  id: number;
  userAccountId: string | null;
  status: PickTaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type PickTaskLine = {
  id: number;
  pickTaskId: number;
  stockLevelId: number;
  storageLocationId: number;
  sku: string;
  requestedQuantity: number;
  pickedQuantity: number;
  createdAt: string;
};

export type Shipment = {
  id: number;
  userAccountId: string;
  status: ShipmentStatus;
  carrier: string | null;
  serviceLevel: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShipmentLine = {
  id: number;
  shipmentId: number;
  pickTaskLineId: number | null;
  sku: string;
  quantity: number;
  createdAt: string;
};

export type TrackingEvent = {
  id: number;
  shipmentId: number;
  status: string;
  eventLocation: string | null;
  description: string | null;
  occurredAt: string;
  createdAt: string;
};

export type ReturnAuthorization = {
  id: number;
  shipmentId: number | null;
  userAccountId: string;
  status: ReturnAuthorizationStatus;
  reason: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReturnAuthorizationLine = {
  id: number;
  returnAuthorizationId: number;
  shipmentLineId: number | null;
  sku: string;
  expectedQuantity: number;
  receivedQuantity: number;
  condition: ReturnCondition | null;
  disposition: ReturnDisposition | null;
  createdAt: string;
};

export type CycleCount = {
  id: number;
  userAccountId: string;
  status: CycleCountStatus;
  createdAt: string;
  updatedAt: string;
};

export type CycleCountLine = {
  id: number;
  cycleCountId: number;
  stockLevelId: number;
  storageLocationId: number;
  sku: string;
  expectedQuantity: number;
  countedQuantity: number | null;
  variance: number | null;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Enriched types — carry resolved copy alongside the base entity
// ---------------------------------------------------------------------------

export type StorageLocationWithCopy = StorageLocation & {
  name: string;
  ancestors: StorageLocationWithCopy[];
};

export type SupplierWithCopy = Supplier & {
  name: string;
  contacts: SupplierContact[];
};

// available is derived: on_hand - reserved (never stored in DB)
export type StockLevelWithLocation = StockLevel & {
  available: number;
  storageLocation: StorageLocationWithCopy;
};

export type InboundReceiptWithCopy = InboundReceipt & {
  supplier: SupplierWithCopy;
  lines: InboundReceiptLine[];
};

export type PickTaskWithLines = PickTask & {
  lines: Array<PickTaskLine & { storageLocation: StorageLocationWithCopy }>;
};

export type ShipmentWithEvents = Shipment & {
  lines: ShipmentLine[];
  trackingEvents: TrackingEvent[];
};

export type ReturnAuthorizationWithLines = ReturnAuthorization & {
  lines: ReturnAuthorizationLine[];
};

export type CycleCountWithLines = CycleCount & {
  lines: Array<CycleCountLine & { storageLocation: StorageLocationWithCopy }>;
};
