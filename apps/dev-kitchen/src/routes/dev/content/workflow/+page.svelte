<script lang="ts">
  import { ArticleWorkflowPanel, BlockEditorHost } from '@sveltebuilder/content';
  import { Button } from '@sveltebuilder/coreui';
  import Example from '$lib/Example.svelte';
  import {
    ARTICLES_WITH_COPY,
    ASSIGNMENTS,
    BLOCKS,
    CHECKLIST_ITEMS,
    CHECKLIST_STATES,
    LEAD_ARTICLE,
    contentDictionary,
  } from '$lib/fixtures/content';

  const dictionary = contentDictionary();

  let open = $state(false);
  let lastTransition = $state('(none)');
  let blockChanges = $state(0);
</script>

<Example title="ArticleWorkflowPanel">
  <Button onclick={() => (open = true)}>Open workflow</Button>
  <ArticleWorkflowPanel
    article={ARTICLES_WITH_COPY[2]}
    assignments={ASSIGNMENTS}
    checklistItems={CHECKLIST_ITEMS}
    checklistStates={CHECKLIST_STATES}
    {open}
    onClose={() => (open = false)}
    onTransitionStatus={(slug) => (lastTransition = slug)}
    locale="en"
    {dictionary}
  />
  <p role="status">Last transition: {lastTransition}</p>
</Example>

<Example title="BlockEditorHost">
  <div style:inline-size="100%">
    <BlockEditorHost
      blocks={BLOCKS}
      articleId={LEAD_ARTICLE.id}
      onBlocksChange={() => blockChanges++}
      locale="en"
      {dictionary}
    />
    <p role="status">{blockChanges} structural changes</p>
  </div>
</Example>
