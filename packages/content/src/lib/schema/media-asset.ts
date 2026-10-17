import { pgEnum, pgTable, bigint, index, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { MEDIA_ASSET_TYPES } from './media-asset-type.js';
import type { MediaAssetRights } from './media-asset-rights.js';
import type { MediaAssetSource } from './media-asset-source.js';
import type { MediaAssetLicense } from './media-asset-license.js';

export const mediaAssetType = pgEnum('media_asset_type', MEDIA_ASSET_TYPES);

export const mediaAsset = pgTable(
  'media_asset',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    mediaType: mediaAssetType('media_type').notNull(),
    storageKey: text('storage_key').notNull().unique(),
    width: integer('width'),
    height: integer('height'),
    mimeType: text('mime_type').notNull(),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_media_asset_user_account').on(table.userAccountId),
    index('idx_media_asset_type').on(table.mediaType),
  ]
);

export type MediaAsset = typeof mediaAsset.$inferSelect;

/**
 * The public face of an asset's rights and provenance — what a reader's page may know.
 *
 * media_asset_rights is admin-only, because expiry dates and credit obligations are licensing
 * terms nobody else needs, so the page cannot read it. This is the projection a public read
 * (the `media_asset_attribution` view) exposes: only for the licences that are meant to be
 * attributed in public (`creative_commons`, `public_domain`), and only the URLs.
 */
export type MediaAssetAttribution = {
  mediaAssetId: number;
  license: MediaAssetLicense;
  sourceUrl: string;
  licenseUrl: string | null;
};

export type MediaAssetWithCopy = MediaAsset & {
  altText: string;
  caption: string;
  credit: string;
  rights: MediaAssetRights | null;
  source: MediaAssetSource | null;
};
