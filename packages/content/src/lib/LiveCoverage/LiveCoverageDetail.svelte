<!-- Camp 2: renders a live coverage page with ordered live updates.
     Coverage title/description resolved via hermes (scope = 'live_coverage'). -->
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
  aria-label="Live coverage"
>
  <header class="live-coverage-detail__header">
    <div class="live-coverage-detail__status" aria-live="polite">
      {#if coverage.active}
        <span class="live-coverage-detail__live-dot" aria-hidden="true"></span>
        <span class="live-coverage-detail__live-label">Live</span>
      {:else}
        <span class="live-coverage-detail__ended-label">Coverage ended</span>
      {/if}
    </div>
    <h1 class="live-coverage-detail__title">{title}</h1>
    {#if description}
      <p class="live-coverage-detail__description">{description}</p>
    {/if}
  </header>

  {#if pinnedUpdates.length > 0}
    <div class="live-coverage-detail__pinned" aria-label="Pinned updates">
      {#each pinnedUpdates as update (update.id)}
        <LiveUpdateCard liveUpdate={update} {locale} {dictionary} />
      {/each}
    </div>
  {/if}

  <div class="live-coverage-detail__updates" aria-label="All updates" aria-live="polite">
    {#each regularUpdates as update (update.id)}
      <LiveUpdateCard liveUpdate={update} {locale} {dictionary} />
    {/each}
    {#if regularUpdates.length === 0 && pinnedUpdates.length === 0}
      <p class="live-coverage-detail__empty">No updates yet.</p>
    {/if}
  </div>
</section>
