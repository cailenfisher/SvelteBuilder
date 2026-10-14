import { pgEnum, pgTable, bigint, index, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ARTICLE_BLOCK_TYPES } from './article-block-type.js';
import { article } from './article.js';
import { mediaAsset } from './media-asset.js';
import type { MediaAssetWithCopy } from './media-asset.js';

export const articleBlockType = pgEnum('article_block_type', ARTICLE_BLOCK_TYPES);

export type ParagraphBlockContent = Record<string, never>;

export type HeadingBlockContent = { level: 2 | 3 | 4 };

export type ImageBlockContent = { altOverride: boolean };

export type GalleryBlockContent = {
  layout: 'grid' | 'carousel';
  captionPosition: 'below' | 'overlay';
};

export type VideoBlockContent = {
  provider: 'youtube' | 'vimeo' | 'self';
  aspect: '16/9' | '4/3';
};

export type EmbedBlockContent = {
  provider: string;
  url: string;
  aspect?: string;
};

export type PullquoteBlockContent = Record<string, never>;

export type LiveUpdateBlockContent = Record<string, never>;

export type ArticleBlockContent =
  | ParagraphBlockContent
  | HeadingBlockContent
  | ImageBlockContent
  | GalleryBlockContent
  | VideoBlockContent
  | EmbedBlockContent
  | PullquoteBlockContent
  | LiveUpdateBlockContent;

export const articleBlock = pgTable(
  'article_block',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    blockType: articleBlockType('block_type').notNull(),
    position: integer('position').notNull(),
    content: jsonb('content').$type<ArticleBlockContent>().notNull().default(sql`'{}'`),
    mediaAssetId: bigint('media_asset_id', { mode: 'number' }).references(() => mediaAsset.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_article_block_article').on(table.articleId, table.position),
    index('idx_article_block_media').on(table.mediaAssetId),
  ]
);

export type ArticleBlock = typeof articleBlock.$inferSelect;

export type ArticleBlockWithCopy = ArticleBlock & {
  text: string;
  mediaAsset: MediaAssetWithCopy | null;
};
