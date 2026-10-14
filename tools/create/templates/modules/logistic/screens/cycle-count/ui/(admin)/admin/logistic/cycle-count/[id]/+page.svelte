<script lang="ts">
  import './cycle-count-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Badge,
    Button,
    ConfirmDialog,
    InlineNotification,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';
  import type { CycleCountDetailView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

  let { data, form }: { data: CycleCountDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const count = $derived(data.cycleCount);

  const statusVariant = $derived(
    count.status === 'completed'
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
    count.status !== 'completed' && count.status !== 'cancelled' && countedLines.length > 0
  );

  let approveConfirmOpen = $state(false);
  let approveForm: HTMLFormElement | undefined = $state();
</script>

<svelte:head>
  <title>{t('logistic.cycle_count.one')} #{count.id}</title>
</svelte:head>

<div class="cycle-count-detail-screen">
  <header class="cycle-count-detail-screen__header">
    <a href="/admin/logistic/cycle-count" class="cycle-count-detail-screen__back">
      ← {t('logistic.cycle_count.title')}
    </a>
    <div class="cycle-count-detail-screen__title-row">
      <h1 class="cycle-count-detail-screen__title">{t('logistic.cycle_count.one')} #{count.id}</h1>
      <Badge variant={statusVariant}>
        {t(`logistic.cycle_count.status.${count.status}`)}
      </Badge>
      {#if approvable}
        <Button variant="primary" onclick={() => (approveConfirmOpen = true)}>
          {t('logistic.cycle_count.approve')}
        </Button>
      {/if}
    </div>
    <p class="cycle-count-detail-screen__meta">
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
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <Table>
    <TableHead>
      <TableRow>
        <TableHeaderCell>{t('logistic.field.storage_location')}</TableHeaderCell>
        <TableHeaderCell>{t('logistic.field.sku')}</TableHeaderCell>
        <TableHeaderCell>{t('logistic.cycle_count.expected')}</TableHeaderCell>
        <TableHeaderCell>{t('logistic.cycle_count.counted')}</TableHeaderCell>
        <TableHeaderCell>{t('logistic.cycle_count.variance')}</TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {#each count.lines as line (line.id)}
        <TableRow>
          <TableCell>
            {scoped.localText('name', 'storage_location', line.storageLocationId)}
          </TableCell>
          <TableCell><code class="cycle-count-detail-screen__mono">{line.sku}</code></TableCell>
          <TableCell>{line.expectedQuantity}</TableCell>
          <!-- Null counted is "nobody has counted this yet", which is not zero found. -->
          <TableCell>{line.countedQuantity ?? '—'}</TableCell>
          <TableCell>
            {#if line.variance !== null && line.variance !== 0}
              <span class="cycle-count-detail-screen__variance" class:negative={line.variance < 0}>
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
