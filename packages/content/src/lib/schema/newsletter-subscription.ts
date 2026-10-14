import { pgTable, bigint, index, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { newsletter } from './newsletter.js';
import { subscriber } from './subscriber.js';

export const newsletterSubscription = pgTable(
  'newsletter_subscription',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    newsletterId: bigint('newsletter_id', { mode: 'number' })
      .notNull()
      .references(() => newsletter.id, { onDelete: 'cascade' }),
    subscriberId: bigint('subscriber_id', { mode: 'number' })
      .notNull()
      .references(() => subscriber.id, { onDelete: 'cascade' }),
    subscribedAt: timestamp('subscribed_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    uniqueIndex('uq_newsletter_subscription').on(table.newsletterId, table.subscriberId),
    index('idx_newsletter_subscription_newsletter').on(table.newsletterId),
    index('idx_newsletter_subscription_subscriber').on(table.subscriberId),
  ]
);

export type NewsletterSubscription = typeof newsletterSubscription.$inferSelect;
