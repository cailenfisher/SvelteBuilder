// Dev-kitchen fixture data for @sveltebuilder/content component showcases.
// All copy is loaded via hermes mock payload below — no text columns on entities.
import type {
  Article,
  ArticleWithCopy,
  ArticleBlock,
  ArticleBlockWithCopy,
  ArticleStatus,
  ArticleStatusWithCopy,
  AuthorProfile,
  AuthorProfileWithCopy,
  Section,
  SectionWithCopy,
  Topic,
  TopicWithCopy,
  LiveUpdate,
  LiveCoverageWithUpdates,
  Newsletter,
  NewsletterWithCopy,
} from '@sveltebuilder/content';
import type { DictionaryPayload } from '@sveltebuilder/hermes';

export const draftStatus: ArticleStatusWithCopy = {
  id: 1, slug: 'draft', ordinal: 1, label: 'Draft',
};

export const publishedStatus: ArticleStatusWithCopy = {
  id: 5, slug: 'published', ordinal: 5, label: 'Published',
};

export const worldSection: SectionWithCopy = {
  id: 1, parentSectionId: null, slug: 'world', ordinal: 1, active: true,
  createdAt: '2025-01-01T00:00:00Z', name: 'World', description: '', children: [],
};

export const techSection: SectionWithCopy = {
  id: 2, parentSectionId: null, slug: 'tech', ordinal: 2, active: true,
  createdAt: '2025-01-01T00:00:00Z', name: 'Technology', description: '', children: [],
};

export const climateTopic: TopicWithCopy = {
  id: 1, slug: 'climate', active: true, createdAt: '2025-01-01T00:00:00Z', name: 'Climate',
};

export const aiTopic: TopicWithCopy = {
  id: 2, slug: 'artificial-intelligence', active: true, createdAt: '2025-01-01T00:00:00Z', name: 'Artificial Intelligence',
};

export const janeAuthor: AuthorProfileWithCopy = {
  id: 1, userAccountId: null, slug: 'jane-doe', active: true,
  createdAt: '2025-01-01T00:00:00Z', name: 'Jane Doe', bio: 'Senior correspondent covering technology and climate.',
};

export const johnAuthor: AuthorProfileWithCopy = {
  id: 2, userAccountId: null, slug: 'john-smith', active: true,
  createdAt: '2025-01-01T00:00:00Z', name: 'John Smith', bio: 'Science editor.',
};

export const sampleBlocks: ArticleBlockWithCopy[] = [
  {
    id: 1, articleId: 1, blockType: 'paragraph', position: 0,
    content: {}, mediaAssetId: null, createdAt: '2025-01-01T00:00:00Z',
    text: "The world's leading climate scientists gathered last week to present findings that suggest the pace of Arctic warming is accelerating beyond previous models.",
    mediaAsset: null,
  },
  {
    id: 2, articleId: 1, blockType: 'heading', position: 1,
    content: { level: 2 }, mediaAssetId: null, createdAt: '2025-01-01T00:00:00Z',
    text: 'New Data Points', mediaAsset: null,
  },
  {
    id: 3, articleId: 1, blockType: 'paragraph', position: 2,
    content: {}, mediaAssetId: null, createdAt: '2025-01-01T00:00:00Z',
    text: 'Satellite measurements confirm sea ice is declining at twice the rate predicted in 2020. Scientists warn that feedback loops may be triggering irreversible changes.',
    mediaAsset: null,
  },
  {
    id: 4, articleId: 1, blockType: 'pullquote', position: 3,
    content: {}, mediaAssetId: null, createdAt: '2025-01-01T00:00:00Z',
    text: 'We are past the point of passive observation. Every year of inaction compounds the recovery cost.',
    mediaAsset: null,
  },
];

export const sampleArticle: ArticleWithCopy = {
  id: 1,
  articleStatusId: 5,
  canonicalSlug: 'arctic-warming-accelerating-2025',
  publishedAt: '2025-06-01T10:00:00Z',
  updatedAt: '2025-06-02T09:30:00Z',
  deletedAt: null,
  embargoUntil: null,
  allowComment: true,
  createdAt: '2025-05-28T08:00:00Z',
  headline: 'Arctic Warming Accelerates Beyond Climate Models',
  dek: 'New satellite data shows sea ice declining twice as fast as scientists predicted five years ago.',
  status: publishedStatus,
  blocks: sampleBlocks,
  bylines: [janeAuthor],
  sections: [worldSection],
  topics: [climateTopic],
  tags: [],
};

export const secondArticle: ArticleWithCopy = {
  id: 2,
  articleStatusId: 5,
  canonicalSlug: 'ai-regulation-framework-eu-2025',
  publishedAt: '2025-06-03T08:00:00Z',
  updatedAt: '2025-06-03T08:00:00Z',
  deletedAt: null,
  embargoUntil: null,
  allowComment: false,
  createdAt: '2025-06-02T16:00:00Z',
  headline: 'EU Finalises Landmark AI Regulation Framework',
  dek: 'The European Parliament approved sweeping rules governing foundation models, with enforcement starting in 2026.',
  status: publishedStatus,
  blocks: [],
  bylines: [johnAuthor],
  sections: [techSection],
  topics: [aiTopic],
  tags: [],
};

export const sampleLiveCoverage: LiveCoverageWithUpdates = {
  id: 1, articleId: 1, active: true,
  startedAt: '2025-06-01T08:00:00Z', endedAt: null,
  updates: [
    {
      id: 1, liveCoverageId: 1, publishedAt: '2025-06-01T09:00:00Z', pinned: true, position: 0,
      createdAt: '2025-06-01T09:00:00Z',
      text: 'Scientists release full dataset to the public.',
    },
    {
      id: 2, liveCoverageId: 1, publishedAt: '2025-06-01T10:30:00Z', pinned: false, position: 1,
      createdAt: '2025-06-01T10:30:00Z',
      text: 'Press conference underway — stream available on official channel.',
    },
    {
      id: 3, liveCoverageId: 1, publishedAt: '2025-06-01T11:45:00Z', pinned: false, position: 2,
      createdAt: '2025-06-01T11:45:00Z',
      text: 'Q&A session begins. Journalists from 30 countries present.',
    },
  ],
};

export const sampleNewsletter: NewsletterWithCopy = {
  id: 1, slug: 'weekly-briefing', active: true,
  createdAt: '2025-01-01T00:00:00Z',
  name: 'Weekly Briefing',
  description: 'The most important stories of the week, every Friday morning.',
};

// Minimal hermes DictionaryPayload for fixtures.
// In production this is loaded from the DB via buildArticleDictionaryPayload().
export const fixtureDictionaryPayload: DictionaryPayload = {
  locale: 'en',
  entries: [
    // article_block copy
    { slug: 'text', scope: 'article_block', entity_id: 1, content: 'The world\'s leading climate scientists gathered last week to present findings that suggest the pace of Arctic warming is accelerating beyond previous models.' },
    { slug: 'text', scope: 'article_block', entity_id: 2, content: 'New Data Points' },
    { slug: 'text', scope: 'article_block', entity_id: 3, content: 'Satellite measurements confirm sea ice is declining at twice the rate predicted in 2020. Scientists warn that feedback loops may be triggering irreversible changes.' },
    { slug: 'text', scope: 'article_block', entity_id: 4, content: 'We are past the point of passive observation. Every year of inaction compounds the recovery cost.' },
    // article copy
    { slug: 'headline', scope: 'article', entity_id: 1, content: 'Arctic Warming Accelerates Beyond Climate Models' },
    { slug: 'dek',      scope: 'article', entity_id: 1, content: 'New satellite data shows sea ice declining twice as fast as scientists predicted five years ago.' },
    { slug: 'headline', scope: 'article', entity_id: 2, content: 'EU Finalises Landmark AI Regulation Framework' },
    { slug: 'dek',      scope: 'article', entity_id: 2, content: 'The European Parliament approved sweeping rules governing foundation models, with enforcement starting in 2026.' },
    // author_profile copy
    { slug: 'name', scope: 'author_profile', entity_id: 1, content: 'Jane Doe' },
    { slug: 'name', scope: 'author_profile', entity_id: 2, content: 'John Smith' },
    // section copy
    { slug: 'name', scope: 'section', entity_id: 1, content: 'World' },
    { slug: 'name', scope: 'section', entity_id: 2, content: 'Technology' },
    // topic copy
    { slug: 'name', scope: 'topic', entity_id: 1, content: 'Climate' },
    { slug: 'name', scope: 'topic', entity_id: 2, content: 'Artificial Intelligence' },
    // article_status copy
    { slug: 'label', scope: 'article_status', entity_id: 5, content: 'Published' },
    // live_coverage copy
    { slug: 'title',       scope: 'live_coverage', entity_id: 1, content: 'Breaking: Arctic Climate Summit' },
    { slug: 'description', scope: 'live_coverage', entity_id: 1, content: 'Live updates from the International Climate Research Conference.' },
    // live_update copy
    { slug: 'text', scope: 'live_update', entity_id: 1, content: 'Scientists release full dataset to the public.' },
    { slug: 'text', scope: 'live_update', entity_id: 2, content: 'Press conference underway — stream available on official channel.' },
    { slug: 'text', scope: 'live_update', entity_id: 3, content: 'Q&A session begins. Journalists from 30 countries present.' },
    // newsletter UI copy
    { slug: 'newsletter.signup_heading',     scope: 'content', entity_id: null, content: 'Stay Informed' },
    { slug: 'newsletter.signup_description', scope: 'content', entity_id: null, content: 'The most important stories of the week, every Friday morning.' },
    { slug: 'newsletter.email_label',        scope: 'content', entity_id: null, content: 'Email address' },
    { slug: 'newsletter.email_placeholder',  scope: 'content', entity_id: null, content: 'your@email.com' },
    { slug: 'newsletter.submit_label',       scope: 'content', entity_id: null, content: 'Subscribe' },
    { slug: 'newsletter.success_message',    scope: 'content', entity_id: null, content: 'Thanks for subscribing! Check your inbox to confirm.' },
    { slug: 'newsletter.error_message',      scope: 'content', entity_id: null, content: 'Something went wrong. Please try again.' },
  ],
};
