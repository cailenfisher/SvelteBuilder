<script lang="ts">
  import './return-authorization-detail-screen.css';
  import { createDictionary } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { ConfirmDialog, InlineNotification } from '@sveltebuilder/coreui';
  import type { ScreenFormResult } from '@sveltebuilder/coreui';
  import type { ReturnAuthorizationDetailView } from '@sveltebuilder/logistic/views';
  import ReturnAuthorizationDetailHeader from './ReturnAuthorizationDetailHeader.svelte';
  import ReturnAuthorizationLineTable from './ReturnAuthorizationLineTable.svelte';
  import { formErrorText } from '$lib/FormError/form-error';

  let { data, form }: { data: ReturnAuthorizationDetailView; form?: ScreenFormResult } = $props();
  // Only the controls that will work: `data.actions` is what the reader may do on this screen's
  // scope. Absent, every control shows and the database answers.
  const can = (action: string) => data.actions?.includes(action) ?? true;

  const dictionary = getDictionary();
  const scoped = $derived(createDictionary(data.copy));
  const localText = (slug: string) => scoped.localText(slug, 'logistic');

  const authorization = $derived(data.returnAuthorization);

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
  <title>{localText('logistic.return_authorization.one')} #{authorization.id}</title>
</svelte:head>

<div class="return-authorization-detail-screen">
  <ReturnAuthorizationDetailHeader
    returnAuthorization={authorization}
    processable={open && allGraded && can('grade')}
    onProcess={() => (processConfirmOpen = true)}
    dictionary={scoped}
  />

  {#if form?.error}
    <InlineNotification severity="danger" summary={formErrorText(form.error, scoped, dictionary)} detail={form.error.detail} />
  {/if}

  <section class="return-authorization-detail-screen__lines">
    <h2 class="return-authorization-detail-screen__section-title">{localText('logistic.return_authorization.lines')}</h2>
    <ReturnAuthorizationLineTable
      returnAuthorizationLines={authorization.lines}
      gradable={open && can('grade')}
      conditions={data.conditions}
      dispositions={data.dispositions}
      storageLocations={data.storageLocations}
      dictionary={scoped}
    />
  </section>
</div>

<!-- Processing is irreversible bookkeeping, so it is confirmed. The form is a real POST
     rather than a fetch, submitted by the dialog's confirm. -->
<form method="POST" action="?/process" bind:this={processForm} hidden></form>

<ConfirmDialog
  bind:open={processConfirmOpen}
  title={localText('logistic.return_authorization.process')}
  description={localText('logistic.return_authorization.process_confirm')}
  confirmLabel={localText('logistic.return_authorization.process')}
  cancelLabel={dictionary.localText('action.cancel')}
  onConfirm={() => processForm?.requestSubmit()}
/>
