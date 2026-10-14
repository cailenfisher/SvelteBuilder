<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge } from '@sveltebuilder/coreui';
  import type { Supplier, SupplierContact } from '../schema/index.js';

  type Props = {
    supplier: Supplier;
    contacts?: SupplierContact[];
    href?: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { supplier, contacts = [], href, dictionary: dictionaryProp, class: extraClass }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const name = $derived(dictionary.localText('name', 'supplier', supplier.id));

  const primaryContact = $derived(
    contacts.find((c) => c.role === 'primary') ?? contacts[0] ?? null
  );

  const classes = $derived(
    ['supplier-card', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<article class={classes}>
  <header class="supplier-card__header">
    <div class="supplier-card__title-row">
      {#if href}
        <a class="supplier-card__name-link" {href}>{name}</a>
      {:else}
        <h2 class="supplier-card__name">{name}</h2>
      {/if}

      {#if !supplier.active}
        <Badge variant="default" size="sm">Inactive</Badge>
      {/if}
    </div>

    {#if supplier.leadTimeDay !== null}
      <p class="supplier-card__lead-time">
        Lead time: {supplier.leadTimeDay} {supplier.leadTimeDay === 1 ? 'day' : 'days'}
      </p>
    {/if}
  </header>

  {#if primaryContact}
    <div class="supplier-card__contact">
      <p class="supplier-card__contact-name">{primaryContact.name}</p>
      {#if primaryContact.email}
        <a class="supplier-card__contact-link" href="mailto:{primaryContact.email}">
          {primaryContact.email}
        </a>
      {/if}
      {#if primaryContact.phone}
        <a class="supplier-card__contact-link" href="tel:{primaryContact.phone}">
          {primaryContact.phone}
        </a>
      {/if}
    </div>
  {/if}

  {#if contacts.length > 1}
    <p class="supplier-card__contact-count">+{contacts.length - 1} more contact{contacts.length - 1 !== 1 ? 's' : ''}</p>
  {/if}
</article>
