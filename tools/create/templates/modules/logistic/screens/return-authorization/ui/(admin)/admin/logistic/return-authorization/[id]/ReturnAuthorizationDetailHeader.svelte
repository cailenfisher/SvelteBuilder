<!-- The return's identity: back to the list, its number and status, why it came back, and,
     once every line is graded, the action that closes it. -->
<script lang="ts">
  import './return-authorization-detail-header.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge, Button } from '@sveltebuilder/coreui';
  import type { ReturnAuthorization } from '@sveltebuilder/logistic';

  type Props = {
    returnAuthorization: ReturnAuthorization;
    /** Whether the return can be processed now: open, and every line graded. */
    processable: boolean;
    onProcess: () => void;
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { returnAuthorization, processable, onProcess, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');

  const statusVariant = $derived(
    returnAuthorization.status === 'processed'
      ? 'success'
      : returnAuthorization.status === 'received'
        ? 'warning'
        : returnAuthorization.status === 'cancelled'
          ? 'danger'
          : 'default'
  );
</script>

<header class="return-authorization-detail-header">
  <a href="/admin/logistic/return-authorization" class="return-authorization-detail-header__back">
    ← {localText('logistic.return_authorization.title')}
  </a>
  <div class="return-authorization-detail-header__title-row">
    <h1 class="return-authorization-detail-header__title">
      {localText('logistic.return_authorization.one')} #{returnAuthorization.id}
    </h1>
    <Badge variant={statusVariant}>
      {localText(`logistic.return_authorization.status.${returnAuthorization.status}`)}
    </Badge>
    {#if processable}
      <Button variant="primary" onclick={onProcess}>
        {localText('logistic.return_authorization.process')}
      </Button>
    {/if}
  </div>
  {#if returnAuthorization.reason}
    <p class="return-authorization-detail-header__meta">{returnAuthorization.reason}</p>
  {/if}
  {#if returnAuthorization.note}
    <p class="return-authorization-detail-header__meta">{returnAuthorization.note}</p>
  {/if}
</header>
