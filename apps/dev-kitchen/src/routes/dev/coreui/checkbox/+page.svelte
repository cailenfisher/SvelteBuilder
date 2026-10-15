<script lang="ts">
  import { Checkbox } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
  import CallbackLog from '$lib/CallbackLog/CallbackLog.svelte';

  let accepted = $state(true);
  let toggled = $state(0);

  let controlledChecked = $state(false);
  const controlledCalls: boolean[] = $state([]);
  let boundChecked = $state(false);
  const boundCalls: boolean[] = $state([]);
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

<Example title="Callbacks">
  <Checkbox
    checked={controlledChecked}
    onCheckedChange={(next) => {
      controlledCalls.push(next);
      controlledChecked = next;
    }}
    label="Controlled"
  />
  <CallbackLog name="Controlled onCheckedChange" calls={controlledCalls} />
  <Checkbox bind:checked={boundChecked} onCheckedChange={(next) => boundCalls.push(next)} label="Bound" />
  <CallbackLog name="Bound onCheckedChange" calls={boundCalls} />
  <p role="status">Bound value: {boundChecked}</p>
</Example>
