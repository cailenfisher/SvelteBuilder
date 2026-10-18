<!-- Gives a user or group a role on this article, until an optional end: posts to this route's
     `share` action. The principal picker lists users by email address and groups by name, and
     submits `user_account:<id>` or `user_group:<id>`. The end is picked and submitted as UTC.
     Only roles that hold an article permission are offered, and the database refuses any whose
     article permissions the reader does not hold. -->
<script lang="ts">
  import './article-role-assignment-create-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, DateTimePicker, Field, Select, SelectItem } from '@sveltebuilder/coreui';
  import type { RoleAssignmentPanelView } from '@sveltebuilder/access/views';

  type Props = Pick<RoleAssignmentPanelView, 'userAccounts' | 'userGroups' | 'roles'> & {
    /** Holds the `access` copy and the names of roles and groups. */
    dictionary: DictionaryInstance;
  };

  let { userAccounts, userGroups, roles, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'access');
</script>

<form method="POST" action="?/share" class="article-role-assignment-create-form">
  <h3 class="article-role-assignment-create-form__title">{localText('access.role_assignment.add')}</h3>

  <div class="article-role-assignment-create-form__fields">
    <Field label={localText('access.role_assignment.principal')} id="article-role-assignment-principal" required>
      <Select name="principal" placeholder={localText('access.role_assignment.principal_placeholder')}>
        {#each userAccounts as userAccount (userAccount.id)}
          <SelectItem value={`user_account:${userAccount.id}`} label={userAccount.emailAddress} />
        {/each}
        {#each userGroups as userGroup (userGroup.id)}
          <SelectItem value={`user_group:${userGroup.id}`} label={dictionary.localText('name', 'user_group', userGroup.id)} />
        {/each}
      </Select>
    </Field>

    <Field label={localText('access.role_assignment.role')} id="article-role-assignment-role" required>
      <Select name="role_id" placeholder={localText('access.role_assignment.role_placeholder')}>
        {#each roles as role (role.id)}
          <SelectItem value={String(role.id)} label={dictionary.localText('name', 'role', role.id)} />
        {/each}
      </Select>
    </Field>

    <Field
      label={localText('access.role_assignment.expires_at_input')}
      hint={localText('access.role_assignment.expires_at_hint')}
      id="article-role-assignment-expires-at"
    >
      <DateTimePicker name="expires_at" timezone="UTC" />
    </Field>
  </div>

  <Button type="submit">{localText('access.role_assignment.add')}</Button>
</form>
