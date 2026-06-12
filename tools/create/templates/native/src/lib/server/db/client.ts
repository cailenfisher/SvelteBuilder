// Raw Drizzle database client.
//
// IMPORTANT: Route code, load functions, and form actions must NOT import this
// directly. Use event.locals.db.withUser(...) instead — it opens a transaction,
// sets app.current_user_id, and ensures every query is user-scoped.
//
// Deliberate exceptions that may import db directly:
//   - src/lib/server/auth-resolver.ts  (bootstrap lookup before user context exists)
//   - src/hooks.server.ts              (locale query — public data, no RLS needed)
//   - Migration scripts and seed runners (no request context)

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '$env/static/private';

const client = postgres(DATABASE_URL);

export const db = drizzle(client);
