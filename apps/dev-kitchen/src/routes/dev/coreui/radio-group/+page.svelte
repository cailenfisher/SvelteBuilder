<script lang="ts">
  import { RadioGroup, RadioGroupItem } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';

  let carrier = $state('ground');
  let layout = $state('list');
</script>

<Example title="RadioGroup, vertical">
  <RadioGroup bind:value={carrier} name="carrier">
    <RadioGroupItem value="ground" label="Ground" />
    <RadioGroupItem value="express" label="Express" />
    <RadioGroupItem value="freight" label="Freight" disabled />
  </RadioGroup>
  <p role="status">Carrier: {carrier}</p>
</Example>

<Example title="RadioGroup, horizontal">
  <RadioGroup bind:value={layout} orientation="horizontal" name="layout">
    <RadioGroupItem value="list" label="List" />
    <RadioGroupItem value="grid" label="Grid" />
  </RadioGroup>
</Example>

<Example title="RadioGroup, disabled">
  <RadioGroup value="a" disabled name="locked">
    <RadioGroupItem value="a" label="Locked option A" />
    <RadioGroupItem value="b" label="Locked option B" />
  </RadioGroup>
</Example>
