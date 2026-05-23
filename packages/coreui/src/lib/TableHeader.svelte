<script lang="ts">
  import type { Snippet } from 'svelte';

  type Scope = 'col' | 'row' | 'colgroup' | 'rowgroup';
  type SortDir = 'asc' | 'desc' | false;

  type Props = {
    scope?: Scope;
    sortable?: boolean;
    sorted?: SortDir;
    children: Snippet;
    class?: string | undefined;
  };

  let {
    scope = 'col',
    sortable = false,
    sorted = false,
    children,
    class: extraClass,
  }: Props = $props();

  const classes = $derived(
    [
      'table-header',
      sortable ? 'table-header--sortable' : '',
      extraClass ?? '',
    ]
      .filter(Boolean)
      .join(' ')
  );

  const ariaSort = $derived(
    sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined
  );
</script>

<th class={classes} {scope} aria-sort={ariaSort}>
  {#if sortable}
    <span class="table-header__content">
      {@render children()}
      <span class="table-header__sort-icon" aria-hidden="true">
        {#if sorted === 'asc'}
          <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
            <path d="M8 4l4 6H4l4-6z" fill="currentColor"/>
          </svg>
        {:else if sorted === 'desc'}
          <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
            <path d="M8 12L4 6h8l-4 6z" fill="currentColor"/>
          </svg>
        {:else}
          <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
            <path d="M8 3l3 4H5l3-4zm0 10l-3-4h6l-3 4z" fill="currentColor" opacity="0.4"/>
          </svg>
        {/if}
      </span>
    </span>
  {:else}
    {@render children()}
  {/if}
</th>

<style>
  .table-header {
    padding: var(--table-cell-padding-y) var(--table-cell-padding-x);
    font-size: var(--table-font-size);
    font-weight: var(--table-header-weight);
    color: var(--color-text-secondary);
    text-align: left;
    white-space: nowrap;
    background-color: var(--table-header-bg);
    border-bottom: 1px solid var(--table-border);
  }

  .table-header--sortable {
    cursor: pointer;
    user-select: none;
  }

  .table-header--sortable:hover {
    color: var(--color-text-primary);
  }

  .table-header__content {
    display: inline-flex;
    align-items: center;
    gap: var(--primitive-space-1-5);
  }

  .table-header__sort-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }
</style>
