import { pgTable, index, integer, primaryKey } from 'drizzle-orm/pg-core';
import { permission } from './permission.js';
import { role } from './role.js';

export const rolePermission = pgTable(
  'role_permission',
  {
    roleId: integer('role_id')
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
    permissionId: integer('permission_id')
      .notNull()
      .references(() => permission.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index('idx_role_permission_permission_id').on(table.permissionId),
  ]
);

export type RolePermission = typeof rolePermission.$inferSelect;
