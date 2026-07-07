<!-- Camp 2: renders a live coverage page with ordered live updates.
     Coverage title/description resolved via hermes (scope = 'live_coverage'). -->
<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import LiveUpdateItem from './LiveUpdateItem.svelte';
  import type { LiveCoverageWithUpdates } from '../schema/index.js';

  type Props = {
    coverage: LiveCoverageWithUpdates;
    locale: string;
    class?: string | undefined;
  };

  let { coverage, locale, class: extraClass }: Props = $props();

  const title       = $derived(localText('title',       'live_coverage', coverage.id));
  const description = $derived(localText('description', 'live_coverage', coverage.id));

  const sortedUpdates = $derived(
    [...(coverage.updates ?? [])].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    ),
  );
  const pinnedUpdates  = $derived(sortedUpdates.filter((u) => u.pinned));
  const regularUpdates = $derived(sortedUpdates.filter((u) => !u.pinned));
</script>

<section
  class={['live-coverage-view', extraClass ?? ''].filter(Boolean).join(' ')}
  aria-label="Live coverage"
>
  <header class="live-coverage-view__header">
    <div class="live-coverage-view__status" aria-live="polite">
      {#if coverage.active}
        <span class="live-coverage-view__live-dot" aria-hidden="true"></span>
        <span class="live-coverage-view__live-label">Live</span>
      {:else}
        <span class="live-coverage-view__ended-label">Coverage ended</span>
      {/if}
    </div>
    <h1 class="live-coverage-view__title">{title}</h1>
    {#if description}
      <p class="live-coverage-view__description">{description}</p>
    {/if}
  </header>

  {#if pinnedUpdates.length > 0}
    <div class="live-coverage-view__pinned" aria-label="Pinned updates">
      {#each pinnedUpdates as update (update.id)}
        <LiveUpdateItem {update} {locale} />
      {/each}
    </div>
  {/if}

  <div class="live-coverage-view__updates" aria-label="All updates" aria-live="polite">
    {#each regularUpdates as update (update.id)}
      <LiveUpdateItem {update} {locale} />
    {/each}
    {#if regularUpdates.length === 0 && pinnedUpdates.length === 0}
      <p class="live-coverage-view__empty">No updates yet.</p>
    {/if}
  </div>
</section>

<style>
  .live-coverage-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .live-coverage-view__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding-block-end: var(--space-4);
    border-block-end: 1px solid var(--border-color);
  }

  .live-coverage-view__status {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .live-coverage-view__live-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: var(--radius-full, 9999px);
    background: var(--color-error, #dc2626);
    animation: live-pulse 2s ease-in-out infinite;
  }

  @keyframes live-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .live-coverage-view__live-label {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-error, #dc2626);
  }

  .live-coverage-view__ended-label {
    font-size: var(--text-sm);
    color: var(--text-soft);
    font-style: italic;
  }

  .live-coverage-view__title {
    margin: 0;
    font-size: var(--text-2xl, 1.5rem);
    font-weight: var(--weight-bold);
    line-height: var(--leading-tight);
    color: var(--text);
  }

  .live-coverage-view__description {
    margin: 0;
    font-size: var(--text-base);
    color: var(--text-soft);
    line-height: var(--leading-relaxed);
  }

  .live-coverage-view__pinned {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .live-coverage-view__updates {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .live-coverage-view__empty {
    margin: 0;
    font-size: var(--text-base);
    color: var(--text-soft);
    font-style: italic;
    text-align: center;
    padding: var(--space-8) 0;
  }
</style>
