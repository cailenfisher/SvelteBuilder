<!-- An article's bylines: resolves each author's name from the dictionary and joins them with
     the locale's own list grammar. -->
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

  // The locale's own list grammar ("A, B and C", "A, B et C"), with each name replaced by its
  // link: formatToParts marks which parts are names and which are separators.
  const parts = $derived(
    new Intl.ListFormat(locale, { type: 'conjunction' }).formatToParts(
      bylines.map((author) => String(author.id))
    )
  );
  const authorOf = (id: string) => bylines.find((author) => String(author.id) === id);
</script>

{#if bylines.length > 0}
  <span class={['article-byline-list', extraClass ?? ''].filter(Boolean).join(' ')}>
    <span class="article-byline-list__label"
      >{dictionary.localText('content.article_byline_list.by', 'content')}</span
    >
    {#each parts as part, index (index)}
      {@const author = part.type === 'element' ? authorOf(part.value) : undefined}
      {#if author}
        <a
          class="article-byline-list__link"
          href={`${linkPrefix}/${author.slug}`}
          lang={dictionary.localeOf('name', 'author_profile', author.id) !== locale
            ? dictionary.localeOf('name', 'author_profile', author.id)
            : undefined}
        >
          {dictionary.localText('name', 'author_profile', author.id)}
        </a>
      {:else}{part.value}{/if}
    {/each}
  </span>
{/if}
