<script lang="ts">
  import { ArticleWorkflowPanel } from '@sveltebuilder/content';
  import Example from '$lib/Example/Example.svelte';
  import { ARTICLE_STATUSES, CHECKLIST, STATUS, contentDictionary } from '$lib/fixtures/content';

  const dictionary = contentDictionary();
</script>

<!-- The forms post to this page, which has no actions: submitting shows SvelteKit's 405. The
     showcase is for the panel's markup and keyboard path, not the workflow itself. -->
<Example title="Required items outstanding">
  <div style:inline-size="100%">
    <ArticleWorkflowPanel
      statusSlug={STATUS.inReview.slug}
      statuses={ARTICLE_STATUSES}
      checklist={CHECKLIST}
      transitionAction="?/transition"
      checklistAction="?/checklist"
      {dictionary}
    />
  </div>
</Example>

<Example title="Ready to publish">
  <div style:inline-size="100%">
    <ArticleWorkflowPanel
      statusSlug={STATUS.inReview.slug}
      statuses={ARTICLE_STATUSES}
      checklist={CHECKLIST.map((item) => ({ ...item, completed: true }))}
      transitionAction="?/transition"
      checklistAction="?/checklist"
      {dictionary}
    />
  </div>
</Example>
