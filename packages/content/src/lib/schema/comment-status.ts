// Declared once: the pgEnum in ./comment.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const COMMENT_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'flagged',
] as const;

export type CommentStatus = (typeof COMMENT_STATUSES)[number];
