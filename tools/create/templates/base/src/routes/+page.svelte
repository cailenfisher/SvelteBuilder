<script lang="ts">
  import { localText, LocalText } from '@sveltebuilder/hermes'
</script>

<main>
  <h1><LocalText slug="app.name" /></h1>
  <p>{localText('app.tagline')}</p>
</main>
