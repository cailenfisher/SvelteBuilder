<!-- Every supplier as a card linking to its detail screen. -->
<script lang="ts">
  import './supplier-list.css';
  import type { DictionaryInstance } from 'diglossia';
  import { SupplierCard } from '@sveltebuilder/logistic';
  import type { SupplierWithContacts } from '@sveltebuilder/logistic/views';

  type Props = {
    suppliers: SupplierWithContacts[];
    /** The screen's scoped dictionary: module copy and every supplier's name. */
    dictionary: DictionaryInstance;
  };

  let { suppliers, dictionary }: Props = $props();
</script>

{#if suppliers.length > 0}
  <div class="supplier-list">
    {#each suppliers as supplier (supplier.id)}
      <SupplierCard
        {supplier}
        contacts={supplier.contacts}
        href="/admin/logistic/supplier/{supplier.id}"
        {dictionary}
      />
    {/each}
  </div>
{:else}
  <p class="supplier-list__empty">{dictionary.localText('logistic.supplier.empty', 'logistic')}</p>
{/if}
