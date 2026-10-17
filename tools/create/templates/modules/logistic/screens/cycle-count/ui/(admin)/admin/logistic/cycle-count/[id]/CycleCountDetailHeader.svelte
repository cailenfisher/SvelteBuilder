<!-- The count's identity and progress: back to the list, its number and status, how much has
     been counted and how many lines differ, and, once something is counted, the approval. -->
<script lang="ts">
  import './cycle-count-detail-header.css';
  import type { DictionaryInstance } from 'diglossia';
  import { Badge, Button } from '@sveltebuilder/coreui';
  import type { CycleCountDetailView } from '@sveltebuilder/logistic/views';

  type Props = {
    cycleCount: CycleCountDetailView['cycleCount'];
    /** Whether the count can be approved now: open, and something counted. */
    approvable: boolean;
    onApprove: () => void;
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
  };

  let { cycleCount, approvable, onApprove, dictionary }: Props = $props();

  const localText = (slug: string) => dictionary.localText(slug, 'logistic');

  const statusVariant = $derived(
    cycleCount.status === 'completed'
      ? 'success'
      : cycleCount.status === 'in_progress'
        ? 'warning'
        : cycleCount.status === 'cancelled'
          ? 'danger'
          : 'default'
  );

  const countedLines = $derived(cycleCount.lines.filter((line) => line.countedQuantity !== null));
  const varianceLines = $derived(
    countedLines.filter((line) => line.variance !== null && line.variance !== 0)
  );
</script>

<header class="cycle-count-detail-header">
  <a href="/admin/logistic/cycle-count" class="cycle-count-detail-header__back">
    ← {localText('logistic.cycle_count.title')}
  </a>
  <div class="cycle-count-detail-header__title-row">
    <h1 class="cycle-count-detail-header__title">
      {localText('logistic.cycle_count.one')} #{cycleCount.id}
    </h1>
    <Badge variant={statusVariant}>
      {localText(`logistic.cycle_count.status.${cycleCount.status}`)}
    </Badge>
    {#if approvable}
      <Button variant="primary" onclick={onApprove}>
        {localText('logistic.cycle_count.approve')}
      </Button>
    {/if}
  </div>
  <p class="cycle-count-detail-header__progress">
    {dictionary.formatText(
      'logistic.cycle_count.progress_value',
      { counted: countedLines.length, total: cycleCount.lines.length },
      'logistic'
    )}
    {#if varianceLines.length > 0}
      ·
      {dictionary.formatText(
        'logistic.cycle_count.variance_count',
        { count: varianceLines.length },
        'logistic'
      )}
    {/if}
  </p>
</header>
