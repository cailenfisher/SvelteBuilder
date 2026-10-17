<!-- The showcase frame: page list, the page's heading and components, and a colour-scheme
     switch. Locale and direction come from the base chrome's LocalePicker (pick
     العربية for right-to-left). Harness-only copy is English: nothing here ships. -->
<script lang="ts">
  import './kitchen-layout.css';
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

<div class="kitchen-layout">
  <nav class="kitchen-layout__navigation" aria-label="Showcase pages">
    <ul class="kitchen-layout__pages">
      <li>
        <a class="kitchen-layout__page-link" href="/dev/theme" aria-current={page.url.pathname === '/dev/theme' ? 'page' : undefined}
          >Theme, direction and focus</a
        >
      </li>
    </ul>
    {#each SHOWCASE as section (section.slug)}
      <h2 class="kitchen-layout__section">{section.title}</h2>
      <ul class="kitchen-layout__pages">
        {#each section.pages as entry (entry.slug)}
          {@const href = `/dev/${section.slug}/${entry.slug}`}
          <li>
            <a class="kitchen-layout__page-link" {href} aria-current={page.url.pathname === href ? 'page' : undefined}
              >{entry.title}</a
            >
          </li>
        {/each}
      </ul>
    {/each}
  </nav>

  <div class="kitchen-layout__page">
    <div class="kitchen-layout__toolbar" role="group" aria-label="Color scheme">
      {#each ['system', 'light', 'dark'] as const as option (option)}
        <button
          type="button"
          class="kitchen-layout__scheme"
          aria-pressed={scheme === option}
          onclick={() => applyScheme(option)}>{option}</button
        >
      {/each}
    </div>

    {#if current}
      <h1 class="kitchen-layout__title">{current.page.title}</h1>
      <p class="kitchen-layout__components">
        {current.section.title}:
        {#each current.page.components as name, index (name)}
          <code>{name}</code>{index < current.page.components.length - 1 ? ', ' : ''}
        {/each}
      </p>
    {/if}

    {@render children()}
  </div>
</div>
