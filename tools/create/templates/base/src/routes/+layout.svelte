<script lang="ts">
  import { page } from '$app/state'
  import { load, localText, LocalText } from '@sveltebuilder/hermes'
  import { LocaleSwitcher } from '@sveltebuilder/coreui'
  import type { LayoutData } from './$types'

  let { data, children }: { data: LayoutData; children: any } = $props()

  $effect(() => {
    load(data.dictionary, data.locale.code, data.defaultLocale.code)
  })

  // Admin and auth routes manage their own chrome.
  const isFullPage = $derived(
    page.url.pathname.startsWith('/admin') ||
    page.url.pathname.startsWith('/sign-')
  )
</script>

<svelte:head>
  <title>{localText('app.name')}</title>
</svelte:head>

{#if isFullPage}
  <div dir={data.locale.dir} class="full-page">
    {@render children()}
  </div>
{:else}
  <div class="app" dir={data.locale.dir}>
    <header class="app__header">
      <a href="/" class="app__brand">
        <LocalText slug="app.name" />
      </a>
      <nav class="app__nav">
        <LocaleSwitcher
          label={localText('locale.select')}
          current={data.locale}
          locales={data.locales}
        />
      </nav>
    </header>

    <main class="app__main">
      {@render children()}
    </main>

    <footer class="app__footer">
      <p class="app__footer-copy">
        <LocalText slug="app.name" />
      </p>
    </footer>
  </div>
{/if}

<style>
  .full-page {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

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
    border-bottom: 1px solid var(--color-border-default, currentColor);
  }

  .app__brand {
    font-weight: 600;
    text-decoration: none;
    color: var(--color-text-primary, inherit);
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
    border-top: 1px solid var(--color-border-default, currentColor);
  }

  .app__footer-copy {
    margin: 0;
    font-size: var(--text-xs, 0.75rem);
    color: var(--color-text-secondary, inherit);
  }
</style>
