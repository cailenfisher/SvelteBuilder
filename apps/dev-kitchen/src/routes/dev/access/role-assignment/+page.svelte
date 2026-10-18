<script lang="ts">
  import { RoleAssignmentPanel, RoleAssignmentTable } from '@sveltebuilder/access';
  import type { RoleAssignmentRow } from '@sveltebuilder/access/views';
  import { Button } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
  import { ARTICLE_ACCESS, accessDictionary } from '$lib/fixtures/access';

  const dictionary = accessDictionary();
  const broad = ARTICLE_ACCESS.filter((roleAssignment) => roleAssignment.entityId === null);
</script>

{#snippet remove(roleAssignment: RoleAssignmentRow)}
  <form method="POST" action="#remove">
    <input type="hidden" name="role_assignment_id" value={roleAssignment.id} />
    <Button type="submit" variant="secondary" size="sm">Remove</Button>
  </form>
{/snippet}

{#snippet add()}
  <p>The host page's form for giving someone access goes here.</p>
{/snippet}

<Example title="RoleAssignmentPanel: one article's access">
  <div style:inline-size="100%">
    <RoleAssignmentPanel roleAssignments={ARTICLE_ACCESS} locale="en" removeAction={remove} addForm={add} {dictionary} />
  </div>
</Example>

<Example title="RoleAssignmentTable: a user's broad assignments">
  <div style:inline-size="100%">
    <RoleAssignmentTable caption="Roles held everywhere or on every row" roleAssignments={broad} locale="en" rowAction={remove} {dictionary} />
  </div>
</Example>

<Example title="RoleAssignmentTable: none">
  <div style:inline-size="100%">
    <RoleAssignmentTable caption="Roles held" roleAssignments={[]} locale="en" {dictionary} />
  </div>
</Example>
