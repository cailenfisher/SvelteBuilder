import { pgEnum, pgTable, bigint, index, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { MEDIA_TYPES } from './media-type.js';
import type { MediaAssetRights } from './media-asset-rights.js';
import type { MediaAssetSource } from './media-asset-source.js';
import type { MediaLicense } from './media-license.js';

export const mediaType = pgEnum('media_type', MEDIA_TYPES);

export const mediaAsset = pgTable(
  'media_asset',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    mediaType: mediaType('media_type').notNull(),
    storageKey: text('storage_key').notNull().unique(),
    width: integer('width'),
    height: integer('height'),
    mimeType: text('mime_type').notNull(),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    uploadedBy: bigint('uploaded_by', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_media_asset_uploader').on(table.uploadedBy),
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
  license: MediaLicense;
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
