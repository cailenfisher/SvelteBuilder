<!-- Every role, each linking to its detail screen. A module's role says so in words: its
     permissions are its module's to change. -->
<script lang="ts">
  import './role-table.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@sveltebuilder/coreui';
  import type { Role } from '@sveltebuilder/access/schema';

  let { roles, dictionary }: { roles: Role[]; dictionary: DictionaryInstance } = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'access');
</script>

<Table caption={localText('access.role.list')} class="role-table">
  <TableHead>
    <TableRow>
      <TableHeaderCell>{localText('access.role.name')}</TableHeaderCell>
      <TableHeaderCell>{localText('access.role.kind')}</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {#each roles as role (role.id)}
      <TableRow>
        <TableCell>
          <a class="role-table__link" href="/admin/role/{role.id}">{dictionary.localText('name', 'role', role.id)}</a>
        </TableCell>
        <TableCell>
          {#if role.slug !== null}
            <Badge size="sm">{localText('access.role.managed')}</Badge>
          {:else}
            {localText('access.role.custom')}
          {/if}
        </TableCell>
      </TableRow>
    {:else}
      <TableRow>
        <TableCell colspan={2}>{localText('access.role.empty')}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
