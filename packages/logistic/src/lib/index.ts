// Components — Camp 2 (entity-aware, import @sveltebuilder/hermes)
export { default as SupplierCard } from './components/SupplierCard.svelte';
export { default as StorageLocationPath } from './components/StorageLocationPath.svelte';
export { default as PickTaskCard } from './components/PickTaskCard.svelte';
export { default as ReceiptCard } from './components/ReceiptCard.svelte';

// Components — Camp 1 (i18n-agnostic, no hermes import)
export { default as PickTaskStatusBadge } from './components/PickTaskStatusBadge.svelte';
export { default as ShipmentStatusBadge } from './components/ShipmentStatusBadge.svelte';
export { default as ReturnConditionBadge } from './components/ReturnConditionBadge.svelte';
export { default as StockLevelBar } from './components/StockLevelBar.svelte';
export { default as BarcodeInput } from './components/BarcodeInput.svelte';
export { default as TrackingEventList } from './components/TrackingEventList.svelte';

// Types
export type {
  StorageLocation,
  StorageLocationType,
  StorageLocationWithCopy,
  Supplier,
  SupplierContact,
  SupplierWithCopy,
  StockLevel,
  StockLevelWithLocation,
  StockAdjustment,
  StockAdjustmentReason,
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
} from './schema/index.js';

// Enum values, declared once in modules that do not import drizzle-orm, so screens can use them
// at runtime for filters and validation.
export { STOCK_ADJUSTMENT_REASONS } from './schema/stock-adjustment-reason.js';
export { CYCLE_COUNT_STATUSES } from './schema/cycle-count-status.js';
export { INBOUND_RECEIPT_STATUSES } from './schema/inbound-receipt-status.js';
export { PICK_TASK_STATUSES } from './schema/pick-task-status.js';
export { RETURN_AUTHORIZATION_STATUSES } from './schema/return-authorization-status.js';
export { RETURN_CONDITIONS } from './schema/return-condition.js';
export { RETURN_DISPOSITIONS } from './schema/return-disposition.js';
export { SHIPMENT_STATUSES } from './schema/shipment-status.js';
export { STORAGE_LOCATION_TYPES } from './schema/storage-location-type.js';
