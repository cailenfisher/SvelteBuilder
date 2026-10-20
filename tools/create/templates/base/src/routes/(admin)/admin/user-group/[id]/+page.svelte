<script lang="ts">
  import './user-group-admin-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Badge, Button, type ScreenFormResult } from '@sveltebuilder/coreui';
  import { RoleAssignmentTable, UserGroupMemberTable } from '@sveltebuilder/access';
  import type { RoleAssignmentRow, UserGroupAdminDetailView, UserGroupMemberRow } from '@sveltebuilder/access/views';
  import { formErrorText } from '$lib/FormError/form-error';
  import RoleAssignmentCreateForm from '$lib/Role/RoleAssignment/RoleAssignmentCreateForm.svelte';
  import UserGroupMemberCreateForm from './UserGroupMemberCreateForm.svelte';

  let { data, form }: { data: UserGroupAdminDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'access');
  const userGroupName = $derived(scoped.localText('name', 'user_group', data.userGroup.id));
</script>

{#snippet removeMember(userGroupMember: UserGroupMemberRow)}
  <form method="post" action="?/removeMember">
    <input type="hidden" name="user_account_id" value={userGroupMember.userAccount.id} />
    <Button type="submit" variant="secondary" size="sm">{dictionary.localText('action.remove')}</Button>
  </form>
{/snippet}

{#snippet removeRoleAssignment(roleAssignment: RoleAssignmentRow)}
  <form method="post" action="?/deleteRoleAssignment">
    <input type="hidden" name="role_assignment_id" value={roleAssignment.id} />
    <Button type="submit" variant="secondary" size="sm">{dictionary.localText('action.remove')}</Button>
  </form>
{/snippet}

<svelte:head>
  <title>{userGroupName}</title>
</svelte:head>

<div class="user-group-admin-detail-screen">
  <header class="user-group-admin-detail-screen__header">
    <Button href="/admin/user-group" variant="ghost" size="sm">← {dictionary.localText('navigation.back')}</Button>
    <h1 class="user-group-admin-detail-screen__title">{userGroupName}</h1>
    {#if data.userGroup.external}
      <p class="user-group-admin-detail-screen__external">
        <Badge size="sm">{localText('access.user_group.external')}</Badge>
        {localText('access.user_group.external_hint')}
      </p>
    {/if}
  </header>

  {#if form?.error}
    <p class="user-group-admin-detail-screen__error" role="alert">{formErrorText(form.error, scoped, dictionary)}</p>
  {/if}
  {#if form?.success}
    <p class="user-group-admin-detail-screen__success" role="status">{dictionary.localText('feedback.saved')}</p>
  {/if}

  <section class="user-group-admin-detail-screen__section">
    <UserGroupMemberTable
      caption={localText('access.user_group.member_title')}
      userGroupMembers={data.userGroupMembers}
      locale={data.localeCode}
      rowAction={removeMember}
      dictionary={scoped}
    />
    <UserGroupMemberCreateForm userAccounts={data.userAccounts} dictionary={scoped} />
  </section>

  <section class="user-group-admin-detail-screen__section">
    {#if data.userGroup.external}
      <p class="user-group-admin-detail-screen__external">{localText('access.user_group.external_role_hint')}</p>
    {:else}
      <RoleAssignmentTable
        caption={localText('access.role_assignment.title')}
        roleAssignments={data.roleAssignments}
        locale={data.localeCode}
        rowAction={removeRoleAssignment}
        dictionary={scoped}
      />
      <RoleAssignmentCreateForm roles={data.roles} scopes={data.scopes} dictionary={scoped} />
    {/if}
  </section>

  <div class="user-group-admin-detail-screen__danger">
    <form method="post" action="?/delete">
      <Button type="submit" variant="danger" size="sm">{localText('access.user_group.delete')}</Button>
    </form>
  </div>
</div>
