<script lang="ts">
  import { Skeleton } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Skeleton — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Skeleton</h1>

  <section class="dev-section">
    <h2>Explicit width and height</h2>
    <div class="dev-stage">
      <Skeleton width="8rem" height="1rem" />
      <Skeleton width="12rem" height="1rem" />
      <Skeleton width="6rem" height="2rem" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Matching text lines (height ~1em, varying widths)</h2>
    <div class="dev-stage">
      <Skeleton width="100%" height="1em" />
      <Skeleton width="90%" height="1em" />
      <Skeleton width="75%" height="1em" />
      <Skeleton width="50%" height="1em" />
    </div>
  </section>

  <section class="dev-section">
    <h2>Matching a card (avatar + lines)</h2>
    <div class="dev-stage">
      <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
        <Skeleton width="3rem" height="3rem" radius="50%" />
        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem; padding-top: 0.25rem;">
          <Skeleton width="40%" height="0.875em" />
          <Skeleton width="70%" height="0.875em" />
          <Skeleton width="55%" height="0.875em" />
        </div>
      </div>
    </div>
  </section>

  <section class="dev-section">
    <h2>inline={true}</h2>
    <div class="dev-stage">
      <p>
        Loading user:
        <Skeleton inline width="6rem" height="1em" />
        in project
        <Skeleton inline width="8rem" height="1em" />
      </p>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { display: flex; flex-direction: column; gap: 0.5rem; padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
</style>
