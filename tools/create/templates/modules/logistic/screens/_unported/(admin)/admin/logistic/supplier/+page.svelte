<script lang="ts">
  import { Button } from '@sveltebuilder/coreui';
  import { SupplierCard } from '@sveltebuilder/logistic';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div class="supplier-list">
  <header class="supplier-list__header">
    <h1 class="supplier-list__title">Suppliers</h1>
    <Button href="/admin/logistic/supplier/new" variant="primary">Add supplier</Button>
  </header>

  {#if data.suppliers.length > 0}
    <div class="supplier-list__grid">
      {#each data.suppliers as supplier (supplier.id)}
        <SupplierCard
          {supplier}
          contacts={supplier.contacts}
          href="/admin/logistic/supplier/{supplier.id}"
        />
      {/each}
    </div>
  {:else}
    <p class="supplier-list__empty">No suppliers yet. Add one to start managing inbound receipts.</p>
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
