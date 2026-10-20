<script lang="ts">
  import './supplier-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Divider, InlineNotification } from '@sveltebuilder/coreui';
  import type { SupplierDetailView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import SupplierContactAddForm from './SupplierContactAddForm.svelte';
  import SupplierContactList from './SupplierContactList.svelte';
  import SupplierUpdateForm from './SupplierUpdateForm.svelte';
  import { formErrorText } from '$lib/FormError/form-error';

  let { data, form }: { data: SupplierDetailView; form?: ScreenFormResult } = $props();
  // Only the controls that will work: `data.actions` is what the reader may do on this screen's
  // scope. Absent, every control shows and the database answers.
  const can = (action: string) => data.actions.includes(action);

  // Global copy from context, module copy from this screen's own instance — see the
  // list screen for why the module's copy cannot come from the root dictionary.
  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');

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
    <InlineNotification severity="danger" summary={formErrorText(form.error, scoped, dictionary)} detail={form.error.detail} />
  {/if}

  {#if can('update')}
    <SupplierUpdateForm supplier={data.supplier} dictionary={scoped} />

    <Divider />
  {/if}

  <section class="supplier-detail-screen__contacts">
    <div class="supplier-detail-screen__contacts-header">
      <h2 class="supplier-detail-screen__section-title">{localText('logistic.supplier.contacts')}</h2>
      {#if can('update')}
        <Button variant="ghost" size="sm" onclick={() => (showContactForm = !showContactForm)}>
          {showContactForm
            ? dictionary.localText('action.cancel')
            : localText('logistic.supplier.contact_add')}
        </Button>
      {/if}
    </div>

    {#if showContactForm}
      <SupplierContactAddForm dictionary={scoped} />
    {/if}

    <SupplierContactList supplierContacts={data.supplier.contacts} removable={can('update')} dictionary={scoped} />
  </section>
</div>
