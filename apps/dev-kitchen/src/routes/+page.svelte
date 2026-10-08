<!-- Index: every showcase page, grouped by package. -->
<script lang="ts">
  import { SHOWCASE } from '$lib/catalog';
</script>

<svelte:head>
  <title>dev-kitchen</title>
</svelte:head>

<h1>dev-kitchen</h1>
<p>
  Every component the workspace packages export, rendered from source against the scaffold's own
  chrome. See <code>apps/dev-kitchen/README.md</code>.
</p>

<p><a href="/dev/theme">Theme, direction and focus</a>: the set under light, dark and right-to-left.</p>

{#each SHOWCASE as section (section.slug)}
  <section>
    <h2>{section.title}</h2>
    <ul>
      {#each section.pages as entry (entry.slug)}
        <li><a href={`/dev/${section.slug}/${entry.slug}`}>{entry.title}</a></li>
      {/each}
    </ul>
  </section>
{/each}
