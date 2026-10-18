<script lang="ts">
  import './shipment-list-screen.css';
  import { goto } from '$app/navigation';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Dialog, FilterLinkList, InlineNotification } from '@sveltebuilder/coreui';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import type { ShipmentStatus } from '@sveltebuilder/logistic';
  import type { ShipmentListView } from '@sveltebuilder/logistic/views';
  import ShipmentCreateForm from './ShipmentCreateForm.svelte';
  import ShipmentTable from './ShipmentTable.svelte';
  import { formErrorText } from '$lib/FormError/form-error';

  let { data, form }: { data: ShipmentListView; form?: ScreenFormResult } = $props();
  // Only the controls that will work: `data.actions` is what the reader may do on this screen's
  // scope. Absent, every control shows and the database answers.
  const can = (action: string) => data.actions.includes(action);

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');

  let newShipmentOpen = $state(false);

  const href = (status: ShipmentStatus | null, page = 1) => {
    const params = new URLSearchParams();
    if (status !== null) params.set('status', status);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return `/admin/logistic/shipment${query ? `?${query}` : ''}`;
  };
</script>

<svelte:head>
  <title>{localText('logistic.shipment.title')}</title>
</svelte:head>

<div class="shipment-list-screen">
  <header class="shipment-list-screen__header">
    <h1 class="shipment-list-screen__title">{localText('logistic.shipment.title')}</h1>
    {#if can('create')}
      <Button variant="primary" onclick={() => (newShipmentOpen = true)}>
        {localText('logistic.shipment.new')}
      </Button>
    {/if}
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={formErrorText(form.error, scoped, dictionary)} detail={form.error.detail} />
  {/if}

  <FilterLinkList
    label={localText('logistic.shipment.filter_status')}
    links={[
      { href: href(null), label: localText('logistic.shipment.filter_all'), current: data.status === null },
      ...data.statuses.map((status) => ({
        href: href(status),
        label: localText(`logistic.shipment.status.${status}`),
        current: data.status === status,
      })),
    ]}
  />

  <ShipmentTable
    shipments={data.shipments}
    page={data.page}
    perPage={data.perPage}
    total={data.total}
    onPageChange={(next) => goto(href(data.status, next))}
    localeCode={data.localeCode}
    dictionary={scoped}
  />
</div>

<Dialog bind:open={newShipmentOpen} title={localText('logistic.shipment.new')} closeLabel={dictionary.localText('action.close')}>
  {#snippet children()}
    <ShipmentCreateForm dictionary={scoped} onCancel={() => (newShipmentOpen = false)} />
  {/snippet}
</Dialog>
