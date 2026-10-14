<script lang="ts">
  import { Switch } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';

  let notify = $state(false);
</script>

<Example title="Switch">
  <Switch bind:checked={notify} label="Email me when stock is low" />
  <Switch size="sm" label="Small" />
  <Switch disabled label="Disabled" />
  <Switch checked disabled label="Disabled, on" />
</Example>
