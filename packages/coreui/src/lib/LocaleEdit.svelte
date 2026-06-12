<script lang="ts">
  import Field from './Field.svelte';
  import Input from './Input.svelte';
  import Select from './Select.svelte';
  import SelectItem from './SelectItem.svelte';

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

  // svelte-ignore state_referenced_locally
  let dirValue = $state<string>(dir);
</script>

<div class="locale-edit">
  <div class="row">
    <Field label={codeLabel} id="locale-edit-code" required>
      <Input id="locale-edit-code" name="code" value={code} placeholder="en" required />
    </Field>
    <Field label={dirLabel} id="locale-edit-dir">
      <Select bind:value={dirValue} name="dir">
        <SelectItem value="ltr" label={ltrLabel} />
        <SelectItem value="rtl" label={rtlLabel} />
      </Select>
    </Field>
  </div>
  <div class="row">
    <Field label={nameLabel} id="locale-edit-name" required>
      <Input id="locale-edit-name" name="name" value={name} placeholder="English" required />
    </Field>
    <Field label={nativeNameLabel} id="locale-edit-native-name" required>
      <Input
        id="locale-edit-native-name"
        name="native_name"
        value={nativeName}
        placeholder="English"
        required
      />
    </Field>
  </div>
</div>