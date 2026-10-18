<!-- Every group, each linking to its detail screen; an external one says so in words. -->
<script lang="ts">
  import './user-group-table.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@sveltebuilder/coreui';
  import type { UserGroup } from '@sveltebuilder/access/schema';

  let { userGroups, dictionary }: { userGroups: UserGroup[]; dictionary: DictionaryInstance } = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'access');
</script>

<Table caption={localText('access.user_group.list')} class="user-group-table">
  <TableHead>
    <TableRow>
      <TableHeaderCell>{localText('access.user_group.name')}</TableHeaderCell>
      <TableHeaderCell>{localText('access.user_group.kind')}</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {#each userGroups as userGroup (userGroup.id)}
      <TableRow>
        <TableCell>
          <a class="user-group-table__link" href="/admin/user-group/{userGroup.id}">
            {dictionary.localText('name', 'user_group', userGroup.id)}
          </a>
        </TableCell>
        <TableCell>
          {#if userGroup.external}
            <Badge size="sm">{localText('access.user_group.external')}</Badge>
          {:else}
            {localText('access.user_group.internal')}
          {/if}
        </TableCell>
      </TableRow>
    {:else}
      <TableRow>
        <TableCell colspan={2}>{localText('access.user_group.empty')}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
