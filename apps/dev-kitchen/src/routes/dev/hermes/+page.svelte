<script lang="ts">
  import { localText, LocalText } from '@sveltebuilder/hermes'
  import type { PageData } from '../../$types'

  let { data }: { data: PageData } = $props()

  // Test cases — cover all key lookup patterns
  const cases = [
    { label: 'Global slug',        slug: 'app.name',       scope: undefined, entityId: undefined },
    { label: 'Global action',      slug: 'action.save',    scope: undefined, entityId: undefined },
    { label: 'Missing key',        slug: 'does.not.exist', scope: undefined, entityId: undefined },
    { label: 'Scoped, no entity',  slug: 'action.save',    scope: 'product', entityId: undefined },
    { label: 'Scoped with entity', slug: 'product.title',  scope: 'product', entityId: 1        },
  ] as const
</script>

<h1>Hermes</h1>

<section>
  <h2>Dictionary stats</h2>
  <p>Entries loaded: <strong>{data.dictionary.length}</strong></p>
  <p>Active locale: <strong>{data.locale.code}</strong></p>
  <p>Default locale: <strong>{data.defaultLocale.code}</strong></p>
</section>

<section>
  <h2>localText() function</h2>
  <table>
    <thead>
      <tr>
        <th>Label</th>
        <th>Call</th>
        <th>Output</th>
      </tr>
    </thead>
    <tbody>
      {#each cases as c}
        <tr>
          <td>{c.label}</td>
          <td><code>localText('{c.slug}'{c.scope ? `, '${c.scope}'` : ''}{c.entityId ? `, ${c.entityId}` : ''})</code></td>
          <td>{localText(c.slug, c.scope, c.entityId)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>

<section>
  <h2>LocalText component</h2>
  <p><LocalText slug="app.name" /></p>
  <p><LocalText slug="app.tagline" /></p>
  <p><LocalText slug="action.save" /></p>
  <p><LocalText slug="missing.key" /></p>
</section>

<section>
  <h2>All loaded dictionary entries</h2>
  <table>
    <thead>
      <tr>
        <th>Slug</th>
        <th>Scope</th>
        <th>Entity</th>
        <th>Content</th>
      </tr>
    </thead>
    <tbody>
      {#each data.dictionary as entry}
        <tr>
          <td><code>{entry.link.slug}</code></td>
          <td><code>{entry.link.scope ?? '—'}</code></td>
          <td><code>{entry.link.entityId ?? '—'}</code></td>
          <td>{entry.content}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>

<style>
  section {
    margin-block: 2rem;
  }

  h2 {
    margin-block-end: 0.75rem;
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }

  th, td {
    text-align: left;
    padding: 0.375rem 0.75rem;
    border: 1px solid currentColor;
  }

  th {
    font-weight: 600;
  }
</style>
