<!-- Every navigation item in every menu, each editable or deletable through this route's
     `delete` action. -->
<script lang="ts">
  import './navigation-item-table.css';
  import { getDictionary } from 'diglossia/svelte';
  import type { LocalTextLink } from 'diglossia';
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
    navigationItems: {
      id: number;
      href: string;
      menu: string;
      position: number;
      active: boolean;
      localTextLink: Pick<LocalTextLink, 'slug'> | null;
    }[];
  };

  let { navigationItems }: Props = $props();

  const dictionary = getDictionary();
</script>

<div class="navigation-item-table">
  <Table>
    <TableHead>
      <TableRow>
        <TableHeaderCell>{dictionary.localText('admin.local_text.slug')}</TableHeaderCell>
        <TableHeaderCell>{dictionary.localText('admin.navigation_item.href')}</TableHeaderCell>
        <TableHeaderCell>{dictionary.localText('admin.navigation_item.menu')}</TableHeaderCell>
        <TableHeaderCell>{dictionary.localText('admin.navigation_item.position')}</TableHeaderCell>
        <TableHeaderCell>{dictionary.localText('admin.navigation_item.active')}</TableHeaderCell>
        <TableHeaderCell>
          <span class="visually-hidden">{dictionary.localText('table.actions')}</span>
        </TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {#if navigationItems.length === 0}
        <TableRow>
          <TableCell colspan={6}>{dictionary.localText('feedback.empty')}</TableCell>
        </TableRow>
      {/if}
      {#each navigationItems as item (item.id)}
        <TableRow>
          <TableCell>
            <code class="navigation-item-table__slug">{item.localTextLink?.slug ?? '—'}</code>
          </TableCell>
          <TableCell>{item.href}</TableCell>
          <TableCell>{item.menu}</TableCell>
          <TableCell>{item.position}</TableCell>
          <TableCell>{item.active ? '✓' : '—'}</TableCell>
          <TableCell>
            <div class="navigation-item-table__row-actions">
              <Button href="/admin/navigation-item/{item.id}" variant="ghost" size="sm">
                {dictionary.localText('action.edit')}
              </Button>
              <form method="post" action="?/delete">
                <input type="hidden" name="id" value={item.id} />
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
