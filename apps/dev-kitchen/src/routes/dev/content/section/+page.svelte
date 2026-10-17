<script lang="ts">
  import { SectionLink } from '@sveltebuilder/content';
  import Example from '$lib/Example/Example.svelte';
  import { SECTIONS, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
</script>

<Example title="SectionLink">
  {#each SECTIONS as section (section.id)}
    <SectionLink {section} locale="en" {dictionary} />
    <SectionLink {section} locale="en" href={`/section/${section.slug}`} {dictionary} />
  {/each}
</Example>
