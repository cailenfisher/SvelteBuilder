<svelte:head>
  <title>CoreUI — Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>CoreUI Components</h1>

  <section class="dev-section">
    <h2>Form Controls</h2>
    <div class="grid">
      <a href="/dev/coreui/field" class="component-card">Field</a>
      <a href="/dev/coreui/label" class="component-card">Label</a>
      <a href="/dev/coreui/input" class="component-card">Input</a>
      <a href="/dev/coreui/textarea" class="component-card">Textarea</a>
      <a href="/dev/coreui/checkbox" class="component-card">Checkbox</a>
      <a href="/dev/coreui/radio-group" class="component-card">RadioGroup</a>
      <a href="/dev/coreui/switch" class="component-card">Switch</a>
      <a href="/dev/coreui/select" class="component-card">Select</a>
    </div>
  </section>

  <section class="dev-section">
    <h2>Actions</h2>
    <div class="grid">
      <a href="/dev/coreui/button" class="component-card">Button</a>
    </div>
  </section>

  <section class="dev-section">
    <h2>Overlays</h2>
    <div class="grid">
      <a href="/dev/coreui/dialog" class="component-card">Dialog</a>
      <a href="/dev/coreui/popover" class="component-card">Popover</a>
      <a href="/dev/coreui/tooltip" class="component-card">Tooltip</a>
      <a href="/dev/coreui/menu" class="component-card">Menu</a>
    </div>
  </section>

  <section class="dev-section">
    <h2>Display</h2>
    <div class="grid">
      <a href="/dev/coreui/alert" class="component-card">Alert</a>
      <a href="/dev/coreui/avatar" class="component-card">Avatar</a>
      <a href="/dev/coreui/badge" class="component-card">Badge</a>
      <a href="/dev/coreui/card" class="component-card">Card</a>
      <a href="/dev/coreui/tag" class="component-card">Tag</a>
      <a href="/dev/coreui/divider" class="component-card">Divider</a>
    </div>
  </section>

  <section class="dev-section">
    <h2>Navigation</h2>
    <div class="grid">
      <a href="/dev/coreui/tabs" class="component-card">Tabs</a>
      <a href="/dev/coreui/pagination" class="component-card">Pagination</a>
      <a href="/dev/coreui/accordion" class="component-card">Accordion</a>
    </div>
  </section>

  <section class="dev-section">
    <h2>Feedback</h2>
    <div class="grid">
      <a href="/dev/coreui/spinner" class="component-card">Spinner</a>
      <a href="/dev/coreui/skeleton" class="component-card">Skeleton</a>
      <a href="/dev/coreui/progress-bar" class="component-card">ProgressBar</a>
    </div>
  </section>

  <section class="dev-section">
    <h2>Data</h2>
    <div class="grid">
      <a href="/dev/coreui/table" class="component-card">Table</a>
    </div>
  </section>
</div>

<style>
  .dev-page {
    max-width: 56rem;
  }

  h1 {
    margin-block-end: 2rem;
  }

  .dev-section {
    margin-block-end: 2rem;
  }

  h2 {
    margin-block-end: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.6;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: 0.75rem;
  }

  .component-card {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    border: 1px solid currentColor;
    border-radius: 0.375rem;
    text-decoration: none;
    font-weight: 500;
    transition: background-color 0.1s;
  }

  .component-card:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
</style>
