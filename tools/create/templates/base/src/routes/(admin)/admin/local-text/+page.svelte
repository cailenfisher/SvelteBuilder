<script lang="ts">
  import './local-text-admin-list-screen.css';
  import { getDictionary } from 'diglossia/svelte'
  import {
    Button, Field, Textarea,
    Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell,
  } from '@sveltebuilder/coreui'
  import LocalTextLinkFieldset from '$lib/LocalTextLink/LocalTextLinkFieldset.svelte'
  import type { PageData, ActionData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const dictionary = getDictionary()

  const title       = $derived(dictionary.localText('admin.local_text.title'))
  const slugLabel   = $derived(dictionary.localText('admin.local_text.slug'))
  const scopeLabel  = $derived(dictionary.localText('admin.local_text.scope'))
  const newLabel    = $derived(dictionary.localText('admin.local_text.new'))
  const deleteLabel = $derived(dictionary.localText('action.delete'))
  const editLabel   = $derived(dictionary.localText('action.edit'))

  function translationFor(linkId: number, localeId: number): string {
    return data.translations.find((t) => t.link === linkId && t.locale === localeId)?.content ?? '—'
  }

  function truncate(text: string, max = 48): string {
    return text.length > max ? text.slice(0, max) + '…' : text
  }
</script>

<div class="local-text-admin-list-screen">
  <header class="local-text-admin-list-screen__header">
    <h1 class="local-text-admin-list-screen__title">{title}</h1>
  </header>

  <section class="local-text-admin-list-screen__add">
    <h2 class="local-text-admin-list-screen__section-title">{newLabel}</h2>

    {#if form?.error}
      <p class="local-text-admin-list-screen__error" role="alert">{form.error}</p>
    {/if}
    {#if form?.success}
      <p class="local-text-admin-list-screen__success" role="status">{dictionary.localText('feedback.saved')}</p>
    {/if}

    <form method="post" action="?/create" class="local-text-admin-list-screen__form">
      <LocalTextLinkFieldset {slugLabel} {scopeLabel} />

      <div class="local-text-admin-list-screen__locales">
        {#each data.locales as locale (locale.id)}
          <div class="local-text-admin-list-screen__locale-field">
            <input type="hidden" name="locale_id" value={locale.id} />
            <Field label={locale.nativeName} id="content_{locale.id}">
              <Textarea id="content_{locale.id}" name="content" rows={2} />
            </Field>
          </div>
        {/each}
      </div>

      <Button type="submit">{newLabel}</Button>
    </form>
  </section>

  <div class="local-text-admin-list-screen__table-wrap">
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{slugLabel}</TableHeaderCell>
          <TableHeaderCell>{scopeLabel}</TableHeaderCell>
          {#each data.locales as locale (locale.id)}
            <TableHeaderCell>{locale.nativeName}</TableHeaderCell>
          {/each}
          <TableHeaderCell>
            <span class="visually-hidden">{dictionary.localText('table.actions')}</span>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {#if data.entries.length === 0}
          <TableRow>
            <TableCell colspan={3 + data.locales.length}>
              {dictionary.localText('feedback.empty')}
            </TableCell>
          </TableRow>
        {/if}
        {#each data.entries as entry (entry.id)}
          <TableRow>
            <TableCell>
              <a href="/admin/local-text/{entry.id}" class="local-text-admin-list-screen__link">{entry.slug}</a>
            </TableCell>
            <TableCell>{entry.scope ?? '—'}</TableCell>
            {#each data.locales as locale (locale.id)}
              <TableCell class="local-text-admin-list-screen__content-cell">
                {truncate(translationFor(entry.id, locale.id))}
              </TableCell>
            {/each}
            <TableCell>
              <div class="local-text-admin-list-screen__row-actions">
                <Button href="/admin/local-text/{entry.id}" variant="ghost" size="sm">
                  {editLabel}
                </Button>
                <form method="post" action="?/delete">
                  <input type="hidden" name="id" value={entry.id} />
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
