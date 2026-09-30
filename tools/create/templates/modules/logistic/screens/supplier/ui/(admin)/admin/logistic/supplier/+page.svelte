<script lang="ts">
  import { createDictionary } from 'diglossia';
  import { Button } from '@sveltebuilder/coreui';
  import { SupplierCard } from '@sveltebuilder/logistic';
  import type { SupplierListView } from '@sveltebuilder/logistic/views';

  // The loader for this screen is flavour-specific; SupplierListView is the contract
  // between the two. Typing `data` as the view rather than PageData is what makes a
  // mismatch a compile error in the scaffolded project instead of a runtime surprise.
  let { data }: { data: SupplierListView } = $props();

  // Module copy is not in the root dictionary — get_dictionary treats a null scope
  // filter as "scope is null" — so the loader ships it and the screen builds its own
  // instance. $derived rather than a one-time call: the payload changes when the
  // visitor switches locale, and this screen has to follow. (A screen that also needs
  // global copy reaches the layout's instance through getDictionary(); this one has no
  // global strings.)
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');
</script>

<svelte:head>
  <title>{t('logistic.supplier.title')}</title>
</svelte:head>

<div class="supplier-list">
  <header class="supplier-list__header">
    <h1 class="supplier-list__title">{t('logistic.supplier.title')}</h1>
    <Button href="/admin/logistic/supplier/new" variant="primary">
      {t('logistic.supplier.add')}
    </Button>
  </header>

  {#if data.suppliers.length > 0}
    <div class="supplier-list__grid">
      {#each data.suppliers as supplier (supplier.id)}
        <!-- Camp 2 component: it reads the supplier's own name from the dictionary,
             so it takes this screen's instance rather than the page context. -->
        <SupplierCard
          {supplier}
          contacts={supplier.contacts}
          href="/admin/logistic/supplier/{supplier.id}"
          dictionary={scoped}
        />
      {/each}
    </div>
  {:else}
    <p class="supplier-list__empty">{t('logistic.supplier.empty')}</p>
  {/if}
</div>

<style>
  .supplier-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .supplier-list__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .supplier-list__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .supplier-list__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-4);
  }

  .supplier-list__empty {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    margin: 0;
    padding: var(--space-8) 0;
  }
</style>
