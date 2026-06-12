<script lang="ts">
  import Field from './Field.svelte';
  import Input from './Input.svelte';
  import Textarea from './Textarea.svelte';
  import Select from './Select.svelte';
  import SelectItem from './SelectItem.svelte';

  type Locale = { id: number; code: string; nativeName: string };

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

  // svelte-ignore state_referenced_locally
  let selectedLocale = $state(localeId !== undefined ? String(localeId) : '');
</script>

<div class="local-text-edit">
  <Field label={slugLabel} id="lte-slug">
    <Input id="lte-slug" name="slug" value={slug} readonly={slugReadonly} />
  </Field>
  <Field label={localeLabel} id="lte-locale">
    <Select bind:value={selectedLocale} name="locale_id">
      {#each locales as locale (locale.id)}
        <SelectItem value={String(locale.id)} label={locale.nativeName} />
      {/each}
    </Select>
  </Field>
  <Field label={contentLabel} id="lte-content">
    <Textarea id="lte-content" name="content" value={content} rows={4} />
  </Field>
</div>