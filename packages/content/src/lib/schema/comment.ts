import { pgEnum, pgTable, bigint, index, text, timestamp } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { COMMENT_STATUSES } from './comment-status.js';
import { article } from './article.js';

export const commentStatus = pgEnum('comment_status', COMMENT_STATUSES);

export const comment = pgTable(
  'comment',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }),
    parentCommentId: bigint('parent_comment_id', { mode: 'number' }).references(
      (): AnyPgColumn => comment.id,
      { onDelete: 'cascade' }
    ),
    // SCOPE DEVIATION: user-generated runtime data, not dictionary copy
    authorName: text('author_name').notNull(),
    authorEmail: text('author_email').notNull(),
    body: text('body').notNull(),
    status: commentStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_comment_article').on(table.articleId, table.createdAt),
    index('idx_comment_parent').on(table.parentCommentId),
    index('idx_comment_status').on(table.articleId, table.status),
    index('idx_comment_user').on(table.userAccountId),
  ]
);

export type Comment = typeof comment.$inferSelect;

export type CommentWithReplies = Comment & {
  replies: CommentWithReplies[];
};
