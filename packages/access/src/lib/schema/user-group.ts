import { pgTable, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * A set of users who hold whatever the group holds. Its name is copy, under the `user_group`
 * scope (A16). Groups do not contain groups (A9).
 *
 * An `external` group stands for an outside organization (a carrier, a partner newsroom). It
 * can be assigned roles on single rows only; a trigger refuses a global or scope assignment
 * to it (A10).
 */
export const userGroup = pgTable('user_group', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  external: boolean('external').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
});

export type UserGroup = typeof userGroup.$inferSelect;
