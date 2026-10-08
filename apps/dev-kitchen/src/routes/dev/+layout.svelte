<!-- The showcase frame: page list, the page's heading and components, and a colour-scheme
     switch. Locale and direction come from the base chrome's LocaleSwitcher (pick
     العربية for right-to-left). Harness-only copy is English: nothing here ships. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { SHOWCASE, findPage } from '$lib/catalog';

  let { children }: { children: Snippet } = $props();

  const current = $derived(findPage(page.url.pathname));

  type Scheme = 'system' | 'light' | 'dark';
  let scheme = $state<Scheme>('system');

  function applyScheme(next: Scheme) {
    scheme = next;
    // data-color-scheme on <html> is the coreui contract (CLAUDE.md, Theme and color
    // scheme); absent means follow prefers-color-scheme.
    if (next === 'system') document.documentElement.removeAttribute('data-color-scheme');
    else document.documentElement.setAttribute('data-color-scheme', next);
  }
</script>

<svelte:head>
  <title>{current ? `${current.page.title} · dev-kitchen` : 'dev-kitchen'}</title>
</svelte:head>

<div class="kitchen">
  <nav class="kitchen__nav" aria-label="Showcase pages">
    <ul class="kitchen__pages">
      <li>
        <a href="/dev/theme" aria-current={page.url.pathname === '/dev/theme' ? 'page' : undefined}
          >Theme, direction and focus</a
        >
      </li>
    </ul>
    {#each SHOWCASE as section (section.slug)}
      <h2 class="kitchen__section">{section.title}</h2>
      <ul class="kitchen__pages">
        {#each section.pages as entry (entry.slug)}
          {@const href = `/dev/${section.slug}/${entry.slug}`}
          <li>
            <a {href} aria-current={page.url.pathname === href ? 'page' : undefined}>{entry.title}</a>
          </li>
        {/each}
      </ul>
    {/each}
  </nav>

  <div class="kitchen__page">
    <div class="kitchen__toolbar" role="group" aria-label="Color scheme">
      {#each ['system', 'light', 'dark'] as const as option (option)}
        <button
          type="button"
          class="kitchen__scheme"
          aria-pressed={scheme === option}
          onclick={() => applyScheme(option)}>{option}</button
        >
      {/each}
    </div>

    {#if current}
      <h1 class="kitchen__title">{current.page.title}</h1>
      <p class="kitchen__components">
        {current.section.title}:
        {#each current.page.components as name, index (name)}
          <code>{name}</code>{index < current.page.components.length - 1 ? ', ' : ''}
        {/each}
      </p>
    {/if}

    {@render children()}
  </div>
</div>

<style>
  .kitchen {
    display: grid;
    grid-template-columns: minmax(12rem, 16rem) 1fr;
    gap: var(--space-6);
    align-items: start;
  }

  .kitchen__nav {
    position: sticky;
    inset-block-start: var(--space-4);
    max-block-size: calc(100dvh - var(--space-8));
    overflow-y: auto;
    font-size: var(--text-sm);
  }

  .kitchen__section {
    margin: 0 0 var(--space-2);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-soft);
  }

  .kitchen__pages {
    list-style: none;
    margin: 0 0 var(--space-4);
    padding: 0;
    display: grid;
    gap: var(--space-1);
  }

  /* 24px tall, the WCAG 2.5.8 minimum target size. */
  .kitchen__pages a {
    display: block;
    min-block-size: 1.5rem;
    padding-block: var(--space-0-5);
  }

  .kitchen__pages a[aria-current='page'] {
    font-weight: var(--weight-medium);
  }

  .kitchen__toolbar {
    display: flex;
    gap: var(--space-1);
    justify-content: flex-end;
  }

  .kitchen__scheme {
    font: inherit;
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }

  .kitchen__scheme[aria-pressed='true'] {
    background: var(--brand);
    color: var(--brand-fg);
  }

  .kitchen__title {
    margin: var(--space-2) 0 var(--space-1);
  }

  .kitchen__components {
    margin: 0;
    color: var(--text-soft);
    font-size: var(--text-sm);
  }

  @media (max-width: 48rem) {
    .kitchen {
      grid-template-columns: 1fr;
    }

    .kitchen__nav {
      position: static;
      max-block-size: none;
    }
  }
</style>
