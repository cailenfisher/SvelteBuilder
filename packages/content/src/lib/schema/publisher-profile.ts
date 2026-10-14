import { pgTable, bigint, index, text, timestamp } from 'drizzle-orm/pg-core';
import { mediaAsset } from './media-asset.js';
import type { MediaAssetWithCopy } from './media-asset.js';

export const publisherProfile = pgTable(
  'publisher_profile',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    logoMediaAssetId: bigint('logo_media_asset_id', { mode: 'number' }).references(
      () => mediaAsset.id,
      { onDelete: 'set null' }
    ),
    url: text('url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [index('idx_publisher_profile_logo').on(table.logoMediaAssetId)]
);

export type PublisherProfile = typeof publisherProfile.$inferSelect;

export type PublisherProfileWithCopy = PublisherProfile & {
  name: string;
  logo: MediaAssetWithCopy | null;
};
