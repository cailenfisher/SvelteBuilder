<script lang="ts">
  import './local-text-admin-list-screen.css';
  import { getDictionary } from 'diglossia/svelte'
  import LocalTextCreateForm from './LocalTextCreateForm.svelte'
  import LocalTextTable from './LocalTextTable.svelte'
  import type { PageData, ActionData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const dictionary = getDictionary()
</script>

<div class="local-text-admin-list-screen">
  <header class="local-text-admin-list-screen__header">
    <h1 class="local-text-admin-list-screen__title">{dictionary.localText('admin.local_text.title')}</h1>
  </header>

  <LocalTextCreateForm locales={data.locales} result={form} />

  <LocalTextTable localTextLinks={data.entries} localTexts={data.translations} locales={data.locales} />
</div>
