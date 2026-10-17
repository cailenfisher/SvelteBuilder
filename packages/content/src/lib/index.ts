// =============================================================================
// @sveltebuilder/content — public surface
// =============================================================================

// Schema types. Type-only: the schema modules define Drizzle tables, and drizzle-orm is a
// build-time dependency that must never reach a runtime bundle (CLAUDE.md, guardrail 8).
export type {
  Article,
  ArticleAssignment,
  ArticleAssignmentRole,
  ArticleBlock,
  ArticleBlockContent,
  ArticleBlockType,
  ArticleBlockWithCopy,
  ArticleByline,
  ArticleChecklistState,
  ArticlePreviewToken,
  ArticleRenderable,
  ArticleRevision,
  ArticleSection,
  ArticleStatus,
  ArticleStatusWithCopy,
  ArticleTag,
  ArticleTopic,
  ArticleWithCopy,
  ArticleWithRelations,
  AuthorProfile,
  AuthorProfileWithCopy,
  Comment,
  CommentStatus,
  CommentWithReplies,
  ArticleBlockEmbedContent,
  Front,
  FrontLayoutVariant,
  FrontSlot,
  FrontSlotWithArticle,
  FrontWithSlots,
  ArticleBlockGalleryContent,
  ArticleBlockHeadingContent,
  ArticleBlockImageContent,
  LiveCoverage,
  LiveCoverageWithUpdates,
  LiveUpdate,
  ArticleBlockLiveUpdateContent,
  LiveUpdateWithCopy,
  MediaAsset,
  MediaAssetAttribution,
  MediaAssetRights,
  MediaAssetSource,
  MediaAssetWithCopy,
  MediaAssetLicense,
  MediaAssetType,
  Newsletter,
  NewsletterSubscription,
  NewsletterWithCopy,
  ArticleBlockParagraphContent,
  PublishChecklistItem,
  PublisherProfile,
  PublisherProfileWithCopy,
  ArticleBlockPullquoteContent,
  Section,
  SectionWithCopy,
  Subscriber,
  SubscriberWithLocale,
  Tag,
  TagWithCopy,
  Topic,
  TopicWithCopy,
  ArticleBlockVideoContent,
} from './schema/index.js';

// Enum values, declared once in modules that do not import drizzle-orm, so screens can use them
// at runtime for filters and validation.
export { ARTICLE_ASSIGNMENT_ROLES } from './schema/article-assignment-role.js';
export { ARTICLE_BLOCK_TYPES } from './schema/article-block-type.js';
export { COMMENT_STATUSES } from './schema/comment-status.js';
export { FRONT_LAYOUT_VARIANTS } from './schema/front-layout-variant.js';
export { MEDIA_ASSET_LICENSES } from './schema/media-asset-license.js';
export { MEDIA_ASSET_TYPES } from './schema/media-asset-type.js';

// Entity components: resolve their copy from the dictionary in context, or the `dictionary` prop.
export { default as ArticleList } from './Article/ArticleList.svelte';
export { default as ArticleAssignmentQueue } from './Article/ArticleAssignment/ArticleAssignmentQueue.svelte';
export { default as FrontCurationBoard } from './Front/FrontCurationBoard.svelte';
export { default as SubscriberList } from './Subscriber/SubscriberList.svelte';
export { default as ArticleBlockEditor } from './Article/ArticleBlock/ArticleBlockEditor.svelte';
export type { ArticleBlockDraft } from './Article/ArticleBlock/ArticleBlockEditor.svelte';
export { default as ArticleBlockRenderer } from './Article/ArticleBlock/ArticleBlockRenderer.svelte';
export { default as ArticleCard } from './Article/ArticleCard.svelte';
export { default as ArticleDetail } from './Article/ArticleDetail.svelte';
export { default as ArticleWorkflowPanel } from './Article/ArticleWorkflowPanel.svelte';
export { default as AuthorProfileDetail } from './AuthorProfile/AuthorProfileDetail.svelte';
export { default as ArticleBylineList } from './Article/ArticleByline/ArticleBylineList.svelte';
export { default as LiveCoverageDetail } from './LiveCoverage/LiveCoverageDetail.svelte';
export { default as LiveUpdateCard } from './LiveUpdate/LiveUpdateCard.svelte';
export { default as MediaAssetFigure } from './MediaAsset/MediaAssetFigure.svelte';
export { default as NewsletterSubscriptionForm } from './Newsletter/NewsletterSubscription/NewsletterSubscriptionForm.svelte';
export { default as FrontDetail } from './Front/FrontDetail.svelte';
export { default as SectionLink } from './Section/SectionLink.svelte';
export { default as TopicLink } from './Topic/TopicLink.svelte';

// Application-level components: plain props, no dictionary.
export { default as CommentList } from './Comment/CommentList.svelte';
