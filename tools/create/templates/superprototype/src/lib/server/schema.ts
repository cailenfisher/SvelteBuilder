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
  uuid,
} from 'drizzle-orm/pg-core';
import { localTextLink } from '@sveltebuilder/hermes-schema/schema';

// Reference Supabase's auth schema for the user_account FK
const authSchema = pgSchema('auth');
const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

export const userAccount = pgTable(
  'user_account',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    displayName: text('display_name').notNull(),
    emailAddress: text('email_address').notNull(),
    active: boolean('active').notNull().default(true),
  },
  (table) => [
    uniqueIndex('uq_user_account_email').on(table.emailAddress),
    index('idx_user_account_email').on(table.emailAddress),
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
