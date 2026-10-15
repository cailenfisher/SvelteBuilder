<!-- Adjusting one stock level: the adjustment itself, and its reorder point beneath. Both
     forms close the modal once their action has answered. -->
<script lang="ts">
  import './stock-adjustment-modal.css';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Dialog } from '@sveltebuilder/coreui';
  import type { StockAdjustmentReason } from '@sveltebuilder/logistic';
  import type { StockLevelRow } from '@sveltebuilder/logistic/views';
  import StockAdjustmentForm from './StockAdjustmentForm.svelte';
  import StockLevelReorderPointForm from './StockLevelReorderPointForm.svelte';

  type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The level being adjusted; nothing renders inside the modal without one. */
    stockLevel: StockLevelRow | null;
    manualReasons: StockAdjustmentReason[];
    /** The screen's scoped dictionary: module copy and every location's name. */
    dictionary: DictionaryInstance;
  };

  let { open, onOpenChange, stockLevel, manualReasons, dictionary }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
  const close = () => onOpenChange(false);
</script>

<Dialog
  {open}
  {onOpenChange}
  title={localText('logistic.stock_level.adjust_title')}
  closeLabel={globalDictionary.localText('action.close')}
>
  {#snippet children()}
    {#if stockLevel}
      <p class="stock-adjustment-modal__context">
        <span class="stock-adjustment-modal__sku">{stockLevel.sku}</span>
        · {dictionary.localText('name', 'storage_location', stockLevel.storageLocation.id)}
        · {stockLevel.onHand}
        {localText('logistic.field.on_hand')}
      </p>

      <StockAdjustmentForm {stockLevel} {manualReasons} {dictionary} onCancel={close} onSubmit={close} />
      <StockLevelReorderPointForm {stockLevel} {dictionary} onSubmit={close} />
    {/if}
  {/snippet}
</Dialog>
