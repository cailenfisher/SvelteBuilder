<script lang="ts">
  import { localText } from '@sveltebuilder/hermes';
  import { Button, Field, Label, Input, Switch, Divider } from '@sveltebuilder/coreui';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const supplierName = $derived(localText('name', 'supplier', data.supplier.id));
  let showContactForm = $state(false);
</script>

<div class="supplier-detail">
  <header class="supplier-detail__header">
    <div>
      <a href="/admin/logistic/supplier" class="supplier-detail__back">← Suppliers</a>
      <h1 class="supplier-detail__title">{supplierName}</h1>
    </div>
  </header>

  <form method="POST" action="?/update" class="supplier-detail__form">
    <Field>
      <Label for="slug">Slug</Label>
      <Input id="slug" name="slug" value={data.supplier.slug} required />
    </Field>

    <Field>
      <Label for="lead_time_day">Lead time (days)</Label>
      <Input
        id="lead_time_day"
        name="lead_time_day"
        type="number"
        min="0"
        value={data.supplier.leadTimeDay ?? ''}
      />
    </Field>

    <div class="supplier-detail__switch-row">
      <Label for="active">Active</Label>
      <input type="hidden" name="active" value={data.supplier.active ? 'true' : 'false'} />
      <Switch id="active" checked={data.supplier.active} />
    </div>

    <Button type="submit" variant="primary">Save changes</Button>
  </form>

  <Divider />

  <section class="supplier-detail__contacts">
    <div class="supplier-detail__contacts-header">
      <h2 class="supplier-detail__section-title">Contacts</h2>
      <Button variant="ghost" size="sm" onclick={() => (showContactForm = !showContactForm)}>
        {showContactForm ? 'Cancel' : 'Add contact'}
      </Button>
    </div>

    {#if showContactForm}
      <form method="POST" action="?/addContact" class="supplier-detail__contact-form">
        <div class="supplier-detail__contact-fields">
          <Field>
            <Label for="contact-role">Role</Label>
            <Input id="contact-role" name="role" placeholder="primary" required />
          </Field>
          <Field>
            <Label for="contact-name">Name</Label>
            <Input id="contact-name" name="name" required />
          </Field>
          <Field>
            <Label for="contact-email">Email</Label>
            <Input id="contact-email" name="email" type="email" />
          </Field>
          <Field>
            <Label for="contact-phone">Phone</Label>
            <Input id="contact-phone" name="phone" type="tel" />
          </Field>
        </div>
        <Button type="submit" variant="primary" size="sm">Add contact</Button>
      </form>
    {/if}

    {#if data.supplier.contacts.length > 0}
      <ul class="supplier-detail__contact-list">
        {#each data.supplier.contacts as contact (contact.id)}
          <li class="supplier-detail__contact-item">
            <div class="supplier-detail__contact-info">
              <span class="supplier-detail__contact-name">{contact.name}</span>
              <span class="supplier-detail__contact-role">{contact.role}</span>
              {#if contact.email}
                <a href="mailto:{contact.email}" class="supplier-detail__contact-link">{contact.email}</a>
              {/if}
              {#if contact.phone}
                <a href="tel:{contact.phone}" class="supplier-detail__contact-link">{contact.phone}</a>
              {/if}
            </div>
            <form method="POST" action="?/deleteContact">
              <input type="hidden" name="contact_id" value={contact.id} />
              <Button type="submit" variant="danger" size="sm">Remove</Button>
            </form>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="supplier-detail__empty">No contacts yet.</p>
    {/if}
  </section>
</div>

<style>
  .supplier-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 48rem;
    margin-inline: auto;
  }

  .supplier-detail__back {
    font-size: var(--text-sm);
    color: var(--color-text-link);
    text-decoration: none;
    display: block;
    margin-block-end: var(--space-2);
  }

  .supplier-detail__back:hover { text-decoration: underline; }

  .supplier-detail__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .supplier-detail__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .supplier-detail__switch-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .supplier-detail__contacts-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .supplier-detail__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .supplier-detail__contact-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    background-color: var(--color-surface-overlay);
    border-radius: var(--radius-md);
  }

  .supplier-detail__contact-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  .supplier-detail__contact-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .supplier-detail__contact-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
  }

  .supplier-detail__contact-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .supplier-detail__contact-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-primary);
  }

  .supplier-detail__contact-role {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .supplier-detail__contact-link {
    font-size: var(--text-sm);
    color: var(--color-text-link);
    text-decoration: none;
  }

  .supplier-detail__contact-link:hover { text-decoration: underline; }

  .supplier-detail__contacts {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .supplier-detail__empty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
</style>
