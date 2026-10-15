<!-- Every piece of copy with its text in each locale, each row editable or deletable through
     this route's `delete` action. -->
<script lang="ts">
  import './local-text-table.css';
  import { getDictionary } from 'diglossia/svelte';
  import type { Locale, LocalTextLink } from 'diglossia';
  import {
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';

  type Props = {
    localTextLinks: Pick<LocalTextLink, 'id' | 'slug' | 'scope'>[];
    /** Every translation of every link, as rows of the local_text table. */
    localTexts: { link: number; locale: number; content: string }[];
    locales: Pick<Locale, 'id' | 'nativeName'>[];
  };

  let { localTextLinks, localTexts, locales }: Props = $props();

  const dictionary = getDictionary();

  function contentFor(linkId: number, localeId: number): string {
    return (
      localTexts.find((localText) => localText.link === linkId && localText.locale === localeId)
        ?.content ?? '—'
    );
  }

  function truncate(text: string, max = 48): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }
</script>

<div class="local-text-table">
  <Table>
    <TableHead>
      <TableRow>
        <TableHeaderCell>{dictionary.localText('admin.local_text.slug')}</TableHeaderCell>
        <TableHeaderCell>{dictionary.localText('admin.local_text.scope')}</TableHeaderCell>
        {#each locales as locale (locale.id)}
          <TableHeaderCell>{locale.nativeName}</TableHeaderCell>
        {/each}
        <TableHeaderCell>
          <span class="visually-hidden">{dictionary.localText('table.actions')}</span>
        </TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {#if localTextLinks.length === 0}
        <TableRow>
          <TableCell colspan={3 + locales.length}>
            {dictionary.localText('feedback.empty')}
          </TableCell>
        </TableRow>
      {/if}
      {#each localTextLinks as link (link.id)}
        <TableRow>
          <TableCell>
            <a href="/admin/local-text/{link.id}" class="local-text-table__link">{link.slug}</a>
          </TableCell>
          <TableCell>{link.scope ?? '—'}</TableCell>
          {#each locales as locale (locale.id)}
            <TableCell class="local-text-table__content-cell">
              {truncate(contentFor(link.id, locale.id))}
            </TableCell>
          {/each}
          <TableCell>
            <div class="local-text-table__row-actions">
              <Button href="/admin/local-text/{link.id}" variant="ghost" size="sm">
                {dictionary.localText('action.edit')}
              </Button>
              <form method="post" action="?/delete">
                <input type="hidden" name="id" value={link.id} />
                <Button type="submit" variant="danger" size="sm">
                  {dictionary.localText('action.delete')}
                </Button>
              </form>
            </div>
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>
