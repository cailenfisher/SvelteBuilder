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

  let { data, form }: { data: ShipmentListView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

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
  <title>{t('logistic.shipment.title')}</title>
</svelte:head>

<div class="shipment-list-screen">
  <header class="shipment-list-screen__header">
    <h1 class="shipment-list-screen__title">{t('logistic.shipment.title')}</h1>
    <Button variant="primary" onclick={() => (newShipmentOpen = true)}>
      {t('logistic.shipment.new')}
    </Button>
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <FilterLinkList
    label={t('logistic.shipment.filter_status')}
    links={[
      { href: href(null), label: t('logistic.shipment.filter_all'), current: data.status === null },
      ...data.statuses.map((status) => ({
        href: href(status),
        label: t(`logistic.shipment.status.${status}`),
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

<Dialog bind:open={newShipmentOpen} title={t('logistic.shipment.new')} closeLabel={dictionary.localText('action.close')}>
  {#snippet children()}
    <ShipmentCreateForm dictionary={scoped} onCancel={() => (newShipmentOpen = false)} />
  {/snippet}
</Dialog>
