<script lang="ts">
  import { getDictionary, LocalText } from 'diglossia/svelte'

  const dictionary = getDictionary()
</script>

<main>
  <h1><LocalText slug="app.name" /></h1>
  <p>{dictionary.localText('app.tagline')}</p>
</main>
