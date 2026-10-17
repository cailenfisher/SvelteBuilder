import { pgTable, bigint, index, integer, primaryKey, timestamp } from 'drizzle-orm/pg-core';
import { userGroup } from './user-group.js';

export const userGroupMember = pgTable(
  'user_group_member',
  {
    userGroupId: integer('user_group_id')
      .notNull()
      .references(() => userGroup.id, { onDelete: 'cascade' }),
    // FK to user_account(id) — cross-package ref added via supplemental SQL (01-access.sql)
    userAccountId: bigint('user_account_id', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userGroupId, table.userAccountId] }),
    index('idx_user_group_member_user_account_id').on(table.userAccountId),
  ]
);

export type UserGroupMember = typeof userGroupMember.$inferSelect;
