<script lang="ts">
  import { merge } from '@sveltebuilder/hermes';
  import { blogDictionaryPayload } from '$lib/blog-fixtures.js';

  let { children }: { children: any } = $props();

  $effect(() => {
    merge(blogDictionaryPayload, 'en', 'en');
  });
</script>

{@render children()}
