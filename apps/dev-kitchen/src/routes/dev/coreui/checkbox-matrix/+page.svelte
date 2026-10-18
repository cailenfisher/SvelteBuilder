<script lang="ts">
  import { CheckboxMatrix, type CheckboxMatrixCell } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
  import CallbackLog from '$lib/CallbackLog/CallbackLog.svelte';

  // A role's permissions: kinds of thing down the side, actions across the top. Not every kind
  // offers every action, so some cells are empty.
  const rows = [
    { key: 'article', label: 'Articles' },
    { key: 'section', label: 'Sections' },
    { key: 'media_asset', label: 'Media' },
  ];
  const columns = [
    { key: 'read', label: 'Read' },
    { key: 'update', label: 'Update' },
    { key: 'publish', label: 'Publish' },
    { key: 'share', label: 'Share' },
  ];
  const cells: CheckboxMatrixCell[] = [
    { rowKey: 'article', columnKey: 'read', value: '1', checked: true },
    { rowKey: 'article', columnKey: 'update', value: '2', checked: true },
    { rowKey: 'article', columnKey: 'publish', value: '3', checked: false },
    { rowKey: 'article', columnKey: 'share', value: '4', checked: false },
    { rowKey: 'section', columnKey: 'read', value: '5', checked: true },
    { rowKey: 'section', columnKey: 'update', value: '6', checked: false },
    { rowKey: 'media_asset', columnKey: 'read', value: '7', checked: false },
    { rowKey: 'media_asset', columnKey: 'update', value: '8', checked: false },
  ];

  // The same grid with one value held through a broader grant.
  const inheritedCells: CheckboxMatrixCell[] = cells.map((cell) =>
    cell.rowKey === 'article' && cell.columnKey === 'publish'
      ? { ...cell, inheritedFrom: 'From Editors, on every article' }
      : cell
  );

  const changes: string[] = $state([]);
</script>

<Example title="Editable, inside a form">
  <form method="POST" style:inline-size="100%">
    <CheckboxMatrix
      id="role-permission"
      caption="Permissions of Copy desk"
      {rows}
      {columns}
      {cells}
      name="permission_id"
      onCheckedChange={(cell, checked) => changes.push(`${cell.rowKey}.${cell.columnKey} → ${checked}`)}
    />
  </form>
  <CallbackLog name="onCheckedChange" calls={changes} />
</Example>

<Example title="An inherited value">
  <div style:inline-size="100%">
    <CheckboxMatrix
      id="role-permission-inherited"
      caption="Permissions of Copy desk, with one held through Editors"
      {rows}
      {columns}
      cells={inheritedCells}
      name="permission_id"
    />
  </div>
</Example>

<Example title="Read-only (a role its module manages)">
  <div style:inline-size="100%">
    <CheckboxMatrix
      id="role-permission-readonly"
      caption="Permissions of Content editor"
      {rows}
      {columns}
      {cells}
      readonly
    />
  </div>
</Example>
