<script lang="ts">
  import { BylineList, SectionLabel, TopicTag } from '@sveltebuilder/content';
  import Example from '$lib/Example.svelte';
  import { AUTHORS, SECTIONS, TOPICS, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
</script>

<Example title="BylineList">
  <BylineList bylines={AUTHORS.slice(0, 1)} locale="en" {dictionary} />
  <BylineList bylines={AUTHORS} locale="en" linkPrefix="/author" {dictionary} />
</Example>

<Example title="SectionLabel">
  {#each SECTIONS as section (section.id)}
    <SectionLabel {section} locale="en" {dictionary} />
    <SectionLabel {section} locale="en" href={`/section/${section.slug}`} {dictionary} />
  {/each}
</Example>

<Example title="TopicTag">
  {#each TOPICS as topic (topic.id)}
    <TopicTag {topic} locale="en" {dictionary} />
    <TopicTag {topic} locale="en" href={`/topic/${topic.slug}`} {dictionary} />
  {/each}
</Example>
