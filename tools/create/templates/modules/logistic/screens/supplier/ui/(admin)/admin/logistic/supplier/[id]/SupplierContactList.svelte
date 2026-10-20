<!-- The supplier's contacts, each removable from its row through this route's
     `deleteSupplierContact` action. -->
<script lang="ts">
  import './supplier-contact-list.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button } from '@sveltebuilder/coreui';
  import type { SupplierContact } from '@sveltebuilder/logistic';

  type Props = {
    supplierContacts: SupplierContact[];
    /** Whether each contact has a remove control: for a reader who may edit the supplier. */
    removable: boolean;
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { supplierContacts, removable, dictionary }: Props = $props();

  const globalDictionary = getDictionary();
</script>

{#if supplierContacts.length > 0}
  <ul class="supplier-contact-list">
    {#each supplierContacts as contact (contact.id)}
      <li class="supplier-contact-list__contact">
        <div>
          <p class="supplier-contact-list__name">{contact.name}</p>
          <p class="supplier-contact-list__detail">
            {contact.role}{contact.email ? ` · ${contact.email}` : ''}{contact.phone
              ? ` · ${contact.phone}`
              : ''}
          </p>
        </div>
        {#if removable}
          <form method="POST" action="?/deleteSupplierContact">
            <input type="hidden" name="supplier_contact_id" value={contact.id} />
            <Button type="submit" variant="ghost" size="sm">
              {globalDictionary.localText('action.remove')}
            </Button>
          </form>
        {/if}
      </li>
    {/each}
  </ul>
{:else}
  <p class="supplier-contact-list__empty">
    {dictionary.localText('logistic.supplier.contact_none', 'logistic')}
  </p>
{/if}
