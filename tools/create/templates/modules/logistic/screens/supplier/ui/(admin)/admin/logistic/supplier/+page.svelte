<script lang="ts">
  import './supplier-list-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, InlineNotification } from '@sveltebuilder/coreui';
  import type { SupplierListView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import SupplierCreateForm from './SupplierCreateForm.svelte';
  import SupplierList from './SupplierList.svelte';

  // The loader for this screen is flavour-specific; SupplierListView is the contract
  // between the two. Typing `data` as the view rather than PageData is what makes a
  // mismatch a compile error in the scaffolded project instead of a runtime surprise.
  let { data, form }: { data: SupplierListView; form?: ScreenFormResult } = $props();

  // Module copy is not in the root dictionary — get_dictionary treats a null scope
  // filter as "scope is null" — so the loader ships it and the screen builds its own
  // instance. $derived rather than a one-time call: the payload changes when the
  // visitor switches locale, and this screen has to follow.
  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');

  let showCreateForm = $state(false);
</script>

<svelte:head>
  <title>{localText('logistic.supplier.title')}</title>
</svelte:head>

<div class="supplier-list-screen">
  <header class="supplier-list-screen__header">
    <h1 class="supplier-list-screen__title">{localText('logistic.supplier.title')}</h1>
    <Button variant="primary" onclick={() => (showCreateForm = !showCreateForm)}>
      {showCreateForm ? dictionary.localText('action.cancel') : localText('logistic.supplier.add')}
    </Button>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  {#if showCreateForm}
    <SupplierCreateForm dictionary={scoped} />
  {/if}

  <SupplierList suppliers={data.suppliers} dictionary={scoped} />
</div>
