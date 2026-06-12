import { sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import { db } from './client';

// UserScopedDb is the only DB handle exposed to route code via event.locals.db.
// Every call opens a transaction, sets the session variable read by
// public.current_user_id(), runs the callback, and commits.
//
// Keep callbacks bounded to logically atomic DB work. Do NOT include external
// API calls, file I/O, or other non-DB operations inside a withUser callback —
// those extend the transaction duration unnecessarily. If a route needs:
//   DB → external API → DB
// use two separate withUser calls with the external work between them.

export type UserScopedDb = {
  withUser: <T>(fn: (tx: PgTransaction<any, any, any>) => Promise<T>) => Promise<T>;
};

export function createUserScopedDb(userAccountId: bigint | null): UserScopedDb {
  return {
    withUser: async (fn) => {
      return db.transaction(async (tx) => {
        if (userAccountId !== null) {
          await tx.execute(
            sql`select set_config('app.current_user_id', ${String(userAccountId)}, true)`,
          );
        }
        return fn(tx);
      });
    },
  };
}
