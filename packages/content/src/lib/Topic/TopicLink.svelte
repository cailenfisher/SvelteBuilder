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
  class={['topic-link', extraClass ?? ''].filter(Boolean).join(' ')}
  href={topicHref}
  lang={nameLocale !== locale ? nameLocale : undefined}
>
  {name}
</a>
