<!-- Sets the alerting threshold below which a stock level counts as low: posts to this
     route's `setReorderPoint` action. Empty clears it. -->
<script lang="ts">
  import './stock-level-reorder-point-form.css';
  import { enhance } from '$app/forms';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Field, Input } from '@sveltebuilder/coreui';
  import type { StockLevelRow } from '@sveltebuilder/logistic/views';

  type Props = {
    stockLevel: StockLevelRow;
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
    /** After the action has answered and the page data has updated. */
    onSubmit: () => void;
  };

  let { stockLevel, dictionary, onSubmit }: Props = $props();

  const globalDictionary = getDictionary();
</script>

<form
  method="POST"
  action="?/setReorderPoint"
  class="stock-level-reorder-point-form"
  use:enhance={() =>
    async ({ update }) => {
      await update();
      onSubmit();
    }}
>
  <input type="hidden" name="stock_level_id" value={stockLevel.id} />

  <Field
    label={dictionary.localText('logistic.stock_level.reorder_point_hint', 'logistic')}
    id="adjust-reorder"
  >
    <Input name="reorder_point" type="number" min="0" value={stockLevel.reorderPoint ?? ''} />
  </Field>

  <div class="stock-level-reorder-point-form__actions">
    <Button type="submit" variant="secondary">{globalDictionary.localText('action.save')}</Button>
  </div>
</form>
