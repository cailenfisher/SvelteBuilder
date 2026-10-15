<script lang="ts">
  import './navigation-item-admin-list-screen.css';
  import { getDictionary } from 'diglossia/svelte'
  import NavigationItemCreateForm from './NavigationItemCreateForm.svelte'
  import NavigationItemTable from './NavigationItemTable.svelte'
  import type { PageData, ActionData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const dictionary = getDictionary()
</script>

<div class="navigation-item-admin-list-screen">
  <header class="navigation-item-admin-list-screen__header">
    <h1 class="navigation-item-admin-list-screen__title">{dictionary.localText('admin.navigation_item.title')}</h1>
  </header>

  <NavigationItemCreateForm result={form} />

  <NavigationItemTable navigationItems={data.navigationItems} />
</div>
