/**
 * Publish validation for images: attached, licensed, sourced, in date, and credited in the
 * locale being published. The reference implementation was an app's own validator, which is
 * where the credit-locale gotcha was found: `localText` falls back to the default locale, so a
 * French article with only an English credit reads as credited unless `localeOf` is compared.
 */
import { describe, expect, it } from 'vitest';
import { createDictionary, type DictionaryPayload } from 'diglossia';

import {
  validateArticleForPublish,
  type ImageProvenance,
} from '../src/lib/publishing/validate-publish.js';
import type { ArticleForStructuredData } from '../src/lib/publishing/structured-data.js';
import type { PublisherProfile } from '../src/lib/schema/index.js';

const NOW = new Date('2026-10-05T12:00:00Z');

type Entry = [slug: string, scope: string, entityId: number, content: string, locale?: string];

const dictionaryOf = (entries: Entry[]) =>
  createDictionary(
    entries.map(([slug, scope, entityId, content, localeCode = 'en'], index) => ({
      link: { id: index + 1, slug, scope, entityId },
      content,
      localeCode,
    })) satisfies DictionaryPayload
  );

const BASE_COPY: Entry[] = [
  ['headline', 'article', 1, 'A headline'],
  ['dek', 'article', 1, 'A dek'],
  ['name', 'publisher_profile', 1, 'The Paper'],
  ['text', 'article_block', 10, 'Some text'],
  ['alt_text', 'media_asset', 4, 'A council chamber'],
];

const publisher = {
  id: 1,
  logoMediaAssetId: null,
  url: 'https://paper.example',
  createdAt: '2026-09-01T00:00:00.000Z',
} as PublisherProfile;

const article = (mediaAssetId: number | null = 4): ArticleForStructuredData =>
  ({
    id: 1,
    articleStatusId: 1,
    canonicalSlug: 'a-story',
    publishedAt: null,
    updatedAt: '2026-10-01T00:00:00.000Z',
    deletedAt: null,
    embargoUntil: null,
    allowComment: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    bylines: [{ id: 1 }],
    sections: [{ id: 1 }],
    topics: [],
    tags: [],
    blocks: [
      {
        id: 10,
        articleId: 1,
        blockType: 'paragraph',
        position: 1,
        content: {},
        mediaAssetId: null,
      },
      { id: 11, articleId: 1, blockType: 'image', position: 2, content: {}, mediaAssetId },
    ],
  }) as unknown as ArticleForStructuredData;

const OK: ImageProvenance = {
  rights: { license: 'royalty_free', creditRequired: false, expiresAt: null },
  source: { sourceUrl: 'https://stock.example/4', licenseUrl: null },
};

function errorsFor(
  entries: Entry[],
  provenance: ImageProvenance | null,
  options: { mediaAssetId?: number | null; locale?: string } = {}
): string[] {
  const imageProvenance = new Map<number, ImageProvenance>(provenance ? [[4, provenance]] : []);
  try {
    validateArticleForPublish(
      article(options.mediaAssetId === undefined ? 4 : options.mediaAssetId),
      publisher,
      dictionaryOf(entries),
      { imageProvenance, locale: options.locale ?? 'en', now: NOW }
    );
    return [];
  } catch (error) {
    return (error as Error).message.split('\n').slice(1);
  }
}

describe('validateArticleForPublish: image provenance', () => {
  it('passes a licensed, sourced, in-date image', () => {
    expect(errorsFor(BASE_COPY, OK)).toEqual([]);
  });

  it('rejects an image block with no asset, even without provenance options', () => {
    expect(() =>
      validateArticleForPublish(article(null), publisher, dictionaryOf(BASE_COPY))
    ).toThrow(/\[block\.11\.mediaAsset\] Image block 2 has no image attached/);
  });

  it('rejects an asset with no rights row', () => {
    expect(errorsFor(BASE_COPY, { rights: null, source: OK.source })).toEqual([
      expect.stringContaining('[block.11.rights]'),
    ]);
  });

  it('rejects an asset with no source recorded', () => {
    expect(errorsFor(BASE_COPY, { rights: OK.rights, source: null })).toEqual([
      expect.stringContaining('[block.11.source]'),
    ]);
    expect(
      errorsFor(BASE_COPY, { rights: OK.rights, source: { sourceUrl: '  ', licenseUrl: null } })
    ).toEqual([expect.stringContaining('[block.11.source]')]);
  });

  it('reports a missing rights row and a missing source together', () => {
    expect(errorsFor(BASE_COPY, null)).toHaveLength(2);
  });

  it('rejects creative_commons without a license URL', () => {
    const copy: Entry[] = [...BASE_COPY, ['credit', 'media_asset', 4, 'Jane Doe']];
    const creativeCommons = (licenseUrl: string | null): ImageProvenance => ({
      rights: { license: 'creative_commons', creditRequired: true, expiresAt: null },
      source: { sourceUrl: 'https://commons.example/4', licenseUrl },
    });

    expect(errorsFor(copy, creativeCommons(null))).toEqual([
      expect.stringContaining('[block.11.licenseUrl]'),
    ]);
    expect(
      errorsFor(copy, creativeCommons('https://creativecommons.org/licenses/by/4.0/'))
    ).toEqual([]);
  });

  it('rejects an expired license, and accepts one that has not expired', () => {
    const withExpiry = (expiresAt: string): ImageProvenance => ({
      ...OK,
      rights: { license: 'rights_managed', creditRequired: false, expiresAt },
    });
    expect(errorsFor(BASE_COPY, withExpiry('2026-10-04T00:00:00Z'))).toEqual([
      expect.stringContaining('[block.11.expiresAt]'),
    ]);
    expect(errorsFor(BASE_COPY, withExpiry('2026-10-06T00:00:00Z'))).toEqual([]);
  });

  it('requires a credit when credit is required, and for creative_commons regardless', () => {
    const required: ImageProvenance = {
      ...OK,
      rights: { license: 'royalty_free', creditRequired: true, expiresAt: null },
    };
    expect(errorsFor(BASE_COPY, required)).toEqual([expect.stringContaining('[block.11.credit]')]);
    expect(errorsFor([...BASE_COPY, ['credit', 'media_asset', 4, 'Jane Doe']], required)).toEqual(
      []
    );

    const creativeCommons: ImageProvenance = {
      rights: { license: 'creative_commons', creditRequired: false, expiresAt: null },
      source: { sourceUrl: 'https://commons.example/4', licenseUrl: 'https://cc.example/by/4.0' },
    };
    expect(errorsFor(BASE_COPY, creativeCommons)).toEqual([
      expect.stringContaining('[block.11.credit]'),
    ]);
  });

  it('does not ask for a credit that is not required', () => {
    expect(errorsFor(BASE_COPY, OK)).toEqual([]);
  });

  it('rejects a credit that exists only in the default locale', () => {
    const required: ImageProvenance = {
      ...OK,
      rights: { license: 'royalty_free', creditRequired: true, expiresAt: null },
    };
    // The dictionary has resolved the French credit to its English fallback.
    const fallback: Entry[] = [
      ...BASE_COPY.map(([slug, scope, id, content]): Entry => [slug, scope, id, content, 'fr']),
      ['credit', 'media_asset', 4, 'Jane Doe', 'en'],
    ];
    expect(errorsFor(fallback, required, { locale: 'fr' })).toEqual([
      expect.stringContaining('[block.11.credit]'),
    ]);

    const written: Entry[] = [
      ...fallback.slice(0, -1),
      ['credit', 'media_asset', 4, 'Jane Doe', 'fr'],
    ];
    expect(errorsFor(written, required, { locale: 'fr' })).toEqual([]);
  });

  it('requires `locale` alongside `imageProvenance`', () => {
    expect(() =>
      validateArticleForPublish(article(), publisher, dictionaryOf(BASE_COPY), {
        imageProvenance: new Map([[4, OK]]),
      })
    ).toThrow(/`locale` is required/);
  });

  it('checks only alt text when no provenance is given', () => {
    expect(() =>
      validateArticleForPublish(article(), publisher, dictionaryOf(BASE_COPY))
    ).not.toThrow();
  });
});
