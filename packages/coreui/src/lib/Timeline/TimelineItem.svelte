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