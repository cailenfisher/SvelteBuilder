// Declared once: the pgEnum in ./media-asset.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const MEDIA_TYPES = ['image', 'video', 'audio', 'document'] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];
