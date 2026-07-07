import type { ArticleWithCopy, LiveCoverageWithUpdates, PublisherProfileWithCopy } from '../schema/index.js';

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
  article: ArticleWithCopy,
  publisher: PublisherProfileWithCopy,
  options: {
    siteUrl: string;
    locale?: string;
    storageBaseUrl?: string;
  },
): NewsArticleJsonLd {
  const base = options.siteUrl.replace(/\/$/, '');
  const storageBase = options.storageBaseUrl ?? '';
  const articleUrl = `${base}/article/${article.canonicalSlug}`;

  // Lead image: first image block, or first media_asset in any block
  const images: string[] = [];
  for (const block of article.blocks) {
    if (block.blockType === 'image' && block.mediaAsset?.storageKey) {
      images.push(`${storageBase}/${block.mediaAsset.storageKey}`);
      break;
    }
  }
  if (publisher.logo?.storageKey && images.length === 0) {
    images.push(`${storageBase}/${publisher.logo.storageKey}`);
  }

  const ld: NewsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.headline,
    datePublished: toOffsetIso(article.publishedAt ?? article.createdAt),
    dateModified: toOffsetIso(article.updatedAt),
    author: article.bylines.map((b) => ({
      '@type': 'Person' as const,
      name: b.name,
      url: `${base}/author/${b.slug}`,
    })),
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: publisher.name,
      url: publisher.url,
      ...(publisher.logo?.storageKey
        ? { logo: { '@type': 'ImageObject', url: `${storageBase}/${publisher.logo.storageKey}` } }
        : {}),
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    ...(article.dek ? { description: article.dek } : {}),
    ...(options.locale ? { inLanguage: options.locale } : {}),
    ...(images.length > 0 ? { image: images } : {}),
  };

  return ld;
}

export function buildLiveBlogPostingJsonLd(
  article: ArticleWithCopy,
  coverage: LiveCoverageWithUpdates,
  publisher: PublisherProfileWithCopy,
  options: {
    siteUrl: string;
    locale?: string;
    storageBaseUrl?: string;
  },
): LiveBlogPostingJsonLd {
  const base = options.siteUrl.replace(/\/$/, '');

  return {
    '@context': 'https://schema.org',
    '@type': 'LiveBlogPosting',
    headline: article.headline,
    datePublished: toOffsetIso(article.publishedAt ?? article.createdAt),
    dateModified: toOffsetIso(article.updatedAt),
    author: article.bylines.map((b) => ({ '@type': 'Person' as const, name: b.name })),
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: publisher.name,
      url: publisher.url,
      ...(publisher.logo?.storageKey && options.storageBaseUrl
        ? { logo: { '@type': 'ImageObject', url: `${options.storageBaseUrl}/${publisher.logo.storageKey}` } }
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
  article: ArticleWithCopy,
  publisher: PublisherProfileWithCopy,
  options: {
    siteUrl: string;
    locale?: string;
    availableLocales?: string[];
    storageBaseUrl?: string;
    twitterSite?: string;
  },
): Record<string, string> {
  const base = options.siteUrl.replace(/\/$/, '');
  const storageBase = options.storageBaseUrl ?? '';
  const articleUrl = `${base}/article/${article.canonicalSlug}`;

  const leadImage = article.blocks.find(
    (b) => b.blockType === 'image' && b.mediaAsset?.storageKey,
  )?.mediaAsset;

  return {
    // Open Graph
    'og:type': 'article',
    'og:url': articleUrl,
    'og:title': article.headline,
    'og:description': article.dek,
    'og:site_name': publisher.name,
    ...(options.locale ? { 'og:locale': options.locale.replace('-', '_') } : {}),
    ...(leadImage?.storageKey
      ? { 'og:image': `${storageBase}/${leadImage.storageKey}`, 'og:image:alt': leadImage.altText }
      : {}),
    // Twitter / X card
    'twitter:card': leadImage ? 'summary_large_image' : 'summary',
    'twitter:title': article.headline,
    'twitter:description': article.dek,
    ...(options.twitterSite ? { 'twitter:site': options.twitterSite } : {}),
    ...(leadImage?.storageKey
      ? { 'twitter:image': `${storageBase}/${leadImage.storageKey}`, 'twitter:image:alt': leadImage.altText }
      : {}),
    // Canonical
    'canonical': articleUrl,
    // Article meta
    'article:published_time': toOffsetIso(article.publishedAt ?? article.createdAt),
    'article:modified_time': toOffsetIso(article.updatedAt),
    ...(article.sections[0] ? { 'article:section': article.sections[0].name } : {}),
    ...Object.fromEntries(article.tags.map((t, i) => [`article:tag:${i}`, t.name])),
  };
}

// hreflang alternates for <link rel="alternate"> in <head>.
export function buildHreflangAlternates(
  canonicalSlug: string,
  siteUrl: string,
  availableLocales: string[],
): Array<{ hreflang: string; href: string }> {
  const base = siteUrl.replace(/\/$/, '');
  const result = availableLocales.map((locale) => ({
    hreflang: locale,
    href: `${base}/article/${canonicalSlug}`,
  }));
  result.push({ hreflang: 'x-default', href: `${base}/article/${canonicalSlug}` });
  return result;
}
