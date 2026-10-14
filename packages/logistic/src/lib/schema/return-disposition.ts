// Declared once: the pgEnum in ./return-authorization-line.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const RETURN_DISPOSITIONS = [
  'restock', 'quarantine', 'scrap', 'refurbish',
] as const;

export type ReturnDisposition = (typeof RETURN_DISPOSITIONS)[number];
