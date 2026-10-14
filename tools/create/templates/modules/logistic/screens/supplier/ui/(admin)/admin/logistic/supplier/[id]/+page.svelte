<script lang="ts">
  import './supplier-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Field, Input, Switch, Divider, InlineNotification } from '@sveltebuilder/coreui';
  import type { SupplierDetailView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

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

<div class="supplier-detail-screen">
  <header class="supplier-detail-screen__header">
    <a href="/admin/logistic/supplier" class="supplier-detail-screen__back">
      ← {dictionary.localText('action.back')}
    </a>
    <h1 class="supplier-detail-screen__title">{supplierName}</h1>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <form method="POST" action="?/update" class="supplier-detail-screen__form">
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

  <section class="supplier-detail-screen__contacts">
    <div class="supplier-detail-screen__contacts-header">
      <h2 class="supplier-detail-screen__section-title">{t('logistic.supplier.contacts')}</h2>
      <Button variant="ghost" size="sm" onclick={() => (showContactForm = !showContactForm)}>
        {showContactForm
          ? dictionary.localText('action.cancel')
          : t('logistic.supplier.contact_add')}
      </Button>
    </div>

    {#if showContactForm}
      <form method="POST" action="?/addSupplierContact" class="supplier-detail-screen__contact-form">
        <div class="supplier-detail-screen__contact-fields">
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
      <ul class="supplier-detail-screen__contact-list">
        {#each data.supplier.contacts as contact (contact.id)}
          <li class="supplier-detail-screen__contact">
            <div>
              <p class="supplier-detail-screen__contact-name">{contact.name}</p>
              <p class="supplier-detail-screen__contact-meta">
                {contact.role}{contact.email ? ` · ${contact.email}` : ''}{contact.phone
                  ? ` · ${contact.phone}`
                  : ''}
              </p>
            </div>
            <form method="POST" action="?/deleteSupplierContact">
              <input type="hidden" name="supplier_contact_id" value={contact.id} />
              <Button type="submit" variant="ghost" size="sm">
                {dictionary.localText('action.remove')}
              </Button>
            </form>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="supplier-detail-screen__empty">{t('logistic.supplier.contact_none')}</p>
    {/if}
  </section>
</div>
