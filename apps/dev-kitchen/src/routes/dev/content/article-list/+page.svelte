<script lang="ts">
  import { ArticleList, ArticleAssignmentQueue } from '@sveltebuilder/content';
  import type { ComponentProps } from 'svelte';
  import Example from '$lib/Example/Example.svelte';
  import { ARTICLES_WITH_COPY, ASSIGNMENTS, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();

  // ArticleAssignmentQueue's row type is not exported; typing through its props still fails the
  // check when the component's shape changes.
  const assignments = ASSIGNMENTS.map((assignment, index) => ({
    ...assignment,
    article: ARTICLES_WITH_COPY[2],
    assigneeName: ['Ada Reporter', 'Grace Editor'][index],
  })) satisfies ComponentProps<typeof ArticleAssignmentQueue>['assignments'];

  let opened = $state('(none)');
</script>

<Example title="ArticleList">
  <div style:inline-size="100%">
    <ArticleList
      articles={ARTICLES_WITH_COPY}
      total={ARTICLES_WITH_COPY.length}
      page={1}
      perPage={20}
      onRowClick={(article) => (opened = article.headline)}
      locale="en"
      {dictionary}
    />
    <p role="status">Opened: {opened}</p>
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
