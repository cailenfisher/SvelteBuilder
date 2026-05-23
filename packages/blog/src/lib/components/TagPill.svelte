<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Badge } from '@sveltebuilder/coreui';
  import type { PostTag } from '../schema/index.js';

  type Props = {
    tag: PostTag;
    locale: string;
    href?: string;
    class?: string | undefined;
  };

  let { tag, locale: _locale, href, class: extraClass }: Props = $props();

  const name = $derived(localText('name', 'post_tag', tag.id));
</script>

{#if href}
  <a
    {href}
    class={['post-tag-pill', extraClass ?? ''].filter(Boolean).join(' ')}
    aria-label={`Filter by tag: ${name}`}
  >
    <Badge variant="default" size="sm">{name}</Badge>
  </a>
{:else}
  <span class={['post-tag-pill', extraClass ?? ''].filter(Boolean).join(' ')}>
    <Badge variant="default" size="sm">{name}</Badge>
  </span>
{/if}

<style>
  .post-tag-pill {
    display: inline-flex;
    text-decoration: none;
  }

  a.post-tag-pill:hover {
    opacity: 0.8;
  }

  a.post-tag-pill:focus-visible {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
    border-radius: var(--radius-full);
  }
</style>
