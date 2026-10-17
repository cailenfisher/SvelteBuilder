// Declared once: the pgEnum in ./pick-task.ts and the type below are both built
// from this list. Safe to import at runtime, since this module does not import drizzle-orm.
export const PICK_TASK_STATUSES = [
  'open', 'in_progress', 'completed', 'cancelled',
] as const;

export type PickTaskStatus = (typeof PICK_TASK_STATUSES)[number];
