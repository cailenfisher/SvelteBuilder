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
    ['timeline-item', current ? 'current' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );
</script>

<li class={classes}>
  <span class="dot" aria-hidden="true"></span>

  <div class="content">
    {#if label || timestamp}
      <div class="meta">
        {#if label}
          <span class="label">{label}</span>
        {/if}
        {#if timestamp}
          <time class="timestamp" datetime={timestamp}>{timestamp}</time>
        {/if}
      </div>
    {/if}

    <div class="body">
      {@render children()}
    </div>
  </div>
</li>