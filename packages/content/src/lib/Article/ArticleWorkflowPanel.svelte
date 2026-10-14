<!-- Camp 2: article workflow side panel. Resolves status labels and checklist item labels
     via diglossia. Uses coreui Drawer, Tabs and Checkbox. -->
<script lang="ts">
  import { getDictionary } from 'diglossia/svelte';
  import type { DictionaryInstance } from 'diglossia';
  import { Drawer, Tabs, TabsList, TabsTrigger, TabsContent, Checkbox, Button } from '@sveltebuilder/coreui';
  import type {
    ArticleWithCopy,
    ArticleAssignment,
    ArticleChecklistState,
    PublishChecklistItem,
  } from '../schema/index.js';

  type Props = {
    article: ArticleWithCopy;
    assignments: ArticleAssignment[];
    checklistItems: PublishChecklistItem[];
    checklistStates: ArticleChecklistState[];
    open: boolean;
    onClose: () => void;
    onTransitionStatus?: (statusSlug: string) => void;
    onChecklistToggle?: (itemId: number, satisfied: boolean) => void;
    locale: string;
    dictionary?: DictionaryInstance;
  };

  let {
    article,
    assignments,
    checklistItems,
    checklistStates,
    open,
    onClose,
    onTransitionStatus,
    onChecklistToggle,
    locale: _locale,
    dictionary: dictionaryProp,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const dictionary = dictionaryProp ?? getDictionary();

  function getChecklistState(itemId: number): boolean {
    return checklistStates.find((s) => s.publishChecklistItemId === itemId)?.satisfied ?? false;
  }

  let activeTab = $state('status');

</script>

<Drawer
  {open}
  onOpenChange={(next) => {
    if (!next) onClose();
  }}
  side="right"
  title={dictionary.localText('content.article_workflow.title', 'content')}
  description={article.headline}
  closeLabel={dictionary.localText('content.article_workflow.close', 'content')}
>
  <Tabs bind:value={activeTab}>
    <TabsList>
      <TabsTrigger value="status">
        {dictionary.localText('content.article_workflow.status', 'content')}
      </TabsTrigger>
      <TabsTrigger value="checklist">
        {dictionary.localText('content.article_workflow.checklist', 'content')}
      </TabsTrigger>
      <TabsTrigger value="assignment">
        {dictionary.localText('content.article_workflow.assignment', 'content')}
      </TabsTrigger>
    </TabsList>

    <TabsContent value="status">
      <div class="article-workflow-panel__status">
        <div class="article-workflow-panel__current-status">
          <span class="article-workflow-panel__status-label">
            {dictionary.localText('content.article_workflow.current', 'content')}
          </span>
          <strong>{article.status.label}</strong>
        </div>

        <div class="article-workflow-panel__actions">
          {#if article.status.slug === 'draft'}
            <Button
              variant="primary"
              onclick={() => onTransitionStatus?.('in_review')}
            >
              {dictionary.localText('content.article_workflow.submit_for_review', 'content')}
            </Button>
          {:else if article.status.slug === 'in_review'}
            <Button
              variant="primary"
              onclick={() => onTransitionStatus?.('approved')}
            >
              {dictionary.localText('content.article_workflow.approve', 'content')}
            </Button>
            <Button
              variant="secondary"
              onclick={() => onTransitionStatus?.('draft')}
            >
              {dictionary.localText('content.article_workflow.send_back', 'content')}
            </Button>
          {:else if article.status.slug === 'approved'}
            <Button
              variant="primary"
              onclick={() => onTransitionStatus?.('published')}
            >
              {dictionary.localText('content.article_workflow.publish', 'content')}
            </Button>
          {:else if article.status.slug === 'published'}
            <Button
              variant="secondary"
              onclick={() => onTransitionStatus?.('draft')}
            >
              {dictionary.localText('content.article_workflow.unpublish', 'content')}
            </Button>
          {/if}
        </div>
      </div>
    </TabsContent>

    <TabsContent value="checklist">
      <div class="article-workflow-panel__checklist">
        {#each checklistItems as item (item.id)}
          {@const checked = getChecklistState(item.id)}
          <div class="article-workflow-panel__checklist-item">
            <Checkbox
              {checked}
              onCheckedChange={(value) => onChecklistToggle?.(item.id, value)}
              label={dictionary.localText('label', 'publish_checklist_item', item.id)}
            />
            {#if item.required && !checked}
              <span class="article-workflow-panel__required">
                {dictionary.localText('content.article_workflow.required', 'content')}
              </span>
            {/if}
          </div>
        {/each}
      </div>
    </TabsContent>

    <TabsContent value="assignment">
      <div class="article-workflow-panel__assignment">
        {#if assignments.length === 0}
          <p class="article-workflow-panel__empty">
            {dictionary.localText('content.article_workflow.assignment_empty', 'content')}
          </p>
        {:else}
          <ul class="article-workflow-panel__assignment-list" role="list">
            {#each assignments as assignment (assignment.id)}
              <li class="article-workflow-panel__assignment-item">
                <span class="article-workflow-panel__assignment-role">
                  {dictionary.localText(`content.article_assignment_role.${assignment.role}`, 'content')}
                </span>
                <span class="article-workflow-panel__assignment-member">
                  <!-- userAccountId resolved server-side; name comes from hermes via author_profile scope -->
                  User #{assignment.userAccountId}
                </span>
                {#if assignment.dueAt}
                  <time class="article-workflow-panel__due" datetime={assignment.dueAt}>
                    Due {new Intl.DateTimeFormat(_locale, { dateStyle: 'medium' }).format(
                      new Date(assignment.dueAt)
                    )}
                  </time>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </TabsContent>
  </Tabs>
</Drawer>

<style>
  .article-workflow-panel__status {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-4) 0;
  }

  .article-workflow-panel__current-status {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    font-size: var(--text-sm);
    color: var(--text-soft);
  }

  .article-workflow-panel__actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .article-workflow-panel__checklist {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4) 0;
  }

  .article-workflow-panel__checklist-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .article-workflow-panel__required {
    font-size: var(--text-xs);
    color: var(--danger-text);
    font-weight: var(--weight-medium);
  }

  .article-workflow-panel__assignment {
    padding: var(--space-4) 0;
  }

  .article-workflow-panel__assignment-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .article-workflow-panel__assignment-item {
    display: grid;
    grid-template-columns: 5rem 1fr auto;
    gap: var(--space-3);
    align-items: center;
    font-size: var(--text-sm);
    padding: var(--space-2) 0;
    border-block-end: 1px solid var(--border-color);
  }

  .article-workflow-panel__assignment-role {
    font-weight: var(--weight-medium);
    color: var(--brand-text);
  }

  .article-workflow-panel__due {
    font-size: var(--text-xs);
    color: var(--text-soft);
  }

  .article-workflow-panel__empty {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-soft);
    font-style: italic;
  }
</style>
