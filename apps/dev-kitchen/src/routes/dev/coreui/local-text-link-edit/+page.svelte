<script lang="ts">
  import { LocalTextLinkEdit } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>LocalTextLinkEdit — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>LocalTextLinkEdit</h1>

  <section class="dev-section">
    <h2>Empty (create new)</h2>
    <div class="dev-stage">
      <form>
        <LocalTextLinkEdit slugLabel="Key (slug)" scopeLabel="Scope" />
      </form>
    </div>
  </section>

  <section class="dev-section">
    <h2>Global key (no scope)</h2>
    <div class="dev-stage">
      <form>
        <LocalTextLinkEdit
          slugLabel="Key (slug)"
          scopeLabel="Scope"
          slug="action.save"
        />
      </form>
    </div>
  </section>

  <section class="dev-section">
    <h2>Scoped key (edit existing)</h2>
    <div class="dev-stage">
      <form>
        <LocalTextLinkEdit
          slugLabel="Key (slug)"
          scopeLabel="Scope"
          slug="product.title"
          scope="product"
        />
      </form>
    </div>
  </section>

  <section class="dev-section">
    <h2>Scope examples</h2>
    <div class="dev-stage">
      <form>
        <LocalTextLinkEdit
          slugLabel="Key (slug)"
          scopeLabel="Scope"
          slug="nav.dashboard"
          scope="nav"
        />
      </form>
      <form style="margin-top: 1rem;">
        <LocalTextLinkEdit
          slugLabel="Key (slug)"
          scopeLabel="Scope"
          slug="order.status.pending"
          scope="order"
        />
      </form>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  form { display: contents; }
</style>
