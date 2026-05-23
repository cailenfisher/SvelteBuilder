<script lang="ts">
  import { Pagination } from 'bits-ui';

  type Props = {
    count: number;
    perPage?: number;
    page?: number;
    siblingCount?: number;
    class?: string | undefined;
  };

  let {
    count,
    perPage = 10,
    page = $bindable(1),
    siblingCount = 1,
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
  class={classes}
>
  {#snippet children({ pages })}
    <Pagination.PrevButton
      class="pagination__btn pagination__btn--nav"
      aria-label="Previous page"
    >
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
        <path
          d="M10 4L6 8l4 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </Pagination.PrevButton>

    <div class="pagination__pages" role="group" aria-label="Page navigation">
      {#each pages as pageItem, i (i)}
        {#if pageItem.type === 'ellipsis'}
          <span class="pagination__ellipsis" aria-hidden="true">…</span>
        {:else}
          <Pagination.Page
            page={pageItem}
            class="pagination__btn pagination__btn--page"
          >
            {pageItem.value}
          </Pagination.Page>
        {/if}
      {/each}
    </div>

    <Pagination.NextButton
      class="pagination__btn pagination__btn--nav"
      aria-label="Next page"
    >
      <svg viewBox="0 0 16 16" fill="none" width="16" height="16" aria-hidden="true">
        <path
          d="M6 4l4 4-4 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </Pagination.NextButton>
  {/snippet}
</Pagination.Root>

<style>
  :global(.pagination) {
    display: flex;
    align-items: center;
    gap: var(--pagination-gap);
  }

  .pagination__pages {
    display: flex;
    align-items: center;
    gap: var(--pagination-gap);
  }

  /* ------------------------------------------------------------------ */
  /* Buttons (nav + page)                                                 */
  /* ------------------------------------------------------------------ */
  :global(.pagination__btn) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--pagination-item-size);
    height: var(--pagination-item-size);
    padding: 0 var(--primitive-space-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--pagination-radius);
    background: transparent;
    font-size: var(--pagination-font-size);
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: background-color var(--duration-fast) var(--ease-out);
    user-select: none;
  }

  :global(.pagination__btn:hover:not([data-disabled]):not([disabled])) {
    background-color: var(--color-surface-raised);
  }

  /* Active page — Bits sets data-selected on the active page button */
  :global(.pagination__btn--page[data-selected]) {
    background-color: var(--color-brand);
    border-color: var(--color-brand);
    color: var(--color-brand-foreground);
    font-weight: var(--weight-medium);
  }

  :global(.pagination__btn[data-disabled]),
  :global(.pagination__btn[disabled]) {
    color: var(--color-disabled-text);
    border-color: var(--color-disabled-border);
    cursor: not-allowed;
  }

  :global(.pagination__btn:focus-visible) {
    outline: var(--focus-ring-width) var(--focus-ring-style) var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  /* ------------------------------------------------------------------ */
  /* Ellipsis                                                             */
  /* ------------------------------------------------------------------ */
  .pagination__ellipsis {
    min-width: var(--pagination-item-size);
    height: var(--pagination-item-size);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: var(--pagination-font-size);
    color: var(--color-text-tertiary);
    user-select: none;
  }
</style>
