<script lang="ts">
  import './app-layout.css';
  import './full-page-layout.css';
  import '../app.css'
  import { page } from '$app/state'
  import { createDictionary } from 'diglossia'
  import { setDictionary, getDictionary, LocalText } from 'diglossia/svelte'
  import {
    LocalePicker,
    createMessageBus,
    setMessageBus,
    ToastRegion,
    MessageLiveRegion,
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
  <div dir={data.locale.dir} class="full-page-layout">
    {@render children()}
  </div>
{:else}
  <div class="app-layout" dir={data.locale.dir}>
    <header class="app-layout__header">
      <a href="/" class="app-layout__brand">
        <LocalText slug="app.name" />
      </a>
      <nav class="app-layout__navigation">
        <LocalePicker
          label={dictionary.localText('locale.select')}
          current={data.locale}
          locales={data.locales}
        />
      </nav>
    </header>

    <main class="app-layout__main">
      {@render children()}
    </main>

    <footer class="app-layout__footer">
      <p class="app-layout__footer-copy">
        <LocalText slug="app.name" />
      </p>
    </footer>
  </div>
{/if}

<ToastRegion />
<MessageLiveRegion />
