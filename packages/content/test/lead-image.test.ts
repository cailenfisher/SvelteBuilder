import { describe, expect, it } from 'vitest';
import { selectLeadMediaAssetId } from '../src/lib/publishing/lead-image.js';
import { licenseLabelFromUrl, safeHttpUrl } from '../src/lib/publishing/license.js';
import {
  buildArticleMetaTags,
  buildNewsArticleJsonLd,
} from '../src/lib/publishing/structured-data.js';
import { createDictionary } from 'diglossia';

const blocks = [
  { id: 1, blockType: 'paragraph' as const, mediaAssetId: null },
  { id: 2, blockType: 'image' as const, mediaAssetId: 10 },
  { id: 3, blockType: 'image' as const, mediaAssetId: 20 },
];

describe('selectLeadMediaAssetId', () => {
  it('is the first image block when no lead is chosen', () => {
    expect(selectLeadMediaAssetId({ blocks })).toEqual({ mediaAssetId: 10, blockId: 2 });
    expect(selectLeadMediaAssetId({ blocks, leadMediaAssetId: null })).toEqual({
      mediaAssetId: 10,
      blockId: 2,
    });
  });

  it('prefers the explicit lead, and names the body block showing it', () => {
    expect(selectLeadMediaAssetId({ blocks, leadMediaAssetId: 20 })).toEqual({
      mediaAssetId: 20,
      blockId: 3,
    });
  });

  it('allows a lead the body does not contain', () => {
    expect(selectLeadMediaAssetId({ blocks, leadMediaAssetId: 99 })).toEqual({
      mediaAssetId: 99,
      blockId: null,
    });
  });

  it('skips assets the caller did not fetch, falling back to the block rule', () => {
    const available = (id: number) => id === 20;
    expect(selectLeadMediaAssetId({ blocks, leadMediaAssetId: 99 }, available)).toEqual({
      mediaAssetId: 20,
      blockId: 3,
    });
    expect(selectLeadMediaAssetId({ blocks }, () => false)).toBeNull();
  });

  it('is null for an article with no image', () => {
    expect(selectLeadMediaAssetId({ blocks: [blocks[0]] })).toBeNull();
  });
});

describe('og:image and JSON-LD follow the same lead', () => {
  const article = {
    id: 1,
    canonicalSlug: 'a-story',
    publishedAt: '2026-10-01T00:00:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    leadMediaAssetId: 20,
    blocks,
    bylines: [],
    sections: [],
    tags: [],
    topics: [],
  } as never;
  const publisher = { id: 1, url: 'https://paper.example', logo: null } as never;
  const dictionary = createDictionary([
    {
      link: { id: 1, slug: 'alt_text', scope: 'media_asset', entityId: 20 },
      content: 'Second',
      localeCode: 'en',
    },
  ]);
  const options = {
    siteUrl: 'https://paper.example',
    storageBaseUrl: 'https://cdn.example',
    mediaAssets: new Map([
      [10, { storageKey: 'one.jpg' }],
      [20, { storageKey: 'two.jpg' }],
    ]),
  };

  it('uses the explicit lead for both, and resolves its alt text from the dictionary', () => {
    const tags = buildArticleMetaTags(article, publisher, dictionary, options);
    expect(tags['og:image']).toBe('https://cdn.example/two.jpg');
    expect(tags['og:image:alt']).toBe('Second');
    expect(buildNewsArticleJsonLd(article, publisher, dictionary, options).image).toEqual([
      'https://cdn.example/two.jpg',
    ]);
  });
});

describe('license helpers', () => {
  it('names a Creative Commons license from its URL', () => {
    expect(licenseLabelFromUrl('https://creativecommons.org/licenses/by/4.0/')).toBe('CC BY 4.0');
    expect(licenseLabelFromUrl('https://creativecommons.org/licenses/by-sa/2.0/deed.en')).toBe(
      'CC BY-SA 2.0'
    );
    expect(licenseLabelFromUrl('https://creativecommons.org/publicdomain/zero/1.0/')).toBe(
      'CC0 1.0'
    );
  });

  it('returns null for anything it cannot name', () => {
    expect(licenseLabelFromUrl('https://example.com/licenses/by/4.0/')).toBeNull();
    expect(licenseLabelFromUrl(null)).toBeNull();
  });

  it('only allows http(s) links', () => {
    expect(safeHttpUrl('https://example.com/a')).toBe('https://example.com/a');
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('not a url')).toBeNull();
    expect(safeHttpUrl('')).toBeNull();
  });
});
