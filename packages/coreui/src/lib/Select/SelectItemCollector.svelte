<!-- Internal: renders Select's children in registration mode — see select-items.ts. Not exported. -->
<script lang="ts">
  import { setContext, type Snippet } from 'svelte';
  import { SELECT_ITEM_REGISTRY, type SelectItemRegistry } from './select-items.js';

  let { registry, children }: { registry: SelectItemRegistry; children: Snippet } = $props();

  // svelte-ignore state_referenced_locally
  setContext(SELECT_ITEM_REGISTRY, registry);
</script>

{@render children()}
