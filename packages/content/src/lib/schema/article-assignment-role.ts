// Declared once: the pgEnum in ./article-assignment.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const ARTICLE_ASSIGNMENT_ROLES = [
  'author',
  'editor',
  'photo',
  'copy',
] as const;

export type ArticleAssignmentRole = (typeof ARTICLE_ASSIGNMENT_ROLES)[number];
