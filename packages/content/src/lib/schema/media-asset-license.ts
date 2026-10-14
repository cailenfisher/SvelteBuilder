// Declared once: the pgEnum in ./media-asset-rights.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const MEDIA_ASSET_LICENSES = [
  'all_rights_reserved',
  'rights_managed',
  'royalty_free',
  'creative_commons',
  'public_domain',
] as const;

export type MediaAssetLicense = (typeof MEDIA_ASSET_LICENSES)[number];
