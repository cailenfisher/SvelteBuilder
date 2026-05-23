<script lang="ts">
  import { Pagination } from '@sveltebuilder/coreui';

  let page = $state(1);
</script>

<svelte:head>
  <title>Pagination — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Pagination</h1>

  <section class="dev-section">
    <h2>Default — first page active</h2>
    <div class="dev-stage">
      <Pagination count={100} perPage={10} page={1} />
    </div>
  </section>

  <section class="dev-section">
    <h2>Last page active</h2>
    <div class="dev-stage">
      <Pagination count={100} perPage={10} page={10} />
    </div>
  </section>

  <section class="dev-section">
    <h2>Middle page active</h2>
    <div class="dev-stage">
      <Pagination count={100} perPage={10} page={5} />
    </div>
  </section>

  <section class="dev-section">
    <h2>Small total — 3 pages (no ellipsis)</h2>
    <div class="dev-stage">
      <Pagination count={30} perPage={10} page={2} />
    </div>
  </section>

  <section class="dev-section">
    <h2>Large total — 20 pages (ellipsis visible)</h2>
    <div class="dev-stage">
      <Pagination count={200} perPage={10} page={10} siblingCount={1} />
    </div>
  </section>

  <section class="dev-section">
    <h2>Bound page (live)</h2>
    <div class="dev-stage">
      <Pagination bind:page count={100} perPage={10} />
      <p style="margin-top: 0.75rem; font-size: 0.875rem;">Current page: <strong>{page}</strong></p>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
</style>
