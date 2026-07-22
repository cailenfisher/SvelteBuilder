<script lang="ts">
  import { merge } from '@sveltebuilder/hermes';
  import { SectionFront } from '@sveltebuilder/content';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  $effect(() => {
    merge(data.dictionaryPayload, data.locale.code, data.defaultLocale.code);
  });

  const mediaAssets = $derived(
    new Map(
      data.articles.items.flatMap((a) =>
        (a.blocks ?? [])
          .filter((b) => b.mediaAsset != null)
          .map((b) => [BigInt(b.mediaAssetId!), b.mediaAsset!]),
      ),
    ),
  );
</script>

<svelte:head>
  <title>{data.front.section?.name ?? data.front.slug}</title>
</svelte:head>

<main class="section-page">
  <SectionFront
    front={data.front}
    {mediaAssets}
    storageBaseUrl={data.storageBaseUrl}
    locale={data.locale.code}
    sections={data.front.section ? [data.front.section] : []}
  />
</main>

<style>
  .section-page {
    max-width: 80rem;
    margin-inline: auto;
    padding: var(--space-8) var(--space-4);
  }
</style>
