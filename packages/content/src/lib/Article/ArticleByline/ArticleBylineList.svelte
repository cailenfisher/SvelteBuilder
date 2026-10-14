<!-- Camp 2: resolves author names via diglossia. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import type { AuthorProfile } from '../../schema/index.js';

  type Props = {
    bylines: AuthorProfile[];
    locale: string;
    linkPrefix?: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let {
    bylines,
    locale,
    linkPrefix = '/author',
    dictionary: dictionaryProp,
    class: extraClass,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();
</script>

{#if bylines.length > 0}
  <span class={['article-byline-list', extraClass ?? ''].filter(Boolean).join(' ')} aria-label="By">
    <span class="article-byline-list__label" aria-hidden="true">By</span>
    {#each bylines as author, i (author.id)}
      {#if i > 0}<span aria-hidden="true">{i < bylines.length - 1 ? ', ' : ' and '}</span>{/if}
      <a
        class="article-byline-list__link"
        href={`${linkPrefix}/${author.slug}`}
        lang={dictionary.localeOf('name', 'author_profile', author.id) !== locale
          ? dictionary.localeOf('name', 'author_profile', author.id)
          : undefined}
      >
        {dictionary.localText('name', 'author_profile', author.id)}
      </a>
    {/each}
  </span>
{/if}
