<script lang="ts">
  import { Badge } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Badge — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Badge</h1>

  <section class="dev-section">
    <h2>All variants — medium size</h2>
    <div class="dev-stage dev-stage--row">
      <Badge variant="default">Default</Badge>
      <Badge variant="brand">Brand</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  </section>

  <section class="dev-section">
    <h2>All sizes — default variant</h2>
    <div class="dev-stage dev-stage--row">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  </section>

  <section class="dev-section">
    <h2>Sizes × variants matrix</h2>
    <div class="dev-stage">
      {#each ['sm', 'md', 'lg'] as size}
        <div class="dev-stage--row" style="margin-bottom: 0.5rem;">
          {#each ['default', 'brand', 'success', 'warning', 'danger', 'info'] as variant}
            <Badge size={size as 'sm' | 'md' | 'lg'} variant={variant as 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info'}>{size}</Badge>
          {/each}
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 56rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
</style>
