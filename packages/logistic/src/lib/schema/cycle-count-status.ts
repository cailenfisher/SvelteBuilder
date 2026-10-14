// Declared once: the pgEnum in ./cycle-count.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const CYCLE_COUNT_STATUSES = [
  'open', 'in_progress', 'completed', 'cancelled',
] as const;

export type CycleCountStatus = (typeof CYCLE_COUNT_STATUSES)[number];
