<script lang="ts">
  import './role-admin-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, type ScreenFormResult } from '@sveltebuilder/coreui';
  import type { RoleAdminDetailView } from '@sveltebuilder/access/views';
  import { formErrorText } from '$lib/FormError/form-error';
  import RoleCloneForm from './RoleCloneForm.svelte';
  import RolePermissionForm from './RolePermissionForm.svelte';

  let { data, form }: { data: RoleAdminDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'access');
  const roleName = $derived(scoped.localText('name', 'role', data.role.id));
  const managed = $derived(data.role.slug !== null);
</script>

<svelte:head>
  <title>{roleName}</title>
</svelte:head>

<div class="role-admin-detail-screen">
  <header class="role-admin-detail-screen__header">
    <Button href="/admin/role" variant="ghost" size="sm">← {dictionary.localText('navigation.back')}</Button>
    <h1 class="role-admin-detail-screen__title">{roleName}</h1>
    {#if managed}
      <p class="role-admin-detail-screen__managed">{localText('access.role.managed_hint')}</p>
    {/if}
  </header>

  {#if form?.error}
    <p class="role-admin-detail-screen__error" role="alert">{formErrorText(form.error, scoped, dictionary)}</p>
  {/if}
  {#if form?.success}
    <p class="role-admin-detail-screen__success" role="status">{dictionary.localText('feedback.saved')}</p>
  {/if}

  <RolePermissionForm
    role={data.role}
    permissions={data.permissions}
    rolePermissionIds={data.rolePermissionIds}
    dictionary={scoped}
  />

  <RoleCloneForm {roleName} dictionary={scoped} />

  {#if !managed}
    <div class="role-admin-detail-screen__danger">
      <form method="post" action="?/delete">
        <Button type="submit" variant="danger" size="sm">{localText('access.role.delete')}</Button>
      </form>
    </div>
  {/if}
</div>
