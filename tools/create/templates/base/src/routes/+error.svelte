<script lang="ts">
  import { localText } from '@sveltebuilder/hermes'
  import { page } from '$app/stores'
</script>

<main>
  <h1>{$page.status}</h1>
  <p>{$page.error?.message ?? localText('feedback.error')}</p>
</main>
