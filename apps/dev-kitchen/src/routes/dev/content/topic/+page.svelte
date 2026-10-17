<script lang="ts">
  import { TopicLink } from '@sveltebuilder/content';
  import Example from '$lib/Example/Example.svelte';
  import { TOPICS, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
</script>

<Example title="TopicLink">
  {#each TOPICS as topic (topic.id)}
    <TopicLink {topic} locale="en" {dictionary} />
    <TopicLink {topic} locale="en" href={`/topic/${topic.slug}`} {dictionary} />
  {/each}
</Example>
