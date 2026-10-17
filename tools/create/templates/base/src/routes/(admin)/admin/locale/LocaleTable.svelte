<!-- Every locale the project supports, each editable or deletable through this route's
     `delete` action. -->
<script lang="ts">
  import './locale-table.css';
  import { getDictionary } from 'diglossia/svelte';
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
    locales: { id: number; code: string; name: string; nativeName: string; dir: string }[];
  };

  let { locales }: Props = $props();

  const dictionary = getDictionary();
</script>

<div class="locale-table">
  <Table>
    <TableHead>
      <TableRow>
        <TableHeaderCell>{dictionary.localText('admin.locale.code')}</TableHeaderCell>
        <TableHeaderCell>{dictionary.localText('admin.locale.name')}</TableHeaderCell>
        <TableHeaderCell>{dictionary.localText('admin.locale.native_name')}</TableHeaderCell>
        <TableHeaderCell>{dictionary.localText('admin.locale.dir')}</TableHeaderCell>
        <TableHeaderCell>
          <span class="visually-hidden">{dictionary.localText('table.actions')}</span>
        </TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {#if locales.length === 0}
        <TableRow>
          <TableCell colspan={5}>{dictionary.localText('feedback.empty')}</TableCell>
        </TableRow>
      {/if}
      {#each locales as locale (locale.id)}
        <TableRow>
          <TableCell><code class="locale-table__code">{locale.code}</code></TableCell>
          <TableCell>{locale.name}</TableCell>
          <TableCell>{locale.nativeName}</TableCell>
          <TableCell>{locale.dir}</TableCell>
          <TableCell>
            <div class="locale-table__row-actions">
              <Button href="/admin/locale/{locale.id}" variant="ghost" size="sm">
                {dictionary.localText('action.edit')}
              </Button>
              <form method="post" action="?/delete">
                <input type="hidden" name="id" value={locale.id} />
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
