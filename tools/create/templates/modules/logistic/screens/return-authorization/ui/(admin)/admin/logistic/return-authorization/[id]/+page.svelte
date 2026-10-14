<script lang="ts">
  import './return-authorization-detail-screen.css';
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
    TableHeaderCell,
    TableRow,
  } from '@sveltebuilder/coreui';
  import { ReturnConditionBadge } from '@sveltebuilder/logistic';
  import type { ReturnAuthorizationDetailView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';

  let { data, form }: { data: ReturnAuthorizationDetailView; form?: ScreenFormResult } = $props();

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
  <title>{t('logistic.return_authorization.one')} #{authorization.id}</title>
</svelte:head>

<div class="return-authorization-detail-screen">
  <header class="return-authorization-detail-screen__header">
    <a href="/admin/logistic/return-authorization" class="return-authorization-detail-screen__back">
      ← {t('logistic.return_authorization.title')}
    </a>
    <div class="return-authorization-detail-screen__title-row">
      <h1 class="return-authorization-detail-screen__title">{t('logistic.return_authorization.one')} #{authorization.id}</h1>
      <Badge variant={statusVariant}>
        {t(`logistic.return_authorization.status.${authorization.status}`)}
      </Badge>
      {#if open && allGraded}
        <Button variant="primary" onclick={() => (processConfirmOpen = true)}>
          {t('logistic.return_authorization.process')}
        </Button>
      {/if}
    </div>
    {#if authorization.reason}
      <p class="return-authorization-detail-screen__meta">{authorization.reason}</p>
    {/if}
    {#if authorization.note}
      <p class="return-authorization-detail-screen__meta">{authorization.note}</p>
    {/if}
  </header>

  {#if form?.error}
    <InlineNotification severity="danger" summary={form.error} />
  {/if}

  <section class="return-authorization-detail-screen__lines">
    <h2 class="return-authorization-detail-screen__section-title">{t('logistic.return_authorization.lines')}</h2>
    {#if authorization.lines.length > 0}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{t('logistic.field.sku')}</TableHeaderCell>
            <TableHeaderCell>{t('logistic.return_authorization.expected_quantity')}</TableHeaderCell>
            <TableHeaderCell>{t('logistic.return_authorization.received_quantity')}</TableHeaderCell>
            <TableHeaderCell>{t('logistic.return_authorization.condition')}</TableHeaderCell>
            <TableHeaderCell>{t('logistic.return_authorization.disposition')}</TableHeaderCell>
            {#if open}
              <TableHeaderCell>{t('logistic.return_authorization.grade')}</TableHeaderCell>
            {/if}
          </TableRow>
        </TableHead>
        <TableBody>
          {#each authorization.lines as line (line.id)}
            <TableRow>
              <TableCell><code class="return-authorization-detail-screen__mono">{line.sku}</code></TableCell>
              <TableCell>{line.expectedQuantity}</TableCell>
              <TableCell>{line.receivedQuantity}</TableCell>
              <TableCell>
                {#if line.condition !== null}
                  <!-- Camp 1 component: it takes the label as a plain string. -->
                  <ReturnConditionBadge
                    condition={line.condition}
                    label={t(`logistic.return_authorization.condition.${line.condition}`)}
                  />
                {:else}
                  —
                {/if}
              </TableCell>
              <TableCell>
                {line.disposition !== null
                  ? t(`logistic.return_authorization.disposition.${line.disposition}`)
                  : '—'}
              </TableCell>
              {#if open}
                <TableCell>
                  <form method="POST" action="?/gradeReturnAuthorizationLine" class="return-authorization-detail-screen__grade-form">
                    <input type="hidden" name="return_authorization_line_id" value={line.id} />
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
                          label={t(`logistic.return_authorization.condition.${condition}`)}
                        />
                      {/each}
                    </Select>
                    <Select name="disposition" value={line.disposition ?? ''}>
                      {#each data.dispositions as disposition (disposition)}
                        <SelectItem
                          value={disposition}
                          label={t(`logistic.return_authorization.disposition.${disposition}`)}
                        />
                      {/each}
                    </Select>
                    <!-- Only needed for a restock, but offered always: which disposition
                         the operator picks is not known until they submit. The loader
                         validates the pairing. Locations are named from the dictionary,
                         not shown as slugs. -->
                    <Select name="storage_location_id">
                      <SelectItem value="" label={t('logistic.return_authorization.no_location')} />
                      {#each data.storageLocations as location (location.id)}
                        <SelectItem
                          value={String(location.id)}
                          label={scoped.localText('name', 'storage_location', location.id)}
                        />
                      {/each}
                    </Select>
                    <Button type="submit" variant="primary" size="sm">
                      {t('logistic.return_authorization.grade')}
                    </Button>
                  </form>
                </TableCell>
              {/if}
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {:else}
      <p class="return-authorization-detail-screen__empty">{t('logistic.return_authorization.lines_empty')}</p>
    {/if}
  </section>
</div>

<!-- Processing is irreversible bookkeeping, so it is confirmed. The form is a real POST
     rather than a fetch, submitted by the dialog's confirm. -->
<form method="POST" action="?/process" bind:this={processForm} hidden></form>

<ConfirmDialog
  bind:open={processConfirmOpen}
  title={t('logistic.return_authorization.process')}
  description={t('logistic.return_authorization.process_confirm')}
  confirmLabel={t('logistic.return_authorization.process')}
  cancelLabel={dictionary.localText('action.cancel')}
  onConfirm={() => processForm?.requestSubmit()}
/>
