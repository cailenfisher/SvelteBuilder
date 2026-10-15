<!-- Renders a front's layout from FrontWithSlots.
     The front's title comes from the dictionary (scope = 'front'); each slot's article copy is
     resolved by ArticleCard. -->
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
    <div class="front-detail__leads">
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
    <div class="front-detail__secondary">
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
    <div class="front-detail__river">
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
    <aside
      class="front-detail__briefs"
      aria-label={dictionary.localText('content.front_detail.brief', 'content')}
    >
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
