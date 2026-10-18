<!-- Gives a user or group a role everywhere, or on every row of one scope, until an optional end:
     posts to the host route's `createRoleAssignment` action. Shared by the user and group
     administration screens, which both carry that action. Access on a single row is given from
     that row's own access panel instead.

     The scope picker's `*` means everywhere: it can never be a scope, which is a lower-case
     table name. The end is picked and submitted as UTC. -->
<script lang="ts">
  import './role-assignment.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, DateTimePicker, Field, Select, SelectItem } from '@sveltebuilder/coreui';
  import type { RoleAssignmentCreateFormView } from '@sveltebuilder/access/views';

  type Props = RoleAssignmentCreateFormView & {
    /** The screen's dictionary, holding the `access` copy and the roles' names. */
    dictionary: DictionaryInstance;
  };

  let { roles, scopes, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'access');
</script>

<section class="role-assignment-create-form">
  <h2 class="role-assignment-create-form__title">{localText('access.role_assignment.add')}</h2>

  <form method="post" action="?/createRoleAssignment" class="role-assignment-create-form__form">
    <div class="role-assignment-create-form__fields">
      <Field label={localText('access.role_assignment.role')} id="role-assignment-role" required>
        <Select name="role_id">
          {#each roles as role (role.id)}
            <SelectItem value={String(role.id)} label={dictionary.localText('name', 'role', role.id)} />
          {/each}
        </Select>
      </Field>

      <Field label={localText('access.role_assignment.target')} id="role-assignment-scope" required>
        <Select name="scope" value="*">
          <SelectItem value="*" label={localText('access.role_assignment.target_global')} />
          {#each scopes as scope (scope)}
            <SelectItem
              value={scope}
              label={dictionary.formatText(
                'access.role_assignment.target_scope',
                { scope: localText(`access.permission_scope.${scope}`) },
                'access'
              )}
            />
          {/each}
        </Select>
      </Field>

      <Field
        label={localText('access.role_assignment.expires_at_input')}
        hint={localText('access.role_assignment.expires_at_hint')}
        id="role-assignment-expires-at"
      >
        <DateTimePicker name="expires_at" timezone="UTC" />
      </Field>
    </div>

    <Button type="submit">{localText('access.role_assignment.add')}</Button>
  </form>
</section>
