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
  MediaLicense,
  MediaType,
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
export { MEDIA_LICENSES } from './schema/media-license.js';
export { MEDIA_TYPES } from './schema/media-type.js';

// Camp 1 components (no hermes dependency)
export { default as ArticleList } from './components/ArticleList.svelte';
export { default as AssignmentQueue } from './components/AssignmentQueue.svelte';
export { default as FrontCurationBoard } from './components/FrontCurationBoard.svelte';
export { default as SubscriberList } from './components/SubscriberList.svelte';

// Camp 2 components (import hermes — require hermes.load() before mount)
export { default as ArticleBlockEditor } from './components/ArticleBlockEditor.svelte';
export type { ArticleBlockDraft } from './components/ArticleBlockEditor.svelte';
export { default as ArticleBlockRenderer } from './components/ArticleBlockRenderer.svelte';
export { default as ArticleCard } from './components/ArticleCard.svelte';
export { default as ArticleView } from './components/ArticleView.svelte';
export { default as ArticleWorkflowPanel } from './components/ArticleWorkflowPanel.svelte';
export { default as AuthorProfileView } from './components/AuthorProfileView.svelte';
export { default as BylineList } from './components/BylineList.svelte';
export { default as LiveCoverageView } from './components/LiveCoverageView.svelte';
export { default as LiveUpdateItem } from './components/LiveUpdateItem.svelte';
export { default as MediaFigure } from './components/MediaFigure.svelte';
export { default as NewsletterSignup } from './components/NewsletterSignup.svelte';
export { default as SectionFront } from './components/SectionFront.svelte';
export { default as SectionLabel } from './components/SectionLabel.svelte';
export { default as TopicTag } from './components/TopicTag.svelte';
