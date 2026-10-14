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
  EmbedBlockContent,
  Front,
  FrontLayoutVariant,
  FrontSlot,
  FrontSlotWithArticle,
  FrontWithSlots,
  GalleryBlockContent,
  HeadingBlockContent,
  ImageBlockContent,
  LiveCoverage,
  LiveCoverageWithUpdates,
  LiveUpdate,
  LiveUpdateBlockContent,
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
  ParagraphBlockContent,
  PublishChecklistItem,
  PublisherProfile,
  PublisherProfileWithCopy,
  PullquoteBlockContent,
  Section,
  SectionWithCopy,
  Subscriber,
  SubscriberWithLocale,
  Tag,
  TagWithCopy,
  Topic,
  TopicWithCopy,
  VideoBlockContent,
} from './schema/index.js';

// Enum values, declared once in modules that do not import drizzle-orm, so screens can use them
// at runtime for filters and validation.
export { ARTICLE_ASSIGNMENT_ROLES } from './schema/article-assignment-role.js';
export { ARTICLE_BLOCK_TYPES } from './schema/article-block-type.js';
export { COMMENT_STATUSES } from './schema/comment-status.js';
export { FRONT_LAYOUT_VARIANTS } from './schema/front-layout-variant.js';
export { MEDIA_ASSET_LICENSES } from './schema/media-asset-license.js';
export { MEDIA_ASSET_TYPES } from './schema/media-asset-type.js';

// Camp 1 components (no hermes dependency)
export { default as ArticleList } from './Article/ArticleList.svelte';
export { default as AssignmentQueue } from './Article/ArticleAssignment/AssignmentQueue.svelte';
export { default as FrontCurationBoard } from './Front/FrontCurationBoard.svelte';
export { default as SubscriberList } from './Subscriber/SubscriberList.svelte';

// Camp 2 components (import hermes — require hermes.load() before mount)
export { default as ArticleBlockEditor } from './Article/ArticleBlock/ArticleBlockEditor.svelte';
export type { ArticleBlockDraft } from './Article/ArticleBlock/ArticleBlockEditor.svelte';
export { default as ArticleBlockRenderer } from './Article/ArticleBlock/ArticleBlockRenderer.svelte';
export { default as ArticleCard } from './Article/ArticleCard.svelte';
export { default as ArticleView } from './Article/ArticleView.svelte';
export { default as ArticleWorkflowPanel } from './Article/ArticleWorkflowPanel.svelte';
export { default as AuthorProfileView } from './AuthorProfile/AuthorProfileView.svelte';
export { default as BylineList } from './Article/ArticleByline/BylineList.svelte';
export { default as LiveCoverageView } from './LiveCoverage/LiveCoverageView.svelte';
export { default as LiveUpdateItem } from './LiveUpdate/LiveUpdateItem.svelte';
export { default as MediaFigure } from './MediaAsset/MediaFigure.svelte';
export { default as NewsletterSignup } from './Newsletter/NewsletterSubscription/NewsletterSignup.svelte';
export { default as SectionFront } from './Front/SectionFront.svelte';
export { default as SectionLabel } from './Section/SectionLabel.svelte';
export { default as TopicTag } from './Topic/TopicTag.svelte';
