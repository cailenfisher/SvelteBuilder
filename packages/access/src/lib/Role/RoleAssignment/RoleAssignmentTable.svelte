<!-- Role assignments as a table: who holds which role, where, and until when. Used for a user's
     or group's assignments, and by RoleAssignmentPanel for one row's access.

     A user is shown by email address (data, from auth.users); a group, a role and a scope by their
     copy: `name` under `user_group` or `role` by id, and `access.permission_scope.<scope>`. The
     table's own copy is under the `access` scope. Any action on a row, such as a remove form
     posting to the host page, is the host's `rowAction` snippet. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import {
    Badge,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';
  import type { RoleAssignmentRow } from '../../views.js';

  type Props = {
    /** The table's caption, and its accessible name. */
    caption: string;
    roleAssignments: RoleAssignmentRow[];
    /** BCP 47 locale for dates. */
    locale: string;
    rowAction?: Snippet<[RoleAssignmentRow]>;
    dictionary?: DictionaryInstance;
  };

  let { caption, roleAssignments, locale, rowAction, dictionary: dictionaryProp }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'access');

  const columnCount = $derived(rowAction ? 5 : 4);

  function target(roleAssignment: RoleAssignmentRow): string {
    if (roleAssignment.entityId !== null) return localText('access.role_assignment.target_entity');
    if (roleAssignment.scope === null) return localText('access.role_assignment.target_global');
    return dictionary.formatText(
      'access.role_assignment.target_scope',
      { scope: localText(`access.permission_scope.${roleAssignment.scope}`) },
      'access'
    );
  }

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  }

  const expired = (roleAssignment: RoleAssignmentRow) =>
    roleAssignment.expiresAt !== null && new Date(roleAssignment.expiresAt).getTime() <= Date.now();
</script>

<Table {caption} class="role-assignment-table">
  <TableHead>
    <TableRow>
      <TableHeaderCell>{localText('access.role_assignment.principal')}</TableHeaderCell>
      <TableHeaderCell>{localText('access.role_assignment.role')}</TableHeaderCell>
      <TableHeaderCell>{localText('access.role_assignment.target')}</TableHeaderCell>
      <TableHeaderCell>{localText('access.role_assignment.expires_at')}</TableHeaderCell>
      {#if rowAction}
        <TableHeaderCell>{localText('access.role_assignment.action')}</TableHeaderCell>
      {/if}
    </TableRow>
  </TableHead>
  <TableBody>
    {#each roleAssignments as roleAssignment (`${roleAssignment.entityId === null ? 'broad' : 'entity'}-${roleAssignment.id}`)}
      <TableRow>
        <TableCell>
          {#if roleAssignment.userAccount}
            {roleAssignment.userAccount.emailAddress}
          {:else if roleAssignment.userGroup}
            <span class="role-assignment-table__group">
              {dictionary.localText('name', 'user_group', roleAssignment.userGroup.id)}
              {#if roleAssignment.userGroup.external}
                <Badge size="sm">{localText('access.user_group.external')}</Badge>
              {/if}
            </span>
          {/if}
        </TableCell>
        <TableCell>{dictionary.localText('name', 'role', roleAssignment.roleId)}</TableCell>
        <TableCell>{target(roleAssignment)}</TableCell>
        <TableCell>
          {#if roleAssignment.expiresAt === null}
            {localText('access.role_assignment.no_expiry')}
          {:else}
            <time datetime={roleAssignment.expiresAt}>{formatDate(roleAssignment.expiresAt)}</time>
            {#if expired(roleAssignment)}
              <Badge size="sm" variant="warning">{localText('access.role_assignment.expired')}</Badge>
            {/if}
          {/if}
        </TableCell>
        {#if rowAction}
          <TableCell>{@render rowAction(roleAssignment)}</TableCell>
        {/if}
      </TableRow>
    {:else}
      <TableRow>
        <TableCell colspan={columnCount}>{localText('access.role_assignment.empty')}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
