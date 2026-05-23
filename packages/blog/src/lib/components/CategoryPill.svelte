<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Badge } from '@sveltebuilder/coreui';
  import type { PostCategory } from '../schema/index.js';

  type Props = {
    category: PostCategory;
    locale: string;
    href?: string;
    class?: string | undefined;
  };

  let { category, locale: _locale, href, class: extraClass }: Props = $props();

  const name = $derived(localText('name', 'post_category', category.id));
</script>

{#if href}
  <a
    {href}
    class={['post-category-pill', extraClass ?? ''].filter(Boolean).join(' ')}
    aria-label={`Filter by category: ${name}`}
  >
    <Badge variant="brand" size="sm">{name}</Badge>
  </a>
{:else}
  <span class={['post-category-pill', extraClass ?? ''].filter(Boolean).join(' ')}>
    <Badge variant="brand" size="sm">{name}</Badge>
  </span>
{/if}

<style>
  .post-category-pill {
    display: inline-flex;
    text-decoration: none;
  }

  a.post-category-pill:hover {
    opacity: 0.8;
  }

  a.post-category-pill:focus-visible {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
    border-radius: var(--radius-full);
  }
</style>
