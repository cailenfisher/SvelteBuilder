/**
 * The gate for Camp 2 copy resolution.
 *
 * Every Camp 2 component resolves its own strings from a dictionary, and takes that
 * dictionary either from context or from an optional `dictionary` prop. Two mistakes
 * are invisible to every other check in the repo:
 *
 *  1. A composite component (ArticleView, ArticleCard, ArticleBlockRenderer,
 *     LiveCoverageView) renders a child Camp 2 component and forgets to forward
 *     `dictionary`. The child silently falls back to `getDictionary()` — the root
 *     layout's context dictionary, which by design carries only global scope-null
 *     copy — and every entity-bound string becomes a `[missing: …]` sentinel.
 *     `svelte-check` cannot see it: the prop is optional, so omitting it is valid.
 *
 *  2. A component asks for a slug the seed does not provide (ArticleCard once asked
 *     for `article_status:label` while the seed wrote `article_status:name`).
 *
 * Both shipped in 0.1.0 and reached a real scaffold, where the entire article body
 * rendered as sentinels. So: render each component with the dictionary passed as a
 * prop — the way a screen passes it — and assert nothing went missing.
 *
 * `onMissing` is the real assertion rather than scanning the HTML for '[missing:',
 * because a sentinel can land somewhere a string scan would plausibly be written not
 * to look, like MediaFigure's `alt` attribute. The HTML scan stays as a backstop.
 */
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createDictionary, type DictionaryPayload } from 'diglossia';
import type { Component } from 'svelte';

import ArticleBlockRenderer from '../src/lib/components/ArticleBlockRenderer.svelte';
import ArticleCard from '../src/lib/components/ArticleCard.svelte';
import ArticleView from '../src/lib/components/ArticleView.svelte';
import BylineList from '../src/lib/components/BylineList.svelte';
import LiveCoverageView from '../src/lib/components/LiveCoverageView.svelte';
import LiveUpdateItem from '../src/lib/components/LiveUpdateItem.svelte';
import MediaFigure from '../src/lib/components/MediaFigure.svelte';
import SectionLabel from '../src/lib/components/SectionLabel.svelte';
import TopicTag from '../src/lib/components/TopicTag.svelte';

import type {
  Article,
  ArticleBlock,
  ArticleStatus,
  AuthorProfile,
  LiveCoverageWithUpdates,
  MediaAsset,
  Section,
  Topic,
} from '../src/lib/schema/index.js';

// ── fixtures ────────────────────────────────────────────────────────────────

const LOCALE = 'en';

/** [slug, scope, entityId, content] — the shape a resolved copy row arrives in. */
type CopySpec = [string, string | null, number | null, string];

const toPayload = (specs: CopySpec[]): DictionaryPayload =>
  specs.map(([slug, scope, entityId, content], index) => ({
    link: { id: index + 1, slug, scope, entityId },
    content,
    localeCode: LOCALE,
  }));

/**
 * Renders a component with `dictionary` supplied as a prop and reports every key the
 * component asked for and did not find.
 */
function renderWithCopy<P extends Record<string, unknown>>(
  component: Component<never>,
  props: P,
  copy: CopySpec[]
): { html: string; missing: string[] } {
  const missing: string[] = [];
  const dictionary = createDictionary(toPayload(copy), {
    onMissing: ({ key }) => {
      missing.push(key);
      return undefined;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = render(component as any, { props: { ...props, dictionary } });
  return { html: `${result.head}${result.body}`, missing };
}

const article: Article = {
  id: 7,
  articleStatusId: 5,
  canonicalSlug: 'council-advances-transit-levy',
  publishedAt: '2026-09-30T04:03:54.000Z',
  updatedAt: '2026-09-30T06:03:54.000Z',
  deletedAt: null,
  embargoUntil: null,
  allowComment: true,
  createdAt: '2026-09-29T04:03:54.000Z',
};

const status: ArticleStatus = { id: 5, slug: 'published', ordinal: 50 };

const section: Section = {
  id: 13,
  parentSectionId: 1,
  slug: 'local',
  ordinal: 13,
  active: true,
  createdAt: '2026-09-01T00:00:00.000Z',
};

const topic: Topic = {
  id: 2,
  slug: 'transport',
  active: true,
  createdAt: '2026-09-01T00:00:00.000Z',
};

const author: AuthorProfile = {
  id: 7,
  userAccountId: 1,
  slug: 'maya-brennan',
  active: true,
  createdAt: '2026-09-01T00:00:00.000Z',
};

const heroImage: MediaAsset = {
  id: 4,
  mediaType: 'image',
  storageKey: 'editorial/2026/10/council-chamber.jpg',
  width: 1600,
  height: 900,
  mimeType: 'image/jpeg',
  uploadedBy: 1,
  createdAt: '2026-09-29T00:00:00.000Z',
};

const blocks: ArticleBlock[] = [
  {
    id: 28,
    articleId: 7,
    blockType: 'heading',
    position: 1,
    content: { level: 2 },
    mediaAssetId: null,
    createdAt: '2026-09-29T00:00:00.000Z',
  },
  {
    id: 29,
    articleId: 7,
    blockType: 'paragraph',
    position: 2,
    content: {},
    mediaAssetId: null,
    createdAt: '2026-09-29T00:00:00.000Z',
  },
  {
    id: 30,
    articleId: 7,
    blockType: 'pullquote',
    position: 3,
    content: {},
    mediaAssetId: null,
    createdAt: '2026-09-29T00:00:00.000Z',
  },
  {
    id: 31,
    articleId: 7,
    blockType: 'image',
    position: 4,
    content: { altOverride: false },
    mediaAssetId: 4,
    createdAt: '2026-09-29T00:00:00.000Z',
  },
];

const mediaAssets = new Map<number, MediaAsset>([[heroImage.id, heroImage]]);
const STORAGE = 'https://example.test/storage/v1/object/public';

const HEADLINE = 'Council advances transit levy to November ballot';
const DEK = 'A 6-3 vote sends the measure to voters.';
const SECTION_NAME = 'Local';
const TOPIC_NAME = 'Transport';
const AUTHOR_NAME = 'Maya Brennan';
const STATUS_NAME = 'Published';
const ALT_TEXT = 'Council members seated at the dais';
const CAPTION = 'The council chamber on Tuesday evening.';
const CREDIT = 'Meridian staff';
/**
 * Prose per block. Only the text-bearing block types render this — an image block
 * renders MediaFigure and never reads its own `text`, which is why the assertions
 * below check the image block's alt text rather than this.
 */
const BLOCK_TEXT: Record<number, string> = {
  28: 'What the levy would fund',
  29: 'The city council voted 6-3 on Tuesday to place a transit measure on the ballot.',
  30: 'Frequency is the whole service.',
};

/** The block ids whose prose should appear in rendered output. */
const PROSE_BLOCK_IDS = [28, 29, 30];

/** Copy for every key the article components resolve, directly or through a child. */
const ARTICLE_COPY: CopySpec[] = [
  ['headline', 'article', article.id, HEADLINE],
  ['dek', 'article', article.id, DEK],
  ['name', 'article_status', status.id, STATUS_NAME],
  ['name', 'section', section.id, SECTION_NAME],
  ['name', 'topic', topic.id, TOPIC_NAME],
  ['name', 'author_profile', author.id, AUTHOR_NAME],
  ['alt_text', 'media_asset', heroImage.id, ALT_TEXT],
  ['caption', 'media_asset', heroImage.id, CAPTION],
  ['credit', 'media_asset', heroImage.id, CREDIT],
  ...Object.entries(BLOCK_TEXT).map(
    ([id, text]) => ['text', 'article_block', Number(id), text] as CopySpec
  ),
];

// ── leaf components ─────────────────────────────────────────────────────────
// These resolve their own copy. If one of these breaks, every parent breaks too,
// so they are asserted first to keep a failure readable.

describe('leaf Camp 2 components resolve their own copy', () => {
  it('SectionLabel', () => {
    const { html, missing } = renderWithCopy(
      SectionLabel,
      { section, locale: LOCALE },
      ARTICLE_COPY
    );
    expect(missing).toEqual([]);
    expect(html).toContain(SECTION_NAME);
  });

  it('TopicTag', () => {
    const { html, missing } = renderWithCopy(TopicTag, { topic, locale: LOCALE }, ARTICLE_COPY);
    expect(missing).toEqual([]);
    expect(html).toContain(TOPIC_NAME);
  });

  it('BylineList', () => {
    const { html, missing } = renderWithCopy(
      BylineList,
      { bylines: [author], locale: LOCALE },
      ARTICLE_COPY
    );
    expect(missing).toEqual([]);
    expect(html).toContain(AUTHOR_NAME);
  });

  it('MediaFigure', () => {
    const { html, missing } = renderWithCopy(
      MediaFigure,
      { asset: heroImage, locale: LOCALE, storageBaseUrl: STORAGE },
      ARTICLE_COPY
    );
    expect(missing).toEqual([]);
    expect(html).toContain(ALT_TEXT);
    expect(html).toContain(CAPTION);
  });

  it('LiveUpdateItem', () => {
    const update = {
      id: 3,
      liveCoverageId: 1,
      publishedAt: '2026-09-30T05:00:00.000Z',
      pinned: false,
      position: 3,
      createdAt: '2026-09-30T05:00:00.000Z',
      text: '',
    };
    const { html, missing } = renderWithCopy(LiveUpdateItem, { update, locale: LOCALE }, [
      ['text', 'live_update', 3, 'Baghdad has not yet issued a statement.'],
    ]);
    expect(missing).toEqual([]);
    expect(html).toContain('Baghdad has not yet issued a statement.');
  });
});

// ── composite components ────────────────────────────────────────────────────
// The regression that shipped. Each of these renders child Camp 2 components, and
// each assertion below fails if the `dictionary` prop is not forwarded to them.

describe('composite components forward `dictionary` to their children', () => {
  it('ArticleBlockRenderer renders every block type, and its MediaFigure', () => {
    for (const block of blocks) {
      const { html, missing } = renderWithCopy(
        ArticleBlockRenderer,
        { block, mediaAssets, storageBaseUrl: STORAGE, locale: LOCALE },
        ARTICLE_COPY
      );
      expect(missing, `block ${block.id} (${block.blockType})`).toEqual([]);
      expect(html, `block ${block.id} (${block.blockType})`).not.toContain('[missing:');
    }

    // The image block reaches MediaFigure, whose copy only resolves if the block
    // renderer forwarded the dictionary to it.
    const imageBlock = blocks.find((block) => block.blockType === 'image')!;
    const { html } = renderWithCopy(
      ArticleBlockRenderer,
      { block: imageBlock, mediaAssets, storageBaseUrl: STORAGE, locale: LOCALE },
      ARTICLE_COPY
    );
    expect(html).toContain(ALT_TEXT);
  });

  it('ArticleCard, in every layout variant', () => {
    for (const variant of ['lead', 'secondary', 'river', 'brief'] as const) {
      const { html, missing } = renderWithCopy(
        ArticleCard,
        {
          article,
          status,
          bylines: [author],
          sections: [section],
          topics: [topic],
          locale: LOCALE,
          variant,
          showStatus: true,
        },
        ARTICLE_COPY
      );

      expect(missing, `variant ${variant}`).toEqual([]);
      expect(html, `variant ${variant}`).not.toContain('[missing:');
      expect(html, `variant ${variant}`).toContain(HEADLINE);
      // Resolved by children: SectionLabel, BylineList, and the status Badge.
      expect(html, `variant ${variant}`).toContain(SECTION_NAME);
      expect(html, `variant ${variant}`).toContain(AUTHOR_NAME);
      expect(html, `variant ${variant}`).toContain(STATUS_NAME);
    }
  });

  it('ArticleView renders the whole article without a sentinel', () => {
    const { html, missing } = renderWithCopy(
      ArticleView,
      {
        article: { ...article, status, bylines: [author], sections: [section], blocks },
        mediaAssets,
        storageBaseUrl: STORAGE,
        locale: LOCALE,
      },
      ARTICLE_COPY
    );

    expect(missing).toEqual([]);
    expect(html).not.toContain('[missing:');
    expect(html).toContain(HEADLINE);
    // Resolved by children: SectionLabel, BylineList, MediaFigure, and one
    // ArticleBlockRenderer per block. Every paragraph of the body is in this list.
    expect(html).toContain(SECTION_NAME);
    expect(html).toContain(AUTHOR_NAME);
    for (const id of PROSE_BLOCK_IDS) {
      expect(html, `block ${id} prose`).toContain(BLOCK_TEXT[id]);
    }
    // The image block reaches MediaFigure two levels down: ArticleView →
    // ArticleBlockRenderer → MediaFigure. Both forwards have to hold for this.
    expect(html).toContain(ALT_TEXT);
    expect(html).toContain(CAPTION);
  });

  it('LiveCoverageView renders each update', () => {
    const coverage: LiveCoverageWithUpdates = {
      id: 1,
      articleId: article.id,
      active: true,
      startedAt: '2026-09-30T02:00:00.000Z',
      endedAt: null,
      updates: [1, 2, 3].map((id) => ({
        id,
        liveCoverageId: 1,
        publishedAt: '2026-09-30T05:00:00.000Z',
        pinned: id === 1,
        position: id,
        createdAt: '2026-09-30T05:00:00.000Z',
        text: '',
      })),
    };

    const updateCopy: CopySpec[] = [
      ['title', 'live_coverage', 1, 'Iraq withdrawal'],
      ['description', 'live_coverage', 1, 'Live updates as the last troops depart.'],
      ['text', 'live_update', 1, 'The Pentagon confirms the withdrawal is complete.'],
      ['text', 'live_update', 2, 'A defense official says the final contingent has flown out.'],
      ['text', 'live_update', 3, 'Baghdad has not yet issued a statement.'],
    ];

    const { html, missing } = renderWithCopy(
      LiveCoverageView,
      { coverage, locale: LOCALE },
      updateCopy
    );

    expect(missing).toEqual([]);
    expect(html).not.toContain('[missing:');
    // Pinned and unpinned updates render through separate LiveUpdateItem call sites.
    expect(html).toContain('The Pentagon confirms the withdrawal is complete.');
    expect(html).toContain('Baghdad has not yet issued a statement.');
  });
});
