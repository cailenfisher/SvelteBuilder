<script lang="ts">
  import './locale-admin-list-screen.css';
  import { getDictionary } from 'diglossia/svelte'
  import {
    Button,
    Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell,
  } from '@sveltebuilder/coreui'
  import LocaleFieldset from '$lib/Locale/LocaleFieldset.svelte'
  import type { PageData, ActionData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const dictionary = getDictionary()

  const title       = $derived(dictionary.localText('admin.locale.title'))
  const newLabel    = $derived(dictionary.localText('admin.locale.new'))
  const codeLabel   = $derived(dictionary.localText('admin.locale.code'))
  const nameLabel   = $derived(dictionary.localText('admin.locale.name'))
  const nativeLabel = $derived(dictionary.localText('admin.locale.native_name'))
  const dirLabel    = $derived(dictionary.localText('admin.locale.dir'))
  const ltrLabel    = $derived(dictionary.localText('admin.locale.dir.ltr'))
  const rtlLabel    = $derived(dictionary.localText('admin.locale.dir.rtl'))
  const deleteLabel = $derived(dictionary.localText('action.delete'))
  const editLabel   = $derived(dictionary.localText('action.edit'))
</script>

<div class="locale-admin-list-screen">
  <header class="locale-admin-list-screen__header">
    <h1 class="locale-admin-list-screen__title">{title}</h1>
  </header>

  <section class="locale-admin-list-screen__add">
    <h2 class="locale-admin-list-screen__section-title">{newLabel}</h2>

    {#if form?.error}
      <p class="locale-admin-list-screen__error" role="alert">{form.error}</p>
    {/if}
    {#if form?.success}
      <p class="locale-admin-list-screen__success" role="status">{dictionary.localText('feedback.saved')}</p>
    {/if}

    <form method="post" action="?/create" class="locale-admin-list-screen__form">
      <LocaleFieldset
        {codeLabel}
        {nameLabel}
        nativeNameLabel={nativeLabel}
        {dirLabel}
        {ltrLabel}
        {rtlLabel}
      />
      <Button type="submit">{newLabel}</Button>
    </form>
  </section>

  <div class="locale-admin-list-screen__table-wrap">
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{codeLabel}</TableHeaderCell>
          <TableHeaderCell>{nameLabel}</TableHeaderCell>
          <TableHeaderCell>{nativeLabel}</TableHeaderCell>
          <TableHeaderCell>{dirLabel}</TableHeaderCell>
          <TableHeaderCell>
            <span class="visually-hidden">{dictionary.localText('table.actions')}</span>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {#if data.locales.length === 0}
          <TableRow>
            <TableCell colspan={5}>{dictionary.localText('feedback.empty')}</TableCell>
          </TableRow>
        {/if}
        {#each data.locales as locale (locale.id)}
          <TableRow>
            <TableCell><code class="locale-admin-list-screen__code">{locale.code}</code></TableCell>
            <TableCell>{locale.name}</TableCell>
            <TableCell>{locale.nativeName}</TableCell>
            <TableCell>{locale.dir}</TableCell>
            <TableCell>
              <div class="locale-admin-list-screen__row-actions">
                <Button href="/admin/locale/{locale.id}" variant="ghost" size="sm">
                  {editLabel}
                </Button>
                <form method="post" action="?/delete">
                  <input type="hidden" name="id" value={locale.id} />
                  <Button type="submit" variant="danger" size="sm">{deleteLabel}</Button>
                </form>
              </div>
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </div>
</div>
