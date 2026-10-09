<!-- One labelled variant on a showcase page. Harness-only; not a coreui component. -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title, children }: { title: string; children: Snippet } = $props();
</script>

<section class="example">
  <h2 class="example__title">{title}</h2>
  <div class="example__stage">
    {@render children()}
  </div>
</section>

<style>
  .example {
    display: grid;
    gap: var(--space-3);
    padding-block: var(--space-4);
    border-block-end: 1px solid var(--border-color);
  }

  .example__title {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-soft);
  }

  .example__stage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
  }
</style>
