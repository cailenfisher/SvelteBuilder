<script lang="ts">
  import { ArticleList, ArticleAssignmentQueue } from '@sveltebuilder/content';
  import type { ComponentProps } from 'svelte';
  import Example from '$lib/Example/Example.svelte';
  import { ARTICLE_ROWS, ARTICLES_WITH_COPY, ASSIGNMENTS, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();

  // ArticleAssignmentQueue's row type is not exported; typing through its props still fails the
  // check when the component's shape changes.
  const assignments = ASSIGNMENTS.map((assignment, index) => ({
    ...assignment,
    article: ARTICLES_WITH_COPY[2],
    assigneeName: ['Ada Reporter', 'Grace Editor'][index],
  })) satisfies ComponentProps<typeof ArticleAssignmentQueue>['assignments'];

  let page = $state(1);
</script>

<Example title="ArticleList">
  <div style:inline-size="100%">
    <ArticleList
      articles={ARTICLE_ROWS}
      href={(article) => `#article-${article.id}`}
      total={60}
      {page}
      perPage={20}
      onPageChange={(next) => (page = next)}
      locale="en"
      {dictionary}
    />
    <p role="status">Page asked for: {page}</p>
  </div>
</Example>

<Example title="ArticleAssignmentQueue">
  <div style:inline-size="100%">
    <ArticleAssignmentQueue
      {assignments}
      total={assignments.length}
      page={1}
      perPage={20}
      locale="en"
      {dictionary}
    />
  </div>
</Example>
