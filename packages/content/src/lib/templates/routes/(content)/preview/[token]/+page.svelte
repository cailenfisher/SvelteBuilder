<script lang="ts">
  import { merge } from '@sveltebuilder/hermes';
  import { ArticleView } from '@sveltebuilder/content';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  $effect(() => {
    merge(data.dictionaryPayload, data.locale.code, data.defaultLocale.code);
  });

  const mediaAssets = $derived(
    new Map(
      (data.article.blocks ?? [])
        .filter((b) => b.mediaAsset != null)
        .map((b) => [BigInt(b.mediaAssetId!), b.mediaAsset!]),
    ),
  );
</script>

<svelte:head>
  <!-- Prevent search engines from indexing unpublished previews -->
  <meta name="robots" content="noindex, nofollow" />
  <title>[Preview] {data.article.headline}</title>
</svelte:head>

<div class="preview-banner" role="alert" aria-live="polite">
  Preview mode — this article is not published.
</div>

<main class="article-page">
  <ArticleView
    article={data.article}
    {mediaAssets}
    storageBaseUrl={data.storageBaseUrl}
    locale={data.locale.code}
  />
</main>

<style>
  .preview-banner {
    position: sticky;
    top: 0;
    z-index: 100;
    background: color-mix(in srgb, var(--brand), white 80%);
    color: var(--brand);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    text-align: center;
    padding: var(--space-2) var(--space-4);
    border-block-end: 1px solid color-mix(in srgb, var(--brand), white 60%);
  }

  .article-page {
    padding: var(--space-8) var(--space-4);
  }
</style>
