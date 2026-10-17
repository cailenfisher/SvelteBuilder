import { pgTable, integer, text, unique } from 'drizzle-orm/pg-core';

/**
 * One row per (scope, action): `article.update` is ('article', 'update').
 *
 * The catalog is written by `sveltebuilder sync:supabase` from each module's registry
 * manifest, into the generated supplemental SQL rather than the seed, because the
 * role_assignment triggers and every seeded role depend on it and `supabase db push` never
 * runs the seed (A11). The application never writes it.
 *
 * `scope` is the entity type's table name, which is also its local-text scope. An
 * infrastructure table that addresses entities across types carries it, as local_text_link
 * does; a domain entity never carries its own (A8, guardrail 6).
 */
export const permission = pgTable(
  'permission',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    scope: text('scope').notNull(),
    action: text('action').notNull(),
  },
  (table) => [unique('uq_permission_scope_action').on(table.scope, table.action)]
);

export type Permission = typeof permission.$inferSelect;
