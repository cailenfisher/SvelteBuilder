<!-- Adds a user to this group: posts to this route's `addMember` action. Lists only users who are
     not members yet. -->
<script lang="ts">
  import './user-group-member-create-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Field, Select, SelectItem } from '@sveltebuilder/coreui';
  import type { UserAccountOption } from '@sveltebuilder/access/views';

  let { userAccounts, dictionary }: { userAccounts: UserAccountOption[]; dictionary: DictionaryInstance } = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'access');
</script>

{#if userAccounts.length > 0}
  <form method="post" action="?/addMember" class="user-group-member-create-form">
    <Field label={localText('access.user_group_member.add_label')} id="user-group-member-user-account" required>
      <Select name="user_account_id" placeholder={localText('access.user_group_member.add_placeholder')}>
        {#each userAccounts as userAccount (userAccount.id)}
          <SelectItem value={String(userAccount.id)} label={userAccount.emailAddress} />
        {/each}
      </Select>
    </Field>
    <Button type="submit" variant="secondary">{localText('access.user_group_member.add')}</Button>
  </form>
{/if}
