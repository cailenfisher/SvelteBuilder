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
    ['table-header', sortable ? 'sortable' : '', extraClass ?? '']
      .filter(Boolean)
      .join(' ')
  );

  const ariaSort = $derived(
    sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined
  );
</script>

<th class={classes} {scope} aria-sort={ariaSort}>
  {#if sortable}
    <span class="content">
      {@render children()}
      <span class="sort-icon" aria-hidden="true">
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