<script lang="ts">
  let { children }: { children: any } = $props()
</script>

<div class="dev-layout">
  <nav class="dev-layout__nav">
    <strong>Kitchen</strong>
    <a href="/dev">Overview</a>
    <a href="/dev/hermes">Hermes</a>
    <!-- TODO: add links as new component sections are added -->
  </nav>
  <div class="dev-layout__content">
    {@render children()}
  </div>
</div>

<style>
  .dev-layout {
    display: grid;
    grid-template-columns: 14rem 1fr;
    min-height: 100dvh;
  }

  .dev-layout__nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    border-right: 1px solid currentColor;
  }

  .dev-layout__content {
    padding: 1.5rem;
  }
</style>
