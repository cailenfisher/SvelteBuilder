<script lang="ts">
  import '../app.css'
  import { page } from '$app/state'
  import { createDictionary } from 'diglossia'
  import { setDictionary, getDictionary, LocalText } from 'diglossia/svelte'
  import {
    LocaleSwitcher,
    createMessageBus,
    setMessageBus,
    ToastRegion,
    MessageAriaLive,
  } from '@sveltebuilder/coreui'
  import type { LayoutData } from './$types'

  let { data, children }: { data: LayoutData; children: any } = $props()

  // Not inside $effect: effects don't run during SSR, so a dictionary built in
  // one would leave every server-rendered page showing [missing: …] sentinels.
  // Capturing the first value of `data` is intended: switching locale posts to
  // /api/locale and redirects, a full page load that runs this script again.
  // svelte-ignore state_referenced_locally
  setDictionary(createDictionary(data.dictionary))
  const dictionary = getDictionary()

  // Same reasoning as the dictionary: a module-level message bus would leak
  // one visitor's toasts/banners into another's response on the server.
  setMessageBus(
    createMessageBus({
      labels: {
        undo: dictionary.localText('message.undo'),
        showDetails: dictionary.localText('message.show_details'),
        hideDetails: dictionary.localText('message.hide_details'),
        reference: (technicalId) => dictionary.formatText('message.reference', { technicalId }),
        dismiss: (summary) => dictionary.formatText('message.dismiss', { summary }),
        secondsRemaining: (seconds) => dictionary.formatText('message.seconds_remaining', { seconds }),
        region: dictionary.localText('message.region'),
        queued: (count) => dictionary.formatText('message.queued', { count }),
      },
    })
  )

  // Admin and auth routes manage their own chrome.
  const isFullPage = $derived(
    page.url.pathname.startsWith('/admin') ||
    page.url.pathname.startsWith('/sign-')
  )
</script>

<svelte:head>
  <title>{dictionary.localText('app.name')}</title>
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
          label={dictionary.localText('locale.select')}
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

<ToastRegion />
<MessageAriaLive />

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
    border-bottom: 1px solid var(--border-color, currentColor);
  }

  .app__brand {
    font-weight: 600;
    text-decoration: none;
    color: var(--text, inherit);
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
    border-top: 1px solid var(--border-color, currentColor);
  }

  .app__footer-copy {
    margin: 0;
    font-size: var(--text-xs, 0.75rem);
    color: var(--text-soft, inherit);
  }
</style>
