<!-- The fields that describe a locale, for the admin's create and edit forms. The page supplies
     the <form>, its action and its submit button. -->
<script lang="ts">
  import { Field, Input, Select, SelectItem } from '@sveltebuilder/coreui';

  type Props = {
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

<div class="locale-form">
  <div class="locale-form__row">
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
  <div class="locale-form__row">
    <Field label={nameLabel} id="{id}-name" required>
      <Input name="name" value={name} required />
    </Field>
    <Field label={nativeNameLabel} id="{id}-native-name" required>
      <Input name="native_name" value={nativeName} required />
    </Field>
  </div>
</div>

<style>
  .locale-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .locale-form__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }
</style>
