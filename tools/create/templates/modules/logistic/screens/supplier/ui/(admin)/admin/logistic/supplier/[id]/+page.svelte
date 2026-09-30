<script lang="ts">
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Field, Input, Switch, Divider } from '@sveltebuilder/coreui';
  import type { SupplierDetailView, ScreenFormResult } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: SupplierDetailView; form?: ScreenFormResult } = $props();

  // Global copy from context, module copy from this screen's own instance — see the
  // list screen for why the module's copy cannot come from the root dictionary.
  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  // The supplier's name is entity-bound copy: scope 'supplier', keyed by row id.
  const supplierName = $derived(scoped.localText('name', 'supplier', data.supplier.id));

  let showContactForm = $state(false);
</script>

<svelte:head>
  <title>{supplierName}</title>
</svelte:head>

<div class="supplier-detail">
  <header class="supplier-detail__header">
    <a href="/admin/logistic/supplier" class="supplier-detail__back">
      ← {dictionary.localText('action.back')}
    </a>
    <h1 class="supplier-detail__title">{supplierName}</h1>
  </header>

  {#if form?.error}
    <p class="supplier-detail__error" role="alert">{form.error}</p>
  {/if}

  <form method="POST" action="?/update" class="supplier-detail__form">
    <!-- Field renders the <label for>; Input inherits the id from it through field
         context, so it is not repeated here. -->
    <Field label={t('logistic.field.slug')} id="supplier-slug" required>
      <Input id="supplier-slug" name="slug" value={data.supplier.slug} required />
    </Field>

    <Field label={t('logistic.field.lead_time_day')} id="supplier-lead-time">
      <Input
        id="supplier-lead-time"
        name="lead_time_day"
        type="number"
        min="0"
        value={data.supplier.leadTimeDay ?? ''}
      />
    </Field>

    <!-- Switch is self-labelling: it renders its own <label> around the control, so
         it takes the label directly. Wrapping it in a Field would nest labels. The
         hidden input is what actually submits, since the switch is not a form
         control the browser serialises. -->
    <input type="hidden" name="active" value={data.supplier.active ? 'true' : 'false'} />
    <Switch checked={data.supplier.active} label={t('logistic.field.active')} />

    <Button type="submit" variant="primary">{dictionary.localText('action.save')}</Button>
  </form>

  <Divider />

  <section class="supplier-detail__contacts">
    <div class="supplier-detail__contacts-header">
      <h2 class="supplier-detail__section-title">{t('logistic.supplier.contacts')}</h2>
      <Button variant="ghost" size="sm" onclick={() => (showContactForm = !showContactForm)}>
        {showContactForm
          ? dictionary.localText('action.cancel')
          : t('logistic.supplier.contact_add')}
      </Button>
    </div>

    {#if showContactForm}
      <form method="POST" action="?/addContact" class="supplier-detail__contact-form">
        <div class="supplier-detail__contact-fields">
          <Field label={t('logistic.field.role')} id="contact-role" required>
            <Input id="contact-role" name="role" required />
          </Field>
          <Field label={t('logistic.field.name')} id="contact-name" required>
            <Input id="contact-name" name="name" required />
          </Field>
          <Field label={t('logistic.field.email')} id="contact-email">
            <Input id="contact-email" name="email" type="email" />
          </Field>
          <Field label={t('logistic.field.phone')} id="contact-phone">
            <Input id="contact-phone" name="phone" type="tel" />
          </Field>
        </div>
        <Button type="submit" variant="primary">{dictionary.localText('action.save')}</Button>
      </form>
    {/if}

    {#if data.supplier.contacts.length > 0}
      <ul class="supplier-detail__contact-list">
        {#each data.supplier.contacts as contact (contact.id)}
          <li class="supplier-detail__contact">
            <div>
              <p class="supplier-detail__contact-name">{contact.name}</p>
              <p class="supplier-detail__contact-meta">
                {contact.role}{contact.email ? ` · ${contact.email}` : ''}{contact.phone
                  ? ` · ${contact.phone}`
                  : ''}
              </p>
            </div>
            <form method="POST" action="?/deleteContact">
              <input type="hidden" name="contact_id" value={contact.id} />
              <Button type="submit" variant="ghost" size="sm">
                {dictionary.localText('action.remove')}
              </Button>
            </form>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="supplier-detail__empty">{t('logistic.supplier.contact_none')}</p>
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
    color: var(--color-text-secondary);
  }

  .supplier-detail__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: var(--space-1) 0 0;
  }

  .supplier-detail__form,
  .supplier-detail__contact-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    align-items: start;
  }

  .supplier-detail__contacts {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .supplier-detail__contacts-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .supplier-detail__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    margin: 0;
  }

  .supplier-detail__contact-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: var(--space-4);
    width: 100%;
  }

  .supplier-detail__contact-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .supplier-detail__contact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .supplier-detail__contact-name {
    margin: 0;
    font-weight: var(--weight-medium);
  }

  .supplier-detail__contact-meta,
  .supplier-detail__empty {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
</style>
