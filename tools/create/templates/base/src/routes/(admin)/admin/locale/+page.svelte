<script lang="ts">
  import './locale-admin-list-screen.css';
  import { getDictionary } from 'diglossia/svelte'
  import LocaleCreateForm from './LocaleCreateForm.svelte'
  import LocaleTable from './LocaleTable.svelte'
  import type { PageData, ActionData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const dictionary = getDictionary()
</script>

<div class="locale-admin-list-screen">
  <header class="locale-admin-list-screen__header">
    <h1 class="locale-admin-list-screen__title">{dictionary.localText('admin.locale.title')}</h1>
  </header>

  <LocaleCreateForm result={form} />

  <LocaleTable locales={data.locales} />
</div>
