<!-- Camp 2: resolves section name from hermes. -->
<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import type { Section } from '../schema/index.js';

  type Props = {
    section: Section;
    locale: string;
    href?: string;
    class?: string | undefined;
  };

  let { section, locale: _locale, href, class: extraClass }: Props = $props();

  const name = $derived(localText('name', 'section', section.id));
  const sectionHref = $derived(href ?? `/section/${section.slug}`);
</script>

<a class={['section-label', extraClass ?? ''].filter(Boolean).join(' ')} href={sectionHref}>
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
