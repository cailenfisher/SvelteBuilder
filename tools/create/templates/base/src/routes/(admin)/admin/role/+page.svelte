<script lang="ts">
  import './role-admin-list-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import type { RoleAdminListView } from '@sveltebuilder/access/views';
  import { formErrorText } from '$lib/FormError/form-error';
  import RoleCreateForm from './RoleCreateForm.svelte';
  import RoleTable from './RoleTable.svelte';

  // The loader is flavour-specific; RoleAdminListView is the contract between the two.
  let { data, form }: { data: RoleAdminListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'access');
</script>

<svelte:head>
  <title>{localText('access.role.title')}</title>
</svelte:head>

<div class="role-admin-list-screen">
  <header class="role-admin-list-screen__header">
    <h1 class="role-admin-list-screen__title">{localText('access.role.title')}</h1>
    <p class="role-admin-list-screen__intro">{localText('access.role.intro')}</p>
  </header>

  {#if form?.error}
    <p class="role-admin-list-screen__error" role="alert">{formErrorText(form.error, scoped, dictionary)}</p>
  {/if}

  <RoleCreateForm dictionary={scoped} />

  <RoleTable roles={data.roles} dictionary={scoped} />
</div>
