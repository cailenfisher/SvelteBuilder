import {
  pgEnum,
  pgTable,
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

// ── Enums ────────────────────────────────────────────────────────────────────

export const articleBlockType = pgEnum('article_block_type', [
  'paragraph', 'heading', 'image', 'gallery', 'video', 'embed', 'pullquote', 'live_update',
]);

export const articleAssignmentRole = pgEnum('article_assignment_role', [
  'author', 'editor', 'photo', 'copy',
]);

export const mediaType = pgEnum('media_type', [
  'image', 'video', 'audio', 'document',
]);

export const mediaLicense = pgEnum('media_license', [
  'all_rights_reserved', 'rights_managed', 'royalty_free', 'creative_commons', 'public_domain',
]);

export const frontLayoutVariant = pgEnum('front_layout_variant', [
  'lead', 'secondary', 'river', 'brief',
]);

export const commentStatus = pgEnum('comment_status', [
  'pending', 'approved', 'rejected', 'flagged',
]);

// ── Tables ───────────────────────────────────────────────────────────────────

export const articleStatus = pgTable(
  'article_status',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull().unique(),
    ordinal: integer('ordinal').notNull().default(0),
  },
  (table) => [
    index('idx_article_status_ordinal').on(table.ordinal),
  ],
);

export const article = pgTable(
  'article',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleStatusId: bigint('article_status_id', { mode: 'number' })
      .notNull()
      .references(() => articleStatus.id),
    canonicalSlug: text('canonical_slug').notNull().unique(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    embargoUntil: timestamp('embargo_until', { withTimezone: true }),
    allowComment: boolean('allow_comment').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_article_status').on(table.articleStatusId),
    index('idx_article_canonical_slug').on(table.canonicalSlug),
    index('idx_article_embargo').on(table.embargoUntil),
  ],
);

// mediaAsset declared before publisherProfile and articleBlock so direct refs work
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
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_media_asset_uploader').on(table.uploadedBy),
    index('idx_media_asset_type').on(table.mediaType),
  ],
);

export const mediaAssetRights = pgTable(
  'media_asset_rights',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    mediaAssetId: bigint('media_asset_id', { mode: 'number' })
      .notNull()
      .references(() => mediaAsset.id, { onDelete: 'cascade' }),
    license: mediaLicense('license').notNull().default('all_rights_reserved'),
    creditRequired: boolean('credit_required').notNull().default(true),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_media_asset_rights_asset').on(table.mediaAssetId),
  ],
);

export const publisherProfile = pgTable(
  'publisher_profile',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    logoMediaAssetId: bigint('logo_media_asset_id', { mode: 'number' })
      .references(() => mediaAsset.id, { onDelete: 'set null' }),
    url: text('url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_publisher_profile_logo').on(table.logoMediaAssetId),
  ],
);

export const articleBlock = pgTable(
  'article_block',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    blockType: articleBlockType('block_type').notNull(),
    position: integer('position').notNull(),
    content: jsonb('content').notNull().default('{}'),
    mediaAssetId: bigint('media_asset_id', { mode: 'number' })
      .references(() => mediaAsset.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_article_block_article').on(table.articleId, table.position),
    index('idx_article_block_media').on(table.mediaAssetId),
  ],
);

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
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    dueAt: timestamp('due_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('uq_article_assignment').on(table.articleId, table.userAccountId, table.role),
    index('idx_article_assignment_article').on(table.articleId),
    index('idx_article_assignment_user').on(table.userAccountId),
  ],
);

export const articleRevision = pgTable(
  'article_revision',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_article_revision_article').on(table.articleId, table.createdAt),
  ],
);

export const publishChecklistItem = pgTable(
  'publish_checklist_item',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull().unique(),
    ordinal: integer('ordinal').notNull().default(0),
    required: boolean('required').notNull().default(true),
  },
  (table) => [
    index('idx_publish_checklist_item_ordinal').on(table.ordinal),
  ],
);

export const articleChecklistState = pgTable(
  'article_checklist_state',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    publishChecklistItemId: bigint('publish_checklist_item_id', { mode: 'number' })
      .notNull()
      .references(() => publishChecklistItem.id, { onDelete: 'cascade' }),
    satisfied: boolean('satisfied').notNull().default(false),
    satisfiedAt: timestamp('satisfied_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('uq_article_checklist_state').on(table.articleId, table.publishChecklistItemId),
    index('idx_article_checklist_state_article').on(table.articleId),
  ],
);

export const section = pgTable(
  'section',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    parentSectionId: bigint('parent_section_id', { mode: 'number' }).references(
      (): AnyPgColumn => section.id,
      { onDelete: 'set null' },
    ),
    slug: text('slug').notNull().unique(),
    ordinal: integer('ordinal').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_section_parent').on(table.parentSectionId),
    index('idx_section_ordinal').on(table.ordinal),
  ],
);

export const topic = pgTable('topic', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  slug: text('slug').notNull().unique(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tag = pgTable('tag', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  slug: text('slug').notNull().unique(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const articleSection = pgTable(
  'article_section',
  {
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    sectionId: bigint('section_id', { mode: 'number' })
      .notNull()
      .references(() => section.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.sectionId] }),
    index('idx_article_section_section').on(table.sectionId),
  ],
);

export const articleTopic = pgTable(
  'article_topic',
  {
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    topicId: bigint('topic_id', { mode: 'number' })
      .notNull()
      .references(() => topic.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.topicId] }),
    index('idx_article_topic_topic').on(table.topicId),
  ],
);

export const articleTag = pgTable(
  'article_tag',
  {
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    tagId: bigint('tag_id', { mode: 'number' })
      .notNull()
      .references(() => tag.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.tagId] }),
    index('idx_article_tag_tag').on(table.tagId),
  ],
);

export const authorProfile = pgTable(
  'author_profile',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    // FK to user_account(id) — cross-package ref added via supplemental SQL
    userAccountId: bigint('user_account_id', { mode: 'number' }),
    slug: text('slug').notNull().unique(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_author_profile_user').on(table.userAccountId),
    index('idx_author_profile_slug').on(table.slug),
  ],
);

export const articleByline = pgTable(
  'article_byline',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    authorProfileId: bigint('author_profile_id', { mode: 'number' })
      .notNull()
      .references(() => authorProfile.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(1),
  },
  (table) => [
    uniqueIndex('uq_article_byline').on(table.articleId, table.authorProfileId),
    index('idx_article_byline_article').on(table.articleId, table.position),
    index('idx_article_byline_author').on(table.authorProfileId),
  ],
);

export const front = pgTable(
  'front',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    sectionId: bigint('section_id', { mode: 'number' })
      .references(() => section.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_front_section_id').on(table.sectionId),
    index('idx_front_section').on(table.sectionId),
  ],
);

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
    pinnedUntil: timestamp('pinned_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_front_slot_front').on(table.frontId, table.position),
    index('idx_front_slot_article').on(table.articleId),
    index('idx_front_slot_pinned').on(table.pinnedUntil),
  ],
);

export const liveCoverage = pgTable(
  'live_coverage',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    active: boolean('active').notNull().default(true),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('uq_live_coverage_article').on(table.articleId),
    index('idx_live_coverage_article').on(table.articleId),
    index('idx_live_coverage_active').on(table.active),
  ],
);

export const liveUpdate = pgTable(
  'live_update',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    liveCoverageId: bigint('live_coverage_id', { mode: 'number' })
      .notNull()
      .references(() => liveCoverage.id, { onDelete: 'cascade' }),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    pinned: boolean('pinned').notNull().default(false),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_live_update_coverage').on(table.liveCoverageId, table.position),
    index('idx_live_update_published').on(table.publishedAt),
    index('idx_live_update_pinned').on(table.liveCoverageId, table.pinned),
  ],
);

export const newsletter = pgTable('newsletter', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  slug: text('slug').notNull().unique(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subscriber = pgTable(
  'subscriber',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    // SCOPE DEVIATION: email_address is PII/runtime data, not translated copy
    emailAddress: text('email_address').notNull().unique(),
    locale: text('locale').notNull().default('en'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_subscriber_email').on(table.emailAddress),
    index('idx_subscriber_confirmed').on(table.confirmedAt),
  ],
);

export const newsletterSubscription = pgTable(
  'newsletter_subscription',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    newsletterId: bigint('newsletter_id', { mode: 'number' })
      .notNull()
      .references(() => newsletter.id, { onDelete: 'cascade' }),
    subscriberId: bigint('subscriber_id', { mode: 'number' })
      .notNull()
      .references(() => subscriber.id, { onDelete: 'cascade' }),
    subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('uq_newsletter_subscription').on(table.newsletterId, table.subscriberId),
    index('idx_newsletter_subscription_newsletter').on(table.newsletterId),
    index('idx_newsletter_subscription_subscriber').on(table.subscriberId),
  ],
);

export const articlePreviewToken = pgTable(
  'article_preview_token',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    articleId: bigint('article_id', { mode: 'number' })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_article_preview_token_article').on(table.articleId),
    index('idx_article_preview_token_token').on(table.token),
    index('idx_article_preview_token_expiry').on(table.expiresAt),
  ],
);

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
      { onDelete: 'cascade' },
    ),
    // SCOPE DEVIATION: user-generated runtime data, not dictionary copy
    authorName: text('author_name').notNull(),
    authorEmail: text('author_email').notNull(),
    body: text('body').notNull(),
    status: commentStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_comment_article').on(table.articleId, table.createdAt),
    index('idx_comment_parent').on(table.parentCommentId),
    index('idx_comment_status').on(table.articleId, table.status),
    index('idx_comment_user').on(table.userAccountId),
  ],
);
