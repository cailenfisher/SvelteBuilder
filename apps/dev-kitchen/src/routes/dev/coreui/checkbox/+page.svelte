<script lang="ts">
  import { Checkbox } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';

  let accepted = $state(true);
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
