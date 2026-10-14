<script lang="ts">
  import './locale-admin-detail-screen.css';
  import { getDictionary } from 'diglossia/svelte'
  import { Button } from '@sveltebuilder/coreui'
  import LocaleFieldset from '$lib/Locale/LocaleFieldset.svelte'
  import type { PageData, ActionData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const dictionary = getDictionary()

  const editLabel   = $derived(dictionary.localText('admin.locale.edit'))
  const codeLabel   = $derived(dictionary.localText('admin.locale.code'))
  const nameLabel   = $derived(dictionary.localText('admin.locale.name'))
  const nativeLabel = $derived(dictionary.localText('admin.locale.native_name'))
  const dirLabel    = $derived(dictionary.localText('admin.locale.dir'))
  const ltrLabel    = $derived(dictionary.localText('admin.locale.dir.ltr'))
  const rtlLabel    = $derived(dictionary.localText('admin.locale.dir.rtl'))
</script>

<div class="locale-admin-detail-screen">
  <header class="locale-admin-detail-screen__header">
    <Button href="/admin/locale" variant="ghost" size="sm">← {dictionary.localText('navigation.back')}</Button>
    <h1 class="locale-admin-detail-screen__title">{editLabel}</h1>
  </header>

  {#if form?.error}
    <p class="locale-admin-detail-screen__error" role="alert">{form.error}</p>
  {/if}
  {#if form?.success}
    <p class="locale-admin-detail-screen__success" role="status">{dictionary.localText('feedback.saved')}</p>
  {/if}

  <form method="post" action="?/update" class="locale-admin-detail-screen__form">
    <LocaleFieldset
      {codeLabel}
      {nameLabel}
      nativeNameLabel={nativeLabel}
      {dirLabel}
      {ltrLabel}
      {rtlLabel}
      code={data.locale.code}
      name={data.locale.name}
      nativeName={data.locale.nativeName}
      dir={data.locale.dir as 'ltr' | 'rtl'}
    />
    <Button type="submit">{dictionary.localText('action.save')}</Button>
  </form>

  <div class="locale-admin-detail-screen__danger">
    <form method="post" action="?/delete">
      <Button type="submit" variant="danger" size="sm">
        {dictionary.localText('action.delete')} {editLabel}
      </Button>
    </form>
  </div>
</div>
