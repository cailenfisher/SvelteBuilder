import { pgTable, bigint, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { mediaAsset } from './media-asset.js';

// Where an asset came from, and the licence text it was published under. `license` on
// media_asset_rights says only the kind — creative_commons cannot tell CC BY 4.0 from
// CC BY-SA 2.0 — and correct attribution needs both the licence's own URL and the page the
// image was taken from. URLs and a retrieval date, not copy: nothing here is translated.
export const mediaAssetSource = pgTable(
  'media_asset_source',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    mediaAssetId: bigint('media_asset_id', { mode: 'number' })
      .notNull()
      .references(() => mediaAsset.id, { onDelete: 'cascade' }),
    sourceUrl: text('source_url').notNull(),
    licenseUrl: text('license_url'),
    retrievedAt: timestamp('retrieved_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('uq_media_asset_source_asset').on(table.mediaAssetId)]
);

export type MediaAssetSource = typeof mediaAssetSource.$inferSelect;
