<!-- A role's permissions as a grid: the kinds of thing it applies to down the side, actions
     across the top, one box per permission the catalog holds. A module-managed role (one with a
     slug) is shown read-only, because its module's seed owns its permissions (O6).

     Copy, all under the `access` scope: the role's name (`name`, scope `role`, by id); each
     scope's label, `access.permission_scope.<scope>`; each action's,
     `access.permission_action.<action>`. A module seeds the labels for its own scopes and verbs. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { CheckboxMatrix, type CheckboxMatrixCell } from '@sveltebuilder/coreui';
  import { STANDARD_PERMISSION_ACTIONS, type Permission, type Role } from '../../schema/index.js';

  type Props = {
    role: Role;
    /** The whole catalog, or the part of it this screen shows. */
    permissions: Permission[];
    /** Ids of the permissions the role holds. */
    rolePermissionIds: number[];
    /** The form field each held permission's id is submitted under. */
    name?: string;
    onCheckedChange?: (permission: Permission, checked: boolean) => void;
    dictionary?: DictionaryInstance;
  };

  let {
    role,
    permissions,
    rolePermissionIds,
    name,
    onCheckedChange,
    dictionary: dictionaryProp,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const held = $derived(new Set(rolePermissionIds));
  const byId = $derived(new Map(permissions.map((permission) => [String(permission.id), permission])));

  const scopes = $derived([...new Set(permissions.map((permission) => permission.scope))].sort());

  // Standard actions first, in their declared order, then module verbs alphabetically.
  const actions = $derived.by(() => {
    const present = new Set(permissions.map((permission) => permission.action));
    const standard: string[] = STANDARD_PERMISSION_ACTIONS.filter((action) => present.has(action));
    const module = [...present].filter((action) => !standard.includes(action)).sort();
    return [...standard, ...module];
  });

  const rows = $derived(
    scopes.map((scope) => ({ key: scope, label: dictionary.localText(`access.permission_scope.${scope}`, 'access') }))
  );
  const columns = $derived(
    actions.map((action) => ({ key: action, label: dictionary.localText(`access.permission_action.${action}`, 'access') }))
  );
  const cells: CheckboxMatrixCell[] = $derived(
    permissions.map((permission) => ({
      rowKey: permission.scope,
      columnKey: permission.action,
      value: String(permission.id),
      checked: held.has(permission.id),
    }))
  );

  const caption = $derived(
    dictionary.formatText(
      'access.role_permission.caption',
      { role: dictionary.localText('name', 'role', role.id) },
      'access'
    )
  );
</script>

<CheckboxMatrix
  id={`role-permission-${role.id}`}
  {caption}
  {rows}
  {columns}
  {cells}
  {name}
  readonly={role.slug !== null}
  onCheckedChange={(cell, checked) => {
    const permission = byId.get(cell.value);
    if (permission) onCheckedChange?.(permission, checked);
  }}
/>
