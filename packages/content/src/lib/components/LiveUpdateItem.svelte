<!-- Camp 2: resolves update text from hermes. -->
<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Badge } from '@sveltebuilder/coreui';
  import type { LiveUpdate } from '../schema/index.js';

  type Props = {
    update: LiveUpdate;
    locale: string;
    class?: string | undefined;
  };

  let { update, locale, class: extraClass }: Props = $props();

  const text = $derived(localText('text', 'live_update', update.id));
  const publishedTime = $derived(
    new Intl.DateTimeFormat(locale, { timeStyle: 'short', dateStyle: 'medium' }).format(new Date(update.publishedAt)),
  );
</script>

<article
  class={['live-update-item', update.pinned ? 'live-update-item--pinned' : '', extraClass ?? ''].filter(Boolean).join(' ')}
  aria-label={update.pinned ? 'Pinned live update' : 'Live update'}
>
  <header class="live-update-item__header">
    {#if update.pinned}
      <Badge variant="brand" size="sm">Pinned</Badge>
    {/if}
    <time class="live-update-item__time" datetime={update.publishedAt}>
      {publishedTime}
    </time>
  </header>
  <div class="live-update-item__text">
    {text}
  </div>
</article>

<style>
  .live-update-item {
    padding: var(--space-4);
    border-inline-start: 3px solid var(--border-color);
    transition: border-color var(--duration) var(--ease);
  }

  .live-update-item--pinned {
    border-inline-start-color: var(--brand);
    background: color-mix(in srgb, var(--brand), white 95%);
    border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  }

  .live-update-item__header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-block-end: var(--space-2);
  }

  .live-update-item__time {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-soft);
  }

  .live-update-item__text {
    font-size: var(--text-base);
    line-height: var(--leading-relaxed);
    color: var(--text);
  }
</style>
