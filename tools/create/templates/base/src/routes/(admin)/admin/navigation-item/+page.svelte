<script lang="ts">
  import './navigation-item-admin-list-screen.css';
  import { getDictionary } from 'diglossia/svelte'
  import {
    Button, Field, Input,
    Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell,
  } from '@sveltebuilder/coreui'
  import LocalTextLinkFieldset from '$lib/LocalTextLink/LocalTextLinkFieldset.svelte'
  import type { PageData, ActionData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  const dictionary = getDictionary()

  const title       = $derived(dictionary.localText('admin.navigation_item.title'))
  const newLabel    = $derived(dictionary.localText('admin.navigation_item.new'))
  const hrefLabel   = $derived(dictionary.localText('admin.navigation_item.href'))
  const menuLabel   = $derived(dictionary.localText('admin.navigation_item.menu'))
  const positionLabel   = $derived(dictionary.localText('admin.navigation_item.position'))
  const slugLabel   = $derived(dictionary.localText('admin.local_text.slug'))
  const deleteLabel = $derived(dictionary.localText('action.delete'))
  const editLabel   = $derived(dictionary.localText('action.edit'))
  const activeLabel = $derived(dictionary.localText('admin.navigation_item.active'))
</script>

<div class="navigation-item-admin-list-screen">
  <header class="navigation-item-admin-list-screen__header">
    <h1 class="navigation-item-admin-list-screen__title">{title}</h1>
  </header>

  <section class="navigation-item-admin-list-screen__add">
    <h2 class="navigation-item-admin-list-screen__section-title">{newLabel}</h2>

    {#if form?.error}
      <p class="navigation-item-admin-list-screen__error" role="alert">{form.error}</p>
    {/if}
    {#if form?.success}
      <p class="navigation-item-admin-list-screen__success" role="status">{dictionary.localText('feedback.saved')}</p>
    {/if}

    <form method="post" action="?/create" class="navigation-item-admin-list-screen__form">
      <LocalTextLinkFieldset {slugLabel} scopeLabel={dictionary.localText('admin.local_text.scope')} />

      <div class="navigation-item-admin-list-screen__form-row">
        <Field label={hrefLabel} id="navigation-item-href" required>
          <Input id="navigation-item-href" name="href" placeholder="/admin/example" required />
        </Field>
        <Field label={menuLabel} id="navigation-item-menu" required>
          <Input id="navigation-item-menu" name="menu" placeholder="admin" required />
        </Field>
        <Field label={positionLabel} id="navigation-item-position">
          <Input id="navigation-item-position" name="position" type="number" value="0" />
        </Field>
      </div>

      <Button type="submit">{newLabel}</Button>
    </form>
  </section>

  <div class="navigation-item-admin-list-screen__table-wrap">
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{slugLabel}</TableHeaderCell>
          <TableHeaderCell>{hrefLabel}</TableHeaderCell>
          <TableHeaderCell>{menuLabel}</TableHeaderCell>
          <TableHeaderCell>{positionLabel}</TableHeaderCell>
          <TableHeaderCell>{activeLabel}</TableHeaderCell>
          <TableHeaderCell>
            <span class="visually-hidden">{dictionary.localText('table.actions')}</span>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {#if data.navigationItems.length === 0}
          <TableRow>
            <TableCell colspan={6}>{dictionary.localText('feedback.empty')}</TableCell>
          </TableRow>
        {/if}
        {#each data.navigationItems as item (item.id)}
          <TableRow>
            <TableCell>
              <code class="navigation-item-admin-list-screen__slug">{item.localTextLink?.slug ?? '—'}</code>
            </TableCell>
            <TableCell>{item.href}</TableCell>
            <TableCell>{item.menu}</TableCell>
            <TableCell>{item.position}</TableCell>
            <TableCell>{item.active ? '✓' : '—'}</TableCell>
            <TableCell>
              <div class="navigation-item-admin-list-screen__row-actions">
                <Button href="/admin/navigation-item/{item.id}" variant="ghost" size="sm">
                  {editLabel}
                </Button>
                <form method="post" action="?/delete">
                  <input type="hidden" name="id" value={item.id} />
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
