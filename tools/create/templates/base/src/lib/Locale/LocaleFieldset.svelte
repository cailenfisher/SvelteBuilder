<!-- The inputs that describe a locale, grouped in a <fieldset> for the admin's create and edit
     forms. The page owns the <form>, its action and its submit button. -->
<script lang="ts">
  import { Field, Input, Select, SelectItem } from '@sveltebuilder/coreui';

  type Props = {
    /** Names the group for assistive technology and shows as its caption. Omit when the
        surrounding form or section already names it. */
    legend?: string;
    codeLabel: string;
    nameLabel: string;
    nativeNameLabel: string;
    dirLabel: string;
    ltrLabel: string;
    rtlLabel: string;
    code?: string;
    name?: string;
    nativeName?: string;
    dir?: 'ltr' | 'rtl';
  };

  let {
    legend,
    codeLabel,
    nameLabel,
    nativeNameLabel,
    dirLabel,
    ltrLabel,
    rtlLabel,
    code = '',
    name = '',
    nativeName = '',
    dir = 'ltr',
  }: Props = $props();

  const id = $props.id();

  // svelte-ignore state_referenced_locally
  let dirValue = $state<string>(dir);
</script>

<fieldset class="locale-fieldset">
  {#if legend}
    <legend class="locale-fieldset__legend">{legend}</legend>
  {/if}
  <div class="locale-fieldset__row">
    <Field label={codeLabel} id="{id}-code" required>
      <Input name="code" value={code} required />
    </Field>
    <Field label={dirLabel} id="{id}-dir">
      <Select bind:value={dirValue} name="dir">
        <SelectItem value="ltr" label={ltrLabel} />
        <SelectItem value="rtl" label={rtlLabel} />
      </Select>
    </Field>
  </div>
  <div class="locale-fieldset__row">
    <Field label={nameLabel} id="{id}-name" required>
      <Input name="name" value={name} required />
    </Field>
    <Field label={nativeNameLabel} id="{id}-native-name" required>
      <Input name="native_name" value={nativeName} required />
    </Field>
  </div>
</fieldset>

<style>
  .locale-fieldset {
    margin: 0;
    padding: 0;
    border: 0;
    min-inline-size: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .locale-fieldset__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .locale-fieldset__legend {
    padding: 0;
    margin-block-end: var(--space-2);
    font-weight: var(--weight-semibold);
  }
</style>
