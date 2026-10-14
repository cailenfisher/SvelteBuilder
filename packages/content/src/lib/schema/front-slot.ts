import { pgEnum, pgTable, bigint, index, integer, timestamp } from 'drizzle-orm/pg-core';
import { FRONT_LAYOUT_VARIANTS } from './front-layout-variant.js';
import { article } from './article.js';
import { front } from './front.js';
import type { ArticleWithCopy } from './article.js';

export const frontLayoutVariant = pgEnum('front_layout_variant', FRONT_LAYOUT_VARIANTS);

export const frontSlot = pgTable(
  'front_slot',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    frontId: bigint('front_id', { mode: 'number' })
      .notNull()
      .references(() => front.id, { onDelete: 'cascade' }),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    layoutVariant: frontLayoutVariant('layout_variant').notNull().default('river'),
    pinnedUntil: timestamp('pinned_until', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_front_slot_front').on(table.frontId, table.position),
    index('idx_front_slot_article').on(table.articleId),
    index('idx_front_slot_pinned').on(table.pinnedUntil),
  ]
);

export type FrontSlot = typeof frontSlot.$inferSelect;

export type FrontSlotWithArticle = FrontSlot & {
  article: ArticleWithCopy;
  overrideHeadline: string;
};
