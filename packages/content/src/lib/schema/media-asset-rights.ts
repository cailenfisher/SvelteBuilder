import { pgEnum, pgTable, bigint, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { MEDIA_LICENSES } from './media-license.js';
import { mediaAsset } from './media-asset.js';

export const mediaLicense = pgEnum('media_license', MEDIA_LICENSES);

export const mediaAssetRights = pgTable(
  'media_asset_rights',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    mediaAssetId: bigint('media_asset_id', { mode: 'number' })
      .notNull()
      .references(() => mediaAsset.id, { onDelete: 'cascade' }),
    license: mediaLicense('license').notNull().default('all_rights_reserved'),
    creditRequired: boolean('credit_required').notNull().default(true),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  // One rights row per asset. It is a unique index rather than a plain one so a write can be a
  // single `insert … on conflict (media_asset_id) do update` instead of update-then-insert.
  (table) => [uniqueIndex('uq_media_asset_rights_asset').on(table.mediaAssetId)]
);

export type MediaAssetRights = typeof mediaAssetRights.$inferSelect;
