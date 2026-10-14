<!-- The inputs that describe one locale's copy for a slug, grouped in a <fieldset>. The page owns
     the <form>, its action and its submit button; a page editing several locales renders one per
     locale, and names each with `legend`. -->
<script lang="ts">
  import './local-text.css';
  import type { Locale } from 'diglossia';
  import { Field, Input, Select, SelectItem, Textarea } from '@sveltebuilder/coreui';

  type Props = {
    /** Names the group for assistive technology and shows as its caption. Omit when the
        surrounding form or section already names it. */
    legend?: string;
    slugLabel: string;
    localeLabel: string;
    contentLabel: string;
    locales: Locale[];
    slug?: string;
    localeId?: number;
    content?: string;
    slugReadonly?: boolean;
  };

  let {
    legend,
    slugLabel,
    localeLabel,
    contentLabel,
    locales,
    slug = '',
    localeId,
    content = '',
    slugReadonly = false,
  }: Props = $props();

  const id = $props.id();

  // svelte-ignore state_referenced_locally
  let selectedLocale = $state(localeId !== undefined ? String(localeId) : '');
</script>

<fieldset class="local-text-fieldset">
  {#if legend}
    <legend class="local-text-fieldset__legend">{legend}</legend>
  {/if}
  <Field label={slugLabel} id="{id}-slug">
    <Input name="slug" value={slug} readonly={slugReadonly} />
  </Field>
  <Field label={localeLabel} id="{id}-locale">
    <Select bind:value={selectedLocale} name="locale_id">
      {#each locales as locale (locale.id)}
        <SelectItem value={String(locale.id)} label={locale.nativeName} />
      {/each}
    </Select>
  </Field>
  <Field label={contentLabel} id="{id}-content">
    <Textarea name="content" value={content} rows={4} />
  </Field>
</fieldset>
