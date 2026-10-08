<script lang="ts">
  import { Avatar } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';

  const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  // An inline image, so the page needs no network or committed asset.
  const portrait =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#45b1e8"/><circle cx="32" cy="26" r="12" fill="#fff"/><rect x="14" y="42" width="36" height="22" rx="11" fill="#fff"/></svg>'
    );
</script>

<Example title="Sizes, with an image">
  {#each sizes as size (size)}
    <Avatar {size} src={portrait} alt="Ada Lovelace" />
  {/each}
</Example>

<Example title="Fallback initials">
  {#each sizes as size (size)}
    <Avatar {size} fallback="AL" alt="Ada Lovelace" />
  {/each}
</Example>

<Example title="Broken image falls back">
  <Avatar src="/does-not-exist.png" fallback="GH" alt="Grace Hopper" />
</Example>
