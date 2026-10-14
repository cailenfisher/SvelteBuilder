// Declared once: the pgEnum in ./return-authorization.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const RETURN_AUTHORIZATION_STATUSES = [
  'pending', 'received', 'processed', 'cancelled',
] as const;

export type ReturnAuthorizationStatus = (typeof RETURN_AUTHORIZATION_STATUSES)[number];
