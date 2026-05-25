<script lang="ts">
  import { Button } from '@sveltebuilder/coreui';
</script>

<div class="warehouse-home">
  <h1 class="warehouse-home__title">Warehouse</h1>

  <nav class="warehouse-home__flows" aria-label="Operational flows">
    <a href="/warehouse/pick" class="warehouse-home__flow-card">
      <span class="warehouse-home__flow-icon" aria-hidden="true">📦</span>
      <span class="warehouse-home__flow-label">Pick queue</span>
      <span class="warehouse-home__flow-desc">View and work open pick tasks</span>
    </a>

    <a href="/warehouse/receive" class="warehouse-home__flow-card">
      <span class="warehouse-home__flow-icon" aria-hidden="true">🚚</span>
      <span class="warehouse-home__flow-label">Receiving</span>
      <span class="warehouse-home__flow-desc">Process inbound receipts</span>
    </a>
  </nav>
</div>

<style>
  .warehouse-home {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
    padding: var(--space-6);
    max-width: 48rem;
    margin-inline: auto;
    width: 100%;
  }

  .warehouse-home__title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .warehouse-home__flows {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4);
  }

  .warehouse-home__flow-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-6);
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    text-decoration: none;
    transition: box-shadow var(--duration-fast) var(--ease-out),
                border-color var(--duration-fast) var(--ease-out);
  }

  .warehouse-home__flow-card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-border-strong);
  }

  .warehouse-home__flow-icon {
    font-size: var(--text-3xl);
    line-height: 1;
  }

  .warehouse-home__flow-label {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-primary);
  }

  .warehouse-home__flow-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
</style>
