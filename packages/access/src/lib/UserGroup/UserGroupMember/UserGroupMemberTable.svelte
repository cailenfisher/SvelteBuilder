<!-- A group's members: each user's email address (data, from auth.users) and when they joined.
     Any action on a row, such as a remove form posting to the host page, is the host's
     `rowAction` snippet. Copy is under the `access` scope. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@sveltebuilder/coreui';
  import type { UserGroupMemberRow } from '../../views.js';

  type Props = {
    /** The table's caption, and its accessible name. */
    caption: string;
    userGroupMembers: UserGroupMemberRow[];
    /** BCP 47 locale for dates. */
    locale: string;
    rowAction?: Snippet<[UserGroupMemberRow]>;
    dictionary?: DictionaryInstance;
  };

  let { caption, userGroupMembers, locale, rowAction, dictionary: dictionaryProp }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'access');

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  }
</script>

<Table {caption}>
  <TableHead>
    <TableRow>
      <TableHeaderCell>{localText('access.user_group_member.email_address')}</TableHeaderCell>
      <TableHeaderCell>{localText('access.user_group_member.created_at')}</TableHeaderCell>
      {#if rowAction}
        <TableHeaderCell>{localText('access.user_group_member.action')}</TableHeaderCell>
      {/if}
    </TableRow>
  </TableHead>
  <TableBody>
    {#each userGroupMembers as userGroupMember (userGroupMember.userAccount.id)}
      <TableRow>
        <TableCell>{userGroupMember.userAccount.emailAddress}</TableCell>
        <TableCell><time datetime={userGroupMember.createdAt}>{formatDate(userGroupMember.createdAt)}</time></TableCell>
        {#if rowAction}
          <TableCell>{@render rowAction(userGroupMember)}</TableCell>
        {/if}
      </TableRow>
    {:else}
      <TableRow>
        <TableCell colspan={rowAction ? 3 : 2}>{localText('access.user_group_member.empty')}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
