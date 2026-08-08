// =============================================================================
// @sveltebuilder/content — TypeScript types
//
// i18n convention: entities with user-facing copy carry NO name/title/body/etc.
// Copy is linked via hermes (scope = table name, entity_id = bigint PK).
//
// SCOPE DEVIATIONS (documented):
//   comment.author_name, comment.author_email, comment.body — reader-submitted
//     runtime data, not editorial copy. Never entered in the LocalText store.
//     Same pattern as the original blog module comment.body deviation.
//   subscriber.email_address — PII/data, not copy. Never translated.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (mirrors SQL enum types)
// ---------------------------------------------------------------------------

export type ArticleBlockType =
  | 'paragraph'
  | 'heading'
  | 'image'
  | 'gallery'
  | 'video'
  | 'embed'
  | 'pullquote'
  | 'live_update';

export type ArticleAssignmentRole = 'author' | 'editor' | 'photo' | 'copy';

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export type MediaLicense =
  | 'all_rights_reserved'
  | 'rights_managed'
  | 'royalty_free'
  | 'creative_commons'
  | 'public_domain';

export type FrontLayoutVariant = 'lead' | 'secondary' | 'river' | 'brief';

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

// ---------------------------------------------------------------------------
// Block content jsonb shapes (structural config, never prose text)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Base entities
// ---------------------------------------------------------------------------

export type ArticleStatus = {
  id: number;
  slug: string;
  ordinal: number;
};

export type Article = {
  id: number;
  articleStatusId: number;
  canonicalSlug: string;
  publishedAt: string | null;
  updatedAt: string;
  deletedAt: string | null;
  embargoUntil: string | null;
  allowComment: boolean;
  createdAt: string;
};

export type ArticleBlock = {
  id: number;
  articleId: number;
  blockType: ArticleBlockType;
  position: number;
  content: ArticleBlockContent;
  mediaAssetId: number | null;
  createdAt: string;
};

export type ArticleAssignment = {
  id: number;
  articleId: number;
  userAccountId: number;
  role: ArticleAssignmentRole;
  assignedAt: string;
  dueAt: string | null;
};

export type ArticleRevision = {
  id: number;
  articleId: number;
  userAccountId: number;
  createdAt: string;
};

export type PublishChecklistItem = {
  id: number;
  slug: string;
  ordinal: number;
  required: boolean;
};

export type ArticleChecklistState = {
  id: number;
  articleId: number;
  publishChecklistItemId: number;
  satisfied: boolean;
  satisfiedAt: string | null;
};

export type Section = {
  id: number;
  parentSectionId: number | null;
  slug: string;
  ordinal: number;
  active: boolean;
  createdAt: string;
};

export type Topic = {
  id: number;
  slug: string;
  active: boolean;
  createdAt: string;
};

export type Tag = {
  id: number;
  slug: string;
  active: boolean;
  createdAt: string;
};

export type AuthorProfile = {
  id: number;
  userAccountId: number | null;
  slug: string;
  active: boolean;
  createdAt: string;
};

export type ArticleByline = {
  id: number;
  articleId: number;
  authorProfileId: number;
  position: number;
};

export type MediaAsset = {
  id: number;
  mediaType: MediaType;
  storageKey: string;
  width: number | null;
  height: number | null;
  mimeType: string;
  uploadedBy: number;
  createdAt: string;
};

export type MediaAssetRights = {
  id: number;
  mediaAssetId: number;
  license: MediaLicense;
  creditRequired: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export type Front = {
  id: number;
  sectionId: number | null;
  slug: string;
  active: boolean;
  createdAt: string;
};

export type FrontSlot = {
  id: number;
  frontId: number;
  articleId: number;
  position: number;
  layoutVariant: FrontLayoutVariant;
  pinnedUntil: string | null;
  createdAt: string;
};

export type LiveCoverage = {
  id: number;
  articleId: number;
  active: boolean;
  startedAt: string;
  endedAt: string | null;
};

export type LiveUpdate = {
  id: number;
  liveCoverageId: number;
  publishedAt: string;
  pinned: boolean;
  position: number;
  createdAt: string;
};

export type Newsletter = {
  id: number;
  slug: string;
  active: boolean;
  createdAt: string;
};

export type Subscriber = {
  id: number;
  // SCOPE DEVIATION: email_address is PII/data, not translated copy
  emailAddress: string;
  locale: string;
  confirmedAt: string | null;
  createdAt: string;
};

export type NewsletterSubscription = {
  id: number;
  newsletterId: number;
  subscriberId: number;
  subscribedAt: string;
  unsubscribedAt: string | null;
};

export type ArticlePreviewToken = {
  id: number;
  articleId: number;
  token: string;
  expiresAt: string;
  createdAt: string;
};

export type PublisherProfile = {
  id: number;
  logoMediaAssetId: number | null;
  url: string;
  createdAt: string;
};

// SCOPE DEVIATION: author_name, author_email, body are reader-submitted runtime
// data — not editorial copy, not in the LocalText store.
export type Comment = {
  id: number;
  articleId: number;
  userAccountId: number | null;
  parentCommentId: number | null;
  authorName: string;
  authorEmail: string;
  body: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Enriched types — carry resolved copy alongside the base entity
// ---------------------------------------------------------------------------

export type ArticleStatusWithCopy = ArticleStatus & {
  label: string;
};

export type SectionWithCopy = Section & {
  name: string;
  description: string;
  children: SectionWithCopy[];
};

export type TopicWithCopy = Topic & {
  name: string;
};

export type TagWithCopy = Tag & {
  name: string;
};

export type AuthorProfileWithCopy = AuthorProfile & {
  name: string;
  bio: string;
};

export type MediaAssetWithCopy = MediaAsset & {
  altText: string;
  caption: string;
  credit: string;
  rights: MediaAssetRights | null;
};

export type ArticleBlockWithCopy = ArticleBlock & {
  text: string;
  mediaAsset: MediaAssetWithCopy | null;
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

export type FrontSlotWithArticle = FrontSlot & {
  article: ArticleWithCopy;
  overrideHeadline: string;
};

export type FrontWithSlots = Front & {
  name: string;
  slots: FrontSlotWithArticle[];
  section: SectionWithCopy | null;
};

export type LiveUpdateWithCopy = LiveUpdate & {
  text: string;
};

export type LiveCoverageWithUpdates = LiveCoverage & {
  updates: LiveUpdateWithCopy[];
};

export type NewsletterWithCopy = Newsletter & {
  name: string;
  description: string;
};

export type PublisherProfileWithCopy = PublisherProfile & {
  name: string;
  logo: MediaAssetWithCopy | null;
};

export type CommentWithReplies = Comment & {
  replies: CommentWithReplies[];
};

// Pagination result wrapper
export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
};
