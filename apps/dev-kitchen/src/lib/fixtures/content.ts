/**
 * Fixtures for the @sveltebuilder/content showcase.
 *
 * Every record is declared against the package's exported types, so a field a component no
 * longer accepts — or a required one it gained — is a `pnpm check` failure here rather than a
 * page that quietly renders the wrong thing. That is the drift that killed the last harness:
 * its content fixtures were untyped literals passing props that had not existed for months.
 *
 * Copy is not on the records. Entity components resolve it through a dictionary, which a
 * screen builds from what its loader returned; `contentDictionary()` builds the same thing
 * from `COPY`. The `…WithCopy` shapes some list and admin components still take carry their
 * copy baked in, and are assembled from the same strings so the two never disagree.
 */
import { createDictionary, type DictionaryInstance, type DictionaryPayload } from 'diglossia';
import type {
  Article,
  ArticleAssignment,
  ArticleBlock,
  ArticleChecklistState,
  ArticleStatus,
  ArticleWithCopy,
  AuthorProfile,
  FrontSlotWithArticle,
  FrontWithSlots,
  LiveCoverageWithUpdates,
  LiveUpdate,
  MediaAsset,
  MediaAssetAttribution,
  NewsletterWithCopy,
  PublishChecklistItem,
  Section,
  Subscriber,
  Topic,
} from '@sveltebuilder/content';

/** Served from this app's static/media/, so pages need no network. */
export const STORAGE_BASE_URL = '/media';

const CREATED_AT = '2026-09-01T08:00:00.000Z';

// ── Taxonomy and people ──────────────────────────────────────────────────────

export const STATUS = {
  draft: { id: 1, slug: 'draft', ordinal: 20 },
  inReview: { id: 2, slug: 'in_review', ordinal: 30 },
  published: { id: 5, slug: 'published', ordinal: 50 },
} as const satisfies Record<string, ArticleStatus>;

export const SECTIONS = [
  { id: 1, parentSectionId: null, slug: 'news', ordinal: 10, active: true, createdAt: CREATED_AT },
  { id: 2, parentSectionId: 1, slug: 'local', ordinal: 11, active: true, createdAt: CREATED_AT },
] satisfies Section[];

export const TOPICS = [
  { id: 1, slug: 'transport', active: true, createdAt: CREATED_AT },
  { id: 2, slug: 'housing', active: true, createdAt: CREATED_AT },
] satisfies Topic[];

export const AUTHORS = [
  { id: 1, userAccountId: 1, slug: 'ada-reporter', active: true, createdAt: CREATED_AT },
  { id: 2, userAccountId: 2, slug: 'grace-editor', active: true, createdAt: CREATED_AT },
] satisfies AuthorProfile[];

// ── Media ────────────────────────────────────────────────────────────────────

export const MEDIA = [
  {
    id: 10,
    mediaType: 'image',
    storageKey: 'harbour.svg',
    width: 1600,
    height: 900,
    mimeType: 'image/svg+xml',
    uploadedBy: 1,
    createdAt: CREATED_AT,
  },
  {
    id: 11,
    mediaType: 'image',
    storageKey: 'council.svg',
    width: 1600,
    height: 900,
    mimeType: 'image/svg+xml',
    uploadedBy: 1,
    createdAt: CREATED_AT,
  },
] satisfies MediaAsset[];

export const MEDIA_ASSETS = new Map(MEDIA.map((asset) => [asset.id, asset]));

export const ATTRIBUTIONS = new Map<number, MediaAssetAttribution>([
  [
    10,
    {
      mediaAssetId: 10,
      license: 'creative_commons',
      sourceUrl: 'https://example.org/harbour',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    },
  ],
]);

// ── Articles ─────────────────────────────────────────────────────────────────

export const ARTICLES = [
  {
    id: 7,
    articleStatusId: STATUS.published.id,
    canonicalSlug: 'council-advances-transit-levy',
    publishedAt: '2026-09-30T04:03:54.000Z',
    updatedAt: '2026-09-30T06:03:54.000Z',
    deletedAt: null,
    embargoUntil: null,
    allowComment: true,
    leadMediaAssetId: 10,
    createdAt: '2026-09-29T04:03:54.000Z',
  },
  {
    id: 8,
    articleStatusId: STATUS.draft.id,
    canonicalSlug: 'rents-rise-for-third-quarter',
    publishedAt: null,
    updatedAt: '2026-10-02T10:00:00.000Z',
    deletedAt: null,
    embargoUntil: null,
    allowComment: false,
    leadMediaAssetId: null,
    createdAt: '2026-10-02T09:00:00.000Z',
  },
  {
    id: 9,
    articleStatusId: STATUS.inReview.id,
    canonicalSlug: 'night-buses-return',
    publishedAt: null,
    updatedAt: '2026-10-03T10:00:00.000Z',
    deletedAt: null,
    embargoUntil: '2026-10-08T06:00:00.000Z',
    allowComment: true,
    leadMediaAssetId: null,
    createdAt: '2026-10-03T09:00:00.000Z',
  },
] satisfies Article[];

export const [LEAD_ARTICLE, DRAFT_ARTICLE, REVIEW_ARTICLE] = ARTICLES;

const block = (fields: Omit<ArticleBlock, 'articleId' | 'createdAt'>): ArticleBlock => ({
  ...fields,
  articleId: LEAD_ARTICLE.id,
  createdAt: CREATED_AT,
});

export const BLOCKS: ArticleBlock[] = [
  block({ id: 101, blockType: 'paragraph', position: 1, content: {}, mediaAssetId: null }),
  block({ id: 102, blockType: 'heading', position: 2, content: { level: 2 }, mediaAssetId: null }),
  block({ id: 103, blockType: 'paragraph', position: 3, content: {}, mediaAssetId: null }),
  block({ id: 104, blockType: 'image', position: 4, content: { altOverride: false }, mediaAssetId: 11 }),
  block({ id: 105, blockType: 'pullquote', position: 5, content: {}, mediaAssetId: null }),
  block({ id: 106, blockType: 'paragraph', position: 6, content: {}, mediaAssetId: null }),
];

/** Night buses has no lead image, so cards fall back to its first image block. */
export const REVIEW_BLOCKS: ArticleBlock[] = [
  { ...BLOCKS[3], id: 201, articleId: REVIEW_ARTICLE.id, position: 1 },
];

// ── Copy ─────────────────────────────────────────────────────────────────────

/** [slug, scope, entityId, content], the shape a resolved copy row arrives in. */
type CopyRow = [string, string, number | null, string];

const HEADLINES: Record<number, [string, string]> = {
  7: ['Council advances transit levy', 'A seven-to-two vote sends the measure to a public hearing next month.'],
  8: ['Rents rise for a third quarter', 'Median asking rents are up 4.1% on the year.'],
  9: ['Night buses return downtown', 'Four routes resume after a two-year pause.'],
};

const COPY: CopyRow[] = [
  ...Object.entries(HEADLINES).flatMap(([id, [headline, dek]]): CopyRow[] => [
    ['headline', 'article', Number(id), headline],
    ['dek', 'article', Number(id), dek],
  ]),
  ['name', 'article_status', STATUS.draft.id, 'Draft'],
  ['name', 'article_status', STATUS.inReview.id, 'In review'],
  ['name', 'article_status', STATUS.published.id, 'Published'],
  ['name', 'section', 1, 'News'],
  ['name', 'section', 2, 'Local'],
  ['name', 'topic', 1, 'Transport'],
  ['name', 'topic', 2, 'Housing'],
  ['name', 'author_profile', 1, 'Ada Reporter'],
  ['bio', 'author_profile', 1, 'Ada covers city hall and transit.'],
  ['expertise', 'author_profile', 1, 'Local government, transport'],
  ['name', 'author_profile', 2, 'Grace Editor'],
  ['bio', 'author_profile', 2, 'Grace edits the local desk.'],
  ['expertise', 'author_profile', 2, 'Editing'],
  ['alt_text', 'media_asset', 10, 'Ferries moored in the harbour at dawn'],
  ['caption', 'media_asset', 10, 'The harbour, where the levy would fund a new terminal.'],
  ['credit', 'media_asset', 10, 'Ada Reporter'],
  ['alt_text', 'media_asset', 11, 'Council chamber during the vote'],
  ['caption', 'media_asset', 11, 'Councillors voted seven to two.'],
  ['credit', 'media_asset', 11, 'City press office'],
  ['text', 'article_block', 101, 'The council voted on Tuesday to advance a levy that would fund three new transit lines.'],
  ['text', 'article_block', 102, 'What happens next'],
  ['text', 'article_block', 103, 'The measure now goes to a public hearing, then a final vote in November.'],
  ['text', 'article_block', 105, 'We have waited a decade for this.'],
  ['text', 'article_block', 106, 'Opponents say the levy falls hardest on small businesses.'],
  ['title', 'live_coverage', 3, 'Live: the transit levy vote'],
  ['description', 'live_coverage', 3, 'Updates from the council chamber as they happen.'],
  ['text', 'live_update', 1, 'The vote is called. Seven in favour, two against.'],
  ['text', 'live_update', 2, 'Debate opens with a statement from the transit committee.'],
  ['text', 'live_update', 3, 'Councillors are taking their seats.'],
  ['title', 'front', 1, 'Local front page'],
  ['label', 'publish_checklist_item', 1, 'Headline approved'],
  ['label', 'publish_checklist_item', 2, 'Copy edited'],
  ['label', 'publish_checklist_item', 3, 'Images credited'],
  // Module UI copy, as tools/create/templates/modules/content/seed/seed.sql seeds it.
  ['action.submit_for_review', 'content', null, 'Submit for review'],
  ['action.approve', 'content', null, 'Approve'],
  ['action.send_back', 'content', null, 'Send back to draft'],
  ['action.publish', 'content', null, 'Publish'],
  ['action.unpublish', 'content', null, 'Unpublish'],
  ['newsletter.signup_heading', 'content', null, 'Get the newsletter'],
  ['newsletter.signup_description', 'content', null, "The day's most important stories, in your inbox."],
  ['newsletter.email_label', 'content', null, 'Email address'],
  ['newsletter.email_placeholder', 'content', null, 'you@example.com'],
  ['newsletter.submit_label', 'content', null, 'Subscribe'],
  ['newsletter.success_message', 'content', null, 'Check your inbox to confirm your subscription.'],
  ['newsletter.error_message', 'content', null, 'We could not subscribe that address. Please try again.'],
];

const COPY_PAYLOAD: DictionaryPayload = COPY.map(([slug, scope, entityId, content], index) => ({
  link: { id: index + 1, slug, scope, entityId },
  content,
  localeCode: 'en',
}));

/**
 * A fresh dictionary per call, as a screen builds one per request. Pass it as the
 * `dictionary` prop: the root layout's context dictionary carries only global copy.
 */
export function contentDictionary(): DictionaryInstance {
  return createDictionary(COPY_PAYLOAD);
}

const copyOf = (slug: string, scope: string, entityId: number) =>
  COPY.find((row) => row[0] === slug && row[1] === scope && row[2] === entityId)?.[3] ?? '';

// ── Shapes with baked copy, for the components that still take them ───────────

const statusWithCopy = (status: ArticleStatus) => ({ ...status, label: copyOf('name', 'article_status', status.id) });

function withCopy(article: Article, status: ArticleStatus): ArticleWithCopy {
  return {
    ...article,
    headline: HEADLINES[article.id][0],
    dek: HEADLINES[article.id][1],
    status: statusWithCopy(status),
    blocks: [],
    bylines: AUTHORS.slice(0, 1).map((author) => ({
      ...author,
      name: copyOf('name', 'author_profile', author.id),
      bio: copyOf('bio', 'author_profile', author.id),
    })),
    sections: SECTIONS.slice(1).map((section) => ({
      ...section,
      name: copyOf('name', 'section', section.id),
      description: '',
      children: [],
    })),
    topics: TOPICS.map((topic) => ({ ...topic, name: copyOf('name', 'topic', topic.id) })),
    tags: [],
  };
}

export const ARTICLES_WITH_COPY: ArticleWithCopy[] = [
  withCopy(LEAD_ARTICLE, STATUS.published),
  withCopy(DRAFT_ARTICLE, STATUS.draft),
  withCopy(REVIEW_ARTICLE, STATUS.inReview),
];

const slot = (
  id: number,
  article: ArticleWithCopy,
  layoutVariant: FrontSlotWithArticle['layoutVariant'],
  position: number
): FrontSlotWithArticle => ({
  id,
  frontId: 1,
  articleId: article.id,
  position,
  layoutVariant,
  pinnedUntil: null,
  createdAt: CREATED_AT,
  article,
  overrideHeadline: '',
});

export const FRONT: FrontWithSlots = {
  id: 1,
  sectionId: 2,
  slug: 'local',
  active: true,
  createdAt: CREATED_AT,
  name: copyOf('title', 'front', 1),
  section: null,
  slots: [
    slot(1, ARTICLES_WITH_COPY[0], 'lead', 1),
    slot(2, ARTICLES_WITH_COPY[2], 'secondary', 2),
    slot(3, ARTICLES_WITH_COPY[1], 'river', 3),
    slot(4, ARTICLES_WITH_COPY[2], 'brief', 4),
  ],
};

// ── Live coverage ────────────────────────────────────────────────────────────

const update = (id: number, publishedAt: string, pinned: boolean): LiveUpdate => ({
  id,
  liveCoverageId: 3,
  publishedAt,
  pinned,
  position: id,
  createdAt: publishedAt,
});

export const LIVE_UPDATES: LiveUpdate[] = [
  update(1, '2026-09-30T19:42:00.000Z', true),
  update(2, '2026-09-30T19:05:00.000Z', false),
  update(3, '2026-09-30T18:58:00.000Z', false),
];

export const LIVE_COVERAGE: LiveCoverageWithUpdates = {
  id: 3,
  articleId: LEAD_ARTICLE.id,
  active: true,
  startedAt: '2026-09-30T18:55:00.000Z',
  endedAt: null,
  updates: LIVE_UPDATES.map((entry) => ({ ...entry, text: copyOf('text', 'live_update', entry.id) })),
};

// ── Newsletter ───────────────────────────────────────────────────────────────

export const NEWSLETTER: NewsletterWithCopy = {
  id: 1,
  slug: 'daily-briefing',
  active: true,
  createdAt: CREATED_AT,
  name: 'Daily briefing',
  description: "The day's most important stories.",
};

export const SUBSCRIBERS: Subscriber[] = [
  { id: 1, emailAddress: 'ada@example.com', locale: 'en', confirmedAt: '2026-09-02T10:00:00.000Z', createdAt: CREATED_AT },
  { id: 2, emailAddress: 'marie@example.fr', locale: 'fr', confirmedAt: null, createdAt: CREATED_AT },
  { id: 3, emailAddress: 'kenji@example.jp', locale: 'ja', confirmedAt: '2026-09-04T10:00:00.000Z', createdAt: CREATED_AT },
];

// ── Workflow ─────────────────────────────────────────────────────────────────

export const ASSIGNMENTS: ArticleAssignment[] = [
  { id: 1, articleId: REVIEW_ARTICLE.id, userAccountId: 1, role: 'author', assignedAt: CREATED_AT, dueAt: '2026-10-08T12:00:00.000Z' },
  { id: 2, articleId: REVIEW_ARTICLE.id, userAccountId: 2, role: 'editor', assignedAt: CREATED_AT, dueAt: null },
];

export const CHECKLIST_ITEMS: PublishChecklistItem[] = [
  { id: 1, slug: 'headline_approved', ordinal: 10, required: true },
  { id: 2, slug: 'copy_edited', ordinal: 20, required: true },
  { id: 3, slug: 'images_credited', ordinal: 40, required: false },
];

export const CHECKLIST_STATES: ArticleChecklistState[] = [
  { id: 1, articleId: REVIEW_ARTICLE.id, publishChecklistItemId: 1, satisfied: true, satisfiedAt: CREATED_AT },
];
