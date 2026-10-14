<script lang="ts">
  import Field from '../../src/lib/Field/Field.svelte';
  import Switch from '../../src/lib/Switch/Switch.svelte';
  import RadioGroup from '../../src/lib/RadioGroup/RadioGroup.svelte';
  import RadioItem from '../../src/lib/RadioGroup/RadioItem.svelte';

  type Props = { control: 'switch' | 'radio-group'; hint?: string; error?: string };

  let { control, hint, error }: Props = $props();
</script>

<Field id="notify" label="Notify the supplier" {hint} {error} required>
  {#if control === 'switch'}
    <Switch />
  {:else}
    <RadioGroup>
      <RadioItem value="email" label="Email" />
    </RadioGroup>
  {/if}
</Field>
