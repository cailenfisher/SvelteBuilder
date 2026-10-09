<script lang="ts">
  import { ProgressBar, Skeleton, Spinner } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  const sizes = ['sm', 'md', 'lg'] as const;
</script>

<Example title="ProgressBar values">
  <div style:display="grid" style:gap="var(--space-3)" style:inline-size="min(100%, 24rem)">
    <ProgressBar value={0} label="Not started" />
    <ProgressBar value={40} label="Receiving" />
    <ProgressBar value={100} label="Complete" />
  </div>
</Example>

<Example title="ProgressBar sizes and indeterminate">
  <div style:display="grid" style:gap="var(--space-3)" style:inline-size="min(100%, 24rem)">
    {#each sizes as size (size)}
      <ProgressBar {size} value={65} label={`Size ${size}`} />
    {/each}
    <ProgressBar value={null} label="Syncing" />
  </div>
</Example>

<Example title="Spinner">
  {#each sizes as size (size)}
    <Spinner {size} label={`Loading, size ${size}`} />
  {/each}
</Example>

<Example title="Skeleton">
  <div style:display="grid" style:gap="var(--space-2)" style:inline-size="min(100%, 24rem)">
    <Skeleton height="1.5rem" width="60%" />
    <Skeleton height="1rem" />
    <Skeleton height="1rem" width="80%" />
    <p>Inline <Skeleton inline width="6rem" height="1em" /> text.</p>
    <Skeleton width="3rem" height="3rem" radius="var(--radius-full)" />
  </div>
</Example>
