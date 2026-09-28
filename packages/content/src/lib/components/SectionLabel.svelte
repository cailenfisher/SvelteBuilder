<!-- Camp 2: resolves section name via diglossia. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import type { Section } from '../schema/index.js';

  type Props = {
    section: Section;
    locale: string;
    href?: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { section, locale, href, dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();
  const name = $derived(dictionary.localText('name', 'section', section.id));
  const nameLocale = $derived(dictionary.localeOf('name', 'section', section.id));
  const sectionHref = $derived(href ?? `/section/${section.slug}`);
</script>

<a
  class={['section-label', extraClass ?? ''].filter(Boolean).join(' ')}
  href={sectionHref}
  lang={nameLocale !== locale ? nameLocale : undefined}
>
  {name}
</a>

<style>
  .section-label {
    display: inline-block;
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--brand);
    text-decoration: none;
  }

  .section-label:hover { color: color-mix(in srgb, var(--brand), black 20%); }
</style>
