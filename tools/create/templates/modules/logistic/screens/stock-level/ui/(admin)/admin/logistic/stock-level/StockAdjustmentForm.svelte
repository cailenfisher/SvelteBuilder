<!-- Records a stock adjustment: posts to this route's `adjust` action. -->
<script lang="ts">
  import './stock-adjustment-form.css';
  import { enhance } from '$app/forms';
  import type { DictionaryInstance } from 'diglossia';
  import { getDictionary } from 'diglossia/svelte';
  import { Button, Field, Input, Select, SelectItem, Textarea } from '@sveltebuilder/coreui';
  import type { StockAdjustmentReason } from '@sveltebuilder/logistic';
  import type { StockLevelRow } from '@sveltebuilder/logistic/views';

  type Props = {
    stockLevel: StockLevelRow;
    /** The reasons an operator may choose; the operational ones are the workflows' own. */
    manualReasons: StockAdjustmentReason[];
    /** The screen's scoped dictionary: module copy. */
    dictionary: DictionaryInstance;
    onCancel: () => void;
    /** After the action has answered and the page data has updated. */
    onSubmit: () => void;
  };

  let { stockLevel, manualReasons, dictionary, onCancel, onSubmit }: Props = $props();

  const globalDictionary = getDictionary();
  const localText = (slug: string) => dictionary.localText(slug, 'logistic');
</script>

<form
  method="POST"
  action="?/adjust"
  class="stock-adjustment-form"
  use:enhance={() =>
    async ({ update }) => {
      await update();
      onSubmit();
    }}
>
  <input type="hidden" name="stock_level_id" value={stockLevel.id} />

  <!-- Field renders the <label for>; the control inherits its id through field context, so
       it is not repeated on the control. -->
  <Field label={localText('logistic.stock_level.adjust_delta')} id="adjust-delta" required>
    <Input name="delta" type="number" required />
  </Field>

  <Field label={localText('logistic.field.reason')} id="adjust-reason" required>
    <!-- `required` lives on Field, which renders the label and marks it; Select itself takes
         no such prop. SelectItem is self-labelling. -->
    <Select name="reason">
      {#each manualReasons as reason (reason)}
        <SelectItem value={reason} label={localText(`logistic.stock_adjustment_reason.${reason}`)} />
      {/each}
    </Select>
  </Field>

  <Field label={localText('logistic.field.note')} id="adjust-note">
    <Textarea name="note" rows={2} />
  </Field>

  <div class="stock-adjustment-form__actions">
    <Button variant="ghost" onclick={onCancel}>
      {globalDictionary.localText('action.cancel')}
    </Button>
    <Button type="submit" variant="primary">{localText('logistic.stock_level.adjust_apply')}</Button>
  </div>
</form>
