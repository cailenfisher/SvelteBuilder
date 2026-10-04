<script lang="ts">
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Badge,
    Button,
    MetricCard,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@sveltebuilder/coreui';
  import type { LogisticDashboardView } from '@sveltebuilder/logistic/views';

  let { data }: { data: LogisticDashboardView } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  // Every destination this dashboard offers. Each is a bundle the manifest lists under
  // `requires`, so none of these can be a dead link in a scaffolded project.
  const sections = [
    { href: '/admin/logistic/supplier', slug: 'logistic.admin.nav.supplier' },
    { href: '/admin/logistic/receipt', slug: 'logistic.admin.nav.inbound_receipt' },
    { href: '/admin/logistic/stock', slug: 'logistic.admin.nav.stock_level' },
    { href: '/admin/logistic/shipment', slug: 'logistic.admin.nav.shipment' },
    { href: '/admin/logistic/cycle-count', slug: 'logistic.admin.nav.cycle_count' },
    { href: '/admin/logistic/return', slug: 'logistic.admin.nav.return_authorization' },
  ];

  const formatDate = (iso: string | null) =>
    iso === null
      ? '—'
      : new Intl.DateTimeFormat(data.localeCode, { dateStyle: 'medium' }).format(new Date(iso));
</script>

<svelte:head>
  <title>{t('logistic.admin.dashboard.title')}</title>
</svelte:head>

<div class="logistic-dashboard">
  <h1 class="logistic-dashboard__title">{t('logistic.admin.dashboard.title')}</h1>

  <div class="logistic-dashboard__metrics">
    <MetricCard
      value={data.metrics.pendingReceiptCount}
      label={t('logistic.admin.nav.inbound_receipt')}
      description={t('logistic.dashboard.pending')}
    />
    <MetricCard
      value={data.metrics.openPickTaskCount}
      label={t('logistic.admin.nav.pick_task')}
      description={t('logistic.dashboard.open')}
    />
    <MetricCard
      value={data.metrics.openReturnCount}
      label={t('logistic.admin.nav.return_authorization')}
      description={t('logistic.dashboard.open')}
    />
    <MetricCard
      value={data.metrics.openCycleCountCount}
      label={t('logistic.admin.nav.cycle_count')}
      description={t('logistic.dashboard.open')}
    />
    <MetricCard
      value={data.metrics.lowStockCount}
      label={t('logistic.dashboard.low_stock')}
      description={t('logistic.dashboard.below_reorder')}
    />
  </div>

  {#if data.lowStockLevels.length > 0}
    <section class="logistic-dashboard__section">
      <div class="logistic-dashboard__section-header">
        <h2 class="logistic-dashboard__section-title">{t('logistic.dashboard.low_stock')}</h2>
        <Button href="/admin/logistic/stock" variant="ghost" size="sm">
          {dictionary.localText('action.view_all')}
        </Button>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('logistic.field.sku')}</TableHeader>
            <TableHeader>{t('logistic.field.location')}</TableHeader>
            <TableHeader>{t('logistic.field.available')}</TableHeader>
            <TableHeader>{t('logistic.field.reorder_point')}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {#each data.lowStockLevels as level (level.id)}
            <TableRow>
              <TableCell>
                <a href="/admin/logistic/stock?history={level.id}" class="logistic-dashboard__link">
                  <code>{level.sku}</code>
                </a>
              </TableCell>
              <TableCell>
                {scoped.localText('name', 'storage_location', level.storageLocationId)}
              </TableCell>
              <TableCell><Badge variant="warning">{level.available}</Badge></TableCell>
              <TableCell>{level.reorderPoint}</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    </section>
  {/if}

  {#if data.pendingReceipts.length > 0}
    <section class="logistic-dashboard__section">
      <div class="logistic-dashboard__section-header">
        <h2 class="logistic-dashboard__section-title">
          {t('logistic.dashboard.pending_receipts')}
        </h2>
        <Button href="/admin/logistic/receipt" variant="ghost" size="sm">
          {dictionary.localText('action.view_all')}
        </Button>
      </div>

      <ul class="logistic-dashboard__list">
        {#each data.pendingReceipts as receipt (receipt.id)}
          <li class="logistic-dashboard__list-item">
            <a href="/admin/logistic/receipt/{receipt.id}" class="logistic-dashboard__link">
              {t('logistic.receipt.one')} #{receipt.id}
            </a>
            <span class="logistic-dashboard__muted">
              {receipt.supplierId !== null
                ? scoped.localText('name', 'supplier', receipt.supplierId)
                : t('logistic.inbound_receipt.blind')}
              · {formatDate(receipt.expectedAt)}
            </span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if data.openPickTasks.length > 0}
    <section class="logistic-dashboard__section">
      <div class="logistic-dashboard__section-header">
        <h2 class="logistic-dashboard__section-title">{t('logistic.dashboard.open_picks')}</h2>
        <!-- The pick queue lives in the warehouse app, which is why the dashboard requires
             that bundle as well as the admin ones. -->
        <Button href="/warehouse/pick" variant="ghost" size="sm">
          {dictionary.localText('action.view_all')}
        </Button>
      </div>

      <ul class="logistic-dashboard__list">
        {#each data.openPickTasks as task (task.id)}
          <li class="logistic-dashboard__list-item">
            <a href="/warehouse/pick/{task.id}" class="logistic-dashboard__link">
              {t('logistic.pick.task')} #{task.id}
            </a>
            <span class="logistic-dashboard__muted">{formatDate(task.createdAt)}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if data.openReturns.length > 0}
    <section class="logistic-dashboard__section">
      <div class="logistic-dashboard__section-header">
        <h2 class="logistic-dashboard__section-title">{t('logistic.dashboard.open_returns')}</h2>
        <Button href="/admin/logistic/return" variant="ghost" size="sm">
          {dictionary.localText('action.view_all')}
        </Button>
      </div>

      <ul class="logistic-dashboard__list">
        {#each data.openReturns as returnAuthorization (returnAuthorization.id)}
          <li class="logistic-dashboard__list-item">
            <a
              href="/admin/logistic/return/{returnAuthorization.id}"
              class="logistic-dashboard__link"
            >
              {t('logistic.return.one')} #{returnAuthorization.id}
            </a>
            <span class="logistic-dashboard__muted">
              {returnAuthorization.reason ?? formatDate(returnAuthorization.createdAt)}
            </span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <nav class="logistic-dashboard__sections" aria-label={t('logistic.dashboard.sections')}>
    {#each sections as section (section.href)}
      <Button href={section.href} variant="ghost">{t(section.slug)}</Button>
    {/each}
  </nav>
</div>

<style>
  .logistic-dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .logistic-dashboard__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: 0;
  }

  .logistic-dashboard__metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: var(--space-4);
  }

  .logistic-dashboard__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .logistic-dashboard__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .logistic-dashboard__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text);
    margin: 0;
  }

  .logistic-dashboard__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .logistic-dashboard__list-item {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .logistic-dashboard__link {
    color: var(--text);
    font-weight: var(--weight-medium);
  }

  .logistic-dashboard__muted {
    color: var(--text-soft);
    font-size: var(--text-sm);
  }

  .logistic-dashboard__sections {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
</style>
