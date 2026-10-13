<!-- The fields that describe one locale's copy for a slug. The page supplies the <form>, its
     action and its submit button; a page editing several locales renders one per locale. -->
<script lang="ts">
  import type { Locale } from 'diglossia';
  import { Field, Input, Select, SelectItem, Textarea } from '@sveltebuilder/coreui';

  type Props = {
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

<div class="local-text-form">
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
</div>

<style>
  .local-text-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
</style>
