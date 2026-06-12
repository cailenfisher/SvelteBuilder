import {
  pgEnum,
  pgTable,
  bigint,
  boolean,
  index,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const postStatus = pgEnum('post_status', ['draft', 'review', 'published', 'archived']);

export const post = pgTable(
  'post',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull().unique(),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'bigint' }).notNull(),
    status: postStatus('status').notNull().default('draft'),
    featured: boolean('featured').notNull().default(false),
    allowComment: boolean('allow_comment').notNull().default(true),
    readingTimeMinute: integer('reading_time_minute'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_post_slug').on(table.slug),
    index('idx_post_status_published').on(table.status, table.publishedAt),
    index('idx_post_user_account').on(table.userAccountId),
  ],
);

export const postCategory = pgTable(
  'post_category',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull().unique(),
    active: boolean('active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
);

export const postTag = pgTable(
  'post_tag',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull().unique(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
);

export const postCategoryPost = pgTable(
  'post_category_post',
  {
    postCategoryId: bigint('post_category_id', { mode: 'number' })
      .notNull()
      .references(() => postCategory.id, { onDelete: 'cascade' }),
    postId: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => post.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('idx_post_category_post_post').on(table.postId),
  ],
);

export const postPostTag = pgTable(
  'post_post_tag',
  {
    postId: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => post.id, { onDelete: 'cascade' }),
    postTagId: bigint('post_tag_id', { mode: 'number' })
      .notNull()
      .references(() => postTag.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('idx_post_post_tag_post').on(table.postId),
  ],
);

export const comment = pgTable(
  'comment',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    postId: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => post.id, { onDelete: 'cascade' }),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'bigint' }),
    // Self-referential FK
    parentCommentId: bigint('parent_comment_id', { mode: 'number' }).references(
      (): AnyPgColumn => comment.id,
      { onDelete: 'cascade' },
    ),
    body: text('body').notNull(),
    approved: boolean('approved').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_comment_post').on(table.postId, table.createdAt),
    index('idx_comment_parent').on(table.parentCommentId),
  ],
);

export type Post = typeof post.$inferSelect;
export type NewPost = typeof post.$inferInsert;
export type PostCategory = typeof postCategory.$inferSelect;
export type NewPostCategory = typeof postCategory.$inferInsert;
export type PostTag = typeof postTag.$inferSelect;
export type NewPostTag = typeof postTag.$inferInsert;
export type Comment = typeof comment.$inferSelect;
export type NewComment = typeof comment.$inferInsert;
