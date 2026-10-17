// Declared once: the pgEnum in ./shipment.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const SHIPMENT_STATUSES = [
  'created', 'packed', 'dispatched', 'in_transit', 'delivered', 'exception',
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];
