<script lang="ts">
  import { ArticleWorkflowPanel } from '@sveltebuilder/content';
  import { Button } from '@sveltebuilder/coreui';
  import Example from '$lib/Example/Example.svelte';
  import {
    ARTICLES_WITH_COPY,
    ASSIGNMENTS,
    CHECKLIST_ITEMS,
    CHECKLIST_STATES,
    contentDictionary,
  } from '$lib/fixtures/content';

  const dictionary = contentDictionary();

  let open = $state(false);
  let lastTransition = $state('(none)');
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
