/**
 * ArticleView lifts the first image block into a hero above the body. It once rendered that
 * block a second time in the body, so a one-image article showed its picture twice. Nothing
 * else catches this: both renders are valid markup and resolve their copy.
 */
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createDictionary, type DictionaryPayload } from 'diglossia';

import ArticleView from '../src/lib/components/ArticleView.svelte';
import type { ArticleBlock, ArticleRenderable, MediaAsset } from '../src/lib/schema/index.js';

const STORAGE = 'https://example.test/storage/v1/object/public';

const imageAsset = (id: number): MediaAsset => ({
  id,
  mediaType: 'image',
  storageKey: `editorial/photo-${id}.jpg`,
  width: 1600,
  height: 900,
  mimeType: 'image/jpeg',
  uploadedBy: 1,
  createdAt: '2026-09-29T00:00:00.000Z',
});

const block = (
  id: number,
  position: number,
  blockType: ArticleBlock['blockType'],
  mediaAssetId: number | null
): ArticleBlock => ({
  id,
  articleId: 7,
  blockType,
  position,
  content: {},
  mediaAssetId,
  createdAt: '2026-09-29T00:00:00.000Z',
});

const articleWith = (blocks: ArticleBlock[]): ArticleRenderable =>
  ({
    id: 7,
    articleStatusId: 5,
    canonicalSlug: 'council-advances-transit-levy',
    publishedAt: null,
    updatedAt: '2026-09-30T06:03:54.000Z',
    deletedAt: null,
    embargoUntil: null,
    allowComment: true,
    createdAt: '2026-09-29T04:03:54.000Z',
    bylines: [],
    sections: [],
    topics: [],
    blocks,
  }) as unknown as ArticleRenderable;

const dictionary = createDictionary([
  {
    link: { id: 1, slug: 'headline', scope: 'article', entityId: 7 },
    content: 'H',
    localeCode: 'en',
  },
  { link: { id: 2, slug: 'dek', scope: 'article', entityId: 7 }, content: 'D', localeCode: 'en' },
  ...[1, 2].map((id) => ({
    link: { id: 10 + id, slug: 'alt_text', scope: 'media_asset', entityId: id },
    content: `Alt ${id}`,
    localeCode: 'en',
  })),
] satisfies DictionaryPayload);

const mediaAssets = new Map([1, 2].map((id) => [id, imageAsset(id)]));

function renderView(blocks: ArticleBlock[], extra: Record<string, unknown> = {}): string {
  const result = render(ArticleView, {
    props: {
      article: articleWith(blocks),
      mediaAssets,
      storageBaseUrl: STORAGE,
      locale: 'en',
      dictionary,
      ...extra,
    },
  });
  return result.body;
}

const count = (html: string, needle: RegExp) => html.match(needle)?.length ?? 0;

describe('ArticleView lead image', () => {
  it('renders a single image block once, as the hero', () => {
    const html = renderView([block(1, 1, 'image', 1)]);
    expect(count(html, /<figure/g)).toBe(1);
    expect(count(html, /photo-1\.jpg/g)).toBe(1);
    expect(html).toContain('article-view__hero');
    expect(html).toContain('loading="eager"');
  });

  it('renders two image blocks as the hero plus the second, in place', () => {
    const html = renderView([
      block(1, 1, 'image', 1),
      block(2, 2, 'paragraph', null),
      block(3, 3, 'image', 2),
    ]);
    expect(count(html, /<figure/g)).toBe(2);
    expect(count(html, /photo-1\.jpg/g)).toBe(1);
    expect(count(html, /photo-2\.jpg/g)).toBe(1);

    const hero = html.slice(html.indexOf('article-view__hero'), html.indexOf('article-view__body'));
    const body = html.slice(html.indexOf('article-view__body'));
    expect(hero).toContain('photo-1.jpg');
    expect(hero).toContain('loading="eager"');
    expect(body).toContain('photo-2.jpg');
    expect(body).toContain('loading="lazy"');
    expect(body).not.toContain('photo-1.jpg');
  });

  it('picks the first image block that has an asset attached', () => {
    const html = renderView([block(1, 1, 'image', null), block(2, 2, 'image', 2)]);
    expect(count(html, /<figure/g)).toBe(1);
    expect(html.slice(html.indexOf('article-view__hero'))).toContain('photo-2.jpg');
  });

  it('with hero={false}, leaves every image in the body and renders no hero', () => {
    const html = renderView([block(1, 1, 'image', 1), block(2, 2, 'image', 2)], { hero: false });
    expect(html).not.toContain('article-view__hero');
    expect(count(html, /<figure/g)).toBe(2);
    expect(html.indexOf('photo-1.jpg')).toBeLessThan(html.indexOf('photo-2.jpg'));
  });
});
