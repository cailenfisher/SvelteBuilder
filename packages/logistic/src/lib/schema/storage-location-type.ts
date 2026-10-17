// Declared once: the pgEnum in ./storage-location.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const STORAGE_LOCATION_TYPES = [
  'warehouse', 'zone', 'aisle', 'bin',
] as const;

export type StorageLocationType = (typeof STORAGE_LOCATION_TYPES)[number];
