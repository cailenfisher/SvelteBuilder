<script lang="ts">
  import { UserGroupMemberTable } from '@sveltebuilder/access';
  import type { UserGroupMemberRow } from '@sveltebuilder/access/views';
  import { Button } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
  import { SPORTS_DESK_MEMBERS, accessDictionary } from '$lib/fixtures/access';

  const dictionary = accessDictionary();
</script>

{#snippet remove(userGroupMember: UserGroupMemberRow)}
  <form method="POST" action="#remove-member">
    <input type="hidden" name="user_account_id" value={userGroupMember.userAccount.id} />
    <Button type="submit" variant="secondary" size="sm">Remove</Button>
  </form>
{/snippet}

<Example title="A group's members">
  <div style:inline-size="100%">
    <UserGroupMemberTable caption="Members of Sports desk" userGroupMembers={SPORTS_DESK_MEMBERS} locale="en" rowAction={remove} {dictionary} />
  </div>
</Example>

<Example title="No members">
  <div style:inline-size="100%">
    <UserGroupMemberTable caption="Members of Puddleby Wire" userGroupMembers={[]} locale="en" {dictionary} />
  </div>
</Example>
