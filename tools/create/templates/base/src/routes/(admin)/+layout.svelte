<script lang="ts">
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()

  const navLinks = [{ href: '/admin/dashboard', label: 'Dashboard' }]
</script>

<div class="admin-layout">
  <nav class="admin-layout__sidebar" aria-label="Admin navigation">
    <div class="admin-layout__logo">
      <a href="/admin/dashboard">Admin</a>
    </div>
    <ul class="admin-layout__nav">
      {#each navLinks as link}
        <li>
          <a href={link.href} class="admin-layout__nav-link">{link.label}</a>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="admin-layout__body">
    <!-- SuperPrototype layer adds the user header here -->
    <main class="admin-layout__main">
      {@render children()}
    </main>
  </div>
</div>

<style>
  .admin-layout {
    display: flex;
    flex: 1;
    min-height: 100dvh;
  }

  .admin-layout__sidebar {
    width: 224px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.25rem 0.75rem;
    border-right: 1px solid var(--color-border-default, currentColor);
    background-color: var(--color-surface-raised, transparent);
  }

  .admin-layout__logo a {
    font-weight: 600;
    font-size: 1rem;
    text-decoration: none;
    color: inherit;
    padding: 0 0.5rem;
  }

  .admin-layout__nav {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .admin-layout__nav-link {
    display: block;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    text-decoration: none;
    font-size: 0.875rem;
    color: var(--color-text-primary, inherit);
    transition: background-color 0.12s;
  }

  .admin-layout__nav-link:hover {
    background-color: var(--color-surface-overlay, rgba(0, 0, 0, 0.05));
  }

  .admin-layout__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .admin-layout__main {
    padding: 1.5rem;
    flex: 1;
  }
</style>
