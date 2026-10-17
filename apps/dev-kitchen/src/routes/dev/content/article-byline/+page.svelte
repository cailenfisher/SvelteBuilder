<script lang="ts">
  import { ArticleBylineList } from '@sveltebuilder/content';
  import Example from '$lib/Example/Example.svelte';
  import { AUTHORS, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
</script>

<Example title="ArticleBylineList">
  <ArticleBylineList bylines={AUTHORS.slice(0, 1)} locale="en" {dictionary} />
  <ArticleBylineList bylines={AUTHORS} locale="en" linkPrefix="/author" {dictionary} />
</Example>
