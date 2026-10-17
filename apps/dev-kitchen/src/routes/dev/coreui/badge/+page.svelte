<script lang="ts">
  import { Badge, Tag } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
  import CallbackLog from '$lib/CallbackLog/CallbackLog.svelte';

  const variants = ['default', 'brand', 'success', 'warning', 'danger', 'info'] as const;
  const sizes = ['sm', 'md', 'lg'] as const;

  let tags = $state(['Logistics', 'Commerce', 'Content']);

  const removeCalls: string[] = $state([]);
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
    <Tag removeLabel={`Remove ${tag}`} onRemove={() => {
        removeCalls.push(tag);
        tags = tags.filter((other) => other !== tag);
      }}
      >{tag}</Tag
    >
  {:else}
    <p>All tags removed.</p>
  {/each}
  <CallbackLog name="onRemove" calls={removeCalls} />
</Example>

