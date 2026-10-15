<script lang="ts">
  import './cycle-count-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { ConfirmDialog, InlineNotification } from '@sveltebuilder/coreui';
  import { CycleCountLineTable } from '@sveltebuilder/logistic';
  import type { CycleCountDetailView } from '@sveltebuilder/logistic/views';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import CycleCountDetailHeader from './CycleCountDetailHeader.svelte';
  import { formErrorText } from '$lib/FormError/form-error';

  let { data, form }: { data: CycleCountDetailView; form?: ScreenFormResult } = $props();

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');

  const count = $derived(data.cycleCount);

  const countedLines = $derived(count.lines.filter((line) => line.countedQuantity !== null));

  // Approvable while still open, and only once something has actually been counted:
  // approving a count nobody has touched would close it having corrected nothing.
  const approvable = $derived(
    count.status !== 'completed' && count.status !== 'cancelled' && countedLines.length > 0
  );

  let approveConfirmOpen = $state(false);
  let approveForm: HTMLFormElement | undefined = $state();
</script>

<svelte:head>
  <title>{localText('logistic.cycle_count.one')} #{count.id}</title>
</svelte:head>

<div class="cycle-count-detail-screen">
  <CycleCountDetailHeader
    cycleCount={count}
    {approvable}
    onApprove={() => (approveConfirmOpen = true)}
    dictionary={scoped}
  />

  {#if form?.error}
    <InlineNotification severity="danger" summary={formErrorText(form.error, scoped, dictionary)} detail={form.error.detail} />
  {/if}

  <CycleCountLineTable cycleCountLines={count.lines} dictionary={scoped} />
</div>

<form method="POST" action="?/approve" bind:this={approveForm} hidden></form>

<ConfirmDialog
  bind:open={approveConfirmOpen}
  title={localText('logistic.cycle_count.approve')}
  description={localText('logistic.cycle_count.approve_confirm')}
  confirmLabel={localText('logistic.cycle_count.approve')}
  cancelLabel={dictionary.localText('action.cancel')}
  onConfirm={() => approveForm?.requestSubmit()}
/>
