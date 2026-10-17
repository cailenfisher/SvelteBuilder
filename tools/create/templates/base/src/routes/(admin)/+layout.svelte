<script lang="ts">
  import './admin-layout.css';
  import type { Snippet } from 'svelte'
  import { getDictionary } from 'diglossia/svelte'
  import type { LayoutData } from './$types'

  let { data, children }: { data: LayoutData; children: Snippet } = $props()

  const dictionary = getDictionary()

  const navigationLinks = $derived(
    data.navigationItems.map((item) => ({
      href: item.href,
      label: item.localTextLink ? dictionary.localText(item.localTextLink.slug) : item.href,
    }))
  )
</script>

<div class="admin-layout">
  <nav class="admin-layout__sidebar" aria-label={dictionary.localText('admin.navigation.label')}>
    <div class="admin-layout__logo">
      <a class="admin-layout__logo-link" href="/admin/dashboard">{dictionary.localText('admin.title')}</a>
    </div>
    <ul class="admin-layout__navigation">
      {#each navigationLinks as link}
        <li>
          <a href={link.href} class="admin-layout__navigation-link">{link.label}</a>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="admin-layout__body">
    <main class="admin-layout__main">
      {@render children()}
    </main>
  </div>
</div>
