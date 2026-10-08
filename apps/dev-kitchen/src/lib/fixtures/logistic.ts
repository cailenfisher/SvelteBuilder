/**
 * Fixtures for the @sveltebuilder/logistic showcase, typed against the package's exports
 * for the same reason as fixtures/content.ts. Entity names and module UI copy come through
 * a dictionary built from `COPY`, whose module-scoped strings mirror
 * tools/create/templates/modules/logistic/seed/seed.sql.
 */
import { createDictionary, type DictionaryInstance, type DictionaryPayload } from 'diglossia';
import type {
  InboundReceipt,
  InboundReceiptLine,
  PickTask,
  PickTaskLine,
  StorageLocation,
  Supplier,
  SupplierContact,
  TrackingEvent,
} from '@sveltebuilder/logistic';

const CREATED_AT = '2026-09-01T08:00:00.000Z';

export const SUPPLIERS = [
  { id: 1, slug: 'acme-freight', leadTimeDay: 5, active: true, createdAt: CREATED_AT },
  { id: 2, slug: 'northern-fasteners', leadTimeDay: null, active: false, createdAt: CREATED_AT },
] satisfies Supplier[];

export const CONTACTS: SupplierContact[] = [
  { id: 1, supplierId: 1, role: 'Account manager', name: 'Marie Curie', email: 'marie@acme.example', phone: '+33 1 23 45 67 89', createdAt: CREATED_AT },
  { id: 2, supplierId: 1, role: 'Dispatch', name: 'Kenji Sato', email: null, phone: '+81 3 1234 5678', createdAt: CREATED_AT },
];

const location = (
  id: number,
  slug: string,
  locationType: StorageLocation['locationType'],
  parentStorageLocationId: number | null,
  sortOrder: number
): StorageLocation => ({ id, slug, locationType, parentStorageLocationId, active: true, sortOrder, createdAt: CREATED_AT });

export const LOCATIONS = [
  location(1, 'wh-north', 'warehouse', null, 1),
  location(2, 'zone-a', 'zone', 1, 1),
  location(3, 'aisle-04', 'aisle', 2, 4),
  location(4, 'bin-a-04-2', 'bin', 3, 2),
  location(5, 'bin-a-04-3', 'bin', 3, 3),
];

export const [WAREHOUSE, ZONE, AISLE, BIN, NEXT_BIN] = LOCATIONS;

const task = (id: number, status: PickTask['status']): PickTask => ({
  id,
  userAccountId: 1,
  status,
  createdAt: '2026-10-06T07:00:00.000Z',
  updatedAt: '2026-10-06T07:30:00.000Z',
});

export const PICK_TASKS = [task(91, 'open'), task(92, 'in_progress'), task(93, 'completed'), task(94, 'cancelled')];

const line = (id: number, storageLocation: StorageLocation, sku: string, requested: number, picked: number): PickTaskLine & { storageLocation: StorageLocation } => ({
  id,
  pickTaskId: 92,
  stockLevelId: id,
  storageLocationId: storageLocation.id,
  sku,
  requestedQuantity: requested,
  pickedQuantity: picked,
  sequence: id,
  createdAt: CREATED_AT,
  storageLocation,
});

export const PICK_LINES = [line(1, BIN, 'BOLT-M8', 120, 120), line(2, NEXT_BIN, 'NUT-M8', 240, 96)];

const receipt = (
  id: number,
  supplierId: number | null,
  status: InboundReceipt['status'],
  receivedAt: string | null
): InboundReceipt => ({
  id,
  supplierId,
  userAccountId: 1,
  status,
  expectedAt: '2026-10-07T09:00:00.000Z',
  receivedAt,
  note: null,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
});

export const RECEIPTS = [
  receipt(41, 1, 'partial', '2026-10-07T09:40:00.000Z'),
  receipt(42, 1, 'pending', null),
  receipt(43, null, 'complete', '2026-10-06T15:10:00.000Z'),
];

export const RECEIPT_LINES: InboundReceiptLine[] = [
  { id: 1, inboundReceiptId: 41, storageLocationId: BIN.id, sku: 'BOLT-M8', expectedQuantity: 500, receivedQuantity: 500, discrepancy: 0, createdAt: CREATED_AT },
  { id: 2, inboundReceiptId: 41, storageLocationId: NEXT_BIN.id, sku: 'NUT-M8', expectedQuantity: 500, receivedQuantity: 460, discrepancy: -40, createdAt: CREATED_AT },
];

export const TRACKING_EVENTS: TrackingEvent[] = [
  { id: 3, shipmentId: 4182, status: 'delivered', eventLocation: 'Lyon', description: 'Delivered to reception', occurredAt: '2026-10-07T11:20:00.000Z', createdAt: CREATED_AT },
  { id: 2, shipmentId: 4182, status: 'in_transit', eventLocation: 'Paris hub', description: null, occurredAt: '2026-10-06T22:05:00.000Z', createdAt: CREATED_AT },
  { id: 1, shipmentId: 4182, status: 'dispatched', eventLocation: null, description: 'Collected by carrier', occurredAt: '2026-10-06T16:40:00.000Z', createdAt: CREATED_AT },
];

type CopyRow = [string, string, number | null, string];

const COPY: CopyRow[] = [
  ['name', 'supplier', 1, 'Acme Freight'],
  ['name', 'supplier', 2, 'Northern Fasteners'],
  ['name', 'storage_location', 1, 'North warehouse'],
  ['name', 'storage_location', 2, 'Zone A'],
  ['name', 'storage_location', 3, 'Aisle 04'],
  ['name', 'storage_location', 4, 'Bin A-04-2'],
  ['name', 'storage_location', 5, 'Bin A-04-3'],
  ['logistic.inbound_receipt.status.pending', 'logistic', null, 'Pending'],
  ['logistic.inbound_receipt.status.partial', 'logistic', null, 'Partial'],
  ['logistic.inbound_receipt.status.complete', 'logistic', null, 'Complete'],
  ['logistic.inbound_receipt.status.cancelled', 'logistic', null, 'Cancelled'],
  ['logistic.inbound_receipt.blind', 'logistic', null, 'Blind receipt'],
  ['logistic.pick_task.status.open', 'logistic', null, 'Open'],
  ['logistic.pick_task.status.in_progress', 'logistic', null, 'In progress'],
  ['logistic.pick_task.status.completed', 'logistic', null, 'Completed'],
  ['logistic.pick_task.status.cancelled', 'logistic', null, 'Cancelled'],
];

const COPY_PAYLOAD: DictionaryPayload = COPY.map(([slug, scope, entityId, content], index) => ({
  link: { id: index + 1, slug, scope, entityId },
  content,
  localeCode: 'en',
}));

/** A fresh dictionary per call; pass it as the `dictionary` prop. */
export function logisticDictionary(): DictionaryInstance {
  return createDictionary(COPY_PAYLOAD);
}
