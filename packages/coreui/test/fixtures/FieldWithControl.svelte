<script lang="ts">
  import Field from '../../src/lib/Field/Field.svelte';
  import Input from '../../src/lib/Input/Input.svelte';
  import Switch from '../../src/lib/Switch/Switch.svelte';
  import RadioGroup from '../../src/lib/RadioGroup/RadioGroup.svelte';
  import RadioGroupItem from '../../src/lib/RadioGroup/RadioGroupItem.svelte';
  import CustomFieldControl from './CustomFieldControl.svelte';

  type Props = {
    control: 'switch' | 'radio-group' | 'input' | 'custom';
    hint?: string;
    error?: string;
    /** The control's own error, which marks it invalid without the Field rendering a message. */
    controlError?: boolean;
    disabled?: boolean;
  };

  let { control, hint, error, controlError, disabled }: Props = $props();
</script>

<Field id="notify" label="Notify the supplier" {hint} {error} {disabled} required>
  {#if control === 'switch'}
    <Switch />
  {:else if control === 'input'}
    <Input error={controlError} />
  {:else if control === 'custom'}
    <CustomFieldControl />
  {:else}
    <RadioGroup>
      <RadioGroupItem value="email" label="Email" />
    </RadioGroup>
  {/if}
</Field>
