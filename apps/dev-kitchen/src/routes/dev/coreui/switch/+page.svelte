<script lang="ts">
  import { Switch } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
  import CallbackLog from '$lib/CallbackLog/CallbackLog.svelte';

  let notify = $state(false);

  let controlledChecked = $state(false);
  const controlledCalls: boolean[] = $state([]);
  let boundChecked = $state(false);
  const boundCalls: boolean[] = $state([]);
</script>

<Example title="Switch">
  <Switch bind:checked={notify} label="Email me when stock is low" />
  <Switch size="sm" label="Small" />
  <Switch disabled label="Disabled" />
  <Switch checked disabled label="Disabled, on" />
</Example>

<Example title="Callbacks">
  <Switch
    checked={controlledChecked}
    onCheckedChange={(next) => {
      controlledCalls.push(next);
      controlledChecked = next;
    }}
    label="Controlled"
  />
  <CallbackLog name="Controlled onCheckedChange" calls={controlledCalls} />
  <Switch bind:checked={boundChecked} onCheckedChange={(next) => boundCalls.push(next)} label="Bound" />
  <CallbackLog name="Bound onCheckedChange" calls={boundCalls} />
  <p role="status">Bound value: {boundChecked}</p>
</Example>
