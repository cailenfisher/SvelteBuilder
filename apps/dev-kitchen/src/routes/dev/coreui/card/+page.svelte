<script lang="ts">
  import { Card } from '@sveltebuilder/coreui';
</script>

<svelte:head>
  <title>Card — CoreUI Dev Kitchen</title>
</svelte:head>

<div class="dev-page">
  <h1>Card</h1>

  <section class="dev-section">
    <h2>Default (no header/footer)</h2>
    <div class="dev-stage">
      <Card>
        Just a card body. No header or footer slots provided.
      </Card>
    </div>
  </section>

  <section class="dev-section">
    <h2>With header slot</h2>
    <div class="dev-stage">
      <Card>
        {#snippet header()}
          <strong>Card Title</strong>
        {/snippet}
        Card body content below the header.
      </Card>
    </div>
  </section>

  <section class="dev-section">
    <h2>With footer slot</h2>
    <div class="dev-stage">
      <Card>
        Card body content above the footer.
        {#snippet footer()}
          <span style="font-size: 0.75rem; opacity: 0.6;">Last updated 2 minutes ago</span>
        {/snippet}
      </Card>
    </div>
  </section>

  <section class="dev-section">
    <h2>With header and footer</h2>
    <div class="dev-stage">
      <Card>
        {#snippet header()}
          <strong>User Profile</strong>
        {/snippet}
        This card has both a header and a footer. The header has a bottom border, and the footer has a top border (both from card tokens).
        {#snippet footer()}
          <button style="font-size: 0.875rem; cursor: pointer; padding: 0.25rem 0.75rem; border: 1px solid #ccc; border-radius: 0.25rem; background: transparent;">Edit profile</button>
        {/snippet}
      </Card>
    </div>
  </section>

  <section class="dev-section">
    <h2>as="article" vs as="div"</h2>
    <div class="dev-stage dev-stage--row" style="align-items: flex-start;">
      <!--
        as="article": use when the card is standalone, self-contained content —
        a product, a blog post, a user profile card. Semantically meaningful.

        as="div" (default): use for generic layout containers, UI panels,
        or anywhere the card is purely decorative grouping with no independent meaning.
      -->
      <div style="flex: 1;">
        <p style="font-size: 0.75rem; margin-bottom: 0.5rem;">as="article"</p>
        <Card as="article">
          {#snippet header()}<strong>Article Card</strong>{/snippet}
          Renders as &lt;article&gt; in the DOM.
        </Card>
      </div>
      <div style="flex: 1;">
        <p style="font-size: 0.75rem; margin-bottom: 0.5rem;">as="div" (default)</p>
        <Card as="div">
          {#snippet header()}<strong>Div Card</strong>{/snippet}
          Renders as &lt;div&gt; in the DOM.
        </Card>
      </div>
    </div>
  </section>

  <section class="dev-section">
    <h2>padding={false}</h2>
    <div class="dev-stage">
      <Card padding={false}>
        {#snippet header()}<div style="padding: 1rem;"><strong>Custom Padded Header</strong></div>{/snippet}
        <div style="padding: 1rem;">This card has no automatic padding — consumers control spacing entirely.</div>
      </Card>
    </div>
  </section>
</div>

<style>
  .dev-page { max-width: 40rem; }
  h1 { margin-block-end: 2rem; }
  .dev-section { margin-block-end: 2.5rem; }
  h2 { margin-block-end: 0.75rem; font-size: 0.875rem; font-weight: 600; }
  .dev-stage { padding: 1.5rem; border: 1px solid #ccc; border-radius: 0.375rem; }
  .dev-stage--row { display: flex; flex-wrap: wrap; gap: 1rem; }
</style>
