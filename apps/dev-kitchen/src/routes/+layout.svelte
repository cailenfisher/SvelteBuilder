<script lang="ts">
  import { load } from '@sveltebuilder/hermes'
  import { localText, LocalText } from '@sveltebuilder/hermes'
  import LocaleSwitcher from '$lib/components/LocaleSwitcher.svelte'
  import type { LayoutData } from './$types'

  let { data, children }: { data: LayoutData; children: any } = $props()

  $effect(() => {
    load(data.dictionary, data.locale.code, data.defaultLocale.code)
  })
</script>

<svelte:head>
  <title>{localText('app.name')}</title>
</svelte:head>

<!-- TODO: replace shell structure with @sveltebuilder/coreui layout components -->
<div class="app" dir={data.locale.dir}>
  <header class="app__header">
    <a href="/" class="app__brand">
      <LocalText slug="app.name" />
    </a>
    <nav class="app__nav">
      <LocaleSwitcher current={data.locale} locales={data.locales} />
    </nav>
  </header>

  <main class="app__main">
    {@render children()}
  </main>

  <footer class="app__footer">
    <!-- TODO: replace with @sveltebuilder/coreui Footer component -->
  </footer>
</div>

<style>
  .app {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100dvh;
  }

  .app__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid currentColor;
  }

  .app__brand {
    font-weight: 600;
    text-decoration: none;
  }

  .app__nav {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .app__main {
    padding: 1.5rem;
  }

  .app__footer {
    padding: 0.75rem 1.5rem;
    border-top: 1px solid currentColor;
  }
</style>
