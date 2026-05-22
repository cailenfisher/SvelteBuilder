<script lang="ts">
  import { Popover, Button, Field, Input } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Popover — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Popover</h1>

  <section class="dev-section">
    <h2>Basic popover</h2>
    <div class="dev-stage">
      <Popover>
        {#snippet trigger()}
          <Button variant="secondary">Open popover</Button>
        {/snippet}
        <p style="margin: 0; font-size: 0.875rem;">This is popover content. Click outside to close.</p>
      </Popover>
    </div>
  </section>

  <section class="dev-section">
    <h2>With a small form inside</h2>
    <div class="dev-stage">
      <Popover>
        {#snippet trigger()}
          <Button variant="primary">Edit details</Button>
        {/snippet}
        <div style="display: flex; flex-direction: column; gap: 0.75rem; min-width: 16rem;">
          <p style="margin: 0; font-weight: 600; font-size: 0.875rem;">Edit display name</p>
          <Field label="Name" id="popover-name">
            <Input placeholder="Your name" size="sm" />
          </Field>
          <Field label="Title" id="popover-title">
            <Input placeholder="e.g. Engineer" size="sm" />
          </Field>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <Button variant="secondary" size="sm">Cancel</Button>
            <Button variant="primary" size="sm">Save</Button>
          </div>
        </div>
      </Popover>
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
