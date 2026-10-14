<script lang="ts">
  import { Checkbox, RadioGroup, RadioGroupItem, Switch } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';

  let accepted = $state(true);
  let carrier = $state('ground');
  let layout = $state('list');
  let notify = $state(false);
  let toggled = $state(0);
</script>

<Example title="Checkbox">
  <Checkbox bind:checked={accepted} label="Accept partial shipments" />
  <Checkbox label="Unchecked" />
  <Checkbox indeterminate label="Some lines selected" />
  <Checkbox disabled label="Disabled" />
  <Checkbox checked disabled label="Disabled, checked" />
  <Checkbox size="sm" label="Small" onCheckedChange={() => toggled++} />
  <p role="status">Accept partial: {accepted ? 'yes' : 'no'}. Small toggled {toggled} times.</p>
</Example>

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

<Example title="Switch">
  <Switch bind:checked={notify} label="Email me when stock is low" />
  <Switch size="sm" label="Small" />
  <Switch disabled label="Disabled" />
  <Switch checked disabled label="Disabled, on" />
</Example>
