// Drizzle table definitions for the Auth.js adapter, scoped to the `auth` schema.
//
// Auth.js expects snake_case column names in the database. We achieve this by
// passing the snake_case column name as the first argument to each column
// constructor while keeping camelCase property names for TypeScript ergonomics.
//
// Table names are singular per Auth.js adapter conventions (which happen to align
// with SvelteBuilder's singular table convention).
//
// These tables are managed by @auth/drizzle-adapter — do not add application
// columns here. Domain data lives in public.user_account.

import {
  pgSchema,
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';

const authSchema = pgSchema('auth');

export const authUser = authSchema.table('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
});

export const authAccount = authSchema.table(
  'account',
  {
    userId: text('user_id')
      .notNull()
      .references(() => authUser.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
);

export const authSession = authSchema.table('session', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => authUser.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const authVerificationToken = authSchema.table(
  'verification_token',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);
