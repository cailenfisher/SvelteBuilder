<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Badge } from '@sveltebuilder/coreui';
  import type { Supplier, SupplierContact } from '../schema/index.js';

  type Props = {
    supplier: Supplier;
    contacts?: SupplierContact[];
    href?: string;
    class?: string | undefined;
  };

  let { supplier, contacts = [], href, class: extraClass }: Props = $props();

  const name = $derived(localText('name', 'supplier', supplier.id));

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

<style>
  .supplier-card {
    background-color: var(--surface-raised);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-xl);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .supplier-card__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .supplier-card__title-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .supplier-card__name,
  .supplier-card__name-link {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text);
    margin: 0;
    text-decoration: none;
  }

  .supplier-card__name-link:hover {
    color: var(--link-text);
    text-decoration: underline;
  }

  .supplier-card__lead-time {
    font-size: var(--text-sm);
    color: var(--text-soft);
    margin: 0;
  }

  .supplier-card__contact {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding-block-start: var(--space-2);
    border-block-start: 1px solid var(--border-color);
  }

  .supplier-card__contact-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text);
    margin: 0;
  }

  .supplier-card__contact-link {
    font-size: var(--text-sm);
    color: var(--link-text);
    text-decoration: none;
  }

  .supplier-card__contact-link:hover {
    text-decoration: underline;
  }

  .supplier-card__contact-count {
    font-size: var(--text-xs);
    color: var(--text-soft);
    margin: 0;
  }
</style>
