<script lang="ts">
  import { localText, LocalText } from '@sveltebuilder/hermes'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<section>
  <h1><LocalText slug="app.name" /></h1>
  <p>{localText('app.tagline')}</p>
  <p>Locale: <strong>{data.locale.code}</strong></p>
  <p>Default: <strong>{data.defaultLocale.code}</strong></p>
  <p>Dictionary entries loaded: <strong>{data.dictionary.length}</strong></p>
  <nav>
    <a href="/dev">Component kitchen →</a>
    <a href="/blog">Blog demo →</a>
  </nav>
</section>
