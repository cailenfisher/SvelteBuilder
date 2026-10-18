<script lang="ts">
  import './user-account-admin-list-screen.css';
  import { createDictionary } from 'diglossia';
  import type { UserAccountAdminListView } from '@sveltebuilder/access/views';
  import UserAccountTable from './UserAccountTable.svelte';

  let { data }: { data: UserAccountAdminListView } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'access');
</script>

<svelte:head>
  <title>{localText('access.user_account.title')}</title>
</svelte:head>

<div class="user-account-admin-list-screen">
  <header class="user-account-admin-list-screen__header">
    <h1 class="user-account-admin-list-screen__title">{localText('access.user_account.title')}</h1>
    <p class="user-account-admin-list-screen__intro">{localText('access.user_account.intro')}</p>
  </header>

  <UserAccountTable userAccounts={data.userAccounts} dictionary={scoped} />
</div>
