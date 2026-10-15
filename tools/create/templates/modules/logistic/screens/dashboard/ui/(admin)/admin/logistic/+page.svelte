<script lang="ts">
  import './logistic-dashboard-screen.css';
  import { createDictionary } from 'diglossia';
  import { Button } from '@sveltebuilder/coreui';
  import { LogisticMetricSummary } from '@sveltebuilder/logistic';
  import type { LogisticDashboardView } from '@sveltebuilder/logistic/views';
  import LogisticDashboardLinkList from './LogisticDashboardLinkList.svelte';
  import LogisticDashboardSection from './LogisticDashboardSection.svelte';
  import StockLevelLowTable from './StockLevelLowTable.svelte';

  let { data }: { data: LogisticDashboardView } = $props();

  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');

  // Every destination this dashboard offers. Each is a bundle the manifest lists under
  // `requires`, so none of these can be a dead link in a scaffolded project.
  const sections = [
    { href: '/admin/logistic/supplier', slug: 'logistic.admin.navigation.supplier' },
    { href: '/admin/logistic/inbound-receipt', slug: 'logistic.admin.navigation.inbound_receipt' },
    { href: '/admin/logistic/stock-level', slug: 'logistic.admin.navigation.stock_level' },
    { href: '/admin/logistic/shipment', slug: 'logistic.admin.navigation.shipment' },
    { href: '/admin/logistic/cycle-count', slug: 'logistic.admin.navigation.cycle_count' },
    { href: '/admin/logistic/return-authorization', slug: 'logistic.admin.navigation.return_authorization' },
  ];

  const formatDate = (iso: string | null) =>
    iso === null
      ? '—'
      : new Intl.DateTimeFormat(data.localeCode, { dateStyle: 'medium' }).format(new Date(iso));
</script>

<svelte:head>
  <title>{localText('logistic.dashboard.title')}</title>
</svelte:head>

<div class="logistic-dashboard-screen">
  <h1 class="logistic-dashboard-screen__title">{localText('logistic.dashboard.title')}</h1>

  <LogisticMetricSummary metrics={data.metrics} dictionary={scoped} />

  {#if data.lowStockLevels.length > 0}
    <LogisticDashboardSection title={localText('logistic.dashboard.low_stock')} href="/admin/logistic/stock-level">
      <StockLevelLowTable stockLevels={data.lowStockLevels} dictionary={scoped} />
    </LogisticDashboardSection>
  {/if}

  {#if data.pendingInboundReceipts.length > 0}
    <LogisticDashboardSection
      title={localText('logistic.dashboard.pending_inbound_receipt')}
      href="/admin/logistic/inbound-receipt"
    >
      <LogisticDashboardLinkList
        links={data.pendingInboundReceipts.map((receipt) => ({
          href: `/admin/logistic/inbound-receipt/${receipt.id}`,
          label: `${localText('logistic.inbound_receipt.one')} #${receipt.id}`,
          detail: `${
            receipt.supplierId !== null
              ? scoped.localText('name', 'supplier', receipt.supplierId)
              : localText('logistic.inbound_receipt.blind')
          } · ${formatDate(receipt.expectedAt)}`,
        }))}
      />
    </LogisticDashboardSection>
  {/if}

  {#if data.openPickTasks.length > 0}
    <!-- The pick queue lives in the warehouse app, which is why the dashboard requires that
         bundle as well as the admin ones. -->
    <LogisticDashboardSection title={localText('logistic.dashboard.open_pick_task')} href="/warehouse/pick-task">
      <LogisticDashboardLinkList
        links={data.openPickTasks.map((task) => ({
          href: `/warehouse/pick-task/${task.id}`,
          label: `${localText('logistic.pick_task.one')} #${task.id}`,
          detail: formatDate(task.createdAt),
        }))}
      />
    </LogisticDashboardSection>
  {/if}

  {#if data.openReturnAuthorizations.length > 0}
    <LogisticDashboardSection
      title={localText('logistic.dashboard.open_return_authorization')}
      href="/admin/logistic/return-authorization"
    >
      <LogisticDashboardLinkList
        links={data.openReturnAuthorizations.map((returnAuthorization) => ({
          href: `/admin/logistic/return-authorization/${returnAuthorization.id}`,
          label: `${localText('logistic.return_authorization.one')} #${returnAuthorization.id}`,
          detail: returnAuthorization.reason ?? formatDate(returnAuthorization.createdAt),
        }))}
      />
    </LogisticDashboardSection>
  {/if}

  <nav class="logistic-dashboard-screen__sections" aria-label={localText('logistic.dashboard.sections')}>
    {#each sections as section (section.href)}
      <Button href={section.href} variant="ghost">{localText(section.slug)}</Button>
    {/each}
  </nav>
</div>
