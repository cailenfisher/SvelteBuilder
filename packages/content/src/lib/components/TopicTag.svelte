<!-- Camp 2: resolves topic name via diglossia. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import type { Topic } from '../schema/index.js';

  type Props = {
    topic: Topic;
    locale: string;
    href?: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { topic, locale, href, dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();
  const name = $derived(dictionary.localText('name', 'topic', topic.id));
  const nameLocale = $derived(dictionary.localeOf('name', 'topic', topic.id));
  const topicHref = $derived(href ?? `/?topic=${topic.slug}`);
</script>

<a
  class={['topic-tag', extraClass ?? ''].filter(Boolean).join(' ')}
  href={topicHref}
  lang={nameLocale !== locale ? nameLocale : undefined}
>
  {name}
</a>

<style>
  .topic-tag {
    display: inline-block;
    padding: 0.2em 0.65em;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-full, 9999px);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--text-soft);
    text-decoration: none;
    transition: background var(--duration) var(--ease), color var(--duration) var(--ease), border-color var(--duration) var(--ease);
    white-space: nowrap;
  }

  .topic-tag:hover {
    background: var(--surface-raised);
    color: var(--text);
    border-color: var(--border-strong);
  }
</style>
