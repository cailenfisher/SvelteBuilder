/**
 * MediaFigure attribution links, and ArticleCard's picture per layout variant.
 */
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createDictionary } from 'diglossia';

import ArticleCard from '../src/lib/components/ArticleCard.svelte';
import ArticleView from '../src/lib/components/ArticleView.svelte';
import MediaFigure from '../src/lib/components/MediaFigure.svelte';
import type {
  Article,
  ArticleBlock,
  MediaAsset,
  MediaAssetAttribution,
} from '../src/lib/schema/index.js';

const STORAGE = 'https://example.test/storage';

const asset = (id: number): MediaAsset => ({
  id,
  mediaType: 'image',
  storageKey: `photo-${id}.jpg`,
  width: 800,
  height: 600,
  mimeType: 'image/jpeg',
  uploadedBy: 1,
  createdAt: '2026-09-29T00:00:00.000Z',
});

const dictionary = createDictionary([
  {
    link: { id: 1, slug: 'headline', scope: 'article', entityId: 7 },
    content: 'Headline',
    localeCode: 'en',
  },
  { link: { id: 2, slug: 'dek', scope: 'article', entityId: 7 }, content: 'Dek', localeCode: 'en' },
  {
    link: { id: 3, slug: 'alt_text', scope: 'media_asset', entityId: 4 },
    content: 'A chamber',
    localeCode: 'en',
  },
  {
    link: { id: 4, slug: 'credit', scope: 'media_asset', entityId: 4 },
    content: 'Jane Doe',
    localeCode: 'en',
  },
  {
    link: { id: 5, slug: 'caption', scope: 'media_asset', entityId: 4 },
    content: 'The chamber.',
    localeCode: 'en',
  },
]);

const html = (component: never, props: Record<string, unknown>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(component as any, { props: { dictionary, locale: 'en', ...props } }).body;

const attribution = (overrides: Partial<MediaAssetAttribution> = {}): MediaAssetAttribution => ({
  mediaAssetId: 4,
  license: 'creative_commons',
  sourceUrl: 'https://commons.example/photo-4',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  ...overrides,
});

describe('MediaFigure attribution', () => {
  it('links the credit to its source and names the license, linked', () => {
    const out = html(MediaFigure as never, {
      asset: asset(4),
      storageBaseUrl: STORAGE,
      attribution: attribution(),
    });
    expect(out).toContain('href="https://commons.example/photo-4"');
    expect(out).toContain('>Jane Doe</a>');
    expect(out).toContain('href="https://creativecommons.org/licenses/by/4.0/"');
    expect(out).toContain('rel="license noopener"');
    expect(out).toContain('>CC BY 4.0</a>');
  });

  it('renders the credit as plain text without attribution', () => {
    const out = html(MediaFigure as never, { asset: asset(4), storageBaseUrl: STORAGE });
    expect(out).toContain('Jane Doe');
    expect(out).not.toContain('<a ');
  });

  it('never renders a non-http link', () => {
    const out = html(MediaFigure as never, {
      asset: asset(4),
      storageBaseUrl: STORAGE,
      attribution: attribution({
        sourceUrl: 'javascript:alert(1)',
        licenseUrl: 'data:text/html,x',
      }),
    });
    expect(out).not.toContain('<a ');
    expect(out).not.toContain('javascript:');
  });

  it('shows no caption when captioned is false', () => {
    const out = html(MediaFigure as never, {
      asset: asset(4),
      storageBaseUrl: STORAGE,
      captioned: false,
    });
    expect(out).not.toContain('figcaption');
  });
});

describe('ArticleView passes attribution to the hero and the body', () => {
  it('links the license on an in-body image too', () => {
    const block = (id: number, mediaAssetId: number): ArticleBlock => ({
      id,
      articleId: 7,
      blockType: 'image',
      position: id,
      content: {},
      mediaAssetId,
      createdAt: '2026-09-29T00:00:00.000Z',
    });
    const article = {
      id: 7,
      canonicalSlug: 's',
      publishedAt: null,
      updatedAt: '2026-09-30T00:00:00.000Z',
      bylines: [],
      sections: [],
      blocks: [block(1, 3), block(2, 4)],
    };
    const out = html(ArticleView as never, {
      article,
      mediaAssets: new Map([3, 4].map((id) => [id, asset(id)])),
      attributions: new Map([[4, attribution()]]),
      storageBaseUrl: STORAGE,
    });
    expect(out).toContain('>CC BY 4.0</a>');
  });
});

describe('ArticleCard picture', () => {
  const article = {
    id: 7,
    articleStatusId: 1,
    canonicalSlug: 's',
    publishedAt: null,
    updatedAt: '2026-09-30T00:00:00.000Z',
    deletedAt: null,
    embargoUntil: null,
    allowComment: true,
    createdAt: '2026-09-29T00:00:00.000Z',
  } as Article;
  const status = { id: 1, slug: 'published', ordinal: 1 };
  const mediaAssets = new Map([[4, asset(4)]]);
  const blocks = [{ id: 1, blockType: 'image' as const, mediaAssetId: 4 }];

  const card = (variant: string, extra: Record<string, unknown> = {}) =>
    html(ArticleCard as never, {
      article,
      status,
      variant,
      mediaAssets,
      blocks,
      storageBaseUrl: STORAGE,
      ...extra,
    });

  it('shows the lead image on lead, secondary and river, not on brief', () => {
    for (const variant of ['lead', 'secondary', 'river']) {
      expect(card(variant), variant).toContain('photo-4.jpg');
    }
    expect(card('brief')).not.toContain('photo-4.jpg');
  });

  it('never renders a caption or credit in a card', () => {
    expect(card('lead')).not.toContain('figcaption');
  });

  it('keeps the large lead image described, and thumbnails decorative', () => {
    expect(card('lead')).toContain('alt="A chamber"');
    expect(card('river')).toContain('alt=""');
    expect(card('secondary')).toContain('alt=""');
  });

  it("prefers the article's explicit lead image over the first image block", () => {
    const out = card('lead', {
      article: { ...article, leadMediaAssetId: 5 },
      mediaAssets: new Map([4, 5].map((id) => [id, asset(id)])),
    });
    expect(out).toContain('photo-5.jpg');
    expect(out).not.toContain('photo-4.jpg');
  });

  it('renders text only without media props, or when the asset was not fetched', () => {
    expect(card('lead', { mediaAssets: undefined })).not.toContain('<img');
    expect(card('lead', { mediaAssets: new Map() })).not.toContain('<img');
    expect(card('lead', { storageBaseUrl: undefined })).not.toContain('<img');
  });
});
