// Declared once: the pgEnum in ./front-slot.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const FRONT_LAYOUT_VARIANTS = [
  'lead',
  'secondary',
  'river',
  'brief',
] as const;

export type FrontLayoutVariant = (typeof FRONT_LAYOUT_VARIANTS)[number];
