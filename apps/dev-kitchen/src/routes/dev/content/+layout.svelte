<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>

<div class="dev-content-layout">
  {@render children()}
</div>

<style>
  .dev-content-layout {
    padding: 2rem;
    max-width: 72rem;
  }
</style>
