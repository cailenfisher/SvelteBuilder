<!-- The role's permissions as a grid, saved by this route's `setPermission` action. A module's
     role is shown read-only, with no save button: its module's seed owns what it holds. -->
<script lang="ts">
  import './role-permission-form.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Button } from '@sveltebuilder/coreui';
  import { RolePermissionMatrix } from '@sveltebuilder/access';
  import type { Permission, Role } from '@sveltebuilder/access/schema';

  type Props = {
    role: Role;
    permissions: Permission[];
    rolePermissionIds: number[];
    dictionary: DictionaryInstance;
  };

  let { role, permissions, rolePermissionIds, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'access');
</script>

<form method="post" action="?/setPermission" class="role-permission-form">
  {#if permissions.length === 0}
    <p class="role-permission-form__empty">{localText('access.role.permission_empty')}</p>
  {:else}
    <RolePermissionMatrix {role} {permissions} {rolePermissionIds} name="permission_id" {dictionary} />
  {/if}
  {#if role.slug === null && permissions.length > 0}
    <Button type="submit">{localText('access.role.permission_save')}</Button>
  {/if}
</form>
