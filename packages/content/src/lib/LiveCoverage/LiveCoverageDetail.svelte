<!-- A live coverage page with its updates, newest first and pinned ones on top.
     Title and description come from the dictionary (scope = 'live_coverage'). -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import LiveUpdateCard from '../LiveUpdate/LiveUpdateCard.svelte';
  import type { LiveCoverageWithUpdates } from '../schema/index.js';

  type Props = {
    coverage: LiveCoverageWithUpdates;
    locale: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { coverage, locale, dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const title = $derived(dictionary.localText('title', 'live_coverage', coverage.id));
  const description = $derived(dictionary.localText('description', 'live_coverage', coverage.id));

  const sortedUpdates = $derived(
    [...(coverage.updates ?? [])].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
  );
  const pinnedUpdates = $derived(sortedUpdates.filter((u) => u.pinned));
  const regularUpdates = $derived(sortedUpdates.filter((u) => !u.pinned));
</script>

<section
  class={['live-coverage-detail', extraClass ?? ''].filter(Boolean).join(' ')}
  aria-label={dictionary.localText('content.live_coverage_detail.region', 'content')}
>
  <header class="live-coverage-detail__header">
    <div class="live-coverage-detail__status" aria-live="polite">
      {#if coverage.active}
        <span class="live-coverage-detail__live-dot" aria-hidden="true"></span>
        <span class="live-coverage-detail__live-label"
          >{dictionary.localText('content.live_coverage_detail.live', 'content')}</span
        >
      {:else}
        <span class="live-coverage-detail__ended-label"
          >{dictionary.localText('content.live_coverage_detail.ended', 'content')}</span
        >
      {/if}
    </div>
    <h1 class="live-coverage-detail__title">{title}</h1>
    {#if description}
      <p class="live-coverage-detail__description">{description}</p>
    {/if}
  </header>

  {#if pinnedUpdates.length > 0}
    <section
      class="live-coverage-detail__pinned"
      aria-label={dictionary.localText('content.live_coverage_detail.pinned', 'content')}
    >
      {#each pinnedUpdates as update (update.id)}
        <LiveUpdateCard liveUpdate={update} {locale} {dictionary} />
      {/each}
    </section>
  {/if}

  <section
    class="live-coverage-detail__updates"
    aria-label={dictionary.localText('content.live_coverage_detail.all', 'content')}
    aria-live="polite"
  >
    {#each regularUpdates as update (update.id)}
      <LiveUpdateCard liveUpdate={update} {locale} {dictionary} />
    {/each}
    {#if regularUpdates.length === 0 && pinnedUpdates.length === 0}
      <p class="live-coverage-detail__empty">
        {dictionary.localText('content.live_coverage_detail.empty', 'content')}
      </p>
    {/if}
  </section>
</section>
