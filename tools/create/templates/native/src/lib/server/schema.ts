import {
  pgSchema,
  pgTable,
  bigint,
  boolean,
  index,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { localTextLink } from '@sveltebuilder/hermes-schema/schema';

// Reference auth.user for the FK. Auth.js manages this table.
const authSchema = pgSchema('auth');
const authUser = authSchema.table('user', {
  id: text('id').primaryKey(),
});

// ── Domain principal ──────────────────────────────────────────────────────────
//
// user_account is the domain principal. Its bigint PK is the identity used
// everywhere in public.*, including local_text_link.entity_id.
//
// auth_user_id links to auth.user.id (managed by Auth.js). It is text to match
// Auth.js's string PK convention. On first sign-in, Auth.js creates auth.user
// and then the events.createUser callback provisions this row.

export const userAccount = pgTable(
  'user_account',
  {
    id: bigint('id', { mode: 'bigint' }).generatedAlwaysAsIdentity().primaryKey(),
    authUserId: text('auth_user_id')
      .notNull()
      .unique()
      .references(() => authUser.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
    active: boolean('active').notNull().default(true),
    admin: boolean('admin').notNull().default(false),
  },
  (table) => [
    index('idx_user_account_auth_user_id').on(table.authUserId),
  ],
);

export const navigationItem = pgTable(
  'navigation_item',
  {
    id: bigint('id', { mode: 'number' }).generatedByDefaultAsIdentity().primaryKey(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    localTextLinkId: bigint('local_text_link_id', { mode: 'number' })
      .notNull()
      .references(() => localTextLink.id),
    href: text('href').notNull(),
    scope: text('scope').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
  },
  (table) => [
    uniqueIndex('uq_navigation_item_href_scope').on(table.href, table.scope),
  ],
);

export type UserAccount = typeof userAccount.$inferSelect;
export type NewUserAccount = typeof userAccount.$inferInsert;
export type NavigationItem = typeof navigationItem.$inferSelect;
export type NewNavigationItem = typeof navigationItem.$inferInsert;
