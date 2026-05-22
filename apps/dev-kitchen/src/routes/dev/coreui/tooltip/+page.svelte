<script lang="ts">
  import { Tooltip, Button } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Tooltip — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Tooltip</h1>

  <!-- hidden on touch devices via CSS @media (hover: none) -->

  <section class="dev-section">
    <h2>Basic tooltip on a button</h2>
    <div class="dev-stage">
      <Tooltip content="This is a helpful tooltip">
        <Button variant="secondary">Hover me</Button>
      </Tooltip>
    </div>
  </section>

  <section class="dev-section">
    <h2>Tooltip on various trigger types</h2>
    <div class="dev-stage dev-stage--row">
      <Tooltip content="Primary action tooltip">
        <Button variant="primary" size="sm">Primary</Button>
      </Tooltip>
      <Tooltip content="Ghost button tooltip">
        <Button variant="ghost" size="sm">Ghost</Button>
      </Tooltip>
      <Tooltip content="Danger action — cannot be undone">
        <Button variant="danger" size="sm">Danger</Button>
      </Tooltip>
    </div>
  </section>

  <section class="dev-section">
    <h2>Long content (tests max-width)</h2>
    <div class="dev-stage">
      <Tooltip content="This is a much longer tooltip message that tests the max-width constraint. It should wrap onto multiple lines rather than expanding horizontally forever.">
        <Button variant="secondary">Hover for long tooltip</Button>
      </Tooltip>
    </div>
  </section>

  <section class="dev-section">
    <h2>Custom delay</h2>
    <div class="dev-stage dev-stage--row">
      <Tooltip content="Appears immediately (delay=0)" delay={0}>
        <Button variant="ghost" size="sm">No delay</Button>
      </Tooltip>
      <Tooltip content="Default 600ms delay">
        <Button variant="ghost" size="sm">Default delay</Button>
      </Tooltip>
      <Tooltip content="Appears after 1500ms" delay={1500}>
        <Button variant="ghost" size="sm">Long delay</Button>
      </Tooltip>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
</style>
