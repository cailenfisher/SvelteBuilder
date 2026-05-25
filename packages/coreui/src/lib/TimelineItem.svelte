<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    timestamp?: string;
    label?: string;
    current?: boolean;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    timestamp,
    label,
    current = false,
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['timeline-item', current ? 'timeline-item--current' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<li class={classes}>
  <span class="timeline-item__dot" aria-hidden="true"></span>

  <div class="timeline-item__content">
    {#if label || timestamp}
      <div class="timeline-item__meta">
        {#if label}
          <span class="timeline-item__label">{label}</span>
        {/if}
        {#if timestamp}
          <time class="timeline-item__timestamp" datetime={timestamp}>{timestamp}</time>
        {/if}
      </div>
    {/if}

    <div class="timeline-item__body">
      {@render children()}
    </div>
  </div>
</li>

<style>
  .timeline-item {
    display: flex;
    gap: var(--space-3);
    padding-block-end: var(--space-4);
    position: relative;
  }

  .timeline-item:last-child {
    padding-block-end: 0;
  }

  .timeline-item__dot {
    flex-shrink: 0;
    width: var(--space-3);
    height: var(--space-3);
    border-radius: 50%;
    border: 2px solid var(--color-border-default);
    background-color: var(--color-surface-default);
    margin-block-start: calc(var(--text-sm) * var(--leading-normal) / 2 - var(--space-3) / 2);
    position: relative;
    z-index: 1;
  }

  .timeline-item--current .timeline-item__dot {
    border-color: var(--color-border-brand);
    background-color: var(--color-brand-subtle);
  }

  .timeline-item__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .timeline-item__meta {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .timeline-item__label {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-primary);
  }

  .timeline-item__timestamp {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .timeline-item__body {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: var(--leading-relaxed);
  }
</style>
