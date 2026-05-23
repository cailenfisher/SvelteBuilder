<script lang="ts">
  import { Tag } from '@sveltebuilder/coreui';

  let tags = $state(['Design', 'Engineering', 'Product', 'Marketing']);

  function removeTag(label: string) {
    tags = tags.filter((t) => t !== label);
  }
</script>

<svelte:head>
  <title>Tag — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Tag</h1>

  <section class="dev-section">
    <h2>Static (no onremove)</h2>
    <div class="dev-stage dev-stage--row">
      <Tag>Design</Tag>
      <Tag>Engineering</Tag>
      <Tag>Product</Tag>
    </div>
  </section>

  <section class="dev-section">
    <h2>All variants — static</h2>
    <div class="dev-stage dev-stage--row">
      <Tag variant="default">Default</Tag>
      <Tag variant="brand">Brand</Tag>
      <Tag variant="success">Success</Tag>
      <Tag variant="warning">Warning</Tag>
      <Tag variant="danger">Danger</Tag>
      <Tag variant="info">Info</Tag>
    </div>
  </section>

  <section class="dev-section">
    <h2>With onremove — removable tag list</h2>
    <div class="dev-stage">
      {#if tags.length > 0}
        <div class="dev-stage--row">
          {#each tags as tag (tag)}
            <Tag
              variant="brand"
              onremove={() => removeTag(tag)}
              removeLabel="Remove {tag}"
            >
              {tag}
            </Tag>
          {/each}
        </div>
      {:else}
        <p style="font-size: 0.875rem; opacity: 0.6;">All tags removed. Reload to reset.</p>
      {/if}
      <p style="margin-top: 0.5rem; font-size: 0.875rem;">Remaining: <strong>{tags.join(', ') || '(none)'}</strong></p>
    </div>
  </section>

  <section class="dev-section">
    <h2>Variants with onremove</h2>
    <div class="dev-stage dev-stage--row">
      <Tag variant="default" onremove={() => {}} removeLabel="Remove default">Default</Tag>
      <Tag variant="brand" onremove={() => {}} removeLabel="Remove brand">Brand</Tag>
      <Tag variant="success" onremove={() => {}} removeLabel="Remove success">Success</Tag>
      <Tag variant="warning" onremove={() => {}} removeLabel="Remove warning">Warning</Tag>
      <Tag variant="danger" onremove={() => {}} removeLabel="Remove danger">Danger</Tag>
      <Tag variant="info" onremove={() => {}} removeLabel="Remove info">Info</Tag>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
</style>
