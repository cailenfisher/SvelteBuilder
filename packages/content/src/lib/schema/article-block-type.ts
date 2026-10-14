// Declared once: the pgEnum in ./article-block.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const ARTICLE_BLOCK_TYPES = [
  'paragraph',
  'heading',
  'image',
  'gallery',
  'video',
  'embed',
  'pullquote',
  'live_update',
] as const;

export type ArticleBlockType = (typeof ARTICLE_BLOCK_TYPES)[number];
