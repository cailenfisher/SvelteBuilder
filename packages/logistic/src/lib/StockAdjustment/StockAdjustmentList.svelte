<!-- A stock level's adjustments, newest first as given: how much moved, why, what was left,
     when, and the note if there is one. Resolves the reason labels and the "on hand after"
     sentence from the dictionary, scope `logistic`. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import type { StockAdjustment } from '../schema/index.js';

  type Props = {
    stockAdjustments: StockAdjustment[];
    locale: string;
    dictionary?: DictionaryInstance;
    class?: string | undefined;
  };

  let { stockAdjustments, locale, dictionary: dictionaryProp, class: extraClass }: Props =
    $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const formatTimestamp = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso)
    );

  const classes = $derived(['stock-adjustment-list', extraClass ?? ''].filter(Boolean).join(' '));
</script>

{#if stockAdjustments.length > 0}
  <ul class={classes}>
    {#each stockAdjustments as adjustment (adjustment.id)}
      <li class="stock-adjustment-list__item">
        <span
          class="stock-adjustment-list__delta"
          class:stock-adjustment-list__delta--negative={adjustment.delta < 0}
        >
          {adjustment.delta > 0 ? '+' : ''}{adjustment.delta}
        </span>
        <span class="stock-adjustment-list__reason">
          {dictionary.localText(`logistic.stock_adjustment_reason.${adjustment.reason}`, 'logistic')}
        </span>
        <!-- Interpolated through MF2 rather than concatenated, so a locale can put the number
             wherever its grammar needs it. -->
        <span class="stock-adjustment-list__on-hand-after">
          {dictionary.formatText(
            'logistic.stock_level.history_after',
            { count: adjustment.onHandAfter },
            'logistic'
          )}
        </span>
        <span class="stock-adjustment-list__created-at">{formatTimestamp(adjustment.createdAt)}</span>
        {#if adjustment.note}
          <span class="stock-adjustment-list__note">{adjustment.note}</span>
        {/if}
      </li>
    {/each}
  </ul>
{:else}
  <p class="stock-adjustment-list__empty">
    {dictionary.localText('logistic.stock_level.history_empty', 'logistic')}
  </p>
{/if}
