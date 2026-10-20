import { pgTable, integer, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * A named bundle of permissions. Its name and description are copy, linked under the `role`
 * scope (A16), so the table carries none.
 *
 * A non-null `slug` marks a role seeded by a module. Its permissions cannot be changed, so a
 * re-run seed never undoes an admin's edit; an admin clones it to customize it (O6). An
 * admin-created role has no slug.
 *
 * Code checks permissions, never roles: no policy or loader compares a slug (A3).
 */
export const role = pgTable('role', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  slug: text('slug').unique(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
});

export type Role = typeof role.$inferSelect;
