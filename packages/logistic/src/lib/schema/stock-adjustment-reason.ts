// Declared once: the pgEnum in ./stock-adjustment.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const STOCK_ADJUSTMENT_REASONS = [
  'damage', 'theft', 'receiving_error', 'cycle_count_variance', 'system_correction', 'other',
  'inbound_receipt', 'pick', 'return_restock',
] as const;

export type StockAdjustmentReason = (typeof STOCK_ADJUSTMENT_REASONS)[number];
