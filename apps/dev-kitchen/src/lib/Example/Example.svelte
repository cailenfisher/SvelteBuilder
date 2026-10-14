<!-- One labelled variant on a showcase page. Harness-only; not a coreui component. -->
<script lang="ts">
  import './example.css';
  import type { Snippet } from 'svelte';

  let { title, children }: { title: string; children: Snippet } = $props();
</script>

<section class="example">
  <h2 class="example__title">{title}</h2>
  <div class="example__stage">
    {@render children()}
  </div>
</section>
