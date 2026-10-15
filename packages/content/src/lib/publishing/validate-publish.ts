import type { DictionaryInstance } from 'diglossia';
import type { MediaAssetRights, MediaAssetSource } from '../schema/index.js';
import type { ArticleForStructuredData, PublisherForStructuredData } from './structured-data.js';

/**
 * One reason an article cannot be published yet. `slug` is copy in scope `content`
 * (`content.publish_validation.*`), `values` what its message takes; the caller formats it in the
 * editor's language. `field` says what the issue is about, for a caller that marks the field.
 */
export type PublishValidationIssue = {
  field: string;
  slug: string;
  values?: Record<string, string | number>;
};

// ISO 8601 date with explicit timezone offset (Z suffix is valid — it denotes UTC +00:00).
// Rejects naive dates like "2026-06-01T09:00:00" without a timezone suffix.
function hasTimezoneOffset(iso: string): boolean {
  return /Z$|[+-]\d{2}:\d{2}$/.test(iso);
}

/**
 * What publish validation needs to know about an image beyond its copy: its rights row and its
 * provenance row, each null when the asset has none.
 */
export type ImageProvenance = {
  rights: Pick<MediaAssetRights, 'license' | 'creditRequired' | 'expiresAt'> | null;
  source: Pick<MediaAssetSource, 'sourceUrl' | 'licenseUrl'> | null;
};

export type PublishValidationOptions = {
  /**
   * Rights and source for every media asset the article's image blocks refer to, keyed by
   * asset id. The function is pure, so the caller fetches them — both tables are admin-only
   * under RLS, which is who publishes. An image whose id is absent from the map is treated as
   * having neither row.
   *
   * Omit the whole option and image rights are not checked, only alt text — which is what
   * callers that predate it get. Pass it; an unchecked license is how an expired image ships.
   */
  imageProvenance?: ReadonlyMap<number, ImageProvenance>;
  /**
   * The locale being published. Required with `imageProvenance`, because the credit line must
   * be written in it: `dictionary.localText` falls back to the default locale, so a missing
   * French credit would otherwise read as present. The check compares `localeOf` to this.
   */
  locale?: string;
  /** For the license-expiry check. Defaults to the current time; tests pass a fixed one. */
  now?: Date;
};

const isMissing = (text: string | undefined | null): boolean =>
  !text?.trim() || text.startsWith('[missing:');

/**
 * Whether an article is ready to publish, and its structured-data fields complete and well-formed:
 * every reason it is not, or an empty list. Call it in the transition-to-published action before
 * the transition itself.
 *
 * Throws only on a caller's mistake (`imageProvenance` without `locale`), never on the article.
 */
export function validateArticleForPublish(
  article: ArticleForStructuredData,
  publisher: PublisherForStructuredData | null,
  dictionary: DictionaryInstance,
  options: PublishValidationOptions = {}
): PublishValidationIssue[] {
  const errors: PublishValidationIssue[] = [];

  // Resolved here rather than read off the row, for the same reason as everything else in this
  // directory: the copy lives in the dictionary, and a baked string could not follow a locale.
  // Which locale this validates in matters — an article is publishable in the locale an editor
  // is working in, and the caller's dictionary is what decides that.
  const headline = dictionary.localText('headline', 'article', article.id);
  const dek = dictionary.localText('dek', 'article', article.id);

  // Required headline
  if (!headline?.trim() || headline.startsWith('[missing:')) {
    errors.push({ field: 'headline', slug: 'content.publish_validation.headline_required' });
  } else if (headline.length > 110) {
    errors.push({ field: 'headline', slug: 'content.publish_validation.headline_too_long' });
  }

  // Required dek / standfirst
  if (!dek?.trim() || dek.startsWith('[missing:')) {
    errors.push({ field: 'dek', slug: 'content.publish_validation.dek_required' });
  }

  // At least one byline
  if (article.bylines.length === 0) {
    errors.push({ field: 'bylines', slug: 'content.publish_validation.byline_required' });
  }

  // At least one section
  if (article.sections.length === 0) {
    errors.push({ field: 'sections', slug: 'content.publish_validation.section_required' });
  }

  // At least one body block
  if (article.blocks.length === 0) {
    errors.push({ field: 'blocks', slug: 'content.publish_validation.block_required' });
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
        slug: 'content.publish_validation.block_text_missing',
        values: { position: block.position },
      });
    }
  }

  // Images must have alt text (WCAG 2.2 AA, and Google requires it for structured data). The
  // alt text is copy like everything else, keyed on the media asset.
  for (const block of article.blocks) {
    if (block.blockType !== 'image') continue;
    // An image block with nothing attached used to be skipped here, so it passed — and then
    // rendered as an empty gap. It is checked regardless of `options`.
    if (block.mediaAssetId === null) {
      errors.push({
        field: `block.${block.id}.mediaAsset`,
        slug: 'content.publish_validation.image_missing',
        values: { position: block.position },
      });
      continue;
    }
    const altText = dictionary.localText('alt_text', 'media_asset', block.mediaAssetId);
    if (!altText?.trim() || altText.startsWith('[missing:')) {
      errors.push({
        field: `block.${block.id}.altText`,
        slug: 'content.publish_validation.alt_text_missing',
        values: { position: block.position },
      });
    }
  }

  if (options.imageProvenance) {
    errors.push(
      ...validateImageProvenance(article, dictionary, {
        provenance: options.imageProvenance,
        locale: options.locale,
        now: options.now ?? new Date(),
      })
    );
  }

  // Publisher profile required for structured data
  if (!publisher) {
    errors.push({ field: 'publisher', slug: 'content.publish_validation.publisher_missing' });
  } else {
    const publisherName = dictionary.localText('name', 'publisher_profile', publisher.id);
    if (!publisherName?.trim() || publisherName.startsWith('[missing:')) {
      errors.push({ field: 'publisher.name', slug: 'content.publish_validation.publisher_name_missing' });
    }
    if (!publisher.url?.trim()) {
      errors.push({ field: 'publisher.url', slug: 'content.publish_validation.publisher_url_missing' });
    }
  }

  // If publishedAt exists, it must carry a timezone offset
  if (article.publishedAt && !hasTimezoneOffset(article.publishedAt)) {
    errors.push({
      field: 'publishedAt',
      slug: 'content.publish_validation.published_at_offset',
      values: { date: article.publishedAt },
    });
  }

  // Embargo sanity check — embargo cannot be in the past on first publish
  if (article.embargoExpiresAt && !article.publishedAt) {
    const embargoDate = new Date(article.embargoExpiresAt);
    if (embargoDate < new Date()) {
      errors.push({ field: 'embargoExpiresAt', slug: 'content.publish_validation.embargo_passed' });
    }
  }

  return errors;
}

// Whether every image the article shows may be shown: attached, licensed, sourced, in date, and
// credited in the locale being published. Each failure is its own error so an editor sees the
// whole list at once rather than fixing one and meeting the next.
function validateImageProvenance(
  article: ArticleForStructuredData,
  dictionary: DictionaryInstance,
  context: {
    provenance: ReadonlyMap<number, ImageProvenance>;
    locale: string | undefined;
    now: Date;
  }
): PublishValidationIssue[] {
  const errors: PublishValidationIssue[] = [];
  const { provenance, locale, now } = context;

  if (!locale) {
    throw new Error(
      'validateArticleForPublish: `locale` is required when `imageProvenance` is given, to check credits in the locale being published.'
    );
  }

  for (const block of article.blocks) {
    if (block.blockType !== 'image') continue;

    // No-asset blocks were reported above; there is nothing to check provenance of.
    if (block.mediaAssetId === null) continue;

    const { rights, source } = provenance.get(block.mediaAssetId) ?? { rights: null, source: null };

    if (!rights) {
      errors.push({
        field: `block.${block.id}.rights`,
        slug: 'content.publish_validation.rights_missing',
        values: { position: block.position },
      });
    } else {
      if (rights.license === 'creative_commons' && !source?.licenseUrl?.trim()) {
        errors.push({
          field: `block.${block.id}.licenseUrl`,
          slug: 'content.publish_validation.license_url_missing',
          values: { position: block.position },
        });
      }

      if (rights.expiresAt && new Date(rights.expiresAt) < now) {
        errors.push({
          field: `block.${block.id}.expiresAt`,
          slug: 'content.publish_validation.license_expired',
          values: { position: block.position, date: rights.expiresAt.slice(0, 10) },
        });
      }

      const creditRequired = rights.creditRequired || rights.license === 'creative_commons';
      if (creditRequired) {
        const credit = dictionary.localText('credit', 'media_asset', block.mediaAssetId);
        const creditLocale = dictionary.localeOf('credit', 'media_asset', block.mediaAssetId);
        // localText falls back to the default locale, so text alone cannot tell a credit
        // written for this locale from one borrowed from another.
        if (isMissing(credit) || creditLocale !== locale) {
          errors.push({
            field: `block.${block.id}.credit`,
            slug: 'content.publish_validation.credit_missing',
            values: { position: block.position, locale },
          });
        }
      }
    }

    if (!source?.sourceUrl?.trim()) {
      errors.push({
        field: `block.${block.id}.source`,
        slug: 'content.publish_validation.source_missing',
        values: { position: block.position },
      });
    }
  }

  return errors;
}
