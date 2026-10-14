// Declared once: the pgEnum in ./inbound-receipt.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const INBOUND_RECEIPT_STATUSES = [
  'pending', 'partial', 'complete', 'cancelled',
] as const;

export type InboundReceiptStatus = (typeof INBOUND_RECEIPT_STATUSES)[number];
