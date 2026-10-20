<!-- Everyone who can act on one access-controlled row (A17), from list_<entity>_access: access
     given on this row, which the host may let its viewer remove, and access inherited from a
     global or scope assignment, which is shown with where it comes from and is never removable
     here. The difference is told in words (separate, captioned tables and a hint), never by
     colour alone.

     The host passes the remove control for a direct row and, optionally, the form that adds
     access; both post to the host route's actions. Copy is under the `access` scope. -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import RoleAssignmentTable from './RoleAssignmentTable.svelte';
  import type { RoleAssignmentRow } from '../../views.js';

  type Props = {
    /** Every row list_<entity>_access returned for this entity. */
    roleAssignments: RoleAssignmentRow[];
    /** BCP 47 locale for dates. */
    locale: string;
    /** The control that removes a direct assignment. Inherited rows never get one. */
    removeAction?: Snippet<[RoleAssignmentRow]>;
    /** The form that gives someone access, shown below the tables. */
    addForm?: Snippet;
    dictionary?: DictionaryInstance;
  };

  let { roleAssignments, locale, removeAction, addForm, dictionary: dictionaryProp }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'access');

  const titleId = $props.id();

  const direct = $derived(roleAssignments.filter((roleAssignment) => roleAssignment.entityId !== null));
  const inherited = $derived(roleAssignments.filter((roleAssignment) => roleAssignment.entityId === null));
</script>

<section class="role-assignment-panel" aria-labelledby={titleId}>
  <h2 id={titleId} class="role-assignment-panel__title">
    {localText('access.role_assignment_panel.title')}
  </h2>

  <RoleAssignmentTable
    caption={localText('access.role_assignment_panel.direct')}
    roleAssignments={direct}
    {locale}
    rowAction={removeAction}
    {dictionary}
  />

  <RoleAssignmentTable
    caption={localText('access.role_assignment_panel.inherited')}
    roleAssignments={inherited}
    {locale}
    {dictionary}
  />
  <p class="role-assignment-panel__hint">{localText('access.role_assignment_panel.inherited_hint')}</p>

  {#if addForm}
    <div class="role-assignment-panel__add">
      {@render addForm()}
    </div>
  {/if}
</section>
