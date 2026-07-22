<!-- Camp 2: resolves author names from hermes. -->
<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import type { AuthorProfile } from '../schema/index.js';

  type Props = {
    bylines: AuthorProfile[];
    locale: string;
    linkPrefix?: string;
    class?: string | undefined;
  };

  let { bylines, locale: _locale, linkPrefix = '/author', class: extraClass }: Props = $props();
</script>

{#if bylines.length > 0}
  <span class={['byline-list', extraClass ?? ''].filter(Boolean).join(' ')} aria-label="By">
    <span class="byline-list__label" aria-hidden="true">By</span>
    {#each bylines as author, i (author.id)}
      {#if i > 0}<span aria-hidden="true">{i < bylines.length - 1 ? ', ' : ' and '}</span>{/if}
      <a class="byline-list__link" href={`${linkPrefix}/${author.slug}`}>
        {localText('name', 'author_profile', author.id)}
      </a>
    {/each}
  </span>
{/if}

<style>
  .byline-list {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.125rem;
    align-items: center;
    font-size: var(--text-sm);
    color: var(--text-soft);
  }

  .byline-list__label {
    margin-inline-end: 0.25ch;
  }

  .byline-list__link {
    color: var(--text);
    text-decoration: none;
    font-weight: var(--weight-medium);
  }

  .byline-list__link:hover { color: var(--link-text); }
</style>
