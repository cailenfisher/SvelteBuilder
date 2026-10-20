<script lang="ts">
  import './user-group-admin-list-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import type { UserGroupAdminListView } from '@sveltebuilder/access/views';
  import { formErrorText } from '$lib/FormError/form-error';
  import UserGroupCreateForm from './UserGroupCreateForm.svelte';
  import UserGroupTable from './UserGroupTable.svelte';

  let { data, form }: { data: UserGroupAdminListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'access');
</script>

<svelte:head>
  <title>{localText('access.user_group.title')}</title>
</svelte:head>

<div class="user-group-admin-list-screen">
  <header class="user-group-admin-list-screen__header">
    <h1 class="user-group-admin-list-screen__title">{localText('access.user_group.title')}</h1>
    <p class="user-group-admin-list-screen__intro">{localText('access.user_group.intro')}</p>
  </header>

  {#if form?.error}
    <p class="user-group-admin-list-screen__error" role="alert">{formErrorText(form.error, scoped, dictionary)}</p>
  {/if}

  <UserGroupCreateForm dictionary={scoped} />

  <UserGroupTable userGroups={data.userGroups} dictionary={scoped} />
</div>
