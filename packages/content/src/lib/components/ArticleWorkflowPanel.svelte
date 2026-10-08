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

  const ASSIGNMENT_ROLE_LABEL: Record<string, string> = {
    author: 'Author',
    editor: 'Editor',
    photo: 'Photo',
    copy: 'Copy',
  };
</script>

<Drawer
  {open}
  onOpenChange={(next) => {
    if (!next) onClose();
  }}
  side="right"
  title="Article Workflow"
  description={article.headline}
>
  <Tabs bind:value={activeTab}>
    <TabsList>
      <TabsTrigger value="status">Status</TabsTrigger>
      <TabsTrigger value="checklist">Checklist</TabsTrigger>
      <TabsTrigger value="team">Team</TabsTrigger>
    </TabsList>

    <TabsContent value="status">
      <div class="workflow-panel__status">
        <div class="workflow-panel__current-status">
          <span class="workflow-panel__status-label">Current:</span>
          <strong>{article.status.label}</strong>
        </div>

        <div class="workflow-panel__actions">
          {#if article.status.slug === 'draft'}
            <Button
              variant="primary"
              onclick={() => onTransitionStatus?.('in_review')}
            >
              {dictionary.localText('action.submit_for_review', 'content')}
            </Button>
          {:else if article.status.slug === 'in_review'}
            <Button
              variant="primary"
              onclick={() => onTransitionStatus?.('approved')}
            >
              {dictionary.localText('action.approve', 'content')}
            </Button>
            <Button
              variant="secondary"
              onclick={() => onTransitionStatus?.('draft')}
            >
              {dictionary.localText('action.send_back', 'content')}
            </Button>
          {:else if article.status.slug === 'approved'}
            <Button
              variant="primary"
              onclick={() => onTransitionStatus?.('published')}
            >
              {dictionary.localText('action.publish', 'content')}
            </Button>
          {:else if article.status.slug === 'published'}
            <Button
              variant="secondary"
              onclick={() => onTransitionStatus?.('draft')}
            >
              {dictionary.localText('action.unpublish', 'content')}
            </Button>
          {/if}
        </div>
      </div>
    </TabsContent>

    <TabsContent value="checklist">
      <div class="workflow-panel__checklist">
        {#each checklistItems as item (item.id)}
          {@const checked = getChecklistState(item.id)}
          <div class="workflow-panel__checklist-item">
            <Checkbox
              {checked}
              onCheckedChange={(value) => onChecklistToggle?.(item.id, value)}
              label={dictionary.localText('label', 'publish_checklist_item', item.id)}
            />
            {#if item.required && !checked}
              <span class="workflow-panel__required" aria-label="Required">Required</span>
            {/if}
          </div>
        {/each}
      </div>
    </TabsContent>

    <TabsContent value="team">
      <div class="workflow-panel__team">
        {#if assignments.length === 0}
          <p class="workflow-panel__empty">No team members assigned.</p>
        {:else}
          <ul class="workflow-panel__team-list" role="list">
            {#each assignments as assignment (assignment.id)}
              <li class="workflow-panel__team-item">
                <span class="workflow-panel__team-role">
                  {ASSIGNMENT_ROLE_LABEL[assignment.role] ?? assignment.role}
                </span>
                <span class="workflow-panel__team-member">
                  <!-- userAccountId resolved server-side; name comes from hermes via author_profile scope -->
                  User #{assignment.userAccountId}
                </span>
                {#if assignment.dueAt}
                  <time class="workflow-panel__due" datetime={assignment.dueAt}>
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
  .workflow-panel__status {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-4) 0;
  }

  .workflow-panel__current-status {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    font-size: var(--text-sm);
    color: var(--text-soft);
  }

  .workflow-panel__actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .workflow-panel__checklist {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4) 0;
  }

  .workflow-panel__checklist-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .workflow-panel__required {
    font-size: var(--text-xs);
    color: var(--danger);
    font-weight: var(--weight-medium);
  }

  .workflow-panel__team {
    padding: var(--space-4) 0;
  }

  .workflow-panel__team-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .workflow-panel__team-item {
    display: grid;
    grid-template-columns: 5rem 1fr auto;
    gap: var(--space-3);
    align-items: center;
    font-size: var(--text-sm);
    padding: var(--space-2) 0;
    border-block-end: 1px solid var(--border-color);
  }

  .workflow-panel__team-role {
    font-weight: var(--weight-medium);
    color: var(--brand);
  }

  .workflow-panel__due {
    font-size: var(--text-xs);
    color: var(--text-soft);
  }

  .workflow-panel__empty {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-soft);
    font-style: italic;
  }
</style>
