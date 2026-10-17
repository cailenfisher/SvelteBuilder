<!-- One stock level's adjustment history, opened from its row and closed by navigating back
     to the unfiltered list. -->
<script lang="ts">
  import './stock-adjustment-panel.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button } from '@sveltebuilder/coreui';
  import { StockAdjustmentList } from '@sveltebuilder/logistic';
  import type { StockAdjustment } from '@sveltebuilder/logistic';
  import type { StockLevelRow } from '@sveltebuilder/logistic/views';

  type Props = {
    stockLevel: StockLevelRow;
    stockAdjustments: StockAdjustment[];
    localeCode: string;
    /** The screen's scoped dictionary: module copy and every location's name. */
    dictionary: DictionaryInstance;
  };

  let { stockLevel, stockAdjustments, localeCode, dictionary }: Props = $props();

  const globalDictionary = getDictionary();
  const history = $derived(dictionary.localText('logistic.stock_level.history', 'logistic'));
</script>

<section class="stock-adjustment-panel" aria-label={history}>
  <div class="stock-adjustment-panel__header">
    <h2 class="stock-adjustment-panel__title">
      {history} — <span class="stock-adjustment-panel__sku">{stockLevel.sku}</span>
      · {dictionary.localText('name', 'storage_location', stockLevel.storageLocation.id)}
    </h2>
    <Button href="/admin/logistic/stock-level" variant="ghost" size="sm">
      {globalDictionary.localText('action.close')}
    </Button>
  </div>

  <StockAdjustmentList {stockAdjustments} locale={localeCode} {dictionary} />
</section>
