import type { DictionaryInstance } from 'diglossia';
import type { ArticleForStructuredData, PublisherForStructuredData } from './structured-data.js';

export type PublishValidationError = {
  field: string;
  message: string;
};

// ISO 8601 date with explicit timezone offset (Z suffix is valid — it denotes UTC +00:00).
// Rejects naive dates like "2026-06-01T09:00:00" without a timezone suffix.
function hasTimezoneOffset(iso: string): boolean {
  return /Z$|[+-]\d{2}:\d{2}$/.test(iso);
}

// Validates an article is ready to publish and that structured-data fields are
// complete and well-formed. Throws with a list of errors rather than returning.
// Call this in the transition-to-published action before calling transitionArticleStatus.
export function validateArticleForPublish(
  article: ArticleForStructuredData,
  publisher: PublisherForStructuredData | null,
  dictionary: DictionaryInstance
): void {
  const errors: PublishValidationError[] = [];

  // Resolved here rather than read off the row, for the same reason as everything else in this
  // directory: the copy lives in the dictionary, and a baked string could not follow a locale.
  // Which locale this validates in matters — an article is publishable in the locale an editor
  // is working in, and the caller's dictionary is what decides that.
  const headline = dictionary.localText('headline', 'article', article.id);
  const dek = dictionary.localText('dek', 'article', article.id);

  // Required headline
  if (!headline?.trim() || headline.startsWith('[missing:')) {
    errors.push({ field: 'headline', message: 'Headline is required before publishing.' });
  } else if (headline.length > 110) {
    errors.push({
      field: 'headline',
      message: 'Headline exceeds 110 characters (Google News limit).',
    });
  }

  // Required dek / standfirst
  if (!dek?.trim() || dek.startsWith('[missing:')) {
    errors.push({ field: 'dek', message: 'Dek (standfirst) is required before publishing.' });
  }

  // At least one byline
  if (article.bylines.length === 0) {
    errors.push({
      field: 'bylines',
      message: 'At least one byline must be assigned before publishing.',
    });
  }

  // At least one section
  if (article.sections.length === 0) {
    errors.push({
      field: 'sections',
      message: 'At least one section must be assigned before publishing.',
    });
  }

  // At least one body block
  if (article.blocks.length === 0) {
    errors.push({ field: 'blocks', message: 'Article must have at least one body block.' });
  }

  // Every prose block needs text. Resolved from the dictionary, so an unwritten block and one
  // written only in another locale are both caught — publishing a half-translated article is
  // exactly the mistake this is here to prevent.
  const prosyTypes = ['paragraph', 'heading', 'pullquote'];
  for (const block of article.blocks) {
    if (!prosyTypes.includes(block.blockType)) continue;
    const text = dictionary.localText('text', 'article_block', block.id);
    if (!text?.trim() || text.startsWith('[missing:')) {
      errors.push({
        field: `block.${block.id}`,
        message: `Block ${block.position} (${block.blockType}) has no text.`,
      });
    }
  }

  // Images must have alt text (WCAG 2.2 AA, and Google requires it for structured data). The
  // alt text is copy like everything else, keyed on the media asset.
  for (const block of article.blocks) {
    if (block.blockType !== 'image' || block.mediaAssetId === null) continue;
    const altText = dictionary.localText('alt_text', 'media_asset', block.mediaAssetId);
    if (!altText?.trim() || altText.startsWith('[missing:')) {
      errors.push({
        field: `block.${block.id}.altText`,
        message: `Image block ${block.position} is missing alt text. Alt text is required for accessibility (WCAG 2.2 AA) and Google structured data.`,
      });
    }
  }

  // Publisher profile required for structured data
  if (!publisher) {
    errors.push({
      field: 'publisher',
      message:
        'A publisher profile must be configured before publishing (required for NewsArticle structured data).',
    });
  } else {
    const publisherName = dictionary.localText('name', 'publisher_profile', publisher.id);
    if (!publisherName?.trim() || publisherName.startsWith('[missing:')) {
      errors.push({
        field: 'publisher.name',
        message: 'Publisher name is required for structured data.',
      });
    }
    if (!publisher.url?.trim()) {
      errors.push({
        field: 'publisher.url',
        message: 'Publisher URL is required for structured data.',
      });
    }
  }

  // If publishedAt exists, it must carry a timezone offset
  if (article.publishedAt && !hasTimezoneOffset(article.publishedAt)) {
    errors.push({
      field: 'publishedAt',
      message: `datePublished "${article.publishedAt}" lacks a timezone offset. Use ISO 8601 with a timezone (e.g. 2026-06-01T09:00:00Z).`,
    });
  }

  // Embargo sanity check — embargo cannot be in the past on first publish
  if (article.embargoUntil && !article.publishedAt) {
    const embargoDate = new Date(article.embargoUntil);
    if (embargoDate < new Date()) {
      errors.push({
        field: 'embargoUntil',
        message:
          'Embargo date has already passed. Remove the embargo or extend it before publishing.',
      });
    }
  }

  if (errors.length > 0) {
    const messages = errors.map((e) => `[${e.field}] ${e.message}`).join('\n');
    throw new Error(`Article failed publish validation:\n${messages}`);
  }
}
