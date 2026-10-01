import type { DictionaryInstance } from 'diglossia';
import type {
  ArticleRenderable,
  LiveCoverageWithUpdates,
  PublisherProfile,
  Tag,
  Topic,
} from '../schema/index.js';

// headline/dek are resolved through the dictionary passed to each builder below,
// not read as bare fields — closes the second resolution path these helpers used
// to need since they run in +server.ts / +page.svelte outside component context.
/**
 * What the builders below need from an article: its structure, not its copy.
 *
 * They already take a DictionaryInstance and resolve the headline and dek through it. They
 * used to read byline, section and tag names as baked strings on the enriched types instead,
 * which was the same job done two ways — and the baked half could not follow a locale switch,
 * because those strings were resolved once by whatever query produced the row. Everything is
 * resolved through the dictionary now, so this input is narrow enough for a loader that ships
 * a copy payload. Any ArticleWithCopy still satisfies it.
 */
export type ArticleForStructuredData = ArticleRenderable & {
  topics: Topic[];
  tags: Tag[];
};

/**
 * Likewise the publisher: `url` is structural, the name and logo are resolved by id.
 */
export type PublisherForStructuredData = PublisherProfile & {
  logo?: { storageKey: string } | null;
};

/**
 * Media assets the article's blocks refer to, keyed by id.
 *
 * Passed alongside rather than embedded on each block, the same way ArticleView takes them: a
 * block row carries only mediaAssetId, and which assets were actually fetched is the loader's
 * decision, not something these pure functions should imply.
 */
export type MediaAssetLookup = Map<number, { storageKey: string }>;

// Converts an ISO timestamp to RFC 3339 with explicit timezone offset.
// Google requires timezone-offset dates (not naive UTC) in structured data.
function toOffsetIso(iso: string): string {
  const d = new Date(iso);
  // toISOString() always returns UTC with 'Z' suffix — valid RFC 3339.
  return d.toISOString();
}

export type NewsArticleJsonLd = {
  '@context': 'https://schema.org';
  '@type': 'NewsArticle';
  headline: string;
  image?: string[];
  datePublished: string;
  dateModified: string;
  author: Array<{ '@type': 'Person'; name: string; url?: string }>;
  publisher: {
    '@type': 'NewsMediaOrganization';
    name: string;
    logo?: { '@type': 'ImageObject'; url: string };
    url: string;
  };
  description?: string;
  mainEntityOfPage?: { '@type': 'WebPage'; '@id': string };
  inLanguage?: string;
};

export type LiveBlogPostingJsonLd = {
  '@context': 'https://schema.org';
  '@type': 'LiveBlogPosting';
  headline: string;
  datePublished: string;
  dateModified: string;
  author: Array<{ '@type': 'Person'; name: string }>;
  publisher: NewsArticleJsonLd['publisher'];
  coverageStartTime: string;
  coverageEndTime?: string;
  liveBlogUpdate: Array<{
    '@type': 'BlogPosting';
    datePublished: string;
    articleBody: string;
  }>;
};

export function buildNewsArticleJsonLd(
  article: ArticleForStructuredData,
  publisher: PublisherForStructuredData,
  dictionary: DictionaryInstance,
  options: {
    siteUrl: string;
    locale?: string;
    storageBaseUrl?: string;
    mediaAssets?: MediaAssetLookup;
  }
): NewsArticleJsonLd {
  const base = options.siteUrl.replace(/\/$/, '');
  const storageBase = options.storageBaseUrl ?? '';
  const articleUrl = `${base}/article/${article.canonicalSlug}`;
  const headline = dictionary.localText('headline', 'article', article.id);
  const dek = dictionary.localText('dek', 'article', article.id);

  // Lead image: the first image block that has an asset we were given.
  const mediaAssets = options.mediaAssets ?? new Map();
  const images: string[] = [];
  for (const block of article.blocks) {
    const asset = block.mediaAssetId === null ? null : mediaAssets.get(block.mediaAssetId);
    if (block.blockType === 'image' && asset?.storageKey) {
      images.push(`${storageBase}/${asset.storageKey}`);
      break;
    }
  }
  const publisherName = dictionary.localText('name', 'publisher_profile', publisher.id);
  if (publisher.logo?.storageKey && images.length === 0) {
    images.push(`${storageBase}/${publisher.logo.storageKey}`);
  }

  const ld: NewsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    datePublished: toOffsetIso(article.publishedAt ?? article.createdAt),
    dateModified: toOffsetIso(article.updatedAt),
    author: article.bylines.map((b) => ({
      '@type': 'Person' as const,
      name: dictionary.localText('name', 'author_profile', b.id),
      url: `${base}/author/${b.slug}`,
    })),
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: publisherName,
      url: publisher.url,
      ...(publisher.logo?.storageKey
        ? { logo: { '@type': 'ImageObject', url: `${storageBase}/${publisher.logo.storageKey}` } }
        : {}),
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    ...(dek ? { description: dek } : {}),
    ...(options.locale ? { inLanguage: options.locale } : {}),
    ...(images.length > 0 ? { image: images } : {}),
  };

  return ld;
}

export function buildLiveBlogPostingJsonLd(
  article: ArticleForStructuredData,
  coverage: LiveCoverageWithUpdates,
  publisher: PublisherForStructuredData,
  dictionary: DictionaryInstance,
  options: {
    siteUrl: string;
    locale?: string;
    storageBaseUrl?: string;
  }
): LiveBlogPostingJsonLd {
  const publisherName = dictionary.localText('name', 'publisher_profile', publisher.id);

  return {
    '@context': 'https://schema.org',
    '@type': 'LiveBlogPosting',
    headline: dictionary.localText('headline', 'article', article.id),
    datePublished: toOffsetIso(article.publishedAt ?? article.createdAt),
    dateModified: toOffsetIso(article.updatedAt),
    author: article.bylines.map((b) => ({
      '@type': 'Person' as const,
      name: dictionary.localText('name', 'author_profile', b.id),
    })),
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: publisherName,
      url: publisher.url,
      ...(publisher.logo?.storageKey && options.storageBaseUrl
        ? {
            logo: {
              '@type': 'ImageObject',
              url: `${options.storageBaseUrl}/${publisher.logo.storageKey}`,
            },
          }
        : {}),
    },
    coverageStartTime: toOffsetIso(coverage.startedAt),
    ...(coverage.endedAt ? { coverageEndTime: toOffsetIso(coverage.endedAt) } : {}),
    liveBlogUpdate: coverage.updates.map((u) => ({
      '@type': 'BlogPosting',
      datePublished: toOffsetIso(u.publishedAt),
      articleBody: u.text,
    })),
  };
}

// Open Graph / Twitter card meta tags as a key-value record.
export function buildArticleMetaTags(
  article: ArticleForStructuredData,
  publisher: PublisherForStructuredData,
  dictionary: DictionaryInstance,
  options: {
    siteUrl: string;
    locale?: string;
    availableLocales?: string[];
    storageBaseUrl?: string;
    twitterSite?: string;
    mediaAssets?: MediaAssetLookup;
  }
): Record<string, string> {
  const base = options.siteUrl.replace(/\/$/, '');
  const storageBase = options.storageBaseUrl ?? '';
  const articleUrl = `${base}/article/${article.canonicalSlug}`;
  const headline = dictionary.localText('headline', 'article', article.id);
  const dek = dictionary.localText('dek', 'article', article.id);

  const publisherName = dictionary.localText('name', 'publisher_profile', publisher.id);
  const mediaAssets = options.mediaAssets ?? new Map();
  const leadImage = article.blocks
    .filter((b) => b.blockType === 'image' && b.mediaAssetId !== null)
    .map((b) => mediaAssets.get(b.mediaAssetId as number))
    .find((asset) => asset?.storageKey);

  return {
    // Open Graph
    'og:type': 'article',
    'og:url': articleUrl,
    'og:title': headline,
    'og:description': dek,
    'og:site_name': dictionary.localText('name', 'publisher_profile', publisher.id),
    ...(options.locale ? { 'og:locale': options.locale.replace('-', '_') } : {}),
    ...(leadImage?.storageKey
      ? { 'og:image': `${storageBase}/${leadImage.storageKey}`, 'og:image:alt': leadImage.altText }
      : {}),
    // Twitter / X card
    'twitter:card': leadImage ? 'summary_large_image' : 'summary',
    'twitter:title': headline,
    'twitter:description': dek,
    ...(options.twitterSite ? { 'twitter:site': options.twitterSite } : {}),
    ...(leadImage?.storageKey
      ? {
          'twitter:image': `${storageBase}/${leadImage.storageKey}`,
          'twitter:image:alt': leadImage.altText,
        }
      : {}),
    // Canonical
    canonical: articleUrl,
    // Article meta
    'article:published_time': toOffsetIso(article.publishedAt ?? article.createdAt),
    'article:modified_time': toOffsetIso(article.updatedAt),
    ...(article.sections[0]
      ? { 'article:section': dictionary.localText('name', 'section', article.sections[0].id) }
      : {}),
    ...Object.fromEntries(
      article.tags.map((t, i) => [`article:tag:${i}`, dictionary.localText('name', 'tag', t.id)])
    ),
  };
}

// hreflang alternates for <link rel="alternate"> in <head>.
export function buildHreflangAlternates(
  canonicalSlug: string,
  siteUrl: string,
  availableLocales: string[]
): Array<{ hreflang: string; href: string }> {
  const base = siteUrl.replace(/\/$/, '');
  const result = availableLocales.map((locale) => ({
    hreflang: locale,
    href: `${base}/article/${canonicalSlug}`,
  }));
  result.push({ hreflang: 'x-default', href: `${base}/article/${canonicalSlug}` });
  return result;
}
