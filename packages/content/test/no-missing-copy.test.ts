/**
 * The gate for entity components' copy resolution.
 *
 * Every entity component resolves its own strings from a dictionary, and takes that
 * dictionary either from context or from an optional `dictionary` prop. Two mistakes
 * are invisible to every other check in the repo:
 *
 *  1. A composite component (ArticleDetail, ArticleCard, ArticleBlockRenderer,
 *     LiveCoverageDetail) renders a child entity component and forgets to forward
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
 * to look, like MediaAssetFigure's `alt` attribute. The HTML scan stays as a backstop.
 */
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createDictionary, type DictionaryPayload } from 'diglossia';
import type { Component } from 'svelte';

import ArticleBlockRenderer from '../src/lib/Article/ArticleBlock/ArticleBlockRenderer.svelte';
import ArticleCard from '../src/lib/Article/ArticleCard.svelte';
import ArticleDetail from '../src/lib/Article/ArticleDetail.svelte';
import ArticleBylineList from '../src/lib/Article/ArticleByline/ArticleBylineList.svelte';
import LiveCoverageDetail from '../src/lib/LiveCoverage/LiveCoverageDetail.svelte';
import LiveUpdateCard from '../src/lib/LiveUpdate/LiveUpdateCard.svelte';
import MediaAssetFigure from '../src/lib/MediaAsset/MediaAssetFigure.svelte';
import SectionLink from '../src/lib/Section/SectionLink.svelte';
import TopicLink from '../src/lib/Topic/TopicLink.svelte';
import { FRONT_LAYOUT_VARIANTS } from '../src/lib/schema/front-layout-variant.js';

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
  embargoExpiresAt: null,
  commentAllowed: true,
  createdAt: '2026-09-29T04:03:54.000Z',
};

const status: ArticleStatus = { id: 5, slug: 'published', position: 50 };

const section: Section = {
  id: 13,
  parentSectionId: 1,
  slug: 'local',
  position: 13,
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
  userAccountId: 1,
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
 * renders MediaAssetFigure and never reads its own `text`, which is why the assertions
 * below check the image block's alt text rather than this.
 */
const BLOCK_TEXT: Record<number, string> = {
  28: 'What the levy would fund',
  29: 'The city council voted 6-3 on Tuesday to place a transit measure on the ballot.',
  30: 'Frequency is the whole service.',
};

/** The block ids whose prose should appear in rendered output. */
const PROSE_BLOCK_IDS = [28, 29, 30];

/** The module's own copy these components render, as the content seed provides it. */
const MODULE_COPY: CopySpec[] = (
    [
      ['content.article_block_renderer.gallery', 'Photo gallery'],
      ['content.article_block_renderer.embed', '{$provider} embed'],
      ['content.article_byline_list.by', 'By'],
      ['content.article_card.topics', 'Topics'],
      ['content.article_detail.published', 'Published {$date}'],
      ['content.article_detail.updated', 'Updated {$date}'],
      ['content.live_coverage_detail.region', 'Live coverage'],
      ['content.live_coverage_detail.live', 'Live'],
      ['content.live_coverage_detail.ended', 'Coverage ended'],
      ['content.live_coverage_detail.pinned', 'Pinned updates'],
      ['content.live_coverage_detail.all', 'All updates'],
      ['content.live_coverage_detail.empty', 'No updates yet.'],
      ['content.live_update.label', 'Live update'],
      ['content.live_update.pinned_label', 'Pinned live update'],
      ['content.live_update.pinned', 'Pinned'],
    ] as const
  ).map(([slug, text]): CopySpec => [slug, 'content', null, text]);

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
  ...MODULE_COPY,
];

// ── leaf components ─────────────────────────────────────────────────────────
// These resolve their own copy. If one of these breaks, every parent breaks too,
// so they are asserted first to keep a failure readable.

describe('leaf entity components resolve their own copy', () => {
  it('SectionLink', () => {
    const { html, missing } = renderWithCopy(
      SectionLink,
      { section, locale: LOCALE },
      ARTICLE_COPY
    );
    expect(missing).toEqual([]);
    expect(html).toContain(SECTION_NAME);
  });

  it('TopicLink', () => {
    const { html, missing } = renderWithCopy(TopicLink, { topic, locale: LOCALE }, ARTICLE_COPY);
    expect(missing).toEqual([]);
    expect(html).toContain(TOPIC_NAME);
  });

  it('ArticleBylineList', () => {
    const { html, missing } = renderWithCopy(
      ArticleBylineList,
      { bylines: [author], locale: LOCALE },
      ARTICLE_COPY
    );
    expect(missing).toEqual([]);
    expect(html).toContain(AUTHOR_NAME);
  });

  it('MediaAssetFigure', () => {
    const { html, missing } = renderWithCopy(
      MediaAssetFigure,
      { asset: heroImage, locale: LOCALE, storageBaseUrl: STORAGE },
      ARTICLE_COPY
    );
    expect(missing).toEqual([]);
    expect(html).toContain(ALT_TEXT);
    expect(html).toContain(CAPTION);
  });

  it('LiveUpdateCard', () => {
    const update = {
      id: 3,
      liveCoverageId: 1,
      publishedAt: '2026-09-30T05:00:00.000Z',
      pinned: false,
      position: 3,
      createdAt: '2026-09-30T05:00:00.000Z',
      text: '',
    };
    const { html, missing } = renderWithCopy(LiveUpdateCard, { liveUpdate: update, locale: LOCALE }, [
      ['text', 'live_update', 3, 'Baghdad has not yet issued a statement.'],
      ...MODULE_COPY,
    ]);
    expect(missing).toEqual([]);
    expect(html).toContain('Baghdad has not yet issued a statement.');
  });
});

// ── composite components ────────────────────────────────────────────────────
// The regression that shipped. Each of these renders child entity components, and
// each assertion below fails if the `dictionary` prop is not forwarded to them.

describe('composite components forward `dictionary` to their children', () => {
  it('ArticleBlockRenderer renders every block type, and its MediaAssetFigure', () => {
    for (const block of blocks) {
      const { html, missing } = renderWithCopy(
        ArticleBlockRenderer,
        { block, mediaAssets, storageBaseUrl: STORAGE, locale: LOCALE },
        ARTICLE_COPY
      );
      expect(missing, `block ${block.id} (${block.blockType})`).toEqual([]);
      expect(html, `block ${block.id} (${block.blockType})`).not.toContain('[missing:');
    }

    // The image block reaches MediaAssetFigure, whose copy only resolves if the block
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
    for (const variant of FRONT_LAYOUT_VARIANTS) {
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
      // Resolved by children: SectionLink, ArticleBylineList, and the status Badge.
      expect(html, `variant ${variant}`).toContain(SECTION_NAME);
      expect(html, `variant ${variant}`).toContain(AUTHOR_NAME);
      expect(html, `variant ${variant}`).toContain(STATUS_NAME);
    }
  });

  it('ArticleDetail renders the whole article without a sentinel', () => {
    const { html, missing } = renderWithCopy(
      ArticleDetail,
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
    // Resolved by children: SectionLink, ArticleBylineList, MediaAssetFigure, and one
    // ArticleBlockRenderer per block. Every paragraph of the body is in this list.
    expect(html).toContain(SECTION_NAME);
    expect(html).toContain(AUTHOR_NAME);
    for (const id of PROSE_BLOCK_IDS) {
      expect(html, `block ${id} prose`).toContain(BLOCK_TEXT[id]);
    }
    // The image block reaches MediaAssetFigure two levels down: ArticleDetail →
    // ArticleBlockRenderer → MediaAssetFigure. Both forwards have to hold for this.
    expect(html).toContain(ALT_TEXT);
    expect(html).toContain(CAPTION);
  });

  it('LiveCoverageDetail renders each update', () => {
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
      ...MODULE_COPY,
    ];

    const { html, missing } = renderWithCopy(
      LiveCoverageDetail,
      { coverage, locale: LOCALE },
      updateCopy
    );

    expect(missing).toEqual([]);
    expect(html).not.toContain('[missing:');
    // Pinned and unpinned updates render through separate LiveUpdateCard call sites.
    expect(html).toContain('The Pentagon confirms the withdrawal is complete.');
    expect(html).toContain('Baghdad has not yet issued a statement.');
  });
});
