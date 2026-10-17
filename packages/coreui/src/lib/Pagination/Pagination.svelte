<script lang="ts">
  import { Pagination } from 'bits-ui';

  type Props = {
    count: number;
    perPage?: number;
    page?: number;
    siblingCount?: number;
    onPageChange?: (page: number) => void;
    /** Accessible name for the previous-page button. */
    previousLabel: string;
    /** Accessible name for the next-page button. */
    nextLabel: string;
    /** Accessible name for the group of page buttons. */
    label: string;
    class?: string | undefined;
  };

  let {
    count,
    perPage = 10,
    page = $bindable(1),
    siblingCount = 1,
    onPageChange,
    previousLabel,
    nextLabel,
    label,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    ['pagination', extraClass ?? ''].filter(Boolean).join(' ')
  );
</script>

<Pagination.Root
  {count}
  {perPage}
  bind:page
  {siblingCount}
  {onPageChange}
  class={classes}
>
  {#snippet children({ pages })}
    <Pagination.PrevButton class="pagination__button pagination__button--navigation" aria-label={previousLabel}>
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
        <path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </Pagination.PrevButton>

    <div class="pagination__pages" role="group" aria-label={label}>
      {#each pages as pageItem, i (i)}
        {#if pageItem.type === 'ellipsis'}
          <span class="pagination__ellipsis" aria-hidden="true">…</span>
        {:else}
          <Pagination.Page page={pageItem} class="pagination__button pagination__button--page">
            {pageItem.value}
          </Pagination.Page>
        {/if}
      {/each}
    </div>

    <Pagination.NextButton class="pagination__button pagination__button--navigation" aria-label={nextLabel}>
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
        <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </Pagination.NextButton>
  {/snippet}
</Pagination.Root>