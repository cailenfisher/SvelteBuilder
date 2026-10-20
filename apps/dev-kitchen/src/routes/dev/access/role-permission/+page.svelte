<script lang="ts">
  import { RolePermissionMatrix } from '@sveltebuilder/access';
  import Example from '$lib/Example/Example.svelte';
  import CallbackLog from '$lib/CallbackLog/CallbackLog.svelte';
  import {
    CONTENT_EDITOR,
    CONTENT_EDITOR_PERMISSION_IDS,
    COPY_DESK,
    COPY_DESK_PERMISSION_IDS,
    PERMISSIONS,
    accessDictionary,
  } from '$lib/fixtures/access';

  const dictionary = accessDictionary();
  const changes: string[] = $state([]);
</script>

<Example title="An administrator's role">
  <div style:inline-size="100%">
    <RolePermissionMatrix
      role={COPY_DESK}
      permissions={PERMISSIONS}
      rolePermissionIds={COPY_DESK_PERMISSION_IDS}
      name="permission_id"
      onCheckedChange={(permission, checked) => changes.push(`${permission.scope}.${permission.action} → ${checked}`)}
      {dictionary}
    />
  </div>
  <CallbackLog name="onCheckedChange" calls={changes} />
</Example>

<Example title="A module-managed role, read-only">
  <div style:inline-size="100%">
    <RolePermissionMatrix
      role={CONTENT_EDITOR}
      permissions={PERMISSIONS}
      rolePermissionIds={CONTENT_EDITOR_PERMISSION_IDS}
      {dictionary}
    />
  </div>
</Example>
