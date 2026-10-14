<!-- Camp 2: renders a section front page layout from FrontWithSlots.
     Front title resolved via hermes (scope = 'front').
     Article copy within slots resolved via hermes inside ArticleCard. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import ArticleCard from '../Article/ArticleCard.svelte';
  import type { FrontWithSlots, MediaAsset } from '../schema/index.js';

  type Props = {
    front: FrontWithSlots;
    mediaAssets: Map<number, MediaAsset>;
    storageBaseUrl: string;
    locale: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let {
    front,
    mediaAssets,
    storageBaseUrl,
    locale,
    dictionary: dictionaryProp,
    class: extraClass,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const title = $derived(dictionary.localText('title', 'front', front.id));

  const leadSlots = $derived((front.slots ?? []).filter((s) => s.layoutVariant === 'lead'));
  const secondarySlots = $derived(
    (front.slots ?? []).filter((s) => s.layoutVariant === 'secondary')
  );
  const riverSlots = $derived((front.slots ?? []).filter((s) => s.layoutVariant === 'river'));
  const briefSlots = $derived((front.slots ?? []).filter((s) => s.layoutVariant === 'brief'));
</script>

<div class={['front-detail', extraClass ?? ''].filter(Boolean).join(' ')}>
  {#if title}
    <h2 class="front-detail__title">{title}</h2>
  {/if}

  {#if leadSlots.length > 0}
    <div class="front-detail__leads" aria-label="Lead stories">
      {#each leadSlots as slot (slot.id)}
        {#if slot.article}
          <ArticleCard
            article={slot.article}
            {mediaAssets}
            blocks={slot.article.blocks}
            {storageBaseUrl}
            {locale}
            status={slot.article.status}
            {dictionary}
            sections={slot.article.sections ?? []}
            variant="lead"
          />
        {/if}
      {/each}
    </div>
  {/if}

  {#if secondarySlots.length > 0}
    <div class="front-detail__secondary" aria-label="Secondary stories">
      {#each secondarySlots as slot (slot.id)}
        {#if slot.article}
          <ArticleCard
            article={slot.article}
            {mediaAssets}
            blocks={slot.article.blocks}
            {storageBaseUrl}
            {locale}
            status={slot.article.status}
            {dictionary}
            sections={slot.article.sections ?? []}
            variant="secondary"
          />
        {/if}
      {/each}
    </div>
  {/if}

  {#if riverSlots.length > 0}
    <div class="front-detail__river" aria-label="More stories">
      {#each riverSlots as slot (slot.id)}
        {#if slot.article}
          <ArticleCard
            article={slot.article}
            {mediaAssets}
            blocks={slot.article.blocks}
            {storageBaseUrl}
            {locale}
            status={slot.article.status}
            {dictionary}
            sections={slot.article.sections ?? []}
            variant="river"
          />
        {/if}
      {/each}
    </div>
  {/if}

  {#if briefSlots.length > 0}
    <aside class="front-detail__briefs" aria-label="Briefs">
      {#each briefSlots as slot (slot.id)}
        {#if slot.article}
          <ArticleCard
            article={slot.article}
            {mediaAssets}
            blocks={slot.article.blocks}
            {storageBaseUrl}
            {locale}
            status={slot.article.status}
            {dictionary}
            sections={slot.article.sections ?? []}
            variant="brief"
          />
        {/if}
      {/each}
    </aside>
  {/if}
</div>

<style>
  .front-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .front-detail__title {
    margin: 0;
    font-size: var(--text-2xl, 1.5rem);
    font-weight: var(--weight-bold);
    color: var(--text);
    padding-block-end: var(--space-4);
    border-block-end: 2px solid var(--text);
  }

  .front-detail__leads {
    display: grid;
    gap: var(--space-6);
    grid-template-columns: 1fr;
  }

  @media (min-width: 768px) {
    .front-detail__leads {
      grid-template-columns: repeat(auto-fill, minmax(24rem, 1fr));
    }
  }

  .front-detail__secondary {
    display: grid;
    gap: var(--space-4);
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  }

  .front-detail__river {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-block-start: 1px solid var(--border-color);
  }

  .front-detail__briefs {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    padding: var(--space-4);
    background: var(--surface-raised);
    border-radius: var(--radius-lg);
  }
</style>
