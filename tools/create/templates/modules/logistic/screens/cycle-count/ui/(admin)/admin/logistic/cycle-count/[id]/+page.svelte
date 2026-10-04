<script lang="ts">
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Button,
    ConfirmDialog,
    InlineNotification,
    StatusBadge,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@sveltebuilder/coreui';
  import type { CycleCountDetailView, ScreenFormResult } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: CycleCountDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const count = $derived(data.cycleCount);

  const statusVariant = $derived(
    count.status === 'complete'
      ? 'success'
      : count.status === 'in_progress'
        ? 'warning'
        : count.status === 'cancelled'
          ? 'danger'
          : 'default'
  ) as 'success' | 'warning' | 'danger' | 'default';

  const countedLines = $derived(count.lines.filter((line) => line.countedQuantity !== null));
  const varianceLines = $derived(
    countedLines.filter((line) => line.variance !== null && line.variance !== 0)
  );

  // Approvable while still open, and only once something has actually been counted:
  // approving a count nobody has touched would close it having corrected nothing.
  const approvable = $derived(
    count.status !== 'complete' && count.status !== 'cancelled' && countedLines.length > 0
  );

  let approveConfirmOpen = $state(false);
  let approveForm: HTMLFormElement | undefined = $state();
</script>

<svelte:head>
  <title>{t('logistic.cycle_count.one')} #{count.id}</title>
</svelte:head>

<div class="count-detail">
  <header class="count-detail__header">
    <a href="/admin/logistic/cycle-count" class="count-detail__back">
      ← {t('logistic.cycle_count.title')}
    </a>
    <div class="count-detail__title-row">
      <h1 class="count-detail__title">{t('logistic.cycle_count.one')} #{count.id}</h1>
      <StatusBadge
        variant={statusVariant}
        label={t(`logistic.cycle_count.status.${count.status}`)}
      />
      {#if approvable}
        <Button variant="primary" onclick={() => (approveConfirmOpen = true)}>
          {t('logistic.cycle_count.approve')}
        </Button>
      {/if}
    </div>
    <p class="count-detail__meta">
      {scoped.formatText(
        'logistic.cycle_count.progress_value',
        { counted: countedLines.length, total: count.lines.length },
        'logistic'
      )}
      {#if varianceLines.length > 0}
        ·
        {scoped.formatText(
          'logistic.cycle_count.variance_count',
          { count: varianceLines.length },
          'logistic'
        )}
      {/if}
    </p>
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  <Table>
    <TableHead>
      <TableRow>
        <TableHeader>{t('logistic.field.location')}</TableHeader>
        <TableHeader>{t('logistic.field.sku')}</TableHeader>
        <TableHeader>{t('logistic.cycle_count.expected')}</TableHeader>
        <TableHeader>{t('logistic.cycle_count.counted')}</TableHeader>
        <TableHeader>{t('logistic.cycle_count.variance')}</TableHeader>
      </TableRow>
    </TableHead>
    <TableBody>
      {#each count.lines as line (line.id)}
        <TableRow>
          <TableCell>
            {scoped.localText('name', 'storage_location', line.storageLocationId)}
          </TableCell>
          <TableCell><code class="count-detail__mono">{line.sku}</code></TableCell>
          <TableCell>{line.expectedQuantity}</TableCell>
          <!-- Null counted is "nobody has counted this yet", which is not zero found. -->
          <TableCell>{line.countedQuantity ?? '—'}</TableCell>
          <TableCell>
            {#if line.variance !== null && line.variance !== 0}
              <span class="count-detail__variance" class:negative={line.variance < 0}>
                {line.variance > 0 ? '+' : ''}{line.variance}
              </span>
            {:else if line.variance === 0}
              {t('logistic.cycle_count.matched')}
            {:else}
              —
            {/if}
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>

<form method="POST" action="?/approve" bind:this={approveForm} hidden></form>

<ConfirmDialog
  bind:open={approveConfirmOpen}
  title={t('logistic.cycle_count.approve')}
  description={t('logistic.cycle_count.approve_confirm')}
  confirmLabel={t('logistic.cycle_count.approve')}
  cancelLabel={dictionary.localText('action.cancel')}
  onConfirm={() => approveForm?.requestSubmit()}
/>

<style>
  .count-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 72rem;
    margin-inline: auto;
  }

  .count-detail__back {
    color: var(--text-soft);
    font-size: var(--text-sm);
    text-decoration: none;
  }

  .count-detail__title-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-block-start: var(--space-2);
    flex-wrap: wrap;
  }

  .count-detail__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--text);
    margin: 0;
  }

  .count-detail__meta {
    color: var(--text-soft);
    font-size: var(--text-sm);
    margin: var(--space-1) 0 0;
  }

  .count-detail__mono {
    font-family: var(--font-mono);
  }

  .count-detail__variance {
    font-weight: var(--weight-semibold);
  }

  .count-detail__variance.negative {
    color: var(--danger);
  }
</style>
