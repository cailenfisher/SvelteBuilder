<script lang="ts">
  import './user-account-admin-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, type ScreenFormResult } from '@sveltebuilder/coreui';
  import { RoleAssignmentTable } from '@sveltebuilder/access';
  import type { RoleAssignmentRow, UserAccountAdminDetailView } from '@sveltebuilder/access/views';
  import { formErrorText } from '$lib/FormError/form-error';
  import RoleAssignmentCreateForm from '$lib/Role/RoleAssignment/RoleAssignmentCreateForm.svelte';
  import UserAccountAdminForm from './UserAccountAdminForm.svelte';

  let { data, form }: { data: UserAccountAdminDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'access');
</script>

{#snippet removeRoleAssignment(roleAssignment: RoleAssignmentRow)}
  <form method="post" action="?/deleteRoleAssignment">
    <input type="hidden" name="role_assignment_id" value={roleAssignment.id} />
    <Button type="submit" variant="secondary" size="sm">{dictionary.localText('action.remove')}</Button>
  </form>
{/snippet}

<svelte:head>
  <title>{data.userAccount.emailAddress}</title>
</svelte:head>

<div class="user-account-admin-detail-screen">
  <header class="user-account-admin-detail-screen__header">
    <Button href="/admin/user-account" variant="ghost" size="sm">← {dictionary.localText('navigation.back')}</Button>
    <h1 class="user-account-admin-detail-screen__title">{data.userAccount.emailAddress}</h1>
  </header>

  {#if form?.error}
    <p class="user-account-admin-detail-screen__error" role="alert">{formErrorText(form.error, scoped, dictionary)}</p>
  {/if}
  {#if form?.success}
    <p class="user-account-admin-detail-screen__success" role="status">{dictionary.localText('feedback.saved')}</p>
  {/if}

  <UserAccountAdminForm admin={data.userAccount.admin} dictionary={scoped} />

  <section class="user-account-admin-detail-screen__section">
    <h2 class="user-account-admin-detail-screen__section-title">{localText('access.user_account.group_title')}</h2>
    {#if data.userGroups.length === 0}
      <p class="user-account-admin-detail-screen__empty">{localText('access.user_account.group_empty')}</p>
    {:else}
      <ul class="user-account-admin-detail-screen__group-list">
        {#each data.userGroups as userGroup (userGroup.id)}
          <li>
            <a class="user-account-admin-detail-screen__group-link" href="/admin/user-group/{userGroup.id}">
              {scoped.localText('name', 'user_group', userGroup.id)}
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="user-account-admin-detail-screen__section">
    <RoleAssignmentTable
      caption={localText('access.role_assignment.title')}
      roleAssignments={data.roleAssignments}
      locale={data.localeCode}
      rowAction={removeRoleAssignment}
      dictionary={scoped}
    />
    <RoleAssignmentCreateForm roles={data.roles} scopes={data.scopes} dictionary={scoped} />
  </section>
</div>
