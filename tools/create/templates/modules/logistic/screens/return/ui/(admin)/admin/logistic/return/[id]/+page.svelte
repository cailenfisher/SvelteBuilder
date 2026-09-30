<script lang="ts">
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import {
    Badge,
    Button,
    ConfirmDialog,
    Field,
    InlineNotification,
    Input,
    Select,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@sveltebuilder/coreui';
  import { ReturnConditionBadge } from '@sveltebuilder/logistic';
  import type { ReturnDetailView, ScreenFormResult } from '@sveltebuilder/logistic/views';

  let { data, form }: { data: ReturnDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const t = (slug: string) => scoped.localText(slug, 'logistic');

  const authorization = $derived(data.returnAuthorization);

  const statusVariant = $derived(
    authorization.status === 'processed'
      ? 'success'
      : authorization.status === 'received'
        ? 'warning'
        : authorization.status === 'cancelled'
          ? 'danger'
          : 'default'
  ) as 'success' | 'warning' | 'danger' | 'default';

  // Grading is offered while the return is still open. The RPC and the RLS policies
  // enforce the same rule, so hiding the controls is a courtesy, not the safeguard.
  const open = $derived(
    authorization.status !== 'processed' && authorization.status !== 'cancelled'
  );

  // Processing is only meaningful once every line has been graded — an ungraded line has
  // no disposition, so nothing has decided what happened to those goods.
  const allGraded = $derived(
    authorization.lines.length > 0 && authorization.lines.every((line) => line.disposition !== null)
  );

  let processConfirmOpen = $state(false);
  let processForm: HTMLFormElement | undefined = $state();
</script>

<svelte:head>
  <title>{t('logistic.return.one')} #{authorization.id}</title>
</svelte:head>

<div class="return-detail">
  <header class="return-detail__header">
    <a href="/admin/logistic/return" class="return-detail__back">
      ← {t('logistic.return.title')}
    </a>
    <div class="return-detail__title-row">
      <h1 class="return-detail__title">{t('logistic.return.one')} #{authorization.id}</h1>
      <Badge variant={statusVariant}>
        {t(`logistic.return_authorization.status.${authorization.status}`)}
      </Badge>
      {#if open && allGraded}
        <Button variant="primary" onclick={() => (processConfirmOpen = true)}>
          {t('logistic.return.process')}
        </Button>
      {/if}
    </div>
    {#if authorization.reason}
      <p class="return-detail__meta">{authorization.reason}</p>
    {/if}
    {#if authorization.note}
      <p class="return-detail__meta">{authorization.note}</p>
    {/if}
  </header>

  {#if form?.error}
    <InlineNotification severity="error" summary={form.error} />
  {/if}

  <section class="return-detail__lines">
    <h2 class="return-detail__section-title">{t('logistic.return.lines')}</h2>
    {#if authorization.lines.length > 0}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('logistic.field.sku')}</TableHeader>
            <TableHeader>{t('logistic.return.expected_quantity')}</TableHeader>
            <TableHeader>{t('logistic.return.received_quantity')}</TableHeader>
            <TableHeader>{t('logistic.return.condition')}</TableHeader>
            <TableHeader>{t('logistic.return.disposition')}</TableHeader>
            {#if open}
              <TableHeader>{t('logistic.return.grade')}</TableHeader>
            {/if}
          </TableRow>
        </TableHead>
        <TableBody>
          {#each authorization.lines as line (line.id)}
            <TableRow>
              <TableCell><code class="return-detail__mono">{line.sku}</code></TableCell>
              <TableCell>{line.expectedQuantity}</TableCell>
              <TableCell>{line.receivedQuantity}</TableCell>
              <TableCell>
                {#if line.condition !== null}
                  <!-- Camp 1 component: it takes the label as a plain string. -->
                  <ReturnConditionBadge
                    condition={line.condition}
                    label={t(`logistic.return.condition.${line.condition}`)}
                  />
                {:else}
                  —
                {/if}
              </TableCell>
              <TableCell>
                {line.disposition !== null
                  ? t(`logistic.return.disposition.${line.disposition}`)
                  : '—'}
              </TableCell>
              {#if open}
                <TableCell>
                  <form method="POST" action="?/gradeLine" class="return-detail__grade-form">
                    <input type="hidden" name="line_id" value={line.id} />
                    <Input
                      name="received_quantity"
                      type="number"
                      min="0"
                      value={String(line.receivedQuantity)}
                    />
                    <Select name="condition" value={line.condition ?? ''}>
                      {#each data.conditions as condition (condition)}
                        <SelectItem
                          value={condition}
                          label={t(`logistic.return.condition.${condition}`)}
                        />
                      {/each}
                    </Select>
                    <Select name="disposition" value={line.disposition ?? ''}>
                      {#each data.dispositions as disposition (disposition)}
                        <SelectItem
                          value={disposition}
                          label={t(`logistic.return.disposition.${disposition}`)}
                        />
                      {/each}
                    </Select>
                    <!-- Only needed for a restock, but offered always: which disposition
                         the operator picks is not known until they submit. The loader
                         validates the pairing. Locations are named from the dictionary,
                         not shown as slugs. -->
                    <Select name="storage_location_id">
                      <SelectItem value="" label={t('logistic.return.no_location')} />
                      {#each data.locations as location (location.id)}
                        <SelectItem
                          value={String(location.id)}
                          label={scoped.localText('name', 'storage_location', location.id)}
                        />
                      {/each}
                    </Select>
                    <Button type="submit" variant="primary" size="sm">
                      {t('logistic.return.grade')}
                    </Button>
                  </form>
                </TableCell>
              {/if}
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {:else}
      <p class="return-detail__empty">{t('logistic.return.lines_empty')}</p>
    {/if}
  </section>
</div>

<!-- Processing is irreversible bookkeeping, so it is confirmed. The form is a real POST
     rather than a fetch, submitted by the dialog's confirm. -->
<form method="POST" action="?/process" bind:this={processForm} hidden></form>

<ConfirmDialog
  bind:open={processConfirmOpen}
  title={t('logistic.return.process')}
  description={t('logistic.return.process_confirm')}
  confirmLabel={t('logistic.return.process')}
  cancelLabel={dictionary.localText('action.cancel')}
  onConfirm={() => processForm?.requestSubmit()}
/>

<style>
  .return-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding: var(--space-6);
    max-width: 78rem;
    margin-inline: auto;
  }

  .return-detail__back {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    text-decoration: none;
  }

  .return-detail__title-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-block-start: var(--space-2);
    flex-wrap: wrap;
  }

  .return-detail__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .return-detail__meta,
  .return-detail__empty {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    margin: var(--space-1) 0 0;
  }

  .return-detail__lines {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .return-detail__section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .return-detail__mono {
    font-family: var(--font-mono);
  }

  .return-detail__grade-form {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    flex-wrap: wrap;
  }
</style>
