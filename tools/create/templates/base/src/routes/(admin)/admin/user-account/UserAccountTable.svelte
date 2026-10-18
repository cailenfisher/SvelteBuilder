<!-- Every user, by email address, each linking to their detail screen; an administrator says so
     in words. -->
<script lang="ts">
  import './user-account-table.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@sveltebuilder/coreui';
  import type { UserAccountRow } from '@sveltebuilder/access/views';

  let { userAccounts, dictionary }: { userAccounts: UserAccountRow[]; dictionary: DictionaryInstance } = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'access');
</script>

<Table caption={localText('access.user_account.list')} class="user-account-table">
  <TableHead>
    <TableRow>
      <TableHeaderCell>{localText('access.user_account.email_address')}</TableHeaderCell>
      <TableHeaderCell>{localText('access.user_account.admin')}</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {#each userAccounts as userAccount (userAccount.id)}
      <TableRow>
        <TableCell>
          <a class="user-account-table__link" href="/admin/user-account/{userAccount.id}">{userAccount.emailAddress}</a>
        </TableCell>
        <TableCell>
          {#if userAccount.admin}
            <Badge size="sm" variant="brand">{localText('access.user_account.admin')}</Badge>
          {/if}
        </TableCell>
      </TableRow>
    {:else}
      <TableRow>
        <TableCell colspan={2}>{localText('access.user_account.empty')}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
