import { sql } from 'drizzle-orm';
import { pgTable, bigint, check, index, integer, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { role } from './role.js';
import { userGroup } from './user-group.js';

/**
 * A role given to one principal (a user or a group) everywhere, or on every row of one scope.
 * A null `scope` is a global assignment (A8). Assignments on a single row live in a table
 * generated per access-controlled entity (`article_role_assignment`), with a real foreign key
 * to that row (A7).
 *
 * An assignment past `expires_at` grants nothing (A15).
 */
export const roleAssignment = pgTable(
  'role_assignment',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    roleId: integer('role_id')
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
    // FK to user_account(id) — cross-package ref added via supplemental SQL (01-access.sql)
    userAccountId: bigint('user_account_id', { mode: 'number' }),
    userGroupId: integer('user_group_id').references(() => userGroup.id, { onDelete: 'cascade' }),
    scope: text('scope'),
    // FK to user_account(id), on delete set null — added via supplemental SQL (01-access.sql)
    grantedBy: bigint('granted_by', { mode: 'number' }),
    grantedAt: timestamp('granted_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    check(
      'role_assignment_one_principal',
      sql`num_nonnulls(${table.userAccountId}, ${table.userGroupId}) = 1`
    ),
    // NULLS NOT DISTINCT for the reason local_text_link gives: a global assignment to a user
    // has two nulls in the key (scope and user_group_id), and a plain unique constraint would
    // not constrain it at all.
    unique('uq_role_assignment_role_scope_principal')
      .on(table.roleId, table.scope, table.userAccountId, table.userGroupId)
      .nullsNotDistinct(),
    index('idx_role_assignment_user_account_id').on(table.userAccountId),
    index('idx_role_assignment_user_group_id').on(table.userGroupId),
  ]
);

export type RoleAssignment = typeof roleAssignment.$inferSelect;
