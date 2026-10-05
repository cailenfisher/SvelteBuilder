import type { ArticleBlock } from '../schema/index.js';

/** The slice of an article the lead-image rule reads. */
export type ArticleForLeadImage = {
  leadMediaAssetId?: number | null;
  blocks: Pick<ArticleBlock, 'id' | 'blockType' | 'mediaAssetId'>[];
};

export type LeadImage = {
  mediaAssetId: number;
  /**
   * The body block that shows the same asset, when there is one — the block a page that renders
   * the lead above the body should skip, so the picture is not shown twice. Null when the editor
   * chose an asset the body does not contain.
   */
  blockId: number | null;
};

/**
 * Which image leads an article: the one in its social cards, its structured data, its page hero
 * and its card thumbnails. One rule, here, because those four used to each pick "the first image
 * block" for themselves and could only ever agree by accident.
 *
 * The editor's explicit `leadMediaAssetId` wins; without one, the first image block with an
 * asset attached does. `available` narrows the candidates to assets the caller actually fetched,
 * so an explicit lead that was not loaded falls through to the block rule rather than leaving
 * the page with no image.
 */
export function selectLeadMediaAssetId(
  article: ArticleForLeadImage,
  available?: (mediaAssetId: number) => boolean
): LeadImage | null {
  const usable = (mediaAssetId: number | null | undefined): mediaAssetId is number =>
    mediaAssetId != null && (available?.(mediaAssetId) ?? true);

  const imageBlocks = article.blocks.filter((block) => block.blockType === 'image');

  if (usable(article.leadMediaAssetId)) {
    const matching = imageBlocks.find((block) => block.mediaAssetId === article.leadMediaAssetId);
    return { mediaAssetId: article.leadMediaAssetId, blockId: matching?.id ?? null };
  }

  const first = imageBlocks.find((block) => usable(block.mediaAssetId));
  return first && first.mediaAssetId != null
    ? { mediaAssetId: first.mediaAssetId, blockId: first.id }
    : null;
}
