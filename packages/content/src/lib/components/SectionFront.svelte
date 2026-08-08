<!-- Camp 2: renders a section front page layout from FrontWithSlots.
     Front title resolved via hermes (scope = 'front').
     Article copy within slots resolved via hermes inside ArticleCard. -->
<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import ArticleCard from './ArticleCard.svelte';
  import type { FrontWithSlots, MediaAsset, Section } from '../schema/index.js';

  type Props = {
    front: FrontWithSlots;
    mediaAssets: Map<bigint, MediaAsset>;
    storageBaseUrl: string;
    locale: string;
    sections: Section[];
    class?: string | undefined;
  };

  let { front, mediaAssets, storageBaseUrl, locale, sections, class: extraClass }: Props = $props();

  const title = $derived(localText('title', 'front', front.id));

  const leadSlots      = $derived((front.slots ?? []).filter((s) => s.layoutVariant === 'lead'));
  const secondarySlots = $derived((front.slots ?? []).filter((s) => s.layoutVariant === 'secondary'));
  const riverSlots     = $derived((front.slots ?? []).filter((s) => s.layoutVariant === 'river'));
  const briefSlots     = $derived((front.slots ?? []).filter((s) => s.layoutVariant === 'brief'));

  const sectionMap = $derived(new Map(sections.map((s) => [s.id, s])));
</script>

<div class={['section-front', extraClass ?? ''].filter(Boolean).join(' ')}>
  {#if title}
    <h2 class="section-front__title">{title}</h2>
  {/if}

  {#if leadSlots.length > 0}
    <div class="section-front__leads" aria-label="Lead stories">
      {#each leadSlots as slot (slot.id)}
        {#if slot.article}
          <ArticleCard
            article={slot.article}
            {mediaAssets}
            {storageBaseUrl}
            {locale}
            sections={slot.article.sections ?? []}
            variant="lead"
          />
        {/if}
      {/each}
    </div>
  {/if}

  {#if secondarySlots.length > 0}
    <div class="section-front__secondary" aria-label="Secondary stories">
      {#each secondarySlots as slot (slot.id)}
        {#if slot.article}
          <ArticleCard
            article={slot.article}
            {mediaAssets}
            {storageBaseUrl}
            {locale}
            sections={slot.article.sections ?? []}
            variant="secondary"
          />
        {/if}
      {/each}
    </div>
  {/if}

  {#if riverSlots.length > 0}
    <div class="section-front__river" aria-label="More stories">
      {#each riverSlots as slot (slot.id)}
        {#if slot.article}
          <ArticleCard
            article={slot.article}
            {mediaAssets}
            {storageBaseUrl}
            {locale}
            sections={slot.article.sections ?? []}
            variant="river"
          />
        {/if}
      {/each}
    </div>
  {/if}

  {#if briefSlots.length > 0}
    <aside class="section-front__briefs" aria-label="Briefs">
      {#each briefSlots as slot (slot.id)}
        {#if slot.article}
          <ArticleCard
            article={slot.article}
            {mediaAssets}
            {storageBaseUrl}
            {locale}
            sections={slot.article.sections ?? []}
            variant="brief"
          />
        {/if}
      {/each}
    </aside>
  {/if}
</div>

<style>
  .section-front {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .section-front__title {
    margin: 0;
    font-size: var(--text-2xl, 1.5rem);
    font-weight: var(--weight-bold);
    color: var(--text);
    padding-block-end: var(--space-4);
    border-block-end: 2px solid var(--text);
  }

  .section-front__leads {
    display: grid;
    gap: var(--space-6);
    grid-template-columns: 1fr;
  }

  @media (min-width: 768px) {
    .section-front__leads {
      grid-template-columns: repeat(auto-fill, minmax(24rem, 1fr));
    }
  }

  .section-front__secondary {
    display: grid;
    gap: var(--space-4);
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  }

  .section-front__river {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-block-start: 1px solid var(--border-color);
  }

  .section-front__briefs {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    padding: var(--space-4);
    background: var(--surface-raised);
    border-radius: var(--radius-lg);
  }
</style>
