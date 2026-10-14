<!-- LocalePicker posts to this app's /api/locale. -->
<script lang="ts">
  import { LocalePicker } from '@sveltebuilder/coreui';
  import { page } from '$app/state';
  import Example from '$lib/Example/Example.svelte';
</script>

<Example title="LocalePicker">
  <LocalePicker label="Language" current={page.data.locale} locales={page.data.locales} />
</Example>
