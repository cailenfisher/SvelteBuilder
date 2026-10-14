<script lang="ts">
  import Field from '../../src/lib/Field/Field.svelte';
  import Switch from '../../src/lib/Switch/Switch.svelte';
  import RadioGroup from '../../src/lib/RadioGroup/RadioGroup.svelte';
  import RadioGroupItem from '../../src/lib/RadioGroup/RadioGroupItem.svelte';

  type Props = { control: 'switch' | 'radio-group'; hint?: string; error?: string };

  let { control, hint, error }: Props = $props();
</script>

<Field id="notify" label="Notify the supplier" {hint} {error} required>
  {#if control === 'switch'}
    <Switch />
  {:else}
    <RadioGroup>
      <RadioGroupItem value="email" label="Email" />
    </RadioGroup>
  {/if}
</Field>
