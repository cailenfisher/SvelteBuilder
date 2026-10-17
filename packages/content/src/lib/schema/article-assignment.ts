import { pgEnum, pgTable, bigint, index, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { ARTICLE_ASSIGNMENT_ROLES } from './article-assignment-role.js';
import { article } from './article.js';

export const articleAssignmentRole = pgEnum('article_assignment_role', ARTICLE_ASSIGNMENT_ROLES);

export const articleAssignment = pgTable(
  'article_assignment',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }).notNull(),
    role: articleAssignmentRole('role').notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    dueAt: timestamp('due_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    uniqueIndex('uq_article_assignment').on(table.articleId, table.userAccountId, table.role),
    index('idx_article_assignment_article').on(table.articleId),
    index('idx_article_assignment_user').on(table.userAccountId),
  ]
);

export type ArticleAssignment = typeof articleAssignment.$inferSelect;
