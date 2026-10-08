<script lang="ts">
  import { Badge, StatusBadge, Tag } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  const variants = ['default', 'brand', 'success', 'warning', 'danger', 'info'] as const;
  const sizes = ['sm', 'md', 'lg'] as const;

  let tags = $state(['Logistics', 'Commerce', 'Content']);
</script>

<Example title="Badge variants">
  {#each variants as variant (variant)}
    <Badge {variant}>{variant}</Badge>
  {/each}
</Example>

<Example title="Badge sizes">
  {#each sizes as size (size)}
    <Badge {size} variant="brand">{size}</Badge>
  {/each}
</Example>

<Example title="Tag variants">
  {#each variants as variant (variant)}
    <Tag {variant}>{variant}</Tag>
  {/each}
</Example>

<Example title="Removable tags">
  {#each tags as tag (tag)}
    <Tag removeLabel={`Remove ${tag}`} onremove={() => (tags = tags.filter((t) => t !== tag))}>{tag}</Tag>
  {:else}
    <p>All tags removed.</p>
  {/each}
</Example>

<Example title="StatusBadge">
  <StatusBadge label="Draft" />
  <StatusBadge label="In review" variant="info" />
  <StatusBadge label="Published" variant="success" />
  <StatusBadge label="Embargoed" variant="warning" />
  <StatusBadge label="Rejected" variant="danger" />
  <StatusBadge label="Featured" variant="brand" size="lg" />
</Example>
