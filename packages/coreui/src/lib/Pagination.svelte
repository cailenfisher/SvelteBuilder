<script lang="ts">
  import { Pagination } from 'bits-ui';

  type Props = {
    count: number;
    perPage?: number;
    page?: number;
    siblingCount?: number;
    onPageChange?: (page: number) => void;
    class?: string | undefined;
  };

  let {
    count,
    perPage = 10,
    page = $bindable(1),
    siblingCount = 1,
    onPageChange,
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
    <Pagination.PrevButton class="pagination-btn nav" aria-label="Previous page">
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
        <path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </Pagination.PrevButton>

    <div class="pages" role="group" aria-label="Page navigation">
      {#each pages as pageItem, i (i)}
        {#if pageItem.type === 'ellipsis'}
          <span class="ellipsis" aria-hidden="true">…</span>
        {:else}
          <Pagination.Page page={pageItem} class="pagination-btn page">
            {pageItem.value}
          </Pagination.Page>
        {/if}
      {/each}
    </div>

    <Pagination.NextButton class="pagination-btn nav" aria-label="Next page">
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
        <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </Pagination.NextButton>
  {/snippet}
</Pagination.Root>