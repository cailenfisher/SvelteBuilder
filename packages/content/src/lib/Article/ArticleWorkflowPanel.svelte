<!-- An article's place in the editorial workflow: the publish checklist and the status
     transition. Both are plain forms posting to the actions the screen names, so the panel works
     without JavaScript; `enhance` (SvelteKit's, from `$app/forms`) keeps the page and focus in
     place when a checklist box submits itself. Resolves checklist and status names (scopes
     `publish_checklist_item`, `article_status`) and its own copy (scope `content`). -->
<script lang="ts">
  import type { Action } from 'svelte/action';
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Button, Checkbox, Field, InlineNotification, Select, SelectItem } from '@sveltebuilder/coreui';
  import type { ArticleStatus } from '../schema/index.js';
  import type { ArticleChecklistEntry } from '../views.js';

  type Props = {
    /** The article's current status. */
    statusSlug: string;
    /** Every workflow status, in position order. */
    statuses: ArticleStatus[];
    checklist: ArticleChecklistEntry[];
    /** Receives `status_slug`. */
    transitionAction: string;
    /** Receives `item_id` and `satisfied`, one item per submission. */
    checklistAction: string;
    enhance?: Action<HTMLFormElement>;
    dictionary?: DictionaryInstance;
  };

  let {
    statusSlug,
    statuses,
    checklist,
    transitionAction,
    checklistAction,
    enhance = () => {},
    dictionary: dictionaryProp,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  const statusFieldId = $props.id();

  // One form per checklist item, keyed by item id so the checkbox can submit its own.
  const checklistForms: Record<number, HTMLFormElement | undefined> = $state({});

  // What the server will refuse, shown before the editor tries. The transition function enforces
  // the same rule, so this is a courtesy rather than the safeguard.
  const blockingItems = $derived(checklist.filter((item) => item.required && !item.completed));

  const itemLabel = (item: ArticleChecklistEntry) =>
    dictionary.localText('label', 'publish_checklist_item', item.id);
</script>

<section
  class="article-workflow-panel"
  aria-label={dictionary.localText('content.article_workflow.title', 'content')}
>
  <h2 class="article-workflow-panel__title">
    {dictionary.localText('content.article_workflow.checklist', 'content')}
  </h2>

  <ul class="article-workflow-panel__checklist">
    {#each checklist as item (item.id)}
      <li class="article-workflow-panel__checklist-item">
        <!-- Ticking a box is its own submission, so a half-filled checklist cannot be lost by
             navigating away. -->
        <form method="POST" action={checklistAction} use:enhance bind:this={checklistForms[item.id]}>
          <input type="hidden" name="item_id" value={item.id} />
          <input type="hidden" name="satisfied" value={item.completed ? 'false' : 'true'} />
          <!-- Checkbox is self-labelling, so it is not wrapped in a Field. -->
          <Checkbox
            checked={item.completed}
            label={itemLabel(item)}
            onCheckedChange={() => checklistForms[item.id]?.requestSubmit()}
          />
        </form>
        {#if item.required}
          <span class="article-workflow-panel__required">
            {dictionary.localText('content.article_workflow.required', 'content')}
          </span>
        {/if}
      </li>
    {/each}
  </ul>

  <h2 class="article-workflow-panel__title">
    {dictionary.localText('content.article_workflow.status', 'content')}
  </h2>

  {#if blockingItems.length > 0}
    <InlineNotification
      severity="info"
      summary={dictionary.localText('content.article_workflow.publish_blocked', 'content')}
      detail={blockingItems.map(itemLabel).join(', ')}
    />
  {/if}

  <form method="POST" action={transitionAction} class="article-workflow-panel__transition" use:enhance>
    <Field label={dictionary.localText('content.article_workflow.transition', 'content')} id={statusFieldId}>
      <Select name="status_slug" value={statusSlug}>
        {#each statuses as status (status.id)}
          <SelectItem value={status.slug} label={dictionary.localText('name', 'article_status', status.id)} />
        {/each}
      </Select>
    </Field>
    <Button type="submit" variant="primary" size="sm">
      {dictionary.localText('content.article_workflow.save', 'content')}
    </Button>
  </form>
</section>
