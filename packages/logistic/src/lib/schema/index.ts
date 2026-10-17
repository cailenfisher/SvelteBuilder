// =============================================================================
// @sveltebuilder/logistic — TypeScript types
//
// i18n convention: entities with user-facing names carry NO name/label/title
// fields. Copy is linked via diglossia (scope = table name, entity_id = bigint PK).
// Callers resolve via: localText('name', 'supplier', supplier.id)
//
// SCOPE DEVIATIONS (documented):
//   supplier_contact.name — a person's actual name, not editorial copy.
//     Stored as plain text (not translated). Same pattern as blog comment.body.
//
// One module per concept: each table with its pgEnums and inferred types, and each enum's
// values in a module of their own. See CLAUDE.md, "Schema file layout".
// =============================================================================
export * from './cycle-count-line.js';
export * from './cycle-count-status.js';
export * from './cycle-count.js';
export * from './inbound-receipt-line.js';
export * from './inbound-receipt-status.js';
export * from './inbound-receipt.js';
export * from './pick-task-line.js';
export * from './pick-task-status.js';
export * from './pick-task.js';
export * from './return-authorization-line.js';
export * from './return-authorization-status.js';
export * from './return-authorization.js';
export * from './return-condition.js';
export * from './return-disposition.js';
export * from './shipment-line.js';
export * from './shipment-status.js';
export * from './shipment.js';
export * from './stock-adjustment-reason.js';
export * from './stock-adjustment.js';
export * from './stock-level.js';
export * from './storage-location-type.js';
export * from './storage-location.js';
export * from './supplier-contact.js';
export * from './supplier.js';
export * from './tracking-event.js';
