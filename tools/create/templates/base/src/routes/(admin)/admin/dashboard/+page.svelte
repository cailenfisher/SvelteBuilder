<script lang="ts">
  import './admin-dashboard-screen.css';
  import { getDictionary } from 'diglossia/svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const dictionary = getDictionary()

  // The admin areas, from the navigation the layout already loaded, less this page itself.
  const areaLinks = $derived(
    data.navigationItems
      .filter((item) => item.href !== '/admin/dashboard')
      .map((item) => ({
        href: item.href,
        label: item.localTextLink ? dictionary.localText(item.localTextLink.slug) : item.href,
      }))
  )
</script>

<div class="admin-dashboard-screen">
  <h1 class="admin-dashboard-screen__title">{dictionary.localText('admin.dashboard.title')}</h1>

  <ul class="admin-dashboard-screen__area-list">
    {#each areaLinks as link (link.href)}
      <li>
        <a class="admin-dashboard-screen__area-link" href={link.href}>{link.label}</a>
      </li>
    {/each}
  </ul>
</div>
