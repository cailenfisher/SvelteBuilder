import { pgTable, bigint, index, text, timestamp } from 'drizzle-orm/pg-core';

export const subscriber = pgTable(
  'subscriber',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    // SCOPE DEVIATION: email_address is PII/runtime data, not translated copy
    emailAddress: text('email_address').notNull().unique(),
    // FK to locale(id) — cross-package ref added via supplemental SQL
    localeId: bigint('locale_id', { mode: 'number' }).notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_subscriber_email').on(table.emailAddress),
    index('idx_subscriber_confirmed').on(table.confirmedAt),
  ]
);

export type Subscriber = typeof subscriber.$inferSelect;

/** A subscriber with the code of the locale they chose, for listing. */
export type SubscriberWithLocale = Subscriber & {
  localeCode: string;
};
