import { pgTable, bigint, boolean, index, text, timestamp } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { articleStatus } from './article-status.js';
import { mediaAsset } from './media-asset.js';
import type { ArticleBlock, ArticleBlockWithCopy } from './article-block.js';
import type { ArticleStatusWithCopy } from './article-status.js';
import type { AuthorProfile, AuthorProfileWithCopy } from './author-profile.js';
import type { Section, SectionWithCopy } from './section.js';
import type { TagWithCopy } from './tag.js';
import type { TopicWithCopy } from './topic.js';

export const article = pgTable(
  'article',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleStatusId: bigint('article_status_id', { mode: 'number' })
      .notNull()
      .references(() => articleStatus.id),
    canonicalSlug: text('canonical_slug').notNull().unique(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    embargoExpiresAt: timestamp('embargo_expires_at', { withTimezone: true, mode: 'string' }),
    commentAllowed: boolean('comment_allowed').notNull().default(true),
    // The image og:image, the JSON-LD image, the article page's hero and its cards lead with.
    // Null means "the first image block", the rule that applied before this column existed —
    // see selectLeadMediaAssetId in publishing/lead-image.ts. Set null on delete so removing an
    // asset falls back to that rule rather than blocking the delete.
    leadMediaAssetId: bigint('lead_media_asset_id', { mode: 'number' }).references(
      (): AnyPgColumn => mediaAsset.id,
      { onDelete: 'set null' }
    ),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_article_lead_media').on(table.leadMediaAssetId),
    index('idx_article_status').on(table.articleStatusId),
    index('idx_article_canonical_slug').on(table.canonicalSlug),
    index('idx_article_embargo').on(table.embargoExpiresAt),
  ]
);

export type Article = typeof article.$inferSelect;

/**
 * An article plus the relations that identify it — enough for a feed entry, a sitemap row or a
 * card. No copy: a byline's name and a section's name are resolved from the dictionary by
 * entity id, the same as a headline.
 */
export type ArticleWithRelations = Article & {
  bylines: AuthorProfile[];
  sections: Section[];
};

/**
 * The least an article has to be for `ArticleView` to render it.
 *
 * Narrower than ArticleWithCopy on purpose. ArticleView is a Camp 2 component: it resolves
 * the headline, the dek and every block's text from the dictionary itself, by entity id, so
 * the resolved strings on ArticleWithCopy are fields it never reads. Typing the prop as the
 * enriched shape demanded them anyway, which made the component unusable from a loader that
 * ships a copy payload instead of baking strings into rows — the direction every module moved
 * when the query layers were removed.
 *
 * Any ArticleWithCopy still satisfies this, so narrowing breaks no existing caller.
 */
export type ArticleRenderable = ArticleWithRelations & {
  blocks: ArticleBlock[];
};

export type ArticleWithCopy = Article & {
  headline: string;
  dek: string;
  status: ArticleStatusWithCopy;
  blocks: ArticleBlockWithCopy[];
  bylines: AuthorProfileWithCopy[];
  sections: SectionWithCopy[];
  topics: TopicWithCopy[];
  tags: TagWithCopy[];
};
